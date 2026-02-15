package main

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/typesense/code-samples/typesense-gin-full-text-search/routes"
	"github.com/typesense/code-samples/typesense-gin-full-text-search/utils"
)

func main() {
	router := gin.Default()

	// CORS middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Health check endpoint
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	// Setup search routes
	routes.SetupSearchRoutes(router)

	port := utils.GetEnv("PORT", "3000")
	router.Run(":" + port)
}
