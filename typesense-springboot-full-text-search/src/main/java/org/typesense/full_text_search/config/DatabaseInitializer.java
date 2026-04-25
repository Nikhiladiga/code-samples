package org.typesense.full_text_search.config;

import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Properties;

public class DatabaseInitializer {

    private DatabaseInitializer() {
    }

    public static void ensureDatabaseExists() {
        Properties props = new Properties();
        try (InputStream is = DatabaseInitializer.class.getClassLoader()
                .getResourceAsStream("application.properties")) {
            if (is != null) {
                props.load(is);
            }
        } catch (Exception e) {
            System.err.println("Could not load application.properties: " + e.getMessage());
            return;
        }

        String url = props.getProperty("spring.datasource.url");
        String username = props.getProperty("spring.datasource.username");
        String password = props.getProperty("spring.datasource.password");

        if (url == null || !url.contains("postgresql")) return;

        String dbName = extractDatabaseName(url);
        String baseUrl = url.substring(0, url.lastIndexOf('/')) + "/postgres";

        try (Connection conn = DriverManager.getConnection(baseUrl, username, password);
             Statement stmt = conn.createStatement()) {

            ResultSet rs = stmt.executeQuery(
                    "SELECT 1 FROM pg_database WHERE datname = '" + dbName + "'");

            if (!rs.next()) {
                stmt.execute("CREATE DATABASE " + dbName);
                System.out.println("Database '" + dbName + "' created successfully");
            }
        } catch (Exception e) {
            System.err.println("Failed to create database '" + dbName + "': " + e.getMessage());
        }
    }

    private static String extractDatabaseName(String url) {
        String withoutParams = url.contains("?") ? url.substring(0, url.indexOf('?')) : url;
        return withoutParams.substring(withoutParams.lastIndexOf('/') + 1);
    }
}
