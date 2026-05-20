import Foundation

struct Book: Identifiable, Codable {
    let id: String
    let title: String
    let authors: [String]
    let publicationYear: Int
    let imageUrl: String
    
    enum CodingKeys: String, CodingKey {
        case id
        case title
        case authors
        case publicationYear = "publication_year"
        case imageUrl = "image_url"
    }
}

struct TypesenseSearchResult: Codable {
    let hits: [TypesenseHit]
}

struct TypesenseHit: Codable {
    let document: Book
}
