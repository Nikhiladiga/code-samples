package org.typesense.full_text_search.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.typesense.full_text_search.service.TypesenseService;
import org.typesense.model.SearchResult;

@RestController
public class SearchController {

    private final TypesenseService typesenseService;

    public SearchController(TypesenseService typesenseService) {
        this.typesenseService = typesenseService;
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> search(@RequestParam("q") String query) {
        if (query == null || query.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Search query parameter 'q' is required"));
        }

        try {
            SearchResult result = typesenseService.search(query);
            return ResponseEntity.ok(Map.of(
                    "query", query,
                    "results", result.getHits() != null ? result.getHits() : java.util.List.of(),
                    "found", result.getFound() != null ? result.getFound() : 0,
                    "took", result.getSearchTimeMs() != null ? result.getSearchTimeMs() : 0,
                    "facet_counts", result.getFacetCounts() != null ? result.getFacetCounts() : java.util.List.of()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "Search failed: " + e.getMessage()
            ));
        }
    }
}
