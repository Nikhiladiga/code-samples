import Foundation

struct TypesenseConfig {
    // For Production, use your Typesense Cloud host and port 443 with https
    static let host = "localhost"
    static let port = "8108"
    static let scheme = "http"
    
    // IMPORTANT: In a production iOS app, ALWAYS use a Search-Only API Key, never an Admin Key.
    static let apiKey = "xyz"
    static let collection = "books"
    
    static var baseURL: URL {
        URL(string: "\(scheme)://\(host):\(port)")!
    }
}
