package org.typesense.full_text_search.service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.typesense.full_text_search.model.Book;
import org.typesense.full_text_search.repository.BookRepository;

@Service
public class BookService {

    private final BookRepository bookRepository;

    public BookService(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    @Transactional
    public Book save(Book book) {
        return bookRepository.save(book);
    }

    @Transactional(readOnly = true)
    public Optional<Book> findById(Long id) {
        return bookRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Page<Book> findAll(int page, int pageSize) {
        return bookRepository.findAll(
                PageRequest.of(page - 1, pageSize, Sort.by("id").ascending()));
    }

    @Transactional(readOnly = true)
    public long count() {
        return bookRepository.count();
    }

    @Transactional
    public void deleteById(Long id) {
        bookRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Page<Book> findUpdatedSince(Instant since, int page, int pageSize) {
        return bookRepository.findByUpdatedAtAfterOrderByUpdatedAtAsc(
                since, PageRequest.of(page - 1, pageSize));
    }

    @Transactional(readOnly = true)
    public long countUpdatedSince(Instant since) {
        return bookRepository.countByUpdatedAtAfter(since);
    }

    @Transactional(readOnly = true)
    public Optional<Instant> findLatestUpdatedAt() {
        return bookRepository.findLatestUpdatedAt();
    }

    @Transactional(readOnly = true)
    public List<Book> findDeletedSince(Instant since) {
        return bookRepository.findDeletedBooksSince(since);
    }
}
