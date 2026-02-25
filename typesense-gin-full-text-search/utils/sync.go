package utils

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/typesense/typesense-go/v4/typesense/api"
	"github.com/typesense/typesense-go/v4/typesense/api/pointer"

	"github.com/typesense/code-samples/typesense-gin-full-text-search/models"
)

// SyncConfig holds configuration for the sync process
type SyncConfig struct {
	BatchSize        int
	SyncIntervalSec  int
	EnableSoftDelete bool
}

// DefaultSyncConfig returns default sync configuration
func DefaultSyncConfig() *SyncConfig {
	return &SyncConfig{
		BatchSize:       100,
		SyncIntervalSec: 60, // Sync every 60 seconds
	}
}

// SyncAllBooksToTypesense performs a full sync of all books from database to Typesense
// This should only be used for initial data load when Typesense is empty
// For regular syncing, use SyncBooksToTypesense which is incremental
func SyncAllBooksToTypesense(ctx context.Context) error {
	log.Printf("Starting full sync of all books to Typesense...")

	// Get all books from DB
	books, err := GetAllBooks(ctx)
	if err != nil {
		return fmt.Errorf("failed to fetch books from DB: %w", err)
	}

	if len(books) == 0 {
		log.Println("No books found in database")
		return nil
	}

	log.Printf("Syncing %d books to Typesense", len(books))

	// Convert books to Typesense document format
	documents := make([]any, 0, len(books))
	for _, book := range books {
		doc := map[string]any{
			"id":               book.GetTypesenseID(),
			"title":            book.Title,
			"authors":          book.Authors,
			"publication_year": book.PublicationYear,
			"average_rating":   book.AverageRating,
			"image_url":        book.ImageUrl,
			"ratings_count":    book.RatingsCount,
		}
		documents = append(documents, doc)
	}

	// Import documents in bulk using Typesense's import API
	// Use upsert action to handle both inserts and updates
	upsertAction := api.IndexAction("upsert")
	importParams := &api.ImportDocumentsParams{
		BatchSize: pointer.Int(DefaultSyncConfig().BatchSize),
		Action:    &upsertAction,
	}

	results, err := Client.Collection(BookCollection).Documents().Import(
		ctx,
		documents,
		importParams,
	)

	if err != nil {
		return fmt.Errorf("bulk import to Typesense failed: %w", err)
	}

	// Count successes and failures
	successCount := 0
	failureCount := 0
	for _, result := range results {
		if result.Success {
			successCount++
		} else {
			failureCount++
			if failureCount <= 5 {
				log.Printf("Sync error for document %s: %s", result.Id, result.Error)
			}
		}
	}

	log.Printf("Full sync completed: %d documents upserted, %d failed", successCount, failureCount)
	return nil
}

// SyncBooksToTypesense fetches books changed since lastSyncTime and upserts them into Typesense
// This is an incremental sync - only syncs books modified since the last sync
// Returns the new lastSyncTime
func SyncBooksToTypesense(ctx context.Context, lastSyncTime time.Time) (time.Time, error) {
	log.Printf("Starting incremental sync from database to Typesense since %s", lastSyncTime.Format(time.RFC3339))

	// Get only books updated since last sync (efficient for large datasets)
	books, err := GetBooksByUpdatedAt(ctx, lastSyncTime)
	if err != nil {
		return lastSyncTime, fmt.Errorf("failed to fetch changed books from DB: %w", err)
	}

	if len(books) == 0 {
		log.Println("No changes to sync")
		return time.Now(), nil
	}

	log.Printf("Found %d books to sync", len(books))

	// Convert books to Typesense document format
	documents := make([]any, 0, len(books))
	for _, book := range books {
		doc := map[string]any{
			"id":               book.GetTypesenseID(),
			"title":            book.Title,
			"authors":          book.Authors,
			"publication_year": book.PublicationYear,
			"average_rating":   book.AverageRating,
			"image_url":        book.ImageUrl,
			"ratings_count":    book.RatingsCount,
		}
		documents = append(documents, doc)
	}

	// Import documents in bulk using Typesense's import API
	// Use upsert action to handle both inserts and updates
	upsertAction := api.IndexAction("upsert")
	importParams := &api.ImportDocumentsParams{
		BatchSize: pointer.Int(DefaultSyncConfig().BatchSize),
		Action:    &upsertAction,
	}

	results, err := Client.Collection(BookCollection).Documents().Import(
		ctx,
		documents,
		importParams,
	)

	if err != nil {
		return lastSyncTime, fmt.Errorf("bulk import to Typesense failed: %w", err)
	}

	// Count successes and failures
	successCount := 0
	failureCount := 0
	for _, result := range results {
		if result.Success {
			successCount++
		} else {
			failureCount++
			if failureCount <= 5 {
				log.Printf("Sync error for document %s: %s", result.Id, result.Error)
			}
		}
	}

	log.Printf("Sync completed: %d documents upserted, %d failed", successCount, failureCount)

	// Update last sync time
	newSyncTime := time.Now()
	log.Printf("Last sync time updated to: %s", newSyncTime.Format(time.RFC3339))

	return newSyncTime, nil
}

// SyncSoftDeletesToTypesense removes deleted books from Typesense
// Uses a filter query to delete multiple documents by ID
func SyncSoftDeletesToTypesense(ctx context.Context, deletedBookIDs []uint) error {
	if len(deletedBookIDs) == 0 {
		return nil
	}

	// Convert IDs to Typesense document IDs (book_{ID})
	idStrings := make([]string, 0, len(deletedBookIDs))
	for _, id := range deletedBookIDs {
		idStrings = append(idStrings, fmt.Sprintf("book_%d", id))
	}

	// Build filter: id:=[book_1,book_2,book_3]
	filterBy := fmt.Sprintf("id:=[%s]", joinStringSlice(idStrings, ","))

	log.Printf("Deleting %d documents from Typesense: %s", len(deletedBookIDs), filterBy)

	// Delete by query
	_, err := Client.Collection(BookCollection).Documents().Delete(ctx, &api.DeleteDocumentsParams{
		FilterBy: pointer.String(filterBy),
	})

	if err != nil {
		return fmt.Errorf("failed to delete documents from Typesense: %w", err)
	}

	log.Printf("Successfully deleted %d documents from Typesense", len(deletedBookIDs))
	return nil
}

// joinStringSlice joins string slice with separator using strings.Builder
func joinStringSlice(slice []string, sep string) string {
	if len(slice) == 0 {
		return ""
	}
	if len(slice) == 1 {
		return slice[0]
	}
	var builder strings.Builder
	builder.WriteString(slice[0])
	for i := 1; i < len(slice); i++ {
		builder.WriteString(sep)
		builder.WriteString(slice[i])
	}
	return builder.String()
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

	// Handle ID conversion from float64 to uint (JSON unmarshals numbers as float64)
	if idFloat, ok := doc["id"].(float64); ok {
		book.ID = uint(idFloat)
	}

	return &book, nil
}

// SyncSingleBookToTypesense updates a single book in Typesense (for real-time sync)
func SyncSingleBookToTypesense(ctx context.Context, book models.Book) error {
	doc := BookToDocument(book)

	// Use the Upsert API for single document
	_, err := Client.Collection(BookCollection).Documents().Upsert(ctx, doc, &api.DocumentIndexParameters{})
	if err != nil {
		return fmt.Errorf("failed to upsert book to Typesense: %w", err)
	}

	log.Printf("Synced single book to Typesense: ID=%d, Title=%s", book.ID, book.Title)
	return nil
}

// SyncSingleBookDeletionToTypesense deletes a single book from Typesense
func SyncSingleBookDeletionToTypesense(ctx context.Context, bookID uint) error {
	// Delete by document ID (uses book_{ID} format)
	documentID := fmt.Sprintf("book_%d", bookID)

	_, err := Client.Collection(BookCollection).Document(documentID).Delete(ctx)
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

var (
	globalSyncState = &SyncState{
		LastSyncTime: time.Now(),
	}
)

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
