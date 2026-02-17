package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/typesense/code-samples/typesense-gin-full-text-search/utils"
	"github.com/typesense/typesense-go/v4/typesense/api"
	"github.com/typesense/typesense-go/v4/typesense/api/pointer"
)

// SetupSearchRoutes configures all search-related routes
func SetupSearchRoutes(router *gin.Engine) {
	// Simple search endpoint
	router.GET("/search", searchBooks)
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
	result, err := utils.Client.Collection(utils.BookCollection).Documents().Search(c.Request.Context(), searchParams)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Search failed: " + err.Error(),
			"debug": gin.H{
				"collection": utils.BookCollection,
				"query":      query,
				"server_url": utils.GetServerURL(),
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
