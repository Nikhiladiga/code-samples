package routes

import (
	"context"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/typesense/code-samples/typesense-gin-full-text-search/models"
	"github.com/typesense/code-samples/typesense-gin-full-text-search/utils"
)

// SetupBookRoutes configures all book CRUD routes
func SetupBookRoutes(router *gin.Engine) {
	books := router.Group("/books")
	{
		books.POST("", createBook)
		books.GET("/:id", getBook)
		books.GET("", getAllBooks)
		books.PUT("/:id", updateBook)
		books.DELETE("/:id", deleteBook)
	}
}

// createBook creates a new book in the database and syncs to Typesense
func createBook(c *gin.Context) {
	var book models.Book

	if err := c.ShouldBindJSON(&book); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body: " + err.Error(),
		})
		return
	}

	// Save to database (source of truth)
	if err := utils.SaveBook(c.Request.Context(), &book); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create book: " + err.Error(),
		})
		return
	}

	// Sync to Typesense asynchronously (non-blocking)
	go func(bookCopy models.Book) {
		ctx := context.Background()
		if err := utils.SyncBookOnUpdate(ctx, &bookCopy); err != nil {
			log.Printf("Async Typesense sync failed for book %d: %v", bookCopy.ID, err)
		}
	}(book)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Book created successfully",
		"book":    book,
	})
}

// getBook retrieves a single book by ID
func getBook(c *gin.Context) {
	var uri struct {
		ID uint `uri:"id" binding:"required"`
	}

	if err := c.ShouldBindUri(&uri); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid book ID",
		})
		return
	}

	book, err := utils.GetBookByID(c.Request.Context(), uri.ID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Book not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"book": book,
	})
}

// getAllBooks retrieves all books from the database
func getAllBooks(c *gin.Context) {
	books, err := utils.GetAllBooks(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch books: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"count": len(books),
		"books": books,
	})
}

// updateBook updates an existing book and syncs to Typesense
func updateBook(c *gin.Context) {
	var uri struct {
		ID uint `uri:"id" binding:"required"`
	}

	if err := c.ShouldBindUri(&uri); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid book ID",
		})
		return
	}

	// Fetch existing book
	book, err := utils.GetBookByID(c.Request.Context(), uri.ID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Book not found",
		})
		return
	}

	// Bind updated data directly to existing book
	if err := c.ShouldBindJSON(&book); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body: " + err.Error(),
		})
		return
	}

	// Preserve the ID (in case it was in the JSON)
	book.ID = uri.ID

	// Save to database
	if err := utils.SaveBook(c.Request.Context(), book); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update book: " + err.Error(),
		})
		return
	}

	// Sync to Typesense asynchronously (non-blocking)
	go func(bookCopy models.Book) {
		ctx := context.Background()
		if err := utils.SyncBookOnUpdate(ctx, &bookCopy); err != nil {
			log.Printf("Async Typesense sync failed for book %d: %v", bookCopy.ID, err)
		}
	}(*book)

	c.JSON(http.StatusOK, gin.H{
		"message": "Book updated successfully",
		"book":    book,
	})
}

// deleteBook soft-deletes a book and removes it from Typesense
func deleteBook(c *gin.Context) {
	var uri struct {
		ID uint `uri:"id" binding:"required"`
	}

	if err := c.ShouldBindUri(&uri); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid book ID",
		})
		return
	}

	// Check if book exists
	_, err := utils.GetBookByID(c.Request.Context(), uri.ID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Book not found",
		})
		return
	}

	// Soft delete from database
	if err := utils.DeleteBook(c.Request.Context(), uri.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete book: " + err.Error(),
		})
		return
	}

	// Remove from Typesense asynchronously (non-blocking)
	go func(bookID uint) {
		ctx := context.Background()
		if err := utils.SyncBookDeletionOnDelete(ctx, bookID); err != nil {
			log.Printf("Async Typesense deletion failed for book %d: %v", bookID, err)
		}
	}(uri.ID)

	c.JSON(http.StatusOK, gin.H{
		"message": "Book deleted successfully",
	})
}
