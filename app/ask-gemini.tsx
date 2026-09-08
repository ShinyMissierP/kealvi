"use client";

import { useState } from "react";

export default function AskGemini() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function askGemini() {
    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }

    setLoading(true);
    setAnswer("");
    setError("");

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate answer");
      }

      setAnswer(data.answer);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        marginBottom: "32px",
        width: "100%",
      }}
    >
      <div
        style={{
          fontSize: "15px",
          fontWeight: "500",
          color: "#4b5563",
          marginBottom: "8px",
        }}
      >
        Ask a question to Gemini
      </div>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Type your question..."
        rows={3}
        style={{
          display: "block",
          width: "25%",
          boxSizing: "border-box",
          padding: "12px 14px",
          border: "1px solid #d8b4fe",
          borderRadius: "8px",
          backgroundColor: "#ffffff",
          fontSize: "14px",
          color: "#1f2937",
          resize: "vertical",
          outline: "none",
        }}
      />

      <button
        onClick={askGemini}
        disabled={loading}
        style={{
          display: "block",
          marginTop: "12px",
          padding: "10px 20px",
          border: "none",
          borderRadius: "8px",
          backgroundColor: "#6d28d9",
          color: "white",
          fontSize: "14px",
          fontWeight: "600",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Thinking..." : "Ask Gemini"}
      </button>

      {error && (
        <p
          style={{
            marginTop: "12px",
            color: "#dc2626",
            fontSize: "14px",
          }}
        >
          {error}
        </p>
      )}

      {answer && (
        <div
          style={{
            marginTop: "16px",
            padding: "16px",
            border: "1px solid #e9d5ff",
            borderRadius: "8px",
            backgroundColor: "#faf5ff",
          }}
        >
          <div
            style={{
              marginBottom: "6px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#6d28d9",
            }}
          >
            Gemini's Answer
          </div>

          <div
            style={{
              fontSize: "14px",
              lineHeight: "1.6",
              color: "#374151",
            }}
          >
            {answer}
          </div>
        </div>
      )}
    </div>
  );
}