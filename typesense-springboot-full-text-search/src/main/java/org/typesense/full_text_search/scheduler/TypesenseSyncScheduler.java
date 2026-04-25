package org.typesense.full_text_search.scheduler;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicBoolean;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.typesense.full_text_search.service.BookService;
import org.typesense.full_text_search.service.TypesenseService;

@Component
public class TypesenseSyncScheduler {

    private static final Logger log = LoggerFactory.getLogger(TypesenseSyncScheduler.class);

    private final TypesenseService typesenseService;
    private final BookService bookService;
    private final AtomicBoolean initialSyncDone = new AtomicBoolean(false);

    public TypesenseSyncScheduler(TypesenseService typesenseService, BookService bookService) {
        this.typesenseService = typesenseService;
        this.bookService = bookService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        try {
            typesenseService.initializeCollection();
        } catch (Exception e) {
            log.error("Failed to initialize Typesense collection: {}", e.getMessage());
            return;
        }

        typesenseService.setSyncWorkerRunning(true);

        try {
            long docCount = typesenseService.collectionDocumentCount();
            if (docCount > 0) {
                bookService.findLatestUpdatedAt().ifPresent(latest -> {
                    typesenseService.setLastSyncTime(latest);
                    log.info("Typesense already populated, seeding sync time from DB: {}", latest);
                });
            } else {
                log.info("Typesense collection is empty, will run full sync");
            }

            Instant lastSyncTime = typesenseService.getLastSyncTime();
            Instant newSyncTime = typesenseService.syncBooksToTypesense(lastSyncTime);
            typesenseService.setLastSyncTime(newSyncTime);
            log.info("Initial sync completed at {}", newSyncTime);
        } catch (Exception e) {
            log.error("Initial sync failed: {}", e.getMessage());
        }

        initialSyncDone.set(true);
    }

    @Scheduled(fixedDelayString = "${typesense.sync.interval-ms}")
    public void periodicSync() {
        if (!initialSyncDone.get()) return;

        log.info("Running periodic sync...");
        Instant lastSyncTime = typesenseService.getLastSyncTime();

        try {
            Instant newSyncTime = typesenseService.syncBooksToTypesense(lastSyncTime);
            typesenseService.setLastSyncTime(newSyncTime);
        } catch (Exception e) {
            log.error("Periodic sync failed: {}", e.getMessage());
        }

        try {
            typesenseService.syncSoftDeletesToTypesense(lastSyncTime);
        } catch (Exception e) {
            log.error("Soft delete sync failed: {}", e.getMessage());
        }
    }
}
