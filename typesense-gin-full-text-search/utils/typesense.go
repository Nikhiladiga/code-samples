package utils

import (
	"log"
	"time"

	"github.com/typesense/typesense-go/v4/typesense"
)

var Client *typesense.Client

// InitializeTypesenseClient creates the Typesense client
// This must be called after InitializeEnv() to ensure environment variables are loaded
func InitializeTypesenseClient() {
	apiKey := GetEnv("TYPESENSE_API_KEY", "xyz")
	serverURL := GetServerURL()

	// Create client with simple configuration
	Client = typesense.NewClient(
		typesense.WithServer(serverURL),
		typesense.WithAPIKey(apiKey),
		typesense.WithNumRetries(3),
		typesense.WithRetryInterval(1*time.Second),
	)

	log.Printf("Typesense Client created successfully")
}
