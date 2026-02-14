import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView, TextInput } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Heading } from "./components/Heading";
import { BookList } from "./components/BookList";
import { Document } from "./types/Book";
import { search } from "./utils/typesense";
import { SearchInput } from "./components/SearchInput";

function AppContent() {
  const [books, setBooks] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchBooks().catch((error) => {
      console.error("Error fetching books:", error);
    });
  }, []);

  useEffect(() => {
    fetchBooks().catch((error) => {
      console.error("Error fetching books:", error);
    });
  }, [searchQuery]);

  async function fetchBooks() {
    const data = await search(searchQuery);
    setBooks(data);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView>
        <Heading />
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search books..."
        />
        <View style={styles.grid}>
          <BookList books={books} />
        </View>
        <StatusBar style="auto" />
      </ScrollView>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#222",
  },
  headerContainer: {
    paddingTop: 20,
    paddingRight: 20,
    paddingLeft: 20,
    paddingBottom: 10,
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
});
