package org.typesense.samplekotlin.domain.repository

import org.typesense.samplekotlin.domain.model.Book

interface BookRepository {
    suspend fun searchBooks(query: String): List<Book>
}
