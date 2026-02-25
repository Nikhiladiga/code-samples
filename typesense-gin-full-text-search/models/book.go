package models

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

type Book struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	Title           string         `json:"title"`
	Authors         []string       `gorm:"serializer:json" json:"authors"`
	PublicationYear int            `json:"publication_year"`
	AverageRating   float64        `json:"average_rating"`
	ImageUrl        string         `json:"image_url"`
	RatingsCount    int            `json:"ratings_count"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

func (b *Book) GetTypesenseID() string {
	return fmt.Sprintf("book_%d", b.ID)
}

func (b *Book) BeforeCreate(tx *gorm.DB) error {
	return nil
}

func (b *Book) BeforeUpdate(tx *gorm.DB) error {
	b.UpdatedAt = time.Now()
	return nil
}

func (b *Book) BeforeDelete(tx *gorm.DB) error {
	b.UpdatedAt = time.Now()
	return nil
}
