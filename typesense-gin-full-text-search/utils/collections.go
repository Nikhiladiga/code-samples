package utils

import (
	"context"
	"log"

	"github.com/typesense/typesense-go/v4/typesense/api"
	"github.com/typesense/typesense-go/v4/typesense/api/pointer"
)

// InitializeCollections ensures all required collections exist
// This is idempotent - safe to call multiple times
func InitializeCollections(ctx context.Context) error {
	log.Println("Initializing Typesense collections...")

	// Define the books collection schema
	booksSchema := &api.CollectionSchema{
		Name: BookCollection,
		Fields: []api.Field{
			{Name: "title", Type: "string", Facet: pointer.False()},
			{Name: "authors", Type: "string[]", Facet: pointer.True()},
			{Name: "publication_year", Type: "int32", Facet: pointer.True()},
			{Name: "average_rating", Type: "float", Facet: pointer.True()},
			{Name: "image_url", Type: "string", Facet: pointer.False()},
			{Name: "ratings_count", Type: "int32", Facet: pointer.True()},
		},
		DefaultSortingField: pointer.String("ratings_count"),
	}

	// Try to retrieve the collection to check if it exists
	_, err := Client.Collection(BookCollection).Retrieve(ctx)
	if err != nil {
		// Collection doesn't exist, create it
		log.Printf("Collection '%s' not found, creating...", BookCollection)
		_, err = Client.Collections().Create(ctx, booksSchema)
		if err != nil {
			log.Printf("Failed to create collection '%s': %v", BookCollection, err)
			return err
		}
		log.Printf("Collection '%s' created successfully", BookCollection)
	} else {
		log.Printf("Collection '%s' already exists, skipping creation", BookCollection)
	}

	return nil
}
