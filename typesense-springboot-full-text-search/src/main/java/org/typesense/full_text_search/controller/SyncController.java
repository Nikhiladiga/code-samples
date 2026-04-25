package org.typesense.full_text_search.controller;

import java.time.Instant;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.typesense.full_text_search.service.TypesenseService;

@RestController
@RequestMapping("/sync")
public class SyncController {

    private final TypesenseService typesenseService;

    public SyncController(TypesenseService typesenseService) {
        this.typesenseService = typesenseService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> triggerSync() {
        Instant lastSyncTime = typesenseService.getLastSyncTime();

        try {
            Instant newSyncTime = typesenseService.syncBooksToTypesense(lastSyncTime);
            int deletedCount = typesenseService.syncSoftDeletesToTypesense(lastSyncTime);
            typesenseService.setLastSyncTime(newSyncTime);

            return ResponseEntity.ok(Map.of(
                    "message", "Sync completed",
                    "newSyncTime", newSyncTime.toString(),
                    "syncedAt", Instant.now().toString(),
                    "deletedBooks", deletedCount
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "Sync failed",
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getSyncStatus() {
        return ResponseEntity.ok(Map.of(
                "lastSyncTime", typesenseService.getLastSyncTime().toString(),
                "syncWorkerRunning", typesenseService.isSyncWorkerRunning()
        ));
    }
}
