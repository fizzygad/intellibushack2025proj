import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { socket } from "../utils/socket";
import * as Speech from "expo-speech";

export default function ChatScreen({ route }) {
  const { room } = route.params;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    socket.emit("join_room", room);

    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, { sender: "Other", text: msg.text }]);
      Speech.speak(msg.text); // auto speak the translation
    });

    return () => {
      socket.off("receive_message");
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit("send_message", { room, text: input });
    setMessages((prev) => [...prev, { sender: "Me", text: input }]);
    setInput("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.room}>Room: {room}</Text>
      <FlatList
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Text style={item.sender === "Me" ? styles.myMsg : styles.otherMsg}>
            {item.sender}: {item.text}
          </Text>
        )}
      />
      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="Type a message..."
        style={styles.input}
      />
      <TouchableOpacity style={styles.btn} onPress={sendMessage}>
        <Text style={styles.btnText}>Send</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  room: { fontSize: 16, fontWeight: "600", marginBottom: 10 },
  myMsg: { alignSelf: "flex-end", backgroundColor: "#2563EB", color: "white", padding: 10, borderRadius: 10, marginVertical: 3 },
  otherMsg: { alignSelf: "flex-start", backgroundColor: "#E5E7EB", padding: 10, borderRadius: 10, marginVertical: 3 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 10, marginVertical: 10 },
  btn: { backgroundColor: "#2563EB", padding: 12, borderRadius: 10, alignItems: "center" },
  btnText: { color: "white", fontWeight: "600" },
});
