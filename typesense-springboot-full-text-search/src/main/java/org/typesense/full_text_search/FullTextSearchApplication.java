package org.typesense.full_text_search;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.typesense.full_text_search.config.DatabaseInitializer;

import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
@EnableScheduling
@EnableAsync
public class FullTextSearchApplication {

	public static void main(String[] args) {
		// Load .env variables into system properties for Spring Boot to use
		Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
		dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));

		DatabaseInitializer.ensureDatabaseExists();
		SpringApplication.run(FullTextSearchApplication.class, args);
	}

}
