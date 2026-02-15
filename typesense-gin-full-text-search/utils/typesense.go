package utils

import (
	"log"

	"github.com/typesense/typesense-go/v4/typesense"
)

var Client *typesense.Client

func init() {
	apiKey := GetEnv("TYPESENSE_API_KEY", "xyz")
	serverURL := GetServerURL()

	// Create client with simple configuration
	Client = typesense.NewClient(
		typesense.WithServer(serverURL),
		typesense.WithAPIKey(apiKey),
	)

	log.Printf("Typesense Client created successfully")
}
