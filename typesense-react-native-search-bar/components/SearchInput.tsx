import React from "react";
import { StyleSheet, TextInput } from "react-native";
import { useSearchBox } from "react-instantsearch-core";

export const SearchInput = () => {
  const { query, refine } = useSearchBox();

  return (
    <TextInput
      style={styles.searchInput}
      placeholder="Search books..."
      placeholderTextColor="#999"
      value={query}
      onChangeText={refine}
    />
  );
};

const styles = StyleSheet.create({
  searchInput: {
    backgroundColor: "#444",
    color: "white",
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 0,
    fontSize: 16,
  },
});
