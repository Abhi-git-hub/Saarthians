import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireRole: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/ai/context", () => ({ selectTutorContext: vi.fn() }));
vi.mock("@/lib/ai/engine", () => ({ respondToIntent: vi.fn() }));
vi.mock("@/lib/ai/retrieval", () => ({ retrieveMaterialEvidence: vi.fn() }));
vi.mock("@/lib/ai/provider", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/ai/provider")>();
  return { ...mod, generateWithProvider: vi.fn(), isProviderConfigured: vi.fn() };
});

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { selectTutorContext } from "@/lib/ai/context";
import { respondToIntent } from "@/lib/ai/engine";
import { generateWithProvider, isProviderConfigured } from "@/lib/ai/provider";
import { retrieveMaterialEvidence } from "@/lib/ai/retrieval";
import {
  deleteConversation,
  getConversation,
  listConversations,
  sendChatMessage,
} from "./actions";

const USER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const CONVO_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

// Chainable query stub: every builder method returns the chain; awaiting it
// resolves the queued result. Queues are keyed by table in call order.
class Chain {
  private result: unknown;
  constructor(result: unknown) {
    this.result = result;
  }
  select() { return this; }
  insert() { return this; }
  update() { return this; }
  delete() { return this; }
  eq() { return this; }
  in() { return this; }
  gte() { return this; }
  order() { return this; }
  limit() { return this; }
  single() { return this; }
  maybeSingle() { return this; }
  then(resolve: (value: unknown) => void) {
    resolve(this.result);
  }
}

function mockDb(queues: Record<string, unknown[]>) {
  const from = vi.fn((table: string) => {
    const queue = queues[table] ?? [];
    const result = queue.length > 0 ? queue.shift() : { data: null, error: null };
    return new Chain(result);
  });
  vi.mocked(createClient).mockResolvedValue({ from } as never);
  vi.mocked(requireRole).mockResolvedValue({ id: USER_ID } as never);
  vi.mocked(requireRole).mockResolvedValue({ id: USER_ID } as never);
  vi.mocked(selectTutorContext).mockResolvedValue({
    mistakes: [],
    notes: [],
    progress: { gradedAttempts: 0, averagePercent: null, bestPercent: null, perTest: [] },
    noteCount: 0,
  } as never);
  vi.mocked(respondToIntent).mockReturnValue({ body: "Mocked answer.", usedTools: ["mock"], suggestions: [] });
  return { from };
}

describe("sendChatMessage authorization", () => {
  it("rejects invalid input before touching the database", async () => {
    const { from } = mockDb({});
    await expect(sendChatMessage({ conversationId: null, content: "   " })).rejects.toThrow("INVALID_MESSAGE");
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects a conversation owned by another student", async () => {
    mockDb({
      chat_conversations: [
        [{ id: "c1" }],
        { data: null, error: { message: "none" } },
      ],
      chat_messages: [{ count: 0, error: null }],
    });
    await expect(sendChatMessage({ conversationId: CONVO_ID, content: "hello" })).rejects.toThrow(
      "CONVERSATION_NOT_FOUND",
    );
  });

  it("enforces the daily message budget", async () => {
    mockDb({
      chat_conversations: [
        { data: [{ id: CONVO_ID }], error: null },
        { data: { id: CONVO_ID }, error: null },
      ],
      chat_messages: [{ count: 30, error: null }],
    });
    await expect(sendChatMessage({ conversationId: CONVO_ID, content: "hello again" })).rejects.toThrow(
      "CHAT_DAILY_LIMIT",
    );
  });

  it("propagates authorization failure without touching data", async () => {
    const { from } = mockDb({});
    vi.mocked(requireRole).mockRejectedValue(new Error("REDIRECT:/login"));
    await expect(sendChatMessage({ conversationId: null, content: "hello" })).rejects.toThrow("REDIRECT:/login");
    expect(from).not.toHaveBeenCalled();
  });
});

describe("sendChatMessage happy path", () => {
  it("creates a conversation, persists both messages, and returns the id", async () => {
    const { from } = mockDb({
      chat_conversations: [{ data: [], error: null }, { data: { id: "new-convo" }, error: null }],
      chat_messages: [{ count: 0, error: null }, { error: null }, { error: null }, { error: null }],
    });
    const result = await sendChatMessage({ conversationId: null, content: "help me revise" });
    expect(result).toEqual({ conversationId: "new-convo" });
    expect(vi.mocked(selectTutorContext)).toHaveBeenCalledWith(USER_ID, []);
    expect(from).toHaveBeenCalledWith("chat_conversations");
    expect(from).toHaveBeenCalledWith("chat_messages");
  });

  it("sends into an owned conversation and refreshes its timestamp", async () => {
    mockDb({
      chat_conversations: [
        { data: [{ id: CONVO_ID }], error: null },
        { data: { id: CONVO_ID }, error: null },
      ],
      chat_messages: [{ count: 0, error: null }, { error: null }, { error: null }, { error: null }],
    });
    const result = await sendChatMessage({ conversationId: CONVO_ID, content: "quiz me" });
    expect(result).toEqual({ conversationId: CONVO_ID });
  });
});

describe("material-scoped tutoring", () => {
  const MATERIAL_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

  afterEach(() => {
    vi.mocked(isProviderConfigured).mockReset();
  });

  it("rejects a material scope the student cannot see", async () => {
    const { from } = mockDb({
      chat_conversations: [{ data: [], error: null }],
      chat_messages: [{ count: 0, error: null }],
      study_materials: [{ data: null, error: { message: "denied" } }],
    });
    await expect(
      sendChatMessage({ conversationId: null, content: "explain this", materialId: MATERIAL_ID }),
    ).rejects.toThrow("MATERIAL_NOT_FOUND");
    expect(from).toHaveBeenCalledWith("study_materials");
    expect(from).not.toHaveBeenCalledWith("chat_messages");
  });

  it("grounds provider answers in scoped evidence with honest metadata", async () => {
    vi.mocked(isProviderConfigured).mockReturnValue(true);
    const evidence = [
      { chunkId: "c1", materialId: MATERIAL_ID, title: "Physics Ch 3", page: 4, text: "laws", distance: 0.2 },
    ];
    vi.mocked(retrieveMaterialEvidence).mockResolvedValue(evidence);
    vi.mocked(generateWithProvider).mockResolvedValue({
      body: "Grounded answer.",
      usedTools: ["material_retrieval", "gemini_tutor"],
      suggestions: ["More?"],
      mode: "gemini_grounded",
      grounded: true,
      sources: [{ title: "Physics Ch 3", page: 4 }],
    });
    const { from } = mockDb({
      chat_conversations: [{ data: [], error: null }, { data: { id: "new-convo" }, error: null }],
      chat_messages: [{ count: 0, error: null }, { error: null }, { error: null }, { error: null }],
      study_materials: [{ data: { id: MATERIAL_ID }, error: null }],
    });
    const result = await sendChatMessage({ conversationId: null, content: "explain this", materialId: MATERIAL_ID });
    expect(result).toEqual({ conversationId: "new-convo" });
    expect(vi.mocked(retrieveMaterialEvidence)).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ materialId: MATERIAL_ID }),
    );
    expect(vi.mocked(generateWithProvider)).toHaveBeenCalledWith(expect.anything(), expect.anything(), evidence);
    const assistantInsert = from.mock.calls.filter(([table]) => table === "chat_messages");
    expect(assistantInsert.length).toBeGreaterThanOrEqual(2);
  });

  it("falls back honestly when the provider fails", async () => {
    vi.mocked(isProviderConfigured).mockReturnValue(true);
    vi.mocked(retrieveMaterialEvidence).mockRejectedValue(new Error("RETRIEVAL_FAILED"));
    vi.mocked(generateWithProvider).mockRejectedValue(new Error("GEMINI_UNREACHABLE"));
    mockDb({
      chat_conversations: [{ data: [], error: null }, { data: { id: "new-convo" }, error: null }],
      chat_messages: [{ count: 0, error: null }, { error: null }, { error: null }, { error: null }],
    });
    const result = await sendChatMessage({ conversationId: null, content: "help me" });
    expect(result).toEqual({ conversationId: "new-convo" });
    expect(vi.mocked(respondToIntent)).toHaveBeenCalled();
  });
});

describe("conversation reads and deletes", () => {
  it("loads only the requesting student's conversation", async () => {
    mockDb({
      chat_conversations: [{ data: { id: CONVO_ID, title: "t", created_at: "", updated_at: "" }, error: null }],
      chat_messages: [
        {
          data: [{ id: "m1", role: "user", content: "hi", created_at: "" }],
          error: null,
        },
      ],
    });
    const result = await getConversation(CONVO_ID);
    expect(result.conversation.id).toBe(CONVO_ID);
    expect(result.messages).toHaveLength(1);
  });

  it("rejects another student's conversation id", async () => {
    mockDb({ chat_conversations: [{ data: null, error: { message: "none" } }] });
    await expect(getConversation(OTHER_ID)).rejects.toThrow("CONVERSATION_NOT_FOUND");
  });

  it("lists the student's own conversations", async () => {
    mockDb({ chat_conversations: [{ data: [{ id: "c1", title: "t", created_at: "", updated_at: "" }], error: null }] });
    const rows = await listConversations();
    expect(rows).toHaveLength(1);
  });

  it("deletes only owned conversations", async () => {
    mockDb({ chat_conversations: [{ data: [{ id: CONVO_ID }], error: null }] });
    await expect(deleteConversation(CONVO_ID)).resolves.toBeUndefined();
    mockDb({ chat_conversations: [{ data: [], error: null }] });
    await expect(deleteConversation(OTHER_ID)).rejects.toThrow("CONVERSATION_NOT_FOUND");
  });
});
