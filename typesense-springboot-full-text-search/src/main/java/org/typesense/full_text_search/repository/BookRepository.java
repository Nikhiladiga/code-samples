package org.typesense.full_text_search.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.typesense.full_text_search.model.Book;

public interface BookRepository extends JpaRepository<Book, Long> {

    Page<Book> findByUpdatedAtAfterOrderByUpdatedAtAsc(Instant since, Pageable pageable);

    long countByUpdatedAtAfter(Instant since);

    @Query("SELECT MAX(b.updatedAt) FROM Book b")
    Optional<Instant> findLatestUpdatedAt();

    @Query(value = "SELECT * FROM books WHERE deleted_at IS NOT NULL AND updated_at > :since",
            nativeQuery = true)
    List<Book> findDeletedBooksSince(@Param("since") Instant since);
}
