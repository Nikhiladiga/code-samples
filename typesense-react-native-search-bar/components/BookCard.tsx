import React from "react";
import { View, Image, Text, StyleSheet, Dimensions } from "react-native";
import { Book } from "../types/Book";

export const BookCard = ({ book }: { book: Book }) => {
  return (
    <View key={book.id} style={styles.card}>
      <Image
        source={{ uri: book.image_url }}
        style={styles.bookImage}
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.authors} numberOfLines={1}>
          {book.authors.join(", ")}
        </Text>
        <Text style={styles.year}>{book.publication_year}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#333",
    borderRadius: 12,
    margin: 8,
    width: Dimensions.get("window").width / 2 - 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  bookImage: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardContent: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  authors: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 4,
  },
  year: {
    fontSize: 12,
    color: "#999",
  },
});
