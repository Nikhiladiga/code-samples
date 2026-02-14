import React from "react";
import { StyleSheet, TextInput } from "react-native";

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchInput = ({
  value,
  onChangeText,
  placeholder,
}: SearchInputProps) => {
  return (
    <TextInput
      style={styles.searchInput}
      placeholder={placeholder}
      placeholderTextColor="#999"
      value={value}
      onChangeText={onChangeText}
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
