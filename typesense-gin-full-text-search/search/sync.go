package search

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/typesense/code-samples/typesense-gin-full-text-search/config"
	"github.com/typesense/code-samples/typesense-gin-full-text-search/models"
	"github.com/typesense/code-samples/typesense-gin-full-text-search/store"
	"github.com/typesense/typesense-go/v4/typesense/api"
	"github.com/typesense/typesense-go/v4/typesense/api/pointer"
)

// SyncConfig holds configuration for the sync process
type SyncConfig struct {
	BatchSize        int // Typesense import batch size (documents per API call)
	PageSize         int // Database pagination size (records fetched per query)
	SyncIntervalSec  int
	EnableSoftDelete bool
}

// DefaultSyncConfig returns default sync configuration
func DefaultSyncConfig() *SyncConfig {
	return &SyncConfig{
		BatchSize:       1000,
		PageSize:        1000,
		SyncIntervalSec: 60,
	}
}

// SyncAllBooksToTypesense performs a full sync of all books from database to Typesense
func SyncAllBooksToTypesense(ctx context.Context) error {
	log.Printf("Starting full sync of all books to Typesense...")

	cfg := DefaultSyncConfig()

	totalCount, err := store.GetTotalBooksCount(ctx)
	if err != nil {
		return fmt.Errorf("failed to get total books count: %w", err)
	}

	if totalCount == 0 {
		log.Println("No books found in database")
		return nil
	}

	log.Printf("Total books to sync: %d (processing in batches of %d)", totalCount, cfg.PageSize)

	totalPages := int((totalCount + int64(cfg.PageSize) - 1) / int64(cfg.PageSize))
	log.Printf("Will process %d pages", totalPages)

	totalSuccess := 0
	totalFailure := 0

	for page := 1; page <= totalPages; page++ {
		log.Printf("Processing page %d/%d...", page, totalPages)

		books, err := store.GetAllBooksPaginated(ctx, page, cfg.PageSize)
		if err != nil {
			return fmt.Errorf("failed to fetch books page %d: %w", page, err)
		}

		if len(books) == 0 {
			log.Printf("Page %d returned no books, stopping", page)
			break
		}

		log.Printf("Fetched %d books from page %d", len(books), page)

		documents := make([]any, 0, len(books))
		for _, book := range books {
			documents = append(documents, BookToDocument(book))
		}

		upsertAction := api.IndexAction("upsert")
		importParams := &api.ImportDocumentsParams{
			BatchSize: pointer.Int(cfg.BatchSize),
			Action:    &upsertAction,
		}

		results, err := Client.Collection(config.BookCollection).Documents().Import(ctx, documents, importParams)
		if err != nil {
			return fmt.Errorf("bulk import to Typesense failed on page %d: %w", page, err)
		}

		pageSuccess, pageFailure := 0, 0
		for _, result := range results {
			if result.Success {
				pageSuccess++
			} else {
				pageFailure++
				if totalFailure+pageFailure <= 5 {
					log.Printf("Sync error for document %s: %s", result.Id, result.Error)
				}
			}
		}

		totalSuccess += pageSuccess
		totalFailure += pageFailure

		log.Printf("Page %d/%d completed: %d succeeded, %d failed (Total so far: %d succeeded, %d failed)",
			page, totalPages, pageSuccess, pageFailure, totalSuccess, totalFailure)
	}

	log.Printf("Full sync completed: %d documents upserted, %d failed out of %d total",
		totalSuccess, totalFailure, totalCount)
	return nil
}

// SyncBooksToTypesense incrementally syncs books modified since lastSyncTime
func SyncBooksToTypesense(ctx context.Context, lastSyncTime time.Time) (time.Time, error) {
	log.Printf("Starting incremental sync from database to Typesense since %s", lastSyncTime.Format(time.RFC3339))

	cfg := DefaultSyncConfig()

	updatedCount, err := store.GetUpdatedBooksCount(ctx, lastSyncTime)
	if err != nil {
		return lastSyncTime, fmt.Errorf("failed to get updated books count: %w", err)
	}

	if updatedCount == 0 {
		log.Println("No changes to sync")
		return time.Now(), nil
	}

	log.Printf("Found %d books to sync (processing in batches of %d)", updatedCount, cfg.PageSize)

	totalPages := int((updatedCount + int64(cfg.PageSize) - 1) / int64(cfg.PageSize))
	log.Printf("Will process %d pages", totalPages)

	totalSuccess := 0
	totalFailure := 0

	for page := 1; page <= totalPages; page++ {
		log.Printf("Processing page %d/%d...", page, totalPages)

		books, err := store.GetBooksByUpdatedAtPaginated(ctx, lastSyncTime, page, cfg.PageSize)
		if err != nil {
			return lastSyncTime, fmt.Errorf("failed to fetch books page %d: %w", page, err)
		}

		if len(books) == 0 {
			log.Printf("Page %d returned no books, stopping", page)
			break
		}

		log.Printf("Fetched %d books from page %d", len(books), page)

		documents := make([]any, 0, len(books))
		for _, book := range books {
			documents = append(documents, BookToDocument(book))
		}

		upsertAction := api.IndexAction("upsert")
		importParams := &api.ImportDocumentsParams{
			BatchSize: pointer.Int(cfg.BatchSize),
			Action:    &upsertAction,
		}

		results, err := Client.Collection(config.BookCollection).Documents().Import(ctx, documents, importParams)
		if err != nil {
			return lastSyncTime, fmt.Errorf("bulk import to Typesense failed on page %d: %w", page, err)
		}

		pageSuccess, pageFailure := 0, 0
		for _, result := range results {
			if result.Success {
				pageSuccess++
			} else {
				pageFailure++
				if totalFailure+pageFailure <= 5 {
					log.Printf("Sync error for document %s: %s", result.Id, result.Error)
				}
			}
		}

		totalSuccess += pageSuccess
		totalFailure += pageFailure

		log.Printf("Page %d/%d completed: %d succeeded, %d failed (Total so far: %d succeeded, %d failed)",
			page, totalPages, pageSuccess, pageFailure, totalSuccess, totalFailure)
	}

	log.Printf("Incremental sync completed: %d documents upserted, %d failed out of %d total",
		totalSuccess, totalFailure, updatedCount)

	newSyncTime := time.Now()
	log.Printf("Last sync time updated to: %s", newSyncTime.Format(time.RFC3339))

	return newSyncTime, nil
}

// SyncSoftDeletesToTypesense removes deleted books from Typesense
func SyncSoftDeletesToTypesense(ctx context.Context, deletedBookIDs []uint) error {
	if len(deletedBookIDs) == 0 {
		return nil
	}

	idStrings := make([]string, 0, len(deletedBookIDs))
	for _, id := range deletedBookIDs {
		idStrings = append(idStrings, fmt.Sprintf("book_%d", id))
	}

	filterBy := fmt.Sprintf("id:=[%s]", strings.Join(idStrings, ","))

	log.Printf("Deleting %d documents from Typesense: %s", len(deletedBookIDs), filterBy)

	_, err := Client.Collection(config.BookCollection).Documents().Delete(ctx, &api.DeleteDocumentsParams{
		FilterBy: pointer.String(filterBy),
	})

	if err != nil {
		return fmt.Errorf("failed to delete documents from Typesense: %w", err)
	}

	log.Printf("Successfully deleted %d documents from Typesense", len(deletedBookIDs))
	return nil
}

// BookToDocument converts a Book model to a Typesense document map
func BookToDocument(book models.Book) map[string]any {
	return map[string]any{
		"id":               book.GetTypesenseID(),
		"title":            book.Title,
		"authors":          book.Authors,
		"publication_year": book.PublicationYear,
		"average_rating":   book.AverageRating,
		"image_url":        book.ImageUrl,
		"ratings_count":    book.RatingsCount,
	}
}

// DocumentToBook converts a Typesense document map to a Book model
func DocumentToBook(doc map[string]any) (*models.Book, error) {
	jsonBytes, err := json.Marshal(doc)
	if err != nil {
		return nil, err
	}

	var book models.Book
	if err := json.Unmarshal(jsonBytes, &book); err != nil {
		return nil, err
	}

	if idFloat, ok := doc["id"].(float64); ok {
		book.ID = uint(idFloat)
	}

	return &book, nil
}

// SyncSingleBookToTypesense upserts a single book in Typesense (for real-time sync)
func SyncSingleBookToTypesense(ctx context.Context, book models.Book) error {
	doc := BookToDocument(book)

	_, err := Client.Collection(config.BookCollection).Documents().Upsert(ctx, doc, &api.DocumentIndexParameters{})
	if err != nil {
		return fmt.Errorf("failed to upsert book to Typesense: %w", err)
	}

	log.Printf("Synced single book to Typesense: ID=%d, Title=%s", book.ID, book.Title)
	return nil
}

// SyncSingleBookDeletionToTypesense deletes a single book from Typesense
func SyncSingleBookDeletionToTypesense(ctx context.Context, bookID uint) error {
	documentID := fmt.Sprintf("book_%d", bookID)

	_, err := Client.Collection(config.BookCollection).Document(documentID).Delete(ctx)
	if err != nil {
		return fmt.Errorf("failed to delete book from Typesense: %w", err)
	}

	log.Printf("Deleted book from Typesense: ID=%d", bookID)
	return nil
}

// SyncState tracks the current sync state
type SyncState struct {
	LastSyncTime      time.Time
	SyncWorkerRunning bool
	mu                sync.RWMutex
}

var globalSyncState = &SyncState{}

// GetLastSyncTime returns the last sync time
func GetLastSyncTime() time.Time {
	globalSyncState.mu.RLock()
	defer globalSyncState.mu.RUnlock()
	return globalSyncState.LastSyncTime
}

// SetLastSyncTime updates the last sync time
func SetLastSyncTime(t time.Time) {
	globalSyncState.mu.Lock()
	defer globalSyncState.mu.Unlock()
	globalSyncState.LastSyncTime = t
}

// SetSyncWorkerRunning updates the sync worker status
func SetSyncWorkerRunning(running bool) {
	globalSyncState.mu.Lock()
	defer globalSyncState.mu.Unlock()
	globalSyncState.SyncWorkerRunning = running
}

// IsSyncWorkerRunning returns whether the sync worker is running
func IsSyncWorkerRunning() bool {
	globalSyncState.mu.RLock()
	defer globalSyncState.mu.RUnlock()
	return globalSyncState.SyncWorkerRunning
}
