import React, { useState } from "react";
import { motion } from "framer-motion";
import { BotMessageSquare } from "lucide-react";

interface Message {
  text: string;
  sender: "user" | "bot";
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add the user message to the chat history
    const userMessage: Message = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Make a POST request to your backend API to send the user's message
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response from the server.");
      }

      // Parse the JSON response from the server
      const data = await response.json();
      const botResponse: Message = {
        text: data.response,
        sender: "bot",
      };

      // Add the bot's response to the chat history
      setMessages((prev) => [...prev, botResponse]);

    } catch (error) {
      // Handle any errors from the API call
      const errorMessage: Message = {
        text: "Sorry, something went wrong. Please try again later.",
        sender: "bot",
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    // Clear input field after sending
    setInput("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-screen bg-gray-900 text-gray-300 p-6 space-y-6"
    >
      <motion.h1
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold"
      >
        <div className="flex items-center gap-2">
          <BotMessageSquare />
          Chatbot
        </div>
      </motion.h1>

      <div className="flex-grow overflow-y-auto p-6 bg-gray-800 rounded-lg shadow-lg">
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: message.sender === "user" ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex mb-4 ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg shadow-md ${
                message.sender === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              {message.text}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-4 bg-gray-800 rounded-lg shadow-inner flex items-center space-x-4">
        <input
          type="text"
          className="flex-grow px-4 py-2 bg-gray-700 text-gray-300 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition duration-200"
        >
          Send
        </button>
      </div>
    </motion.div>
  );
};

export default Chatbot;
