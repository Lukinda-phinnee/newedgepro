import "server-only";
import { sql } from "@/lib/db";
import type { TradingPlanItem } from "@/components/plan/plan-sidebar";

export interface StoredChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  createdPlanId?: string | null;
  createdPlan?: TradingPlanItem | null;
  createdAt: string;
}

export interface ChatSessionItem {
  id: string;
  title: string;
  planId?: string | null;
  messageCount: number;
  lastMessageSnippet: string;
  updatedAt: string;
  createdAt: string;
}

export async function listPlanChatSessions(userId: string): Promise<ChatSessionItem[]> {
  const rows = (await sql`
    SELECT
      s.id,
      s.title,
      s.plan_id,
      s.created_at,
      s.updated_at,
      COUNT(m.id)::int AS message_count,
      COALESCE(
        (
          SELECT content
          FROM plan_chat_messages
          WHERE session_id = s.id
          ORDER BY created_at DESC
          LIMIT 1
        ),
        ''
      ) AS last_message
    FROM plan_chat_sessions s
    LEFT JOIN plan_chat_messages m ON m.session_id = s.id
    WHERE s.user_id = ${userId}
    GROUP BY s.id
    ORDER BY s.updated_at DESC
  `) as Record<string, unknown>[];

  return rows.map((r) => ({
    id: String(r.id),
    title: String(r.title || "New Conversation"),
    planId: r.plan_id ? String(r.plan_id) : null,
    messageCount: Number(r.message_count || 0),
    lastMessageSnippet: String(r.last_message || "").slice(0, 90),
    updatedAt:
      r.updated_at instanceof Date
        ? r.updated_at.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
        : String(r.updated_at || "Just now"),
    createdAt:
      r.created_at instanceof Date
        ? r.created_at.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : String(r.created_at || "Today"),
  }));
}

export async function getPlanChatSessionWithMessages(
  userId: string,
  sessionId: string
): Promise<{ session: ChatSessionItem; messages: StoredChatMessage[] } | null> {
  const sessionRows = (await sql`
    SELECT id, title, plan_id, created_at, updated_at
    FROM plan_chat_sessions
    WHERE id = ${sessionId} AND user_id = ${userId}
    LIMIT 1
  `) as Record<string, unknown>[];

  if (!sessionRows.length) return null;
  const s = sessionRows[0];

  const messageRows = (await sql`
    SELECT
      m.id,
      m.session_id,
      m.role,
      m.content,
      m.created_plan_id,
      m.created_at,
      p.id AS p_id,
      p.title AS p_title,
      p.session_tag AS p_session_tag,
      p.summary AS p_summary,
      p.content AS p_content,
      p.created_at AS p_created_at,
      p.updated_at AS p_updated_at
    FROM plan_chat_messages m
    LEFT JOIN trading_plans p ON p.id = m.created_plan_id
    WHERE m.session_id = ${sessionId}
    ORDER BY m.created_at ASC
  `) as Record<string, unknown>[];

  const messages: StoredChatMessage[] = messageRows.map((m) => {
    let createdPlan: TradingPlanItem | null = null;
    if (m.p_id) {
      createdPlan = {
        id: String(m.p_id),
        title: String(m.p_title || "Trading Plan"),
        sessionTag: String(m.p_session_tag || ""),
        summary: String(m.p_summary || ""),
        content: String(m.p_content || ""),
        updatedAt:
          m.p_updated_at instanceof Date
            ? m.p_updated_at.toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : String(m.p_updated_at || "Just now"),
        createdAt:
          m.p_created_at instanceof Date
            ? m.p_created_at.toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : String(m.p_created_at || "Today"),
      };
    }

    return {
      id: String(m.id),
      sessionId: String(m.session_id),
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || ""),
      createdPlanId: m.created_plan_id ? String(m.created_plan_id) : null,
      createdPlan,
      createdAt:
        m.created_at instanceof Date
          ? m.created_at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "Just now",
    };
  });

  const session: ChatSessionItem = {
    id: String(s.id),
    title: String(s.title || "Conversation"),
    planId: s.plan_id ? String(s.plan_id) : null,
    messageCount: messages.length,
    lastMessageSnippet: messages[messages.length - 1]?.content.slice(0, 90) || "",
    updatedAt:
      s.updated_at instanceof Date
        ? s.updated_at.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
        : String(s.updated_at || "Just now"),
    createdAt:
      s.created_at instanceof Date
        ? s.created_at.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : String(s.created_at || "Today"),
  };

  return { session, messages };
}

export async function createPlanChatSession(
  userId: string,
  title?: string,
  planId?: string | null
): Promise<ChatSessionItem> {
  const initialTitle = (title || "New Conversation").slice(0, 255);
  const rows = (await sql`
    INSERT INTO plan_chat_sessions (user_id, title, plan_id)
    VALUES (${userId}, ${initialTitle}, ${planId || null})
    RETURNING id, title, plan_id, created_at, updated_at
  `) as Record<string, unknown>[];

  const r = rows[0];
  return {
    id: String(r.id),
    title: String(r.title),
    planId: r.plan_id ? String(r.plan_id) : null,
    messageCount: 0,
    lastMessageSnippet: "",
    updatedAt: "Just now",
    createdAt: "Today",
  };
}

export async function savePlanChatMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  createdPlanId?: string | null
): Promise<{ id: string; createdAt: string }> {
  const rows = (await sql`
    INSERT INTO plan_chat_messages (session_id, role, content, created_plan_id)
    VALUES (${sessionId}, ${role}, ${content}, ${createdPlanId || null})
    RETURNING id, created_at
  `) as Record<string, unknown>[];

  await sql`
    UPDATE plan_chat_sessions
    SET updated_at = NOW()
    WHERE id = ${sessionId}
  `;

  const r = rows[0];
  return {
    id: String(r.id),
    createdAt:
      r.created_at instanceof Date
        ? r.created_at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "Just now",
  };
}

export async function updatePlanChatSessionTitle(
  userId: string,
  sessionId: string,
  title: string
): Promise<boolean> {
  const cleanTitle = title.trim().slice(0, 255) || "New Conversation";
  const rows = (await sql`
    UPDATE plan_chat_sessions
    SET title = ${cleanTitle}, updated_at = NOW()
    WHERE id = ${sessionId} AND user_id = ${userId}
    RETURNING id
  `) as Record<string, unknown>[];

  return rows.length > 0;
}

export async function deletePlanChatSession(
  userId: string,
  sessionId: string
): Promise<boolean> {
  const rows = (await sql`
    DELETE FROM plan_chat_sessions
    WHERE id = ${sessionId} AND user_id = ${userId}
    RETURNING id
  `) as Record<string, unknown>[];

  return rows.length > 0;
}

