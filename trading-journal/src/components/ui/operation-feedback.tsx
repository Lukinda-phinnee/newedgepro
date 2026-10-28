"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, CircleHelp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

type FeedbackKind = "confirmation" | "success" | "failure";
type FeedbackOptions = { kind: FeedbackKind; title: string; description: string; confirmLabel?: string; cancelLabel?: string; autoCloseMs?: number };
type FeedbackContextValue = { showFeedback: (options: FeedbackOptions) => void; confirmAction: (options: Omit<FeedbackOptions, "kind" | "autoCloseMs">) => Promise<boolean> };
const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function OperationFeedbackProvider({ children }: { children: React.ReactNode }) {
  const [feedback, setFeedback] = useState<FeedbackOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const close = useCallback((confirmed = false) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setFeedback(null);
    resolveRef.current?.(confirmed);
    resolveRef.current = null;
  }, []);
  const showFeedback = useCallback((options: FeedbackOptions) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    resolveRef.current?.(false);
    resolveRef.current = null;
    setFeedback(options);
    if (options.kind !== "confirmation") {
      timerRef.current = setTimeout(() => close(), options.autoCloseMs ?? 2400);
    }
  }, [close]);
  const confirmAction = useCallback((options: Omit<FeedbackOptions, "kind" | "autoCloseMs">) => new Promise<boolean>((resolve) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    resolveRef.current?.(false);
    resolveRef.current = resolve;
    setFeedback({ ...options, kind: "confirmation" });
  }), []);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); resolveRef.current?.(false); }, []);

  const Icon = feedback?.kind === "success" ? CheckCircle2 : feedback?.kind === "failure" ? AlertCircle : CircleHelp;
  const tone = feedback?.kind === "success" ? "text-emerald-500 bg-emerald-500/10" : feedback?.kind === "failure" ? "text-rose-500 bg-rose-500/10" : "text-primary bg-primary/10";
  return <FeedbackContext.Provider value={{ showFeedback, confirmAction }}>
    {children}
    <Dialog open={!!feedback} onOpenChange={(open) => { if (!open) close(false); }}>
      <DialogContent className="max-w-sm rounded-3xl border-border/70 bg-card/95 p-6 shadow-[0_30px_100px_-24px_rgba(0,0,0,.55)] backdrop-blur-2xl data-[starting-style]:translate-y-2 data-[starting-style]:scale-[.98] data-[ending-style]:translate-y-2 data-[ending-style]:scale-[.98] transition-[opacity,transform] duration-200 motion-reduce:transition-opacity">
        <button type="button" onClick={() => close(false)} aria-label="Close" className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-95"><X size={16}/></button>
        {feedback && <div className="flex flex-col items-center text-center">
          <div className={`mb-4 flex size-14 items-center justify-center rounded-full ${tone}`}><Icon size={25} strokeWidth={2}/></div>
          <DialogTitle className="text-lg font-semibold tracking-tight">{feedback.title}</DialogTitle>
          <DialogDescription className="mt-2 max-w-[30ch] text-sm">{feedback.description}</DialogDescription>
          {feedback.kind === "confirmation" ? <div className="mt-6 flex w-full gap-2">
            <Button variant="outline" className="flex-1" onClick={() => close(false)}>{feedback.cancelLabel ?? "Cancel"}</Button>
            <Button variant={feedback.confirmLabel?.toLowerCase().includes("delete") ? "destructive" : "default"} className="flex-1" onClick={() => close(true)}>{feedback.confirmLabel ?? "Confirm"}</Button>
          </div> : <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true"><div key={`${feedback.kind}-${feedback.title}`} className="h-full origin-left animate-[feedback-countdown_2400ms_linear_forwards] rounded-full bg-current opacity-50"/></div>}
        </div>}
      </DialogContent>
    </Dialog>
  </FeedbackContext.Provider>;
}

export function useOperationFeedback() {
  const value = useContext(FeedbackContext);
  if (!value) throw new Error("useOperationFeedback must be used inside OperationFeedbackProvider");
  return value;
}
