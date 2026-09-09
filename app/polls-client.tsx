"use client";

import { useState } from "react";

export default function PollsClient({
  initialPolls,
}: {
  initialPolls: any[];
}) {
  const [polls, setPolls] = useState(initialPolls);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
  const [votedPolls, setVotedPolls] = useState<Record<string, boolean>>({});
  const [loadingPolls, setLoadingPolls] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function vote(pollId: string) {
    const optionId = selectedOptions[pollId];

    if (!optionId || votedPolls[pollId]) {
      return;
    }

    setLoadingPolls((prev) => ({
      ...prev,
      [pollId]: true,
    }));

    setErrors((prev) => ({
      ...prev,
      [pollId]: "",
    }));

    try {
      const res = await fetch("/api/polls/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pollId,
          optionId,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();

        if (
          errorText.toLowerCase().includes("duplicate") ||
          errorText.toLowerCase().includes("unique") ||
          errorText.toLowerCase().includes("already")
        ) {
          setVotedPolls((prev) => ({
            ...prev,
            [pollId]: true,
          }));

          setErrors((prev) => ({
            ...prev,
            [pollId]: "You have already voted in this poll.",
          }));

          return;
        }

        throw new Error(errorText || "Vote failed");
      }

      setPolls((current) =>
        current.map((poll) => ({
          ...poll,
          options: poll.options.map((option: any) =>
            option.id === optionId
              ? {
                  ...option,
                  votes: (option.votes ?? 0) + 1,
                }
              : option
          ),
        }))
      );

      setVotedPolls((prev) => ({
        ...prev,
        [pollId]: true,
      }));
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [pollId]:
          error instanceof Error
            ? error.message
            : "Unable to submit your vote.",
      }));
    } finally {
      setLoadingPolls((prev) => ({
        ...prev,
        [pollId]: false,
      }));
    }
  }

  function selectOption(pollId: string, optionId: string) {
    if (votedPolls[pollId]) {
      return;
    }

    setSelectedOptions((prev) => ({
      ...prev,
      [pollId]: optionId,
    }));
  }

  function getTotalVotes(options: any[]) {
    return options.reduce(
      (total, option) => total + (option.votes ?? 0),
      0
    );
  }

  function getMaxVotes(options: any[]) {
    if (!options.length) return 0;

    return Math.max(...options.map((option) => option.votes ?? 0));
  }

  function getPercentage(votes: number, total: number) {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  }

  return (
    <section
      style={{
        marginTop: "40px",
        width: "100%",
      }}
    >
      {/* SECTION TITLE */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "24px",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            fontWeight: "600",
            letterSpacing: "2px",
            color: "#8b5cf6",
            textTransform: "uppercase",
          }}
        >
          Community Opinion
        </p>

        <h2
          style={{
            margin: "5px 0 0",
            fontSize: "28px",
            fontWeight: "700",
            color: "#5b21b6",
          }}
        >
          Polls
        </h2>
      </div>

      {/* POLL CARDS */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        {polls.map((poll) => {
          const totalVotes = getTotalVotes(poll.options);
          const maxVotes = getMaxVotes(poll.options);
          const selected = selectedOptions[poll.id];
          const hasVoted = votedPolls[poll.id];
          const isLoading = loadingPolls[poll.id];

          const winnerOptions =
            maxVotes > 0
              ? poll.options.filter(
                  (option: any) =>
                    (option.votes ?? 0) === maxVotes
                )
              : [];

          return (
            <div
              key={poll.id}
              style={{
                background: "#ffffff",
                border: "1px solid #e9d5ff",
                borderRadius: "14px",
                padding: "20px",
                boxShadow: "0 4px 14px rgba(91, 33, 182, 0.06)",
              }}
            >
              {/* POLL HEADER */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                  marginBottom: "18px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#8b5cf6",
                      marginBottom: "5px",
                    }}
                  >
                    📊 COMMUNITY POLL
                  </div>

                  <h3
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      lineHeight: "1.4",
                      fontWeight: "700",
                      color: "#1f2937",
                    }}
                  >
                    {poll.question}
                  </h3>
                </div>

                <span
                  style={{
                    padding: "5px 9px",
                    borderRadius: "999px",
                    background: "#f3e8ff",
                    color: "#6d28d9",
                    fontSize: "11px",
                    fontWeight: "600",
                    whiteSpace: "nowrap",
                  }}
                >
                  LIVE
                </span>
              </div>

              {/* OPTIONS */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {poll.options.map((option: any) => {
                  const votes = option.votes ?? 0;
                  const percentage = getPercentage(
                    votes,
                    totalVotes
                  );
                  const isSelected = selected === option.id;
                  const isWinner =
                    maxVotes > 0 && votes === maxVotes;

                  return (
                    <button
                      key={option.id}
                      onClick={() =>
                        selectOption(poll.id, option.id)
                      }
                      disabled={hasVoted}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "12px",
                        borderRadius: "9px",
                        border: isSelected
                          ? "2px solid #7c3aed"
                          : "1px solid #e5e7eb",
                        background: isSelected
                          ? "#faf5ff"
                          : "#ffffff",
                        cursor: hasVoted
                          ? "default"
                          : "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {/* OPTION TOP ROW */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "9px",
                          }}
                        >
                          <span
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              border: isSelected
                                ? "5px solid #7c3aed"
                                : "2px solid #c4b5fd",
                              display: "inline-block",
                              background: "#ffffff",
                              boxSizing: "border-box",
                            }}
                          />

                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: "500",
                              color: "#374151",
                            }}
                          >
                            {option.option_text}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#6b7280",
                          }}
                        >
                          {votes} votes
                        </span>
                      </div>

                      {/* PROGRESS BAR */}
                      {hasVoted && (
                        <div style={{ marginTop: "9px" }}>
                          <div
                            style={{
                              width: "100%",
                              height: "7px",
                              background: "#ede9fe",
                              borderRadius: "999px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${percentage}%`,
                                height: "100%",
                                background:
                                  isWinner
                                    ? "#7c3aed"
                                    : "#c4b5fd",
                                borderRadius: "999px",
                                transition:
                                  "width 0.3s ease",
                              }}
                            />
                          </div>

                          <div
                            style={{
                              marginTop: "4px",
                              textAlign: "right",
                              fontSize: "11px",
                              color: "#6b7280",
                            }}
                          >
                            {percentage}%
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* VOTE BUTTON */}
              {!hasVoted && (
                <button
                  onClick={() => vote(poll.id)}
                  disabled={!selected || isLoading}
                  style={{
                    width: "100%",
                    marginTop: "16px",
                    padding: "11px 16px",
                    border: "none",
                    borderRadius: "9px",
                    background:
                      selected && !isLoading
                        ? "#6d28d9"
                        : "#ddd6fe",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor:
                      selected && !isLoading
                        ? "pointer"
                        : "not-allowed",
                    transition: "all 0.2s ease",
                  }}
                >
                  {isLoading ? "Submitting..." : "Vote"}
                </button>
              )}

              {/* VOTED MESSAGE */}
              {hasVoted && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "#f5f3ff",
                    color: "#6d28d9",
                    textAlign: "center",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  ✓ You have already voted
                </div>
              )}

              {/* ERROR */}
              {errors[poll.id] && (
                <p
                  style={{
                    margin: "10px 0 0",
                    color: "#dc2626",
                    fontSize: "12px",
                    textAlign: "center",
                  }}
                >
                  {errors[poll.id]}
                </p>
              )}

              {/* RESULTS / WINNER */}
              {hasVoted && totalVotes > 0 && (
                <div
                  style={{
                    marginTop: "15px",
                    paddingTop: "14px",
                    borderTop: "1px solid #f3e8ff",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      marginBottom: "5px",
                    }}
                  >
                    {totalVotes} total votes
                  </div>

                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#5b21b6",
                    }}
                  >
                    🏆{" "}
                    {winnerOptions.length === 1
                      ? `${winnerOptions[0].option_text} is the winner`
                      : "It is a tie"}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}