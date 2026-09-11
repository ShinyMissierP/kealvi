import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const PRIMARY_MODEL = "gemini-3.1-flash-lite";
const FALLBACK_MODEL = "gemini-3.7-flash";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateAnswer(
  ai: GoogleGenAI,
  prompt: string
) {
  try {
    // First attempt: fast lightweight model
    return await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: prompt,
    });
  } catch (error: any) {
    console.error(
      "Primary Gemini model failed:",
      error?.status
    );

    // Retry only temporary errors
    if (
      error?.status === 503 ||
      error?.status === 429 ||
      error?.status === 500 ||
      error?.status === 502 ||
      error?.status === 504
    ) {
      await sleep(1000);

      try {
        // One retry with the same fast model
        return await ai.models.generateContent({
          model: PRIMARY_MODEL,
          contents: prompt,
        });
      } catch (retryError: any) {
        console.error(
          "Retry failed:",
          retryError?.status
        );

        // Try fallback once
        return await ai.models.generateContent({
          model: FALLBACK_MODEL,
          contents: prompt,
        });
      }
    }

    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { question } = await request.json();

    if (
      !question ||
      typeof question !== "string" ||
      !question.trim()
    ) {
      return NextResponse.json(
        {
          error: "Question is required",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY is missing",
        },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const prompt = `
Answer this question in only 2 or 3 short lines.
Be clear, simple, and correct.

Question:
${question.trim()}
`;

    const response = await generateAnswer(ai, prompt);

    return NextResponse.json({
      answer:
        response.text?.trim() ||
        "No answer was generated.",
    });
  } catch (error: any) {
    console.error("Gemini API error:", error);

    if (
      error?.status === 503 ||
      error?.status === 429
    ) {
      return NextResponse.json(
        {
          error:
            "Gemini is temporarily busy. Please try again.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate answer",
      },
      { status: 500 }
    );
  }
}