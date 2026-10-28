"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "@base-ui/react/menu";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

type ProfileMenuProps = {
  name: string | null;
  email: string;
  collapsed: boolean;
};

export function ProfileMenu({ name, email, collapsed }: ProfileMenuProps) {
  const router = useRouter();
  const [signOutError, setSignOutError] = useState(false);
  const initials = (name || email)
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const handleSignOut = async () => {
    setSignOutError(false);
    try {
      const { error } = await authClient.signOut();
      if (error) {
        setSignOutError(true);
        return;
      }
      router.replace("/sign-in");
      router.refresh();
    } catch {
      setSignOutError(true);
    }
  };

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Open profile menu"
        title={collapsed ? name || email : undefined}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg p-2 text-left outline-none transition-colors hover:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-violet-500",
          collapsed && "lg:justify-center",
        )}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 text-[11px] font-semibold text-white">
          {initials || "U"}
        </span>
        <span className={cn("min-w-0 flex-1", collapsed && "lg:hidden")}>
          <span className="block truncate text-xs font-medium text-sidebar-foreground">{name || "My account"}</span>
          <span className="block truncate text-[10px] text-sidebar-foreground/80">{email}</span>
        </span>
        <ChevronDown size={14} className={cn("shrink-0 text-sidebar-foreground", collapsed && "lg:hidden")} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="top" align="start" sideOffset={8} className="z-[60] outline-none">
          <Menu.Popup className="w-[252px] origin-[var(--transform-origin)] rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl shadow-black/30 outline-none transition-[transform,scale,opacity] duration-150 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0">
            <div className="flex items-center gap-3 px-2.5 py-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 text-xs font-semibold text-white">{initials || "U"}</span>
              <span className="min-w-0"><span className="block truncate text-xs font-medium">{name || "My account"}</span><span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{email}</span></span>
            </div>
            <Menu.Separator className="my-1 h-px bg-border" />
            <Menu.LinkItem href="/profile" closeOnClick className="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-xs text-foreground/80 outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent data-[highlighted]:bg-accent">
              <UserRound size={15} className="text-muted-foreground" />Profile
            </Menu.LinkItem>
            <Menu.LinkItem href="/settings" closeOnClick className="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-xs text-foreground/80 outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent data-[highlighted]:bg-accent">
              <Settings size={15} className="text-muted-foreground" />Settings
            </Menu.LinkItem>
            <Menu.Separator className="my-1 h-px bg-border" />
            <Menu.Item onClick={handleSignOut} className="flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-xs font-medium text-rose-400 outline-none transition-colors hover:bg-rose-500/10 hover:text-rose-300 focus-visible:bg-rose-500/10 data-[highlighted]:bg-rose-500/10">
              <LogOut size={15} />Sign out
            </Menu.Item>
            {signOutError && <p role="alert" className="px-2.5 pb-2 pt-1 text-[11px] text-destructive">Couldn’t sign out. Please try again.</p>}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
