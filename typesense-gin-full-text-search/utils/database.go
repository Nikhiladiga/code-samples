package utils

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/typesense/code-samples/typesense-gin-full-text-search/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectToDB(ctx context.Context) *gorm.DB {
	host := os.Getenv("DB_HOST")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")
	port := os.Getenv("DB_PORT")

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC",
		host, user, password, dbname, port,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic(fmt.Sprintf("Failed to connect to the database: %v", err))
	}

	// Auto-migrate the schema
	if err := db.AutoMigrate(&models.Book{}); err != nil {
		panic(fmt.Sprintf("Failed to auto-migrate: %v", err))
	}

	DB = db
	return db
}

// GetBookByID retrieves a single book by ID
func GetBookByID(ctx context.Context, id uint) (*models.Book, error) {
	var book models.Book
	if err := DB.WithContext(ctx).First(&book, id).Error; err != nil {
		return nil, err
	}
	return &book, nil
}

// GetBooksByUpdatedAt fetches books updated after a given time
// This is used for incremental sync to Typesense
// WARNING: This loads all matching books into memory. For large result sets, use GetBooksByUpdatedAtPaginated.
func GetBooksByUpdatedAt(ctx context.Context, since time.Time) ([]models.Book, error) {
	var books []models.Book
	err := DB.WithContext(ctx).
		Where("updated_at > ?", since).
		Order("updated_at ASC").
		Find(&books).Error
	return books, err
}

// GetBooksByUpdatedAtPaginated fetches books updated after a given time in pages
// Returns books for the given page (1-indexed) with the specified page size
func GetBooksByUpdatedAtPaginated(ctx context.Context, since time.Time, page int, pageSize int) ([]models.Book, error) {
	var books []models.Book
	offset := (page - 1) * pageSize
	err := DB.WithContext(ctx).
		Where("updated_at > ?", since).
		Offset(offset).
		Limit(pageSize).
		Order("updated_at ASC").
		Find(&books).Error
	return books, err
}

// GetUpdatedBooksCount returns the count of books updated after a given time
func GetUpdatedBooksCount(ctx context.Context, since time.Time) (int64, error) {
	var count int64
	err := DB.WithContext(ctx).
		Model(&models.Book{}).
		Where("updated_at > ?", since).
		Count(&count).Error
	return count, err
}

// GetAllBooks fetches all books (for full import)
// WARNING: This loads all books into memory at once. For large datasets, use GetAllBooksPaginated instead.
func GetAllBooks(ctx context.Context) ([]models.Book, error) {
	var books []models.Book
	err := DB.WithContext(ctx).Find(&books).Error
	return books, err
}

// GetAllBooksPaginated fetches books in pages for memory-efficient processing
// Returns books for the given page (1-indexed) with the specified page size
func GetAllBooksPaginated(ctx context.Context, page int, pageSize int) ([]models.Book, error) {
	var books []models.Book
	offset := (page - 1) * pageSize
	err := DB.WithContext(ctx).
		Offset(offset).
		Limit(pageSize).
		Order("id ASC"). // Consistent ordering for pagination
		Find(&books).Error
	return books, err
}

// GetTotalBooksCount returns the total number of books in the database
func GetTotalBooksCount(ctx context.Context) (int64, error) {
	var count int64
	err := DB.WithContext(ctx).Model(&models.Book{}).Count(&count).Error
	return count, err
}

// GetDeletedBooks fetches soft-deleted books since a given time
// Uses updated_at to find books that were deleted (soft delete updates updated_at)
func GetDeletedBooks(ctx context.Context, since time.Time) ([]models.Book, error) {
	var books []models.Book
	err := DB.WithContext(ctx).
		Unscoped(). // Include soft-deleted records
		Where("deleted_at IS NOT NULL").
		Where("updated_at > ?", since).
		Find(&books).Error
	return books, err
}

// SaveBook creates or updates a book
func SaveBook(ctx context.Context, book *models.Book) error {
	return DB.WithContext(ctx).Save(book).Error
}

// DeleteBook performs soft delete
func DeleteBook(ctx context.Context, id uint) error {
	return DB.WithContext(ctx).Delete(&models.Book{}, id).Error
}

// BulkSaveBooks inserts or updates multiple books using gORM's Create with bulk insert
// Note: For upsert (update on conflict), use database-specific syntax
func BulkSaveBooks(ctx context.Context, books []models.Book) error {
	// Begin transaction
	tx := DB.WithContext(ctx).Begin()
	defer tx.Rollback()

	if err := tx.Create(books).Error; err != nil {
		return err
	}

	return tx.Commit().Error
}

// BulkUpsertBooks performs PostgreSQL-specific upsert (ON CONFLICT)
// This is more efficient than gORM's default Create for updates
func BulkUpsertBooks(ctx context.Context, books []models.Book) error {
	if len(books) == 0 {
		return nil
	}

	// Hardcode table name - gORM pluralizes model name
	tableName := "books"

	// Build values string for INSERT
	values := make([]string, 0, len(books))
	args := make([]any, 0, len(books)*7)

	for _, book := range books {
		values = append(values, "(?, ?, ?, ?, ?, ?, ?)")
		args = append(args, book.ID, book.Title, book.Authors, book.PublicationYear, book.AverageRating, book.ImageUrl, book.RatingsCount)
	}

	// PostgreSQL ON CONFLICT query for upsert
	// Updates all fields except id on conflict
	query := fmt.Sprintf(`
		INSERT INTO %s (id, title, authors, publication_year, average_rating, image_url, ratings_count)
		VALUES %s
		ON CONFLICT (id) DO UPDATE SET
			title = EXCLUDED.title,
			authors = EXCLUDED.authors,
			publication_year = EXCLUDED.publication_year,
			average_rating = EXCLUDED.average_rating,
			image_url = EXCLUDED.image_url,
			ratings_count = EXCLUDED.ratings_count,
			updated_at = NOW()
	`, tableName, strings.Join(values, ","))

	return DB.WithContext(ctx).Exec(query, args...).Error
}
