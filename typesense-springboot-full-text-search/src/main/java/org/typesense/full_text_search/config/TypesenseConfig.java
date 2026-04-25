package org.typesense.full_text_search.config;

import java.time.Duration;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.typesense.api.Client;
import org.typesense.resources.Node;

@Configuration
public class TypesenseConfig {

    @Value("${typesense.protocol}")
    private String protocol;

    @Value("${typesense.host}")
    private String host;

    @Value("${typesense.port}")
    private String port;

    @Value("${typesense.api-key}")
    private String apiKey;

    @Value("${typesense.connection-timeout-seconds}")
    private int connectionTimeoutSeconds;

    @Bean
    public Client typesenseClient() {
        Node node = new Node(protocol, host, port);
        org.typesense.api.Configuration configuration = new org.typesense.api.Configuration(
                List.of(node),
                Duration.ofSeconds(connectionTimeoutSeconds),
                apiKey
        );
        return new Client(configuration);
    }
}
