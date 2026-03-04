package main

import (
	"context"
	"log"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/typesense/code-samples/typesense-gin-full-text-search/routes"
	"github.com/typesense/code-samples/typesense-gin-full-text-search/utils"
)

func main() {
	// Initialize environment variables first (loads .env file)
	utils.InitializeEnv()

	// Initialize Typesense client (depends on env vars being loaded)
	utils.InitializeTypesenseClient()

	// Connect to database (stores global DB instance in utils.DB)
	utils.ConnectToDB(context.Background())

	// Initialize collections before starting the server
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := utils.InitializeCollections(ctx); err != nil {
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
	syncConfig := utils.DefaultSyncConfig()
	syncConfig.EnableSoftDelete = true // Enable soft delete handling
	go utils.StartSyncWorker(context.Background(), syncConfig)

	port := utils.GetEnv("PORT", "3000")
	log.Printf("Server starting on port %s", port)
	log.Printf("Sync worker started with interval: %d seconds", syncConfig.SyncIntervalSec)
	router.Run(":" + port)
}
