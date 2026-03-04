package utils

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

var (
	envLoaded = false
)

// InitializeEnv loads the .env file and initializes package-level variables
// This must be called explicitly from main() before any environment variables are accessed
func InitializeEnv() {
	if envLoaded {
		return
	}
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}
	envLoaded = true

	// Initialize package-level variables that depend on environment
	initializeBookCollection()
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

// BookCollection holds the collection name for books
// Initialized by InitializeEnv()
var BookCollection string

// initializeBookCollection sets the collection name from environment
// Called by InitializeEnv() after .env is loaded
func initializeBookCollection() {
	BookCollection = GetEnv("TYPESENSE_COLLECTION", "books")
}
