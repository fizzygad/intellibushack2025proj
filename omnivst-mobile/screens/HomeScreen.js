import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { socket } from "../utils/socket";

export default function HomeScreen({ navigation }) {
  const [roomCode, setRoomCode] = useState("");

  const joinRoom = () => {
    if (roomCode.trim()) {
      socket.emit("join_room", roomCode);
      navigation.navigate("Chat", { room: roomCode });
    }
  };

  const createRoom = () => {
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    socket.emit("create_room", code);
    navigation.navigate("Chat", { room: code });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OmniVST</Text>

      <TouchableOpacity style={styles.btn} onPress={createRoom}>
        <Text style={styles.btnText}>🆕 Create Room</Text>
      </TouchableOpacity>

      <TextInput
        placeholder="Enter Room Code"
        value={roomCode}
        onChangeText={setRoomCode}
        style={styles.input}
      />
      <TouchableOpacity style={styles.btn} onPress={joinRoom}>
        <Text style={styles.btnText}>🔑 Join Room</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 30 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, width: "70%", padding: 10, marginVertical: 10 },
  btn: { backgroundColor: "#2563EB", padding: 15, borderRadius: 10, width: "70%", alignItems: "center", marginVertical: 5 },
  btnText: { color: "white", fontWeight: "600" },
});
