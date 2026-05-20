import Foundation
import Combine
import Typesense

@MainActor
class SearchViewModel: ObservableObject {
    @Published var searchText = ""
    @Published var results: [Book] = []
    @Published var isSearching = false
    
    private let client: Client
    private var searchTask: Task<Void, Never>?
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        let node = Node(host: TypesenseConfig.host, port: TypesenseConfig.port, nodeProtocol: TypesenseConfig.scheme)
        let config = Configuration(nodes: [node], apiKey: TypesenseConfig.apiKey)
        self.client = Client(config: config)
        
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
        let searchParameters = SearchParameters(q: query, queryBy: "title,authors")
        let (searchResult, _) = try await client
            .collection(name: TypesenseConfig.collection)
            .documents()
            .search(searchParameters, for: Book.self)
        
        return searchResult?.hits?.compactMap { $0.document } ?? []
    }
}
