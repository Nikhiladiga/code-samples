package utils

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/typesense/typesense-go/v4/typesense/api"
	"github.com/typesense/typesense-go/v4/typesense/api/pointer"
)

// ImportDocumentsFromJSONL imports documents from a JSONL file in bulk
// This is the production-ready way to load initial data
func ImportDocumentsFromJSONL(ctx context.Context, collectionName, filePath string) error {
	log.Printf("Starting bulk import from %s to collection '%s'...", filePath, collectionName)

	// Read the JSONL file
	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	// Parse each line as a JSON document
	scanner := bufio.NewScanner(file)
	var documents []interface{}
	lineCount := 0

	for scanner.Scan() {
		var doc map[string]interface{}
		if err := json.Unmarshal(scanner.Bytes(), &doc); err != nil {
			log.Printf("Warning: skipping invalid JSON line: %v", err)
			continue
		}
		documents = append(documents, doc)
		lineCount++
	}

	if err := scanner.Err(); err != nil {
		return fmt.Errorf("error reading file: %w", err)
	}

	log.Printf("Read %d documents from file", lineCount)

	// Import documents in bulk using the import API
	// BatchSize controls how many documents are processed at once
	importParams := &api.ImportDocumentsParams{
		BatchSize: pointer.Int(100), // Process in batches of 100
	}

	// The Import method accepts []interface{} containing document maps
	results, err := Client.Collection(collectionName).Documents().Import(
		ctx,
		documents,
		importParams,
	)

	if err != nil {
		return fmt.Errorf("bulk import failed: %w", err)
	}

	// Count successes and failures
	successCount := 0
	failureCount := 0

	for _, result := range results {
		if result.Success {
			successCount++
		} else {
			failureCount++
			// Log first few errors for debugging
			if failureCount <= 5 {
				log.Printf("Import error: %s", result.Error)
			}
		}
	}

	log.Printf("Bulk import completed: %d succeeded, %d failed", successCount, failureCount)

	if failureCount > 0 && failureCount > lineCount/2 {
		// Only error if more than half failed
		return fmt.Errorf("bulk import had too many failures: %d out of %d", failureCount, lineCount)
	}

	return nil
}

// CheckCollectionDocumentCount returns the number of documents in a collection
func CheckCollectionDocumentCount(ctx context.Context, collectionName string) (int, error) {
	collection, err := Client.Collection(collectionName).Retrieve(ctx)
	if err != nil {
		return 0, fmt.Errorf("failed to retrieve collection: %w", err)
	}

	return int(*collection.NumDocuments), nil
}

// InitializeDataIfEmpty checks if collection is empty and imports data if needed
// This is idempotent - safe to run on every startup
func InitializeDataIfEmpty(ctx context.Context, collectionName, dataFilePath string) error {
	log.Printf("Checking if collection '%s' needs data initialization...", collectionName)

	// Check current document count
	count, err := CheckCollectionDocumentCount(ctx, collectionName)
	if err != nil {
		return fmt.Errorf("failed to check document count: %w", err)
	}

	if count > 0 {
		log.Printf("Collection '%s' already has %d documents, skipping import", collectionName, count)
		return nil
	}

	log.Printf("Collection '%s' is empty, importing data from %s", collectionName, dataFilePath)

	// Import data
	if err := ImportDocumentsFromJSONL(ctx, collectionName, dataFilePath); err != nil {
		return fmt.Errorf("failed to import data: %w", err)
	}

	// Verify import
	newCount, err := CheckCollectionDocumentCount(ctx, collectionName)
	if err != nil {
		return fmt.Errorf("failed to verify import: %w", err)
	}

	log.Printf("Data import successful: collection '%s' now has %d documents", collectionName, newCount)
	return nil
}
