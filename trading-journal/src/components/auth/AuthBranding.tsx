"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  BarChart2,
  Shield,
  Zap,
  ArrowRight,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

type AuthMode = "sign-in" | "sign-up";

const features = [
  {
    icon: TrendingUp,
    title: "Track Every Trade",
    desc: "Log entries, exits, P&L, and notes in seconds.",
  },
  {
    icon: BarChart2,
    title: "Deep Analytics",
    desc: "Win rate, drawdown, equity curves & more.",
  },
  {
    icon: Shield,
    title: "Bank-Grade Security",
    desc: "Your data is encrypted and private, always.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    desc: "Instant insights with real-time calculations.",
  },
];

interface Props {
  mode: AuthMode;
  onSwitch: (target: AuthMode) => void;
}

export default function AuthBranding({ mode, onSwitch }: Props) {
  const isSignIn = mode === "sign-in";

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-violet-950 via-indigo-950 to-[#0a0a0f] flex flex-col justify-between p-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-800/10 rounded-full blur-2xl" />
        {/* Grid lines */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.04]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="white"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <BrandMark className="size-10 shrink-0 object-contain" priority />
        <span className="text-white font-bold text-xl tracking-tight">
          Edge<span className="text-violet-400">Pro</span>
        </span>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              {isSignIn ? (
                <>
                  Welcome back,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                    trader
                  </span>
                </>
              ) : (
                <>
                  Start your{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                    trading edge
                  </span>{" "}
                  today
                </>
              )}
            </h1>
            <p className="text-white/50 text-base leading-relaxed max-w-sm">
              {isSignIn
                ? "Your trades, patterns, and performance data are waiting for you."
                : "Join thousands of traders who track, analyze, and improve their strategies with EdgePro."}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Feature list */}
        <div className="mt-10 space-y-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
              className="flex items-start gap-4"
            >
              <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <f.icon className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-white/90 text-sm font-medium">{f.title}</p>
                <p className="text-white/40 text-xs mt-0.5">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Switch CTA */}
      <div className="relative z-10">
        <p className="text-white/40 text-sm">
          {isSignIn ? "Don't have an account?" : "Already have an account?"}
        </p>
        <button
          id={isSignIn ? "branding-goto-signup" : "branding-goto-signin"}
          onClick={() => onSwitch(isSignIn ? "sign-up" : "sign-in")}
          className="mt-2 flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors group"
        >
          {isSignIn ? "Create a free account" : "Sign in to your account"}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
