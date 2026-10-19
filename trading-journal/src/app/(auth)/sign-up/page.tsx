import AuthSplitScreen from "@/components/auth/AuthSplitScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up — EdgePro",
  description: "Create your free EdgePro trading journal account.",
};

export default function SignUpPage() {
  return <AuthSplitScreen />;
}
