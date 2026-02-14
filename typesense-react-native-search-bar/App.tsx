import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, ScrollView } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { InstantSearch } from "react-instantsearch-core";
import { Heading } from "./components/Heading";
import { BookList } from "./components/BookList";
import { SearchInput } from "./components/SearchInput";
import { searchClient } from "./utils/typesense";

function AppContent() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView>
        <Heading />
        <SearchInput />
        <View style={styles.grid}>
          <BookList />
        </View>
        <StatusBar style="auto" />
      </ScrollView>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <InstantSearch searchClient={searchClient} indexName="books">
        <AppContent />
      </InstantSearch>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#222",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
});
