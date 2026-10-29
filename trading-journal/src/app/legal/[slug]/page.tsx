import { LegalDocumentPage } from "@/components/settings/legal-document-page";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <LegalDocumentPage slug={slug}/>;
}
