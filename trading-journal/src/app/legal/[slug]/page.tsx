import { LegalDocumentPage } from "@/components/settings/legal-document-page";

export function generateStaticParams() {
  return [
    { slug: "cookie-policy" },
    { slug: "privacy-policy" },
    { slug: "risk-policy" },
    { slug: "terms-of-service" },
  ];
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <LegalDocumentPage slug={slug}/>;
}
