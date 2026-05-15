package org.typesense.samplekotlin.data.repository

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.typesense.api.Client
import org.typesense.model.SearchParameters
import org.typesense.samplekotlin.domain.model.Book
import org.typesense.samplekotlin.domain.repository.BookRepository

class TypesenseBookRepository(private val client: Client) : BookRepository {

    override suspend fun searchBooks(query: String): List<Book> = withContext(Dispatchers.IO) {
        val searchParameters = SearchParameters()
            .q(query)
            .queryBy("title,authors")
            .sortBy("average_rating:desc")

        val searchResult = client.collections("books").documents().search(searchParameters)

        searchResult.hits?.map { hit ->
            val document = hit.document
            Book(
                id = document["id"]?.toString() ?: "",
                title = document["title"]?.toString() ?: "",
                authors = (document["authors"] as? List<*>)?.map { it.toString() } ?: emptyList(),
                publicationYear = (document["publication_year"] as? Double)?.toInt(),
                imageUrl = document["image_url"]?.toString(),
                averageRating = document["average_rating"] as? Double
            )
        } ?: emptyList()
    }
}
