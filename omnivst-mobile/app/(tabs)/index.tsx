import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";

export default function Landing() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/Logo.png")} // change path to your logo file
        style={styles.logo}
        resizeMode="contain"
      />
     
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push({ pathname: "/(tabs)/profile", params: { edit: "true" } })}
      >
        <Text style={styles.buttonText}>Sign Up/Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  title: { fontSize: 32, fontWeight: "bold", color: "#2563EB", marginBottom: 0 },
  subtitle: { fontSize: 10, color: "#1E293B", marginBottom: 40, textAlign: "center" },
  logo: {width: 300, height: 300, marginBottom: 5 },
  button: { backgroundColor: "#2563EB", paddingVertical: 15, paddingHorizontal: 40, borderRadius: 20 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});