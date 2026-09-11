"use client";

import { useState } from "react";

export default function AskGemini() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function askGemini() {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setError("Please enter a question.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: trimmedQuestion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to generate answer"
        );
      }

      // Add the question to the existing Q&A list
      window.dispatchEvent(
        new CustomEvent("gemini-question-added", {
          detail: {
            id: `gemini-${Date.now()}`,
            question: trimmedQuestion,
            answer: data.answer || "",
          },
        })
      );

      setQuestion("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        marginBottom: "30px",
        width: "100%",
      }}
    >
      <div
        style={{
          fontSize: "13px",
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
        rows={2}
        style={{
          display: "block",
          width: "25%",
          minWidth: "260px",
          boxSizing: "border-box",
          padding: "10px 12px",
          border: "1px solid #d8b4fe",
          borderRadius: "8px",
          backgroundColor: "#ffffff",
          fontSize: "14px",
          color: "#1f2937",
          resize: "none",
          outline: "none",
        }}
      />

      <button
        onClick={askGemini}
        disabled={loading}
        style={{
          marginTop: "12px",
          padding: "10px 20px",
          border: "none",
          borderRadius: "8px",
          backgroundColor: "#6d28d9",
          color: "#ffffff",
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
            marginTop: "10px",
            color: "#dc2626",
            fontSize: "13px",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}