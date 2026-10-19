"use server";

import { auth } from "@/lib/auth/server";
import { mirrorAuthCookiesForLocalHttp } from "@/lib/auth/local-cookie-compat";
import { signInSchema, signUpSchema } from "@/lib/validations/auth";

export async function signInWithEmail(input: { email: string; password: string }) {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please enter a valid email and password." };
  }

  try {
    const { error } = await auth.signIn.email({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (!error) await mirrorAuthCookiesForLocalHttp();
    return { error: error?.message ?? null };
  } catch (cause) {
    console.error("[auth] Email sign-in action failed", cause);
    return { error: "Unable to sign in right now. Please try again." };
  }

}

export async function signUpWithEmail(input: {
  name: string;
  email: string;
  password: string;
}) {
  const parsed = signUpSchema.omit({ confirmPassword: true }).safeParse(input);
  if (!parsed.success) {
    return { error: "Please check your name, email, and password." };
  }

  try {
    const { error } = await auth.signUp.email(parsed.data);

    if (!error) await mirrorAuthCookiesForLocalHttp();
    return { error: error?.message ?? null };
  } catch (cause) {
    console.error("[auth] Email sign-up action failed", cause);
    return { error: "Unable to create your account right now. Please try again." };
  }
}
