import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { sql } from "@/lib/db";
import { ASSETS_BUCKET, s3 } from "@/lib/storage";

type Context = { params: Promise<{ objectKey: string[] }> };
export async function GET(_: Request, { params }: Context) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { objectKey } = await params;
    const key = objectKey.join("/");
    const rows = await sql`SELECT object_key FROM note_attachments WHERE object_key = ${key} AND user_id = ${session.user.id} LIMIT 1`;
    if (!rows.length) return NextResponse.json({ error: "Image not found" }, { status: 404 });
    const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: ASSETS_BUCKET, Key: key }), { expiresIn: 300 });
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("GET note file error:", error);
    return NextResponse.json({ error: "Unable to load image" }, { status: 500 });
  }
}
