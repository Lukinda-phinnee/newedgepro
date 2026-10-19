import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EdgePro — Authentication",
  description: "Sign in or create your EdgePro trading journal account.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
