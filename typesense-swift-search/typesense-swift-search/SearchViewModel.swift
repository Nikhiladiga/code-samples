import Foundation
import Combine

@MainActor
class SearchViewModel: ObservableObject {
    @Published var searchText = ""
    @Published var results: [Book] = []
    @Published var isSearching = false
    
    private var searchTask: Task<Void, Never>?
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        $searchText
            .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
            .removeDuplicates()
            .sink { [weak self] _ in
                self?.triggerSearch()
            }
            .store(in: &cancellables)
    }
    
    func triggerSearch() {
        searchTask?.cancel()
        
        let query = searchText.isEmpty ? "*" : searchText
        
        self.isSearching = true
        
        searchTask = Task {
            do {
                let books = try await self.performSearch(query: query)
                if !Task.isCancelled {
                    self.results = books
                    self.isSearching = false
                }
            } catch {
                if !Task.isCancelled {
                    print("Search error: \(error)")
                    self.results = []
                    self.isSearching = false
                }
            }
        }
    }
    
    private func performSearch(query: String) async throws -> [Book] {
        var urlComponents = URLComponents(url: TypesenseConfig.baseURL.appendingPathComponent("collections/\(TypesenseConfig.collection)/documents/search"), resolvingAgainstBaseURL: false)!
        
        urlComponents.queryItems = [
            URLQueryItem(name: "q", value: query),
            URLQueryItem(name: "query_by", value: "title,authors")
        ]
        
        var request = URLRequest(url: urlComponents.url!)
        request.addValue(TypesenseConfig.apiKey, forHTTPHeaderField: "X-TYPESENSE-API-KEY")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(TypesenseSearchResult.self, from: data)
        return response.hits.map { $0.document }
    }
}
