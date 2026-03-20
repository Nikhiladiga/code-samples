package routes

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/typesense/code-samples/typesense-gin-full-text-search/config"
	"github.com/typesense/code-samples/typesense-gin-full-text-search/search"
	"github.com/typesense/code-samples/typesense-gin-full-text-search/store"
	"github.com/typesense/typesense-go/v4/typesense/api"
	"github.com/typesense/typesense-go/v4/typesense/api/pointer"
)

// SetupSearchRoutes configures all search-related routes
func SetupSearchRoutes(router *gin.Engine) {
	// Simple search endpoint
	router.GET("/search", searchBooks)

	// Sync endpoints for database-to-Typesense synchronization
	router.POST("/sync", syncDatabaseToTypesense)
	router.GET("/sync/status", getSyncStatus)
}

// searchBooks handles the search request
func searchBooks(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Search query parameter 'q' is required",
		})
		return
	}

	// Create search parameters
	searchParams := &api.SearchCollectionParams{
		Q:              pointer.String(query),
		QueryBy:        pointer.String("title,authors"),
		QueryByWeights: pointer.String("2,1"),                                     // Title matches are weighted 2x more than author matches
		FacetBy:        pointer.String("authors,publication_year,average_rating"), // Get facet counts for filtering
	}

	// Perform search using the Typesense client
	result, err := search.Client.Collection(config.BookCollection).Documents().Search(c.Request.Context(), searchParams)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Search failed: " + err.Error(),
			"debug": gin.H{
				"collection": config.BookCollection,
				"query":      query,
				"server_url": config.GetServerURL(),
			},
		})
		return
	}

	// Return search results
	c.JSON(http.StatusOK, gin.H{
		"query":        query,
		"results":      *result.Hits,
		"found":        *result.Found,
		"took":         result.SearchTimeMs,
		"facet_counts": result.FacetCounts,
	})
}

// syncDatabaseToTypesense triggers an immediate sync from database to Typesense
func syncDatabaseToTypesense(c *gin.Context) {
	ctx := c.Request.Context()

	// Get last sync time from global state
	lastSyncTime := search.GetLastSyncTime()

	// Perform regular book sync (inserts and updates)
	newSyncTime, err := search.SyncBooksToTypesense(ctx, lastSyncTime)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Sync failed",
			"message": err.Error(),
		})
		return
	}

	// Handle soft deletes
	deletedBooks, err := store.GetDeletedBooks(ctx, lastSyncTime)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch deleted books",
			"message": err.Error(),
		})
		return
	}

	if len(deletedBooks) > 0 {
		deletedIDs := make([]uint, 0, len(deletedBooks))
		for _, book := range deletedBooks {
			deletedIDs = append(deletedIDs, book.ID)
		}

		if err := search.SyncSoftDeletesToTypesense(ctx, deletedIDs); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to sync deletions",
				"message": err.Error(),
			})
			return
		}
	}

	// Update global sync time
	search.SetLastSyncTime(newSyncTime)

	c.JSON(http.StatusOK, gin.H{
		"message":      "Sync completed",
		"newSyncTime":  newSyncTime.Format(time.RFC3339),
		"syncedAt":     time.Now().Format(time.RFC3339),
		"deletedBooks": len(deletedBooks),
	})
}

// getSyncStatus returns the current sync status
func getSyncStatus(c *gin.Context) {
	lastSyncTime := search.GetLastSyncTime()

	c.JSON(http.StatusOK, gin.H{
		"lastSyncTime":      lastSyncTime.Format(time.RFC3339),
		"syncWorkerRunning": search.IsSyncWorkerRunning(),
	})
}
