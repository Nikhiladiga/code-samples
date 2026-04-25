package org.typesense.full_text_search.controller;

import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.typesense.full_text_search.model.Book;
import org.typesense.full_text_search.service.BookService;
import org.typesense.full_text_search.service.TypesenseService;

@RestController
@RequestMapping("/books")
public class BookController {

    private final BookService bookService;
    private final TypesenseService typesenseService;

    public BookController(BookService bookService, TypesenseService typesenseService) {
        this.bookService = bookService;
        this.typesenseService = typesenseService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createBook(@RequestBody Book book) {
        Book saved = bookService.save(book);
        typesenseService.syncBookAsync(saved);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Book created successfully",
                "book", saved
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getBook(@PathVariable Long id) {
        return bookService.findById(id)
                .map(book -> ResponseEntity.ok(Map.<String, Object>of("book", book)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Book not found")));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllBooks(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(name = "page_size", defaultValue = "100") int pageSize) {

        Page<Book> books = bookService.findAll(page, pageSize);
        return ResponseEntity.ok(Map.of(
                "count", books.getNumberOfElements(),
                "total", books.getTotalElements(),
                "page", page,
                "page_size", pageSize,
                "books", books.getContent()
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateBook(@PathVariable Long id, @RequestBody Book updates) {
        return bookService.findById(id)
                .map(existing -> {
                    if (updates.getTitle() != null) existing.setTitle(updates.getTitle());
                    if (updates.getAuthors() != null) existing.setAuthors(updates.getAuthors());
                    if (updates.getPublicationYear() != null) existing.setPublicationYear(updates.getPublicationYear());
                    if (updates.getAverageRating() != null) existing.setAverageRating(updates.getAverageRating());
                    if (updates.getImageUrl() != null) existing.setImageUrl(updates.getImageUrl());
                    if (updates.getRatingsCount() != null) existing.setRatingsCount(updates.getRatingsCount());

                    Book saved = bookService.save(existing);
                    typesenseService.syncBookAsync(saved);
                    return ResponseEntity.ok(Map.<String, Object>of(
                            "message", "Book updated successfully",
                            "book", saved
                    ));
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Book not found")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteBook(@PathVariable Long id) {
        return bookService.findById(id)
                .map(book -> {
                    bookService.deleteById(id);
                    typesenseService.deleteBookAsync(id);
                    return ResponseEntity.ok(Map.<String, Object>of("message", "Book deleted successfully"));
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Book not found")));
    }
}
