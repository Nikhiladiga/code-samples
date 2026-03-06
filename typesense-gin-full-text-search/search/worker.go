package search

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/typesense/code-samples/typesense-gin-full-text-search/models"
	"github.com/typesense/code-samples/typesense-gin-full-text-search/store"
)

var (
	workerCtx         context.Context
	workerCancel      context.CancelFunc
	workerStartedOnce sync.Once
)

// StartSyncWorker starts a background worker that periodically syncs database changes to Typesense
func StartSyncWorker(ctx context.Context, cfg *SyncConfig) {
	workerCtx, workerCancel = context.WithCancel(ctx)
	SetSyncWorkerRunning(true)

	log.Printf("Starting sync worker with interval: %d seconds", cfg.SyncIntervalSec)

	workerStartedOnce.Do(func() {
		time.Sleep(2 * time.Second)

		if CollectionDocumentCount(workerCtx) > 0 {
			// Typesense already has data — seed from DB's latest updated_at
			// so we only pick up records changed since the last known state.
			if latest, err := store.GetLatestUpdatedAt(workerCtx); err == nil && !latest.IsZero() {
				SetLastSyncTime(latest)
				log.Printf("Typesense already populated, seeding sync time from DB: %s", latest.Format(time.RFC3339))
			}
		} else {
			// Typesense is empty — full sync from zero time
			log.Printf("Typesense collection is empty, running full sync")
		}

		lastSyncTime := GetLastSyncTime()
		if newSyncTime, err := SyncBooksToTypesense(workerCtx, lastSyncTime); err != nil {
			log.Printf("Initial sync failed: %v", err)
		} else {
			SetLastSyncTime(newSyncTime)
			log.Printf("Initial sync completed at %s", newSyncTime.Format(time.RFC3339))
		}
	})

	ticker := time.NewTicker(time.Duration(cfg.SyncIntervalSec) * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			log.Printf("Running periodic sync...")
			lastSyncTime := GetLastSyncTime()
			if newSyncTime, err := SyncBooksToTypesense(workerCtx, lastSyncTime); err != nil {
				log.Printf("Periodic sync failed: %v", err)
			} else {
				SetLastSyncTime(newSyncTime)
			}
			if cfg.EnableSoftDelete {
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

func handleSoftDeletes(ctx context.Context, lastSyncTime time.Time) error {
	deletedBooks, err := store.GetDeletedBooks(ctx, lastSyncTime)
	if err != nil {
		return err
	}

	if len(deletedBooks) == 0 {
		return nil
	}

	deletedIDs := make([]uint, 0, len(deletedBooks))
	for _, book := range deletedBooks {
		deletedIDs = append(deletedIDs, book.ID)
	}

	log.Printf("Found %d soft-deleted books to sync to Typesense", len(deletedIDs))

	if err := SyncSoftDeletesToTypesense(ctx, deletedIDs); err != nil {
		return err
	}

	SetLastSyncTime(time.Now())
	return nil
}

// SyncBookOnUpdate handles real-time sync when a book is created or updated
func SyncBookOnUpdate(ctx context.Context, book *models.Book) error {
	if err := SyncSingleBookToTypesense(ctx, *book); err != nil {
		return err
	}
	SetLastSyncTime(time.Now())
	return nil
}

// SyncBookDeletionOnDelete handles real-time sync when a book is deleted
func SyncBookDeletionOnDelete(ctx context.Context, bookID uint) error {
	if err := SyncSingleBookDeletionToTypesense(ctx, bookID); err != nil {
		return err
	}
	SetLastSyncTime(time.Now())
	return nil
}
