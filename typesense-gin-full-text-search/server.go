package main

import (
	"context"
	"log"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/typesense/code-samples/typesense-gin-full-text-search/config"
	"github.com/typesense/code-samples/typesense-gin-full-text-search/routes"
	"github.com/typesense/code-samples/typesense-gin-full-text-search/search"
	"github.com/typesense/code-samples/typesense-gin-full-text-search/store"
)

func main() {
	// Initialize environment variables first (loads .env file)
	config.InitializeEnv()

	// Initialize Typesense client (depends on env vars being loaded)
	search.InitializeClient()

	// Connect to database
	store.ConnectToDB(context.Background())

	// Initialize collections before starting the server
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := search.InitializeCollections(ctx); err != nil {
		log.Fatalf("Failed to initialize collections: %v", err)
	}

	// Initialize data if collection is empty
	// Use this if you want to import data from a JSONL file
	// This is idempotent - only imports if collection has no documents
	// dataFile := "books.jsonl"
	// if err := utils.InitializeDataIfEmpty(ctx, utils.BookCollection, dataFile); err != nil {
	// 	log.Printf("Warning: Failed to initialize data: %v", err)
	// 	log.Println("Server will continue, but collection may be empty")
	// }

	router := gin.Default()

	// CORS middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false,
	}))

	// Health check endpoint
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	// Setup search and sync routes
	routes.SetupSearchRoutes(router)

	// Setup book CRUD routes
	routes.SetupBookRoutes(router)

	// Start background sync worker
	syncConfig := search.DefaultSyncConfig()
	syncConfig.EnableSoftDelete = true
	go search.StartSyncWorker(context.Background(), syncConfig)

	port := config.GetEnv("PORT", "3000")
	log.Printf("Server starting on port %s", port)
	log.Printf("Sync worker started with interval: %d seconds", syncConfig.SyncIntervalSec)
	router.Run(":" + port)
}
