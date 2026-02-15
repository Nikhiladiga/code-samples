package utils

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// init() function runs automatically when the package is imported
func init() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}
}

// Helper functions to read environment variables with defaults
func GetEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func GetEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func GetServerURL() string {
	protocol := GetEnv("TYPESENSE_PROTOCOL", "http")
	host := GetEnv("TYPESENSE_HOST", "localhost")
	port := GetEnvAsInt("TYPESENSE_PORT", 8108)
	return protocol + "://" + host + ":" + strconv.Itoa(port)
}

// Collection name for books
var BookCollection = GetEnv("TYPESENSE_COLLECTION", "books")
