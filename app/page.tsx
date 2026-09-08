import QuestionsList from "./questions-list";
import Polls from "./polls";
import AskGemini from "./ask-gemini";
import { getQuestionsPage } from "@/lib/questions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function Page() {
  const { questions, hasMore } = await getQuestionsPage(0, PAGE_SIZE);

  return (
   <main
  style={{
    width: "90%",
    maxWidth: "700px",
    margin: "0 auto",
    padding: "24px 0",
  }}
>

      <div
        style={{
          textAlign: "center",
          marginBottom: "28px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: "600",
            letterSpacing: "3px",
            color: "#8b5cf6",
            marginBottom: "6px",
          }}
        >
          ✦ COMMUNITY • KNOWLEDGE • DISCUSSION ✦
        </div>

        <h1
          style={{
            margin: "0",
            fontSize: "38px",
            fontWeight: "800",
            letterSpacing: "-1px",
            color: "#5b21b6",
          }}
        >
          DIGITAL FORUM
        </h1>

        <p
          style={{
            marginTop: "8px",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          Ask questions, share knowledge, and learn together
        </p>
      </div>

      <AskGemini />

      <QuestionsList
        initialQuestions={questions}
        initialHasMore={hasMore}
      />

      <Polls />

    </main>
  );
}