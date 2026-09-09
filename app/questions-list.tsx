"use client";

import { useEffect, useState } from "react";

export default function QuestionsList({
  initialQuestions,
  initialHasMore,
}: any) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [query, setQuery] = useState("");
  const [hasMore, setHasMore] = useState(initialHasMore);

  const [improving, setImproving] = useState(false);
  const [improveError, setImproveError] = useState("");

  const [aiAnswers, setAiAnswers] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [aiErrors, setAiErrors] = useState<Record<string, string>>({});

  // SEARCH
  useEffect(() => {
    const controller = new AbortController();

    const id = setTimeout(async () => {
      try {
        const url = query.trim()
          ? `/api/questions?q=${encodeURIComponent(query.trim())}`
          : `/api/questions`;

        const res = await fetch(url, {
          signal: controller.signal,
        });

        if (!res.ok) return;

        const data = await res.json();

        setQuestions(data.questions || []);
        setHasMore(data.hasMore ?? false);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Search error:", err);
        }
      }
    }, 300);

    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [query]);

  // IMPROVE SEARCH TEXT
  async function improveSearch() {
    if (!query.trim()) {
      setImproveError("Type something to improve.");
      return;
    }

    setImproving(true);
    setImproveError("");

    try {
      const res = await fetch("/api/improve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: query,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to improve text");
      }

      setQuery(data.improved);
    } catch (err) {
      setImproveError(
        err instanceof Error
          ? err.message
          : "Failed to improve text"
      );
    } finally {
      setImproving(false);
    }
  }

  // ASK AI FOR A QUESTION
  async function askAI(questionId: string, questionText: string) {
    setAiLoading((prev) => ({
      ...prev,
      [questionId]: true,
    }));

    setAiErrors((prev) => ({
      ...prev,
      [questionId]: "",
    }));

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: questionText,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate answer");
      }

      setAiAnswers((prev) => ({
        ...prev,
        [questionId]: data.answer,
      }));
    } catch (err) {
      setAiErrors((prev) => ({
        ...prev,
        [questionId]:
          err instanceof Error
            ? err.message
            : "Failed to generate answer",
      }));
    } finally {
      setAiLoading((prev) => ({
        ...prev,
        [questionId]: false,
      }));
    }
  }

  // VOTE
  async function upvote(id: string) {
    setQuestions((qs: any[]) =>
      qs.map((q) =>
        q.id === id
          ? { ...q, votes: (q.votes ?? 0) + 1 }
          : q
      )
    );

    try {
      const res = await fetch(`/api/questions/${id}/vote`, {
        method: "POST",
      });

      if (!res.ok) {
        setQuestions((qs: any[]) =>
          qs.map((q) =>
            q.id === id
              ? { ...q, votes: (q.votes ?? 0) - 1 }
              : q
          )
        );
      }
    } catch (err) {
      console.error("Vote error:", err);
    }
  }

  return (
    <div
      style={{
        width: "100%",
        margin: "0 auto",
      }}
    >
      {/* SEARCH AREA */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions..."
          style={{
            flex: 1,
            padding: "12px 14px",
            border: "1px solid #d8b4fe",
            borderRadius: "8px",
            background: "#ffffff",
            fontSize: "14px",
            outline: "none",
          }}
        />

        <button
          onClick={improveSearch}
          disabled={improving}
          style={{
            padding: "11px 16px",
            border: "none",
            borderRadius: "8px",
            background: "#6d28d9",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: "600",
            cursor: improving ? "not-allowed" : "pointer",
            opacity: improving ? 0.6 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {improving ? "Improving..." : "✨ Improve"}
        </button>
      </div>

      {improveError && (
        <p
          style={{
            margin: "0 0 12px",
            color: "#dc2626",
            fontSize: "13px",
          }}
        >
          {improveError}
        </p>
      )}

      {/* QUESTIONS */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {questions.length === 0 ? (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              color: "#6b7280",
              background: "#faf5ff",
              borderRadius: "10px",
            }}
          >
            No questions found.
          </div>
        ) : (
          questions.map((q: any) => (
            <div
              key={q.id}
              style={{
                padding: "16px",
                border: "1px solid #e9d5ff",
                borderRadius: "12px",
                background: "#ffffff",
              }}
            >
              {/* QUESTION */}
              <div
                style={{
                  fontSize: "16px",
                  lineHeight: "1.5",
                  color: "#1f2937",
                  marginBottom: "12px",
                }}
              >
                {q.body}
              </div>

              {/* ACTIONS */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => upvote(q.id)}
                  style={{
                    padding: "7px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "7px",
                    background: "#ffffff",
                    color: "#374151",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  ▲ {q.votes ?? 0}
                </button>

                <button
                  onClick={() => askAI(q.id, q.body)}
                  disabled={aiLoading[q.id]}
                  style={{
                    padding: "7px 13px",
                    border: "none",
                    borderRadius: "7px",
                    background: "#7c3aed",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: aiLoading[q.id]
                      ? "not-allowed"
                      : "pointer",
                    opacity: aiLoading[q.id] ? 0.6 : 1,
                  }}
                >
                  {aiLoading[q.id]
                    ? "Thinking..."
                    : "🤖 Ask AI"}
                </button>
              </div>

              {/* AI ANSWER */}
              {aiErrors[q.id] && (
                <p
                  style={{
                    marginTop: "12px",
                    color: "#dc2626",
                    fontSize: "13px",
                  }}
                >
                  {aiErrors[q.id]}
                </p>
              )}

              {aiAnswers[q.id] && (
                <div
                  style={{
                    marginTop: "14px",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    background: "#faf5ff",
                    border: "1px solid #e9d5ff",
                  }}
                >
                  <div
                    style={{
                      marginBottom: "5px",
                      color: "#6d28d9",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    AI Answer
                  </div>

                  <div
                    style={{
                      color: "#374151",
                      fontSize: "14px",
                      lineHeight: "1.5",
                    }}
                  >
                    {aiAnswers[q.id]}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {hasMore && (
        <div
          style={{
            marginTop: "20px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              color: "#6b7280",
              fontSize: "13px",
            }}
          >
            More questions available
          </p>
        </div>
      )}
    </div>
  );
}