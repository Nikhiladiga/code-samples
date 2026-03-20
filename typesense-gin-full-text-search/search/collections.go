package search

import (
	"context"
	"fmt"
	"log"

	"github.com/typesense/code-samples/typesense-gin-full-text-search/config"
	"github.com/typesense/typesense-go/v4/typesense/api"
	"github.com/typesense/typesense-go/v4/typesense/api/pointer"
)

// InitializeCollections ensures all required collections exist
// This is idempotent - safe to call multiple times
func InitializeCollections(ctx context.Context) error {
	log.Println("Initializing Typesense collections...")

	booksSchema := &api.CollectionSchema{
		Name: config.BookCollection,
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

	_, err := Client.Collection(config.BookCollection).Retrieve(ctx)
	if err != nil {
		log.Printf("Collection '%s' not found, creating...", config.BookCollection)
		_, err = Client.Collections().Create(ctx, booksSchema)
		if err != nil {
			return fmt.Errorf("failed to create collection '%s': %w", config.BookCollection, err)
		}
		log.Printf("Collection '%s' created successfully", config.BookCollection)
	} else {
		log.Printf("Collection '%s' already exists, skipping creation", config.BookCollection)
	}

	return nil
}

// CollectionDocumentCount returns the number of documents in the books collection.
// Returns 0 on any error (treated as empty).
func CollectionDocumentCount(ctx context.Context) int64 {
	coll, err := Client.Collection(config.BookCollection).Retrieve(ctx)
	if err != nil || coll.NumDocuments == nil {
		return 0
	}
	return *coll.NumDocuments
}
