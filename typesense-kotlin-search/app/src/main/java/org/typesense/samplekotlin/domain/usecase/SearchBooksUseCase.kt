package org.typesense.samplekotlin.domain.usecase

import org.typesense.samplekotlin.domain.model.Book
import org.typesense.samplekotlin.domain.repository.BookRepository

class SearchBooksUseCase(private val repository: BookRepository) {
    suspend operator fun invoke(query: String): Result<List<Book>> {
        return try {
            if (query.isBlank()) {
                Result.success(emptyList())
            } else {
                Result.success(repository.searchBooks(query))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
