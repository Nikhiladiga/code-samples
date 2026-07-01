import SwiftUI

struct BookCardView: View {
    let book: Book
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            AsyncImage(url: URL(string: book.imageUrl)) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Color.gray
            }
            .frame(height: 200)
            .clipped()
            .cornerRadius(12)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(book.title)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.white)
                    .lineLimit(2)
                
                Text(book.authors.joined(separator: ", "))
                    .font(.system(size: 14))
                    .foregroundColor(Color(red: 204/255, green: 204/255, blue: 204/255))
                    .lineLimit(1)
                
                Text("\(String(book.publicationYear))")
                    .font(.system(size: 12))
                    .foregroundColor(Color(red: 153/255, green: 153/255, blue: 153/255))
            }
            .padding([.horizontal, .bottom], 12)
        }
        .background(Color(red: 51/255, green: 51/255, blue: 51/255))
        .cornerRadius(12)
    }
}
