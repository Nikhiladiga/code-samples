package org.typesense.full_text_search.service;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.typesense.api.Client;
import org.typesense.api.FieldTypes;
import org.typesense.model.CollectionResponse;
import org.typesense.model.CollectionSchema;
import org.typesense.model.DeleteDocumentsParameters;
import org.typesense.model.Field;
import org.typesense.model.ImportDocumentsParameters;
import org.typesense.model.IndexAction;
import org.typesense.model.SearchParameters;
import org.typesense.model.SearchResult;
import org.typesense.full_text_search.model.Book;


@Service
public class TypesenseService {

    private static final Logger log = LoggerFactory.getLogger(TypesenseService.class);

    private final Client client;
    private final BookService bookService;

    @Value("${typesense.collection-name}")
    private String collectionName;

    @Value("${typesense.sync.batch-size}")
    private int batchSize;

    @Value("${typesense.sync.page-size}")
    private int pageSize;

    @Value("${typesense.sync.enable-soft-delete}")
    private boolean enableSoftDelete;

    private final AtomicReference<Instant> lastSyncTime = new AtomicReference<>(Instant.EPOCH);
    private final AtomicBoolean syncWorkerRunning = new AtomicBoolean(false);

    public TypesenseService(Client client, BookService bookService) {
        this.client = client;
        this.bookService = bookService;
    }

    // --- Sync state accessors (thread-safe) ---

    public Instant getLastSyncTime() {
        return lastSyncTime.get();
    }

    public void setLastSyncTime(Instant time) {
        lastSyncTime.set(time);
    }

    public boolean isSyncWorkerRunning() {
        return syncWorkerRunning.get();
    }

    public void setSyncWorkerRunning(boolean running) {
        syncWorkerRunning.set(running);
    }

    // --- Collection management ---

    public void initializeCollection() throws Exception {
        log.info("Initializing Typesense collection '{}'...", collectionName);
        try {
            client.collections(collectionName).retrieve();
            log.info("Collection '{}' already exists, skipping creation", collectionName);
        } catch (Exception e) {
            log.info("Collection '{}' not found, creating...", collectionName);
            CollectionSchema schema = new CollectionSchema();
            schema.name(collectionName)
                    .fields(List.of(
                            new Field().name("title").type(FieldTypes.STRING).facet(false),
                            new Field().name("authors").type(FieldTypes.STRING_ARRAY).facet(true),
                            new Field().name("publication_year").type(FieldTypes.INT32).facet(true),
                            new Field().name("average_rating").type(FieldTypes.FLOAT).facet(true),
                            new Field().name("image_url").type(FieldTypes.STRING).facet(false),
                            new Field().name("ratings_count").type(FieldTypes.INT32).facet(true).sort(true)
                    ))
                    .defaultSortingField("ratings_count");
            client.collections().create(schema);
            log.info("Collection '{}' created successfully", collectionName);
        }
    }

    public long collectionDocumentCount() {
        try {
            CollectionResponse response = client.collections(collectionName).retrieve();
            return response.getNumDocuments() != null ? response.getNumDocuments() : 0;
        } catch (Exception e) {
            return 0;
        }
    }

    // --- Search ---

    public SearchResult search(String query) throws Exception {
        SearchParameters params = new SearchParameters()
                .q(query)
                .queryBy("title,authors")
                .queryByWeights("2,1")
                .facetBy("authors,publication_year,average_rating");
        return client.collections(collectionName).documents().search(params);
    }

    // --- Incremental sync ---

    public Instant syncBooksToTypesense(Instant since) throws Exception {
        log.info("Starting incremental sync since {}", since);

        long updatedCount = bookService.countUpdatedSince(since);
        if (updatedCount == 0) {
            log.info("No changes to sync");
            return Instant.now();
        }

        int totalPages = (int) Math.ceil((double) updatedCount / pageSize);
        log.info("Found {} books to sync ({} pages)", updatedCount, totalPages);

        int totalSuccess = 0;
        int totalFailure = 0;

        for (int page = 1; page <= totalPages; page++) {
            Page<Book> books = bookService.findUpdatedSince(since, page, pageSize);
            if (!books.hasContent()) break;

            log.info("Processing page {}/{} ({} books)", page, totalPages, books.getNumberOfElements());

            String jsonl = booksToJsonl(books.getContent());
            ImportDocumentsParameters importParams = new ImportDocumentsParameters();
            importParams.action(IndexAction.UPSERT);

            String response = client.collections(collectionName).documents().import_(jsonl, importParams);
            int[] counts = countImportResults(response);
            totalSuccess += counts[0];
            totalFailure += counts[1];

            log.info("Page {}/{}: {} succeeded, {} failed", page, totalPages, counts[0], counts[1]);
        }

        Instant newSyncTime = Instant.now();
        log.info("Incremental sync completed: {} upserted, {} failed out of {} total",
                totalSuccess, totalFailure, updatedCount);
        return newSyncTime;
    }

    // --- Soft delete sync ---

    public int syncSoftDeletesToTypesense(Instant since) throws Exception {
        List<Book> deletedBooks = bookService.findDeletedSince(since);
        if (deletedBooks.isEmpty()) return 0;

        String idFilter = deletedBooks.stream()
                .map(Book::getTypesenseId)
                .collect(Collectors.joining(","));
        String filterBy = "id:[" + idFilter + "]";

        log.info("Deleting {} documents from Typesense", deletedBooks.size());

        DeleteDocumentsParameters params = new DeleteDocumentsParameters();
        params.filterBy(filterBy);
        client.collections(collectionName).documents().delete(params);

        log.info("Successfully deleted {} documents from Typesense", deletedBooks.size());
        return deletedBooks.size();
    }

    // --- Single document sync (for real-time CRUD operations) ---

    @Async("typesenseAsyncExecutor")
    public void syncBookAsync(Book book) {
        try {
            client.collections(collectionName).documents().upsert(bookToDocument(book));
            setLastSyncTime(Instant.now());
            log.info("Synced book to Typesense: id={}, title={}", book.getId(), book.getTitle());
        } catch (Exception e) {
            log.error("Async Typesense sync failed for book {}: {}", book.getId(), e.getMessage());
        }
    }

    @Async("typesenseAsyncExecutor")
    public void deleteBookAsync(Long bookId) {
        try {
            String documentId = "book_" + bookId;
            client.collections(collectionName).documents(documentId).delete();
            setLastSyncTime(Instant.now());
            log.info("Deleted book from Typesense: id={}", bookId);
        } catch (Exception e) {
            log.error("Async Typesense deletion failed for book {}: {}", bookId, e.getMessage());
        }
    }

    // --- Helpers ---

    private Map<String, Object> bookToDocument(Book book) {
        Map<String, Object> doc = new HashMap<>();
        doc.put("id", book.getTypesenseId());
        doc.put("title", book.getTitle());
        doc.put("authors", book.getAuthors() != null ? book.getAuthors() : List.of());
        doc.put("publication_year", book.getPublicationYear() != null ? book.getPublicationYear() : 0);
        doc.put("average_rating", book.getAverageRating() != null ? book.getAverageRating() : 0.0);
        doc.put("image_url", book.getImageUrl() != null ? book.getImageUrl() : "");
        doc.put("ratings_count", book.getRatingsCount() != null ? book.getRatingsCount() : 0);
        return doc;
    }

    private String booksToJsonl(List<Book> books) {
        return books.stream()
                .map(this::bookToJsonLine)
                .collect(Collectors.joining("\n"));
    }

    private String bookToJsonLine(Book book) {
        String authors = "[]";
        if (book.getAuthors() != null && !book.getAuthors().isEmpty()) {
            authors = "[" + book.getAuthors().stream()
                    .map(a -> "\"" + escapeJson(a) + "\"")
                    .collect(Collectors.joining(",")) + "]";
        }
        return "{" +
                "\"id\":\"" + escapeJson(book.getTypesenseId()) + "\"," +
                "\"title\":\"" + escapeJson(book.getTitle() != null ? book.getTitle() : "") + "\"," +
                "\"authors\":" + authors + "," +
                "\"publication_year\":" + (book.getPublicationYear() != null ? book.getPublicationYear() : 0) + "," +
                "\"average_rating\":" + (book.getAverageRating() != null ? book.getAverageRating() : 0.0) + "," +
                "\"image_url\":\"" + escapeJson(book.getImageUrl() != null ? book.getImageUrl() : "") + "\"," +
                "\"ratings_count\":" + (book.getRatingsCount() != null ? book.getRatingsCount() : 0) +
                "}";
    }

    private static String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }

    private int[] countImportResults(String response) {
        int success = 0, failure = 0;
        if (response == null || response.isBlank()) return new int[]{success, failure};
        for (String line : response.split("\n")) {
            if (line.contains("\"success\":true")) {
                success++;
            } else {
                failure++;
                if (failure <= 5) {
                    log.warn("Import error: {}", line);
                }
            }
        }
        return new int[]{success, failure};
    }
}
