
import React, { useState } from "react";
import axios from "axios";

export default function VidyaChatbot() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");

  const sendMessage = async () => {
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/chat/",
        null,
        {
          params: {
            message: message,
          },
        }
      );

      setReply(res.data.reply);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "15px",
        borderRadius: "10px",
        marginTop: "20px",
      }}
    >
      <h2>🤖 Vidya AI</h2>

      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask about RSI, MA20, BUY..."
        style={{
          width: "70%",
          padding: "10px",
        }}
      />

      <button
        onClick={sendMessage}
        style={{
          marginLeft: "10px",
          padding: "10px",
        }}
      >
        Ask
      </button>

      {reply && (
        <div style={{ marginTop: "15px" }}>
          <strong>Vidya:</strong>
          <div
  style={{
    whiteSpace: "pre-wrap",
    background: "#f5f5f5",
    padding: "12px",
    borderRadius: "10px",
    marginTop: "10px"
  }}
>
  {reply}
</div>
        </div>
      )}
    </div>
  );
}
