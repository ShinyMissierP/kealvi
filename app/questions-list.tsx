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

  // --------------------------------------------------
  // RECEIVE QUESTION FROM TOP "ASK GEMINI" BOX
  // --------------------------------------------------
  useEffect(() => {
    function handleGeminiQuestion(event: Event) {
      const customEvent = event as CustomEvent<{
        id: string;
        question: string;
        answer: string;
      }>;

      const newQuestion =
        customEvent.detail.question.trim();

      const newAnswer =
        customEvent.detail.answer;

      const newId =
        customEvent.detail.id;

      if (!newQuestion) return;

      setQuestions((currentQuestions: any[]) => {
        const alreadyExists =
          currentQuestions.some(
            (q) =>
              q.body?.trim().toLowerCase() ===
              newQuestion.toLowerCase()
          );

        // Do not insert duplicate question
        if (alreadyExists) {
          return currentQuestions;
        }

        return [
          {
            id: newId,
            body: newQuestion,
            author: "Gemini User",
            votes: 0,
            source: "gemini",
            isGeminiQuestion: true,
          },
          ...currentQuestions,
        ];
      });

      // Store Gemini answer for this question
      setAiAnswers((previous) => ({
        ...previous,
        [newId]: newAnswer,
      }));
    }

    window.addEventListener(
      "gemini-question-added",
      handleGeminiQuestion
    );

    return () => {
      window.removeEventListener(
        "gemini-question-added",
        handleGeminiQuestion
      );
    };
  }, []);

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------
  useEffect(() => {
    let active = true;

    const controller =
      new AbortController();

    const id = setTimeout(async () => {
      try {
        const searchText =
          query.trim();

        const url = searchText
          ? `/api/questions?q=${encodeURIComponent(
              searchText
            )}`
          : `/api/questions`;

        const res = await fetch(url, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(
            `Search request failed: ${res.status}`
          );
        }

        const data =
          await res.json();

        // Ignore outdated requests
        if (
          !active ||
          controller.signal.aborted
        ) {
          return;
        }

        setQuestions(
          data.questions || []
        );

        setHasMore(
          data.hasMore ?? false
        );
      } catch (err: any) {
        // Ignore intentional request cancellation
        if (
          !active ||
          controller.signal.aborted
        ) {
          return;
        }

        console.error(
          "Search error:",
          err
        );
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(id);
      controller.abort();
    };
  }, [query]);

  // --------------------------------------------------
  // IMPROVE SEARCH
  // --------------------------------------------------
  async function improveSearch() {
    if (!query.trim()) {
      setImproveError(
        "Type something to improve."
      );
      return;
    }

    setImproving(true);
    setImproveError("");

    try {
      const res = await fetch(
        "/api/improve",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            text: query,
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Failed to improve text"
        );
      }

      setQuery(
        data.improved
      );
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

  // --------------------------------------------------
  // ASK AI FOR EXISTING QUESTION
  // --------------------------------------------------
  async function askAI(
    questionId: string,
    questionText: string
  ) {
    setAiLoading((prev) => ({
      ...prev,
      [questionId]: true,
    }));

    setAiErrors((prev) => ({
      ...prev,
      [questionId]: "",
    }));

    try {
      const res = await fetch(
        "/api/ask",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            question: questionText,
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Failed to generate answer"
        );
      }

      setAiAnswers((prev) => ({
        ...prev,
        [questionId]:
          data.answer,
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

  // --------------------------------------------------
  // VOTE
  // --------------------------------------------------
  async function upvote(id: string) {
    const question = questions.find(
      (q: any) => q.id === id
    );

    // Gemini-generated temporary questions
    // are not votable.
    if (
      question?.isGeminiQuestion
    ) {
      return;
    }

    try {
      const res = await fetch(
        `/api/questions/${id}/vote`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            // Create a new temporary voter
            // for the current page load
            voterId,
          }),
        }
      );

      const data =
        await res.json();

      if (res.status === 409) {
        alert(
          "You have already voted for this question."
        );
        return;
      }

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Vote failed"
        );
      }

      setQuestions(
        (qs: any[]) =>
          qs.map((q) =>
            q.id === id
              ? {
                  ...q,
                  votes:
                    data.votes,
                }
              : q
          )
      );
    } catch (err) {
      console.error(
        "Vote error:",
        err
      );

      alert(
        "Unable to submit your vote."
      );
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
          onChange={(e) =>
            setQuery(e.target.value)
          }
          placeholder="Search questions..."
          style={{
            flex: 1,
            padding: "12px 14px",
            border:
              "1px solid #d8b4fe",
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
            cursor: improving
              ? "not-allowed"
              : "pointer",
            opacity: improving
              ? 0.6
              : 1,
            whiteSpace: "nowrap",
          }}
        >
          {improving
            ? "Improving..."
            : "✨ Improve"}
        </button>
      </div>

      {/* IMPROVE ERROR */}
      {improveError && (
        <p
          style={{
            margin:
              "0 0 12px",
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
          flexDirection:
            "column",
          gap: "12px",
        }}
      >
        {questions.length === 0 ? (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              color: "#6b7280",
              background:
                "#faf5ff",
              borderRadius: "10px",
            }}
          >
            No questions found.
          </div>
        ) : (
          questions.map(
            (q: any) => (
              <div
                key={q.id}
                style={{
                  padding: "16px",
                  border:
                    q.isGeminiQuestion
                      ? "1px solid #c4b5fd"
                      : "1px solid #e9d5ff",
                  borderRadius:
                    "12px",
                  background:
                    q.isGeminiQuestion
                      ? "#faf5ff"
                      : "#ffffff",
                }}
              >
                {/* GEMINI LABEL */}
                {q.isGeminiQuestion && (
                  <div
                    style={{
                      marginBottom:
                        "6px",
                      color:
                        "#7c3aed",
                      fontSize:
                        "11px",
                      fontWeight:
                        "700",
                      letterSpacing:
                        "0.5px",
                    }}
                  >
                    ✨ ASKED TO GEMINI
                  </div>
                )}

                {/* QUESTION */}
                <div
                  style={{
                    fontSize: "16px",
                    lineHeight:
                      "1.5",
                    color:
                      "#1f2937",
                    marginBottom:
                      "12px",
                  }}
                >
                  {q.body}
                </div>

                {/* ACTIONS */}
                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: "10px",
                    flexWrap:
                      "wrap",
                  }}
                >
                  {/* VOTE */}
                  {!q.isGeminiQuestion && (
                    <button
                      onClick={() =>
                        upvote(
                          q.id
                        )
                      }
                      style={{
                        padding:
                          "7px 12px",
                        border:
                          "1px solid #d1d5db",
                        borderRadius:
                          "7px",
                        background:
                          "#ffffff",
                        color:
                          "#374151",
                        fontSize:
                          "13px",
                        cursor:
                          "pointer",
                      }}
                    >
                      ▲{" "}
                      {q.votes ??
                        0}
                    </button>
                  )}

                  {/* ASK AI */}
                  <button
                    onClick={() =>
                      askAI(
                        q.id,
                        q.body
                      )
                    }
                    disabled={
                      aiLoading[
                        q.id
                      ]
                    }
                    style={{
                      padding:
                        "7px 13px",
                      border: "none",
                      borderRadius:
                        "7px",
                      background:
                        "#7c3aed",
                      color:
                        "#ffffff",
                      fontSize:
                        "13px",
                      fontWeight:
                        "600",
                      cursor:
                        aiLoading[
                          q.id
                        ]
                          ? "not-allowed"
                          : "pointer",
                      opacity:
                        aiLoading[
                          q.id
                        ]
                          ? 0.6
                          : 1,
                    }}
                  >
                    {aiLoading[
                      q.id
                    ]
                      ? "Thinking..."
                      : "🤖 Ask AI"}
                  </button>
                </div>

                {/* AI ERROR */}
                {aiErrors[
                  q.id
                ] && (
                  <p
                    style={{
                      marginTop:
                        "12px",
                      color:
                        "#dc2626",
                      fontSize:
                        "13px",
                    }}
                  >
                    {
                      aiErrors[
                        q.id
                      ]
                    }
                  </p>
                )}

                {/* AI ANSWER */}
                {aiAnswers[
                  q.id
                ] && (
                  <div
                    style={{
                      marginTop:
                        "14px",
                      padding:
                        "12px 14px",
                      borderRadius:
                        "8px",
                      background:
                        "#faf5ff",
                      border:
                        "1px solid #e9d5ff",
                    }}
                  >
                    <div
                      style={{
                        marginBottom:
                          "5px",
                        color:
                          "#6d28d9",
                        fontSize:
                          "13px",
                        fontWeight:
                          "600",
                      }}
                    >
                      ✨ AI Answer
                    </div>

                    <div
                      style={{
                        color:
                          "#374151",
                        fontSize:
                          "14px",
                        lineHeight:
                          "1.5",
                      }}
                    >
                      {
                        aiAnswers[
                          q.id
                        ]
                      }
                    </div>
                  </div>
                )}
              </div>
            )
          )
        )}
      </div>

      {/* MORE */}
      {hasMore && (
        <div
          style={{
            marginTop:
              "20px",
            textAlign:
              "center",
          }}
        >
          <p
            style={{
              color:
                "#6b7280",
              fontSize:
                "13px",
            }}
          >
            More questions
            available
          </p>
        </div>
      )}
    </div>
  );
}