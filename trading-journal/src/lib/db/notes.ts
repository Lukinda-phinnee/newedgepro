import "server-only";
import { sql } from "@/lib/db";

export async function listNoteWorkspaces(userId: string) {
  return sql`
    SELECT w.id, w.title, w.emoji, w.cover_image_url AS "coverImageUrl",
      w.created_at AS "createdAt", w.updated_at AS "updatedAt",
      COALESCE(json_agg(json_build_object(
        'id', d.id, 'title', d.title, 'emoji', d.emoji,
        'coverImageUrl', d.cover_image_url, 'content', d.content,
        'shareToken', d.share_token, 'updatedAt', d.updated_at
      ) ORDER BY d.updated_at DESC) FILTER (WHERE d.id IS NOT NULL), '[]'::json) AS documents
    FROM note_workspaces w
    LEFT JOIN note_documents d ON d.workspace_id = w.id
    WHERE w.user_id = ${userId}
    GROUP BY w.id
    ORDER BY w.updated_at DESC
  `;
}

export async function createNoteWorkspace(userId: string, title: string, emoji: string | null = null, coverImageUrl: string | null = null) {
  const rows = await sql`
    INSERT INTO note_workspaces (user_id, title, emoji, cover_image_url)
    VALUES (${userId}, ${title}, ${emoji}, ${coverImageUrl})
    RETURNING id, title, emoji, cover_image_url AS "coverImageUrl", created_at AS "createdAt"
  `;
  const workspace = rows[0];
  const docs = await sql`
    INSERT INTO note_documents (workspace_id, title, cover_image_url)
    VALUES (${workspace.id}, 'Untitled', ${coverImageUrl})
    RETURNING id, title, emoji, cover_image_url AS "coverImageUrl", content,
      share_token AS "shareToken", created_at AS "createdAt", updated_at AS "updatedAt"
  `;
  return { ...workspace, documents: docs };
}

export async function updateNoteWorkspace(userId: string, workspaceId: string, data: Record<string, unknown>) {
  const title = typeof data.title === "string" ? data.title.slice(0, 160) : undefined;
  const emoji = typeof data.emoji === "string" || data.emoji === null ? data.emoji : undefined;
  const cover = typeof data.coverImageUrl === "string" || data.coverImageUrl === null ? data.coverImageUrl : undefined;
  const rows = await sql`
    UPDATE note_workspaces SET
      title = COALESCE(${title ?? null}, title),
      emoji = CASE WHEN ${emoji !== undefined} THEN ${emoji ?? null} ELSE emoji END,
      cover_image_url = CASE WHEN ${cover !== undefined} THEN ${cover ?? null} ELSE cover_image_url END,
      updated_at = NOW()
    WHERE id = ${workspaceId} AND user_id = ${userId}
    RETURNING id, title, emoji, cover_image_url AS "coverImageUrl", updated_at AS "updatedAt"
  `;
  return rows[0] ?? null;
}

export async function deleteNoteWorkspace(userId: string, workspaceId: string) {
  const rows = await sql`DELETE FROM note_workspaces WHERE id = ${workspaceId} AND user_id = ${userId} RETURNING id`;
  return rows.length > 0;
}

export async function listNoteDocuments(userId: string, workspaceId: string) {
  return sql`
    SELECT d.id, d.workspace_id AS "workspaceId", d.title, d.emoji,
      d.cover_image_url AS "coverImageUrl", d.content, d.share_token AS "shareToken",
      d.created_at AS "createdAt", d.updated_at AS "updatedAt"
    FROM note_documents d JOIN note_workspaces w ON w.id = d.workspace_id
    WHERE w.user_id = ${userId} AND w.id = ${workspaceId}
    ORDER BY d.updated_at DESC
  `;
}

export async function createNoteDocument(userId: string, workspaceId: string, title = "Untitled", emoji: string | null = null, coverImageUrl: string | null = null) {
  const rows = await sql`
    INSERT INTO note_documents (workspace_id, title, emoji, cover_image_url)
    SELECT w.id, ${title.slice(0, 200)}, ${emoji}, ${coverImageUrl} FROM note_workspaces w
    WHERE w.id = ${workspaceId} AND w.user_id = ${userId}
      AND (SELECT COUNT(*) FROM note_documents existing WHERE existing.workspace_id = w.id) < 10
    RETURNING id, workspace_id AS "workspaceId", title, emoji, cover_image_url AS "coverImageUrl",
      content, share_token AS "shareToken", created_at AS "createdAt", updated_at AS "updatedAt"
  `;
  return rows[0] ?? null;
}

export async function getNoteDocument(userId: string, documentId: string) {
  const rows = await sql`
    SELECT d.id, d.workspace_id AS "workspaceId", d.title, d.emoji,
      d.cover_image_url AS "coverImageUrl", d.content, d.share_token AS "shareToken",
      d.created_at AS "createdAt", d.updated_at AS "updatedAt"
    FROM note_documents d JOIN note_workspaces w ON w.id = d.workspace_id
    WHERE d.id = ${documentId} AND w.user_id = ${userId} LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function updateNoteDocument(userId: string, documentId: string, data: Record<string, unknown>) {
  const title = typeof data.title === "string" ? data.title.slice(0, 200) : undefined;
  const content = typeof data.content === "string" ? data.content.slice(0, 1_000_000) : undefined;
  const emoji = typeof data.emoji === "string" || data.emoji === null ? data.emoji : undefined;
  const cover = typeof data.coverImageUrl === "string" || data.coverImageUrl === null ? data.coverImageUrl : undefined;
  const share = data.share === true ? true : data.share === false ? false : undefined;
  const rows = await sql`
    UPDATE note_documents d SET
      title = COALESCE(${title ?? null}, d.title),
      content = COALESCE(${content ?? null}, d.content),
      emoji = CASE WHEN ${emoji !== undefined} THEN ${emoji ?? null} ELSE d.emoji END,
      cover_image_url = CASE WHEN ${cover !== undefined} THEN ${cover ?? null} ELSE d.cover_image_url END,
      share_token = CASE WHEN ${share === true} THEN COALESCE(d.share_token, gen_random_uuid()) WHEN ${share === false} THEN NULL ELSE d.share_token END,
      updated_at = NOW()
    FROM note_workspaces w WHERE d.workspace_id = w.id AND d.id = ${documentId} AND w.user_id = ${userId}
    RETURNING d.id, d.workspace_id AS "workspaceId", d.title, d.emoji,
      d.cover_image_url AS "coverImageUrl", d.content, d.share_token AS "shareToken", d.updated_at AS "updatedAt"
  `;
  return rows[0] ?? null;
}

export async function deleteNoteDocument(userId: string, documentId: string) {
  const rows = await sql`
    DELETE FROM note_documents d USING note_workspaces w
    WHERE d.workspace_id = w.id AND d.id = ${documentId} AND w.user_id = ${userId} RETURNING d.id
  `;
  return rows.length > 0;
}

export async function listNoteComments(userId: string, documentId: string) {
  return sql`
    SELECT c.id, c.author_name AS "authorName", c.body, c.created_at AS "createdAt"
    FROM note_comments c JOIN note_documents d ON d.id = c.document_id
    JOIN note_workspaces w ON w.id = d.workspace_id
    WHERE c.document_id = ${documentId} AND w.user_id = ${userId}
    ORDER BY c.created_at ASC
  `;
}

export async function addNoteComment(userId: string, authorName: string, documentId: string, body: string) {
  const rows = await sql`
    INSERT INTO note_comments (document_id, user_id, author_name, body)
    SELECT d.id, ${userId}, ${authorName.slice(0, 160)}, ${body.slice(0, 5000)}
    FROM note_documents d JOIN note_workspaces w ON w.id = d.workspace_id
    WHERE d.id = ${documentId} AND w.user_id = ${userId}
    RETURNING id, author_name AS "authorName", body, created_at AS "createdAt"
  `;
  return rows[0] ?? null;
}

export async function getPublicNoteDocument(shareToken: string) {
  const rows = await sql`
    SELECT d.title, d.emoji, d.cover_image_url AS "coverImageUrl", d.content, d.updated_at AS "updatedAt"
    FROM note_documents d WHERE d.share_token = ${shareToken} LIMIT 1
  `;
  return rows[0] ?? null;
}
