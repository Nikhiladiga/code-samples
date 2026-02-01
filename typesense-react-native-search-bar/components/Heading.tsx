import React from "react";
import { Text, StyleSheet, View, Linking } from "react-native";
import Svg, { Circle, G, Ellipse } from "react-native-svg";

export const Heading = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book Search</Text>
      <View style={styles.poweredBy}>
        <Text style={styles.poweredByText}>powered by </Text>
        <Text
          style={styles.typesenseLink}
          onPress={() => Linking.openURL("https://typesense.org/")}
        >
          type<Text style={styles.typesenseBold}>sense</Text>
        </Text>
        <Text style={styles.poweredByText}> & </Text>
        <ReactNativeLogo size={20} color="#61DAFB" />
      </View>
    </View>
  );
};

function ReactNativeLogo({ size = 120, color = "#61DAFB" }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="-11.5 -10.23174 23 20.46348"
      style={styles.logo}
    >
      <Circle cx="0" cy="0" r="2.05" fill={color} />
      <G fill="none" stroke={color} strokeWidth="1">
        <Ellipse rx="11" ry="4.2" />
        <Ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <Ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 40,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 12,
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  poweredBy: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  poweredByText: {
    fontSize: 14,
    color: "#AAA",
    fontWeight: "400",
    marginRight: 4,
  },
  typesenseLink: {
    fontSize: 14,
    color: "#FF6B9D",
    fontWeight: "600",
    marginRight: 4,
  },
  typesenseBold: {
    fontWeight: "800",
  },
  logo: {
    marginLeft: 4,
    marginTop: -2,
  },
});
