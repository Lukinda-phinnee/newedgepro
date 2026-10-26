import { LoopModuleProvider } from "@/components/trader-notes/loop-module";

export default function TraderNotesLayout({ children }: { children: React.ReactNode }) {
  return <LoopModuleProvider>{children}</LoopModuleProvider>;
}
