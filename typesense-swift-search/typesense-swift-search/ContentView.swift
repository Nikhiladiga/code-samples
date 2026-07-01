import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = SearchViewModel()
    
    private let columns = [
        GridItem(.flexible(), spacing: 16),
        GridItem(.flexible(), spacing: 16)
    ]
    
    var body: some View {
        ZStack {
            Color(red: 34/255, green: 34/255, blue: 34/255)
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                VStack(spacing: 16) {
                    Text("Book Search")
                        .font(.system(size: 40, weight: .bold))
                        .foregroundColor(.white)
                    
                    HStack(spacing: 6) {
                        Text("powered by")
                            .foregroundColor(Color(white: 0.7))
                            .font(.system(size: 14))
                        Text("typesense")
                            .foregroundColor(Color(red: 236/255, green: 72/255, blue: 127/255))
                            .font(.system(size: 14, weight: .semibold))
                        Text("&")
                            .foregroundColor(Color(white: 0.7))
                            .font(.system(size: 14))
                        Image(systemName: "swift")
                            .foregroundColor(.orange)
                            .font(.system(size: 16))
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color(red: 45/255, green: 45/255, blue: 45/255))
                    .cornerRadius(20)
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(Color.white.opacity(0.1), lineWidth: 1)
                    )
                }
                .padding(.top, 40)
                .padding(.bottom, 20)
                
                // Search Bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    
                    TextField("Search books...", text: $viewModel.searchText)
                        .foregroundColor(.white)
                        .accentColor(.white)
                }
                .padding(15)
                .background(Color(red: 68/255, green: 68/255, blue: 68/255))
                .cornerRadius(10)
                .padding(.horizontal, 20)
                .padding(.top, 10)
                .padding(.bottom, 20)
                
                if viewModel.isSearching && viewModel.results.isEmpty {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .padding()
                    Spacer()
                } else if viewModel.results.isEmpty && !viewModel.searchText.isEmpty {
                    Text("No results found")
                        .foregroundColor(.gray)
                        .padding()
                    Spacer()
                } else {
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 16) {
                            ForEach(viewModel.results) { book in
                                BookCardView(book: book)
                            }
                        }
                        .padding(.horizontal, 16)
                    }
                }
            }
        }
        .onAppear {
            if viewModel.results.isEmpty && viewModel.searchText.isEmpty {
                viewModel.triggerSearch()
            }
        }
    }
}

#Preview {
    ContentView()
}
