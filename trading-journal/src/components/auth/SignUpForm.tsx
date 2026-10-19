"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { signUpWithEmail } from "@/app/(auth)/sign-in/actions";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Props {
  onSwitch: () => void;
}

const passwordRules = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /\d/.test(p) },
];

function PasswordStrengthBar({ password }: { password: string }) {
  const score = passwordRules.filter((r) => r.test(password)).length;
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-violet-500",
    "bg-emerald-500",
  ];

  if (!password) return null;

  return (
    <div className="space-y-2 pt-1">
      {/* Bar */}
      <div className="flex gap-1">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < score ? colors[score] : "bg-muted"
            }`}
          />
        ))}
      </div>
      {/* Checklist */}
      <div className="grid grid-cols-2 gap-1">
        {passwordRules.map((rule) => {
          const ok = rule.test(password);
          return (
            <div key={rule.label} className="flex items-center gap-1.5">
              {ok ? (
                <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="size-3 text-muted-foreground/30 shrink-0" />
              )}
              <span className={`text-xs transition-colors ${ok ? "text-foreground/80 font-medium" : "text-muted-foreground/60"}`}>
                {rule.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SignUpForm({ onSwitch }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  });

  const passwordValue = watch("password", "");

  const onSubmit = async (data: SignUpInput) => {
    setServerError(null);
    try {
      const { error } = await signUpWithEmail({
        email: data.email,
        password: data.password,
        name: data.name,
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
          Create your account
        </h2>
        <p className="text-sm text-muted-foreground">
          Start journaling your trades — free forever
        </p>
      </div>

      <form id="sign-up-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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
                <span>Account created successfully. Redirecting to your workspace…</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Server error */}
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

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="signup-name">Full name</Label>
          <Input
            id="signup-name"
            type="text"
            placeholder="John Smith"
            autoComplete="name"
            {...register("name")}
            className={errors.name ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20" : ""}
          />
          {errors.name && (
            <p className="text-xs text-red-500 dark:text-red-400">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="signup-email">Email address</Label>
          <Input
            id="signup-email"
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

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("password")}
              className={`pr-10 ${errors.password ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20" : ""}`}
            />
            <button
              type="button"
              id="signup-toggle-password"
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
          <PasswordStrengthBar password={passwordValue} />
        </div>

        {/* Confirm password */}
        <div className="space-y-2">
          <Label htmlFor="signup-confirm-password">Confirm password</Label>
          <div className="relative">
            <Input
              id="signup-confirm-password"
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("confirmPassword")}
              className={`pr-10 ${errors.confirmPassword ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20" : ""}`}
            />
            <button
              type="button"
              id="signup-toggle-confirm"
              onClick={() => setShowConfirm((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 dark:text-red-400">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Submit */}
        <Button
          id="signup-submit"
          type="submit"
          size="lg"
          disabled={isSubmitting || isSuccess}
          className="w-full mt-2 transition-all"
        >
          {isSuccess ? (
            <><CheckCircle2 className="mr-2 size-4" />Redirecting...</>
          ) : isSubmitting ? (
            <><Loader2 className="mr-2 size-4 animate-spin" />Creating account...</>
          ) : (
            <>Create account<ArrowRight className="ml-2 size-4" /></>
          )}
        </Button>

        {/* Divider */}
        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-3 text-xs text-muted-foreground">
              Already have an account?
            </span>
          </div>
        </div>

        {/* Switch */}
        <Button
          type="button"
          id="signup-goto-signin"
          variant="outline"
          size="lg"
          onClick={onSwitch}
          className="w-full"
        >
          Sign in instead
        </Button>

        <p className="text-center text-xs text-muted-foreground/70 pt-1">
          By signing up you agree to our{" "}
          <span className="text-violet-600 dark:text-violet-400 hover:underline cursor-pointer transition-colors">Terms</span>{" "}
          and{" "}
          <span className="text-violet-600 dark:text-violet-400 hover:underline cursor-pointer transition-colors">Privacy Policy</span>
        </p>
      </form>
    </motion.div>
  );
}
