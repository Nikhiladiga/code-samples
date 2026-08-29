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

		// Always catch up from the zero time on boot so records that changed
		// while the server was down are backfilled. Seeding from the DB's
		// MAX(updated_at) would make the incremental query "find rows newer
		// than the newest row", which matches nothing by construction.
		log.Printf("Running initial catch-up sync from %s", GetLastSyncTime().Format(time.RFC3339))
		runSyncCycle(workerCtx, cfg)
	})

	ticker := time.NewTicker(time.Duration(cfg.SyncIntervalSec) * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			log.Printf("Running periodic sync...")
			runSyncCycle(workerCtx, cfg)
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

// runSyncCycle performs one upsert pass and one soft-delete pass over the same
// window, and only advances the sync time when both succeeded.
func runSyncCycle(ctx context.Context, cfg *SyncConfig) {
	lastSyncTime := GetLastSyncTime()

	newSyncTime, err := SyncBooksToTypesense(ctx, lastSyncTime)
	if err != nil {
		log.Printf("Sync failed, last sync time stays at %s: %v", lastSyncTime.Format(time.RFC3339), err)
		return
	}

	if cfg.EnableSoftDelete {
		if err := handleSoftDeletes(ctx, lastSyncTime); err != nil {
			log.Printf("Soft delete sync failed, last sync time stays at %s: %v", lastSyncTime.Format(time.RFC3339), err)
			return
		}
	}

	SetLastSyncTime(newSyncTime)
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

	return nil
}

// SyncBookOnUpdate handles real-time sync when a book is created or updated
// The sync time is deliberately left alone here. Moving it forward on a single
// write would push the window past concurrent changes made by anything else,
// and the periodic sync would never pick them up.
func SyncBookOnUpdate(ctx context.Context, book *models.Book) error {
	return SyncSingleBookToTypesense(ctx, *book)
}

// SyncBookDeletionOnDelete handles real-time sync when a book is deleted
func SyncBookDeletionOnDelete(ctx context.Context, bookID uint) error {
	return SyncSingleBookDeletionToTypesense(ctx, bookID)
}
