"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, ArrowDownLeft, BookOpen, BriefcaseBusiness,
  LayoutDashboard, Menu, NotebookPen, PanelLeftClose,
  PanelLeftOpen, Plus, ShieldCheck, Target, X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProfileMenu } from "@/components/dashboard/profile-menu";
import { AccountSelector } from "@/components/dashboard/account-selector";
import { cn } from "@/lib/utils";
import { NavigationPageLoading } from "@/components/dashboard/page-loading";
import { BrandMark } from "@/components/brand-mark";
import { useActiveAccount } from "@/components/active-account-context";

const navigationGroups = [
  { label: "Overview", items: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Portfolio hub", href: "/portfolio-hub", icon: BriefcaseBusiness },
  ] },
  { label: "Trading", items: [
    { label: "Trade log", href: "/trade-log", icon: ArrowDownLeft },
    { label: "Trade review", href: "/trade-review", icon: BookOpen },
    { label: "Plan", href: "/plan", icon: Target },
  ] },
  { label: "Improve", items: [
    { label: "Edge", href: "/edge", icon: Activity },
    { label: "Rule engine", href: "/rule-engine", icon: ShieldCheck },
    { label: "Trader notes", href: "/trader-notes", icon: NotebookPen },
  ] },
];

export function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string | null; email: string };
}) {
  const pathname = usePathname();
  const { activeAccount } = useActiveAccount();
  const [tradeCount, setTradeCount] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [workspaceHeaderVisible, setWorkspaceHeaderVisible] = useState(false);
  const isNotesWorkspace = pathname.startsWith("/trader-notes/workspace/");
  useEffect(() => {
    if (!activeAccount) {
      setTradeCount(null);
      return;
    }

    setTradeCount(null);
    const controller = new AbortController();
    const refreshTradeCount = async () => {
      try {
        const response = await fetch(
          `/api/trades?accountId=${encodeURIComponent(activeAccount.id)}`,
          { signal: controller.signal, cache: "no-store" },
        );
        if (!response.ok) return;
        const data: { trades?: unknown[] } = await response.json();
        setTradeCount(data.trades?.length ?? 0);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    };

    void refreshTradeCount();
    window.addEventListener("trade-log:updated", refreshTradeCount);
    return () => {
      controller.abort();
      window.removeEventListener("trade-log:updated", refreshTradeCount);
    };
  }, [activeAccount?.id, pathname]);
  useEffect(() => setPendingHref(null), [pathname]);
  useEffect(() => {
    setCollapsed(isNotesWorkspace);
    setWorkspaceHeaderVisible(false);
  }, [isNotesWorkspace, pathname]);
  useEffect(() => {
    if (!isNotesWorkspace) return;
    const updateHeaderVisibility = (event: PointerEvent) => {
      if (event.clientY <= 12) setWorkspaceHeaderVisible(true);
      else if (event.clientY > 56) setWorkspaceHeaderVisible(false);
    };
    document.addEventListener("pointermove", updateHeaderVisibility);
    return () => document.removeEventListener("pointermove", updateHeaderVisibility);
  }, [isNotesWorkspace]);
  const navigation = navigationGroups.flatMap((group) => group.items);
  const title = pathname.startsWith("/trader-notes") ? "Trader notes" : navigation.find((item) => item.href === pathname)?.label ?? ({ "/profile": "Profile", "/settings": "Settings" }[pathname] ?? "Dashboard");

  return (
    <div className="fixed inset-0 flex h-dvh min-h-0 overflow-hidden bg-background text-foreground">
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[252px] flex-col border-r border-border/70 bg-sidebar text-sidebar-foreground transition-[width,transform] duration-200 lg:static lg:h-full lg:shrink-0 lg:translate-x-0",
          collapsed && "lg:w-[76px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div
          className={cn(
            "flex h-[72px] shrink-0 items-center justify-between px-5",
            collapsed && "lg:justify-center lg:px-0",
          )}
        >
          <Link
            href="/dashboard"
            title={collapsed ? "EdgePro" : undefined}
            className={cn(
              "flex items-center gap-3",
              collapsed && "lg:justify-center",
            )}
            onClick={() => setMobileOpen(false)}
          >
            <BrandMark className="size-9 shrink-0 object-contain" priority />
            <span className={cn(collapsed && "lg:hidden")}>
              <span className="block text-[15px] font-semibold tracking-tight">
                Edge<span className="text-violet-400">Pro</span>
              </span>
              <span className="block text-[10px] tracking-[0.16em] text-sidebar-foreground/80 uppercase">
                Trading journal
              </span>
            </span>
          </Link>
          <button
            className="rounded-lg p-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={17} />
          </button>
          <button
            type="button"
            className={cn(
              "hidden rounded-lg p-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:block",
              collapsed &&
                "absolute -right-3 top-[22px] z-10 border border-border/70 bg-sidebar p-1.5",
            )}
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        <nav
          className="flex-1 space-y-5 overflow-y-auto px-3"
          aria-label="Main navigation"
        >
          {navigationGroups.map((group) => (
            <div key={group.label}>
              <p
                className={cn(
                  "mb-2 px-2 text-[10px] font-semibold tracking-[0.15em] text-sidebar-foreground/80 uppercase",
                  collapsed && "lg:sr-only",
                )}
              >
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map(({ label, href, icon: Icon }) => {
                  const active = href === "/trader-notes" ? pathname.startsWith(href) : pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={(event) => {
                        setMobileOpen(false);
                        if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && href !== pathname) {
                          setPendingHref(href);
                        }
                      }}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? label : undefined}
                      className={cn(
                        "group flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] transition-colors",
                        collapsed && "lg:justify-center lg:px-0",
                        active
                          ? "bg-violet-600 font-medium text-white shadow-sm shadow-violet-950/30"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon
                        size={16}
                        strokeWidth={active ? 2.1 : 1.8}
                        className={cn(
                          active
                            ? "text-white"
                            : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground",
                        )}
                      />
                      <span className={cn(collapsed && "lg:hidden")}>{label}</span>
                      {label === "Trade log" && !collapsed && tradeCount !== null && (
                        <span className="ml-auto rounded-md bg-sidebar-accent px-1.5 py-0.5 text-[10px] text-sidebar-accent-foreground">
                          {tradeCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto shrink-0 p-3">
          <ProfileMenu name={user.name} email={user.email} collapsed={collapsed} />
        </div>
      </aside>

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header
          className={cn(
            "flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-card px-4 backdrop-blur-xl sm:px-6",
            isNotesWorkspace
              ? cn(
                  "absolute inset-x-0 top-0 z-40 transition-transform duration-200",
                  workspaceHeaderVisible ? "translate-y-0" : "-translate-y-full pointer-events-none",
                )
              : "sticky top-0 z-30",
          )}
        >
          <div className="flex items-center gap-3">
            <button
              aria-label="Open navigation"
              className="rounded-lg p-2 text-muted-foreground hover:bg-white/5 lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={19} />
            </button>
            <div className="hidden items-center gap-2 text-xs text-muted-foreground/60 sm:flex">
              <span>Workspace</span>
              <span>/</span>
            </div>
            <h1 className="text-sm font-medium text-foreground/90">{title}</h1>
          </div>
          <div className="flex items-center gap-2.5">
            <AccountSelector />
            <ThemeToggle className="h-8 w-8 rounded-lg border-border/70 bg-white/[0.02]" />
            <Link
              href="/trade-log"
              onClick={(event) => {
                if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && pathname !== "/trade-log") {
                  setPendingHref("/trade-log");
                }
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-violet-600 px-3 text-xs font-medium text-white shadow-sm shadow-violet-950/30 transition hover:bg-violet-500"
            >
              <Plus size={14} />
              Log a trade
            </Link>
          </div>
        </header>
        <main
          suppressHydrationWarning
          className={cn(
            "min-h-0 w-full flex-1 overscroll-contain transition-all duration-200",
            pathname === "/edge" || pathname.startsWith("/trader-notes")
              ? "p-0 overflow-hidden"
              : pathname === "/profile" || pathname === "/settings"
              ? "p-0 overflow-y-auto"
              : pathname === "/dashboard" || pathname === "/portfolio-hub" || pathname === "/trade-log" || pathname === "/trade-review" || pathname === "/rule-engine"
              ? "p-4 overflow-y-auto"
              : "mx-auto max-w-[1440px] p-4 sm:p-7 lg:p-9 overflow-y-auto",
          )}
        >
          {pendingHref ? <NavigationPageLoading href={pendingHref} /> : children}
        </main>
      </div>
    </div>
  );
}

