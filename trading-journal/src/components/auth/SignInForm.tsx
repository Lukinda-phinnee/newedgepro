"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { signInWithEmail } from "@/app/(auth)/sign-in/actions";
import { signInSchema, type SignInInput } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Props {
  onSwitch: () => void;
}

export default function SignInForm({ onSwitch }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInInput) => {
    setServerError(null);
    try {
      const { error } = await signInWithEmail({
        email: data.email,
        password: data.password,
      });
      if (error) {
        setServerError(error);
        return;
      }
      setIsSuccess(true);
      await new Promise((resolve) => window.setTimeout(resolve, 650));
      window.location.assign("/dashboard");
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full"
    >
      {/* Header */}
      <div className="mb-8 space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back
        </h2>
        <p className="text-sm text-muted-foreground">
          Sign in to your trading journal
        </p>
      </div>

      <form id="sign-in-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              key="success"
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-600 shadow-xs dark:text-emerald-400">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                <span>Signed in successfully. Redirecting to your workspace…</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Server error alert */}
        <AnimatePresence>
          {serverError && (
            <motion.div
              key="err"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500 dark:text-red-400">
                {serverError}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email field */}
        <div className="space-y-2">
          <Label htmlFor="signin-email">Email address</Label>
          <Input
            id="signin-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register("email")}
            className={errors.email ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20" : ""}
          />
          {errors.email && (
            <p className="text-xs text-red-500 dark:text-red-400">{errors.email.message}</p>
          )}
        </div>

        {/* Password field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="signin-password">Password</Label>
            <button
              type="button"
              id="signin-forgot-password"
              className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 transition-colors cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="signin-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              {...register("password")}
              className={`pr-10 ${errors.password ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20" : ""}`}
            />
            <button
              type="button"
              id="signin-toggle-password"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 dark:text-red-400">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <Button
          id="signin-submit"
          type="submit"
          size="lg"
          disabled={isSubmitting || isSuccess}
          className="w-full mt-2 transition-all"
        >
          {isSuccess ? (
            <><CheckCircle2 className="mr-2 size-4" />Redirecting...</>
          ) : isSubmitting ? (
            <><Loader2 className="mr-2 size-4 animate-spin" />Signing in...</>
          ) : (
            <>Sign in<ArrowRight className="ml-2 size-4" /></>
          )}
        </Button>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-3 text-xs text-muted-foreground">
              New to EdgePro?
            </span>
          </div>
        </div>

        {/* Switch */}
        <Button
          type="button"
          id="signin-goto-signup"
          variant="outline"
          size="lg"
          onClick={onSwitch}
          className="w-full"
        >
          Create a free account
        </Button>
      </form>
    </motion.div>
  );
}
