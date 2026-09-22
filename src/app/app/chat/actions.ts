"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { MAX_MESSAGES_PER_DAY, MESSAGE_WINDOW, chatMessageSchema, conversationIdSchema } from "@/lib/ai/policy";
import { selectTutorContext } from "@/lib/ai/context";
import { classifyIntent, topicKeywords } from "@/lib/ai/intent";
import { respondToIntent } from "@/lib/ai/engine";
import { generateWithProvider, isProviderConfigured } from "@/lib/ai/provider";
import { retrieveMaterialEvidence, type MaterialEvidence } from "@/lib/ai/retrieval";
import type { TutorAnswer, TutorAnswerMode, TutorContext, TutorSource } from "@/lib/ai/types";

const chatRequestSchema = chatMessageSchema.extend({
  materialId: z.string().uuid().nullish(),
});

export type ChatConversation = {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  context_metadata_json: unknown;
};

export async function listConversations(): Promise<ChatConversation[]> {
  const user = await requireRole(["student"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_conversations")
    .select("id,title,created_at,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(30);

  if (error) throw new Error("CHAT_LOAD_FAILED");
  return data ?? [];
}

export async function getConversation(conversationId: string): Promise<{ conversation: ChatConversation; messages: ChatMessage[] }> {
  const user = await requireRole(["student"]);
  const parsed = conversationIdSchema.safeParse(conversationId);
  if (!parsed.success) throw new Error("INVALID_CONVERSATION");

  const supabase = await createClient();
  const { data: conversation, error } = await supabase
    .from("chat_conversations")
    .select("id,title,created_at,updated_at")
    .eq("id", parsed.data)
    .eq("user_id", user.id)
    .single();

  if (error || !conversation) throw new Error("CONVERSATION_NOT_FOUND");

  const { data: messages, error: messagesError } = await supabase
    .from("chat_messages")
    .select("id,role,content,created_at,context_metadata_json")
    .eq("conversation_id", parsed.data)
    .order("created_at", { ascending: true })
    .limit(MESSAGE_WINDOW);

  if (messagesError) throw new Error("CHAT_LOAD_FAILED");
  return {
    conversation,
    messages: (messages ?? []).filter((message) => message.role === "user" || message.role === "assistant") as ChatMessage[],
  };
}

async function assertDailyBudget(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: conversations, error: conversationsError } = await supabase
    .from("chat_conversations")
    .select("id")
    .eq("user_id", userId);

  if (conversationsError) throw new Error("CHAT_SEND_FAILED");
  const ids = (conversations ?? []).map((conversation) => conversation.id);
  if (ids.length === 0) return;

  const { count, error } = await supabase
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .in("conversation_id", ids)
    .eq("role", "user")
    .gte("created_at", since);

  if (error) throw new Error("CHAT_SEND_FAILED");
  if ((count ?? 0) >= MAX_MESSAGES_PER_DAY) throw new Error("CHAT_DAILY_LIMIT");
}

export async function sendChatMessage(input: unknown): Promise<{ conversationId: string }> {
  const user = await requireRole(["student"]);
  const parsed = chatRequestSchema.safeParse(input);
  if (!parsed.success) throw new Error("INVALID_MESSAGE");

  const supabase = await createClient();
  await assertDailyBudget(supabase, user.id);

  const materialId = parsed.data.materialId ?? null;
  if (materialId) {
    const { data: scoped, error: scopeError } = await supabase
      .from("study_materials")
      .select("id")
      .eq("id", materialId)
      .eq("processing_status", "ready")
      .single();
    if (scopeError || !scoped) throw new Error("MATERIAL_NOT_FOUND");
  }

  let conversationId = parsed.data.conversationId;
  if (conversationId) {
    const { data: owned, error: ownedError } = await supabase
      .from("chat_conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (ownedError || !owned) throw new Error("CONVERSATION_NOT_FOUND");
  } else {
    const { data: created, error: createError } = await supabase
      .from("chat_conversations")
      .insert({ user_id: user.id, title: parsed.data.content.slice(0, 60) })
      .select("id")
      .single();

    if (createError || !created) throw new Error("CHAT_SEND_FAILED");
    conversationId = created.id;
  }

  if (!conversationId) throw new Error("CHAT_SEND_FAILED");

  const { error: userMessageError } = await supabase.from("chat_messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: parsed.data.content,
  });

  if (userMessageError) throw new Error("CHAT_SEND_FAILED");

  // Intent → context → tools → validated answer. When Groq is configured,
  // retrieval runs first (scoped to authorized materials, optionally to one
  // material via "Ask tutor about this PDF"), then generation. Any provider
  // or retrieval failure falls back to the local grounded engine with an
  // honest `fallback` mode — never labeled as generative AI.
  const intent = classifyIntent(parsed.data.content);
  let context: TutorContext;
  try {
    context = await selectTutorContext(
      user.id,
      intent.kind === "explain_topic" ? topicKeywords(intent.topic) : [],
    );
  } catch {
    throw new Error("CHAT_SEND_FAILED");
  }

  let answer: TutorAnswer;
  let mode: TutorAnswerMode = "fallback";
  let sources: TutorSource[] = [];
  let evidence: MaterialEvidence[] = [];
  if (isProviderConfigured()) {
    try {
      evidence = await retrieveMaterialEvidence(supabase, {
        query: parsed.data.content,
        materialId,
      });
    } catch {
      evidence = [];
    }
    try {
      const provided = await generateWithProvider(intent, context, evidence);
      answer = { body: provided.body, usedTools: provided.usedTools, suggestions: provided.suggestions };
      mode = provided.mode ?? "general";
      sources = provided.sources ?? [];
    } catch {
      answer = respondToIntent(intent, context);
    }
  } else {
    answer = respondToIntent(intent, context);
  }
  const body = answer.body.trim() || "I couldn't put that together from your coursework. Try asking me to review your mistakes or make a revision plan.";

  const { error: assistantMessageError } = await supabase.from("chat_messages").insert({
    conversation_id: conversationId,
    role: "assistant",
    content: body,
    context_metadata_json: {
      intent: intent.kind,
      usedTools: evidence.length > 0 && !answer.usedTools.includes("material_retrieval")
        ? [...answer.usedTools, "material_retrieval"]
        : answer.usedTools,
      suggestions: answer.suggestions,
      mode,
      sources,
      materialId,
    },
  });

  if (assistantMessageError) throw new Error("CHAT_SEND_FAILED");

  await supabase.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);

  revalidatePath("/app/chat");
  return { conversationId };
}

export async function deleteConversation(input: unknown): Promise<void> {
  const user = await requireRole(["student"]);
  const parsed = z.string().uuid().safeParse(input);
  if (!parsed.success) throw new Error("INVALID_CONVERSATION");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_conversations")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", user.id)
    .select("id");

  if (error || !data || data.length === 0) throw new Error("CONVERSATION_NOT_FOUND");
  revalidatePath("/app/chat");
}
