import AuthSplitScreen from "@/components/auth/AuthSplitScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — EdgePro",
  description: "Sign in to your EdgePro trading journal.",
};

export default function SignInPage() {
  return <AuthSplitScreen />;
}
