package search

import (
	"log"
	"time"

	"github.com/typesense/code-samples/typesense-gin-full-text-search/config"
	"github.com/typesense/typesense-go/v4/typesense"
)

var Client *typesense.Client

// InitializeClient creates the Typesense client
// This must be called after config.InitializeEnv() to ensure environment variables are loaded
func InitializeClient() {
	apiKey := config.GetEnv("TYPESENSE_API_KEY", "xyz")
	serverURL := config.GetServerURL()

	Client = typesense.NewClient(
		typesense.WithServer(serverURL),
		typesense.WithAPIKey(apiKey),
		typesense.WithNumRetries(3),
		typesense.WithRetryInterval(1*time.Second),
	)

	log.Printf("Typesense Client created successfully")
}
