package utils

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/typesense/code-samples/typesense-gin-full-text-search/models"
)

var (
	workerCtx       context.Context
	workerCancel    context.CancelFunc
	workerStartedOnce sync.Once
)

// StartSyncWorker starts a background worker that periodically syncs database changes to Typesense
func StartSyncWorker(ctx context.Context, config *SyncConfig) {
	workerCtx, workerCancel = context.WithCancel(ctx)
	SetSyncWorkerRunning(true)

	log.Printf("Starting sync worker with interval: %d seconds", config.SyncIntervalSec)

	// Initial sync - wait for it to complete before starting the ticker
	workerStartedOnce.Do(func() {
		// Wait a bit before first sync to allow server to start
		time.Sleep(2 * time.Second)
		lastSyncTime := GetLastSyncTime()
		if newSyncTime, err := SyncBooksToTypesense(workerCtx, lastSyncTime); err != nil {
			log.Printf("Initial sync failed: %v", err)
		} else {
			SetLastSyncTime(newSyncTime)
			log.Printf("Initial sync completed at %s", newSyncTime.Format(time.RFC3339))
		}
	})

	// Periodic sync loop - only starts after initial sync completes
	ticker := time.NewTicker(time.Duration(config.SyncIntervalSec) * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			log.Printf("Running periodic sync...")
			lastSyncTime := GetLastSyncTime()
			if newSyncTime, err := SyncBooksToTypesense(workerCtx, lastSyncTime); err != nil {
				log.Printf("Periodic sync failed: %v", err)
			} else {
				// Update the last sync time after successful sync
				SetLastSyncTime(newSyncTime)
			}
			// Handle soft deletes if enabled
			if config.EnableSoftDelete {
				if err := handleSoftDeletes(workerCtx, lastSyncTime); err != nil {
					log.Printf("Soft delete sync failed: %v", err)
				}
			}
		case <-workerCtx.Done():
			log.Println("Sync worker stopped")
			SetSyncWorkerRunning(false)
			return
		}
	}
}

// StopSyncWorker stops the background sync worker
func StopSyncWorker() {
	if workerCancel != nil {
		workerCancel()
	}
}

// handleSoftDeletes processes soft-deleted books and removes them from Typesense
// Uses the provided lastSyncTime instead of reading the current time to avoid
// missing soft-deletes that occurred between the upsert sync and soft delete check
func handleSoftDeletes(ctx context.Context, lastSyncTime time.Time) error {
	log.Printf("handleSoftDeletes: checking for soft-deleted books since %s", lastSyncTime.Format(time.RFC3339))

	// Get soft-deleted books since last sync
	deletedBooks, err := GetDeletedBooks(ctx, lastSyncTime)
	if err != nil {
		return err
	}

	log.Printf("handleSoftDeletes: found %d soft-deleted books", len(deletedBooks))

	if len(deletedBooks) == 0 {
		return nil
	}

	// Collect IDs of deleted books
	deletedIDs := make([]uint, 0, len(deletedBooks))
	for _, book := range deletedBooks {
		deletedIDs = append(deletedIDs, book.ID)
	}

	log.Printf("Found %d soft-deleted books to sync to Typesense", len(deletedIDs))

	// Sync deletions to Typesense
	if err := SyncSoftDeletesToTypesense(ctx, deletedIDs); err != nil {
		return err
	}

	// Clear soft deletes from database (optional - depends on your retention policy)
	// Note: gORM's Delete does soft delete if model has DeletedAt field
	// To permanently delete, use Unscoped():
	// DB.Unscoped().Where("id IN ?", deletedIDs).Delete(&models.Book{})

	// Update last sync time
	SetLastSyncTime(time.Now())

	return nil
}

// SyncBookOnUpdate handles real-time sync when a book is created or updated
// This is meant to be called from your Gin handlers after DB operations
func SyncBookOnUpdate(ctx context.Context, book *models.Book) error {
	// Sync to Typesense immediately (real-time)
	if err := SyncSingleBookToTypesense(ctx, *book); err != nil {
		return err
	}

	// Update sync state timestamp
	SetLastSyncTime(time.Now())

	return nil
}

// SyncBookDeletionOnDelete handles real-time sync when a book is deleted
func SyncBookDeletionOnDelete(ctx context.Context, bookID uint) error {
	// Sync deletion to Typesense immediately (real-time)
	if err := SyncSingleBookDeletionToTypesense(ctx, bookID); err != nil {
		return err
	}

	// Update sync state timestamp
	SetLastSyncTime(time.Now())

	return nil
}
