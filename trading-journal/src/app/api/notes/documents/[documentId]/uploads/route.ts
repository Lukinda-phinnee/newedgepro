import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { sql } from "@/lib/db";
import { getNoteDocument } from "@/lib/db/notes";
import { ASSETS_BUCKET, s3 } from "@/lib/storage";

type Context = { params: Promise<{ documentId: string }> };
const allowedTypes = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

export async function POST(request: Request, { params }: Context) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { documentId } = await params;
    if (!await getNoteDocument(session.user.id, documentId)) return NextResponse.json({ error: "Document not found" }, { status: 404 });
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !allowedTypes.has(file.type) || file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Choose a PNG, JPG, GIF, or WebP image up to 8 MB" }, { status: 400 });
    }
    const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const objectKey = `trader-notes/${session.user.id}/${randomUUID()}.${ext}`;
    await s3.send(new PutObjectCommand({ Bucket: ASSETS_BUCKET, Key: objectKey, Body: Buffer.from(await file.arrayBuffer()), ContentType: file.type }));
    await sql`INSERT INTO note_attachments (object_key, document_id, user_id, file_name, content_type) VALUES (${objectKey}, ${documentId}, ${session.user.id}, ${file.name.slice(0, 240)}, ${file.type})`;
    return NextResponse.json({ url: `/api/notes/files/${encodeURIComponent(objectKey)}` }, { status: 201 });
  } catch (error) {
    console.error("POST note upload error:", error);
    return NextResponse.json({ error: "Unable to upload image" }, { status: 500 });
  }
}
