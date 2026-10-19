"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import SignInForm from "@/components/auth/SignInForm";
import SignUpForm from "@/components/auth/SignUpForm";
import AuthBranding from "@/components/auth/AuthBranding";
import { ThemeToggle } from "@/components/theme-toggle";

type AuthMode = "sign-in" | "sign-up";

export default function AuthSplitScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const [mode, setMode] = useState<AuthMode>(
    pathname === "/sign-up" ? "sign-up" : "sign-in"
  );
  const [direction, setDirection] = useState<"left" | "right">("right");

  useEffect(() => {
    const newMode = pathname === "/sign-up" ? "sign-up" : "sign-in";
    if (newMode !== mode) {
      setDirection(newMode === "sign-up" ? "left" : "right");
      setMode(newMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const switchTo = (target: AuthMode) => {
    if (target === mode) return;
    setDirection(target === "sign-up" ? "left" : "right");
    setMode(target);
    router.push(target === "sign-up" ? "/sign-up" : "/sign-in");
  };

  const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

  const formVariants = {
    enter: (dir: "left" | "right") => ({
      x: dir === "left" ? 30 : -30,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: EASE },
    },
    exit: (dir: "left" | "right") => ({
      x: dir === "left" ? -30 : 30,
      opacity: 0,
      transition: { duration: 0.3, ease: EASE },
    }),
  };

  // Branding panel position:
  // When sign-in: Branding is on LEFT (x: 0%) -> Form is on RIGHT
  // When sign-up: Branding is on RIGHT (x: 100%) -> Form is on LEFT
  const panelAnimate =
    mode === "sign-in"
      ? { x: "0%", transition: { duration: 0.6, ease: EASE } }
      : { x: "100%", transition: { duration: 0.6, ease: EASE } };

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-background text-foreground transition-colors duration-300">
      {/* ── Theme Toggle floating button (Desktop) ── */}
      <div className="hidden lg:block absolute top-6 right-6 z-30">
        <ThemeToggle />
      </div>

      {/* ── Desktop split layout ── */}
      <div className="hidden lg:flex w-full relative">
        {/* Branding panel — smoothly slides left↔right with shadow */}
        <motion.div
          className="absolute inset-y-0 left-0 w-1/2 z-20 shadow-2xl"
          animate={panelAnimate}
        >
          <AuthBranding mode={mode} onSwitch={switchTo} />
        </motion.div>

        {/* Form area — two halves */}
        <div className="relative w-full flex min-h-screen">
          {/* Left slot (Active when mode === "sign-up", since branding slides to the right) */}
          <div className="w-1/2 flex items-center justify-center px-12 py-12 z-10">
            <AnimatePresence mode="wait" custom={direction}>
              {mode === "sign-up" && (
                <motion.div
                  key="sign-up-desktop"
                  className="w-full max-w-md"
                  custom={direction}
                  variants={formVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <SignUpForm onSwitch={() => switchTo("sign-in")} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right slot (Active when mode === "sign-in", since branding sits on the left) */}
          <div className="w-1/2 flex items-center justify-center px-12 py-12 z-10">
            <AnimatePresence mode="wait" custom={direction}>
              {mode === "sign-in" && (
                <motion.div
                  key="sign-in-desktop"
                  className="w-full max-w-md"
                  custom={direction}
                  variants={formVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <SignInForm onSwitch={() => switchTo("sign-up")} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Mobile layout ── */}
      <div className="flex lg:hidden w-full flex-col min-h-screen">
        {/* Mobile header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-900/30">
              <span className="text-white text-xs font-bold">EP</span>
            </div>
            <span className="font-bold text-sm tracking-tight text-foreground">
              Edge<span className="text-violet-600 dark:text-violet-400">Pro</span>
            </span>
          </div>

          {/* Tab switcher + Theme toggle */}
          <div className="flex items-center gap-2">
            <div className="flex bg-muted/60 dark:bg-white/5 rounded-full p-1 gap-1 border border-border/50">
              <button
                id="mobile-signin-tab"
                onClick={() => switchTo("sign-in")}
                className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer ${
                  mode === "sign-in"
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                id="mobile-signup-tab"
                onClick={() => switchTo("sign-up")}
                className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer ${
                  mode === "sign-up"
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign Up
              </button>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile form area */}
        <div className="flex-1 relative overflow-y-auto px-6 py-8 flex items-start justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={mode + "-mobile"}
              className="w-full max-w-sm"
              custom={direction}
              variants={formVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {mode === "sign-in" ? (
                <SignInForm onSwitch={() => switchTo("sign-up")} />
              ) : (
                <SignUpForm onSwitch={() => switchTo("sign-in")} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
