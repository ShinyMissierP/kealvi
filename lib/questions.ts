import { supabase } from "@/lib/supabase";

export async function getQuestionsPage(offset: number, limit: number) {
  const { data, error } = await supabase
    .from("questions")
    .select("id, body, author, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []).map((q: any) => ({
    id: q.id,
    body: q.body,
    author: q.author,
    votes: 0,
  }));

  const hasMore = (data?.length ?? 0) === limit;

  return {
    questions: rows,
    hasMore,
  };
}

export async function searchQuestions(q: string, limit: number) {
  const { data, error } = await supabase
    .from("questions")
    .select("id, body, author, created_at")
    .ilike("body", `%${q}%`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    body: row.body,
    author: row.author,
    votes: 0,
  }));
}