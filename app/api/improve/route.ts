import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `Improve the following search phrase.
Fix grammar and spelling and make it clearer, but keep the same meaning.
Return ONLY the improved phrase, with no explanation.

Text:
${text}`,
    });

    return NextResponse.json({
      improved: response.text?.trim() || text,
    });
  } catch (error) {
    console.error("Improve API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to improve text",
      },
      { status: 500 }
    );
  }
}