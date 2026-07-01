package org.typesense.samplekotlin.domain.model

data class Book(
    val id: String,
    val title: String,
    val authors: List<String>,
    val publicationYear: Int?,
    val imageUrl: String?,
    val averageRating: Double?
)
