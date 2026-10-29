"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, AtSign, Camera, Clock3, Globe2, Mail, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfileActions } from "@/components/profile/profile-actions";
import { ThemePreference } from "@/components/profile/theme-preference";
import { CountryCodePicker } from "@/components/profile/country-code-picker";
import { useOperationFeedback } from "@/components/ui/operation-feedback";
import { useUserPreferences } from "@/components/user-preferences-provider";
import { authClient } from "@/lib/auth/client";

type ProfilePageProps = { name: string | null; email: string };
type ProfileSettings = { phoneNumber: string; phoneCountryCode: string; phoneRegion: string; timezone: string; timeFormat: "12h" | "24h"; currencyDisplay: string; theme: "light" | "dark" | "system"; avatarData: string | null };
const defaults: ProfileSettings = { phoneNumber: "", phoneCountryCode: "+1", phoneRegion: "US", timezone: "Europe/Paris", timeFormat: "24h", currencyDisplay: "", theme: "dark", avatarData: null };
const timezones = ["Europe/Paris", "Europe/London", "Europe/Berlin", "Europe/Athens", "Asia/Jerusalem", "Asia/Dubai", "Asia/Tokyo", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Australia/Sydney", "UTC"];
const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "NZD"];

function initials(name: string | null, email: string) {
  const source = name?.trim() || email.split("@")[0] || "U";
  return source.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";
}

function Detail({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Mail }) {
  return <div className="min-w-0 rounded-xl border border-border/70 bg-background/55 p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon size={14} aria-hidden="true"/><span>{label}</span></div><p className="mt-2 truncate text-sm font-medium text-foreground">{value}</p></div>;
}

export function ProfilePage({ name: initialName, email }: ProfilePageProps) {
  const router = useRouter();
  const { showFeedback } = useOperationFeedback();
  const { preferences, updatePreferences } = useUserPreferences();
  const avatarInput = useRef<HTMLInputElement>(null);
  const phoneInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName ?? "");
  const [editName, setEditName] = useState(initialName ?? "");
  const [settings, setSettings] = useState(() => ({ ...defaults, ...preferences }));
  const [draft, setDraft] = useState(() => ({ ...defaults, ...preferences }));
  const [editing, setEditing] = useState(false);
  const [focusPhone, setFocusPhone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/profile", { cache: "no-store" }).then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Couldn’t load profile settings.");
      if (alive) {
        setSettings(result);
        setDraft(result);
      }
    }).catch((cause: unknown) => {
      if (alive) showFeedback({ kind: "failure", title: "Profile settings couldn’t load", description: cause instanceof Error ? cause.message : "Please refresh and try again." });
    }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [showFeedback]);

  useEffect(() => {
    if (!editing || !focusPhone) return;
    phoneInput.current?.focus();
    setFocusPhone(false);
  }, [editing, focusPhone]);

  const saveSettings = async (changes: Partial<ProfileSettings>) => {
    const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Couldn’t save profile settings.");
    setSettings(result);
    setDraft(result);
    updatePreferences({ timezone: result.timezone, timeFormat: result.timeFormat, currencyDisplay: result.currencyDisplay, theme: result.theme });
  };

  const saveProfile = async () => {
    const nextName = editName.trim();
    if (!nextName || nextName.length > 100) { showFeedback({ kind: "failure", title: "Name is required", description: "Enter a name up to 100 characters." }); return; }
    setSaving(true);
    try {
      const { error: authError } = await authClient.updateUser({ name: nextName });
      if (authError) throw new Error(authError.message || "Couldn’t update your name.");
      setName(nextName);
      await saveSettings({ phoneNumber: draft.phoneNumber, phoneCountryCode: draft.phoneCountryCode, phoneRegion: draft.phoneRegion });
      setEditing(false); showFeedback({ kind: "success", title: "Profile saved", description: "Your profile details have been updated." }); router.refresh();
    } catch (cause) { showFeedback({ kind: "failure", title: "Profile wasn’t saved", description: cause instanceof Error ? cause.message : "Please try again." }); }
    finally { setSaving(false); }
  };

  const savePreferences = async () => {
    setSaving(true);
    try { await saveSettings({ timezone: draft.timezone, timeFormat: draft.timeFormat, currencyDisplay: draft.currencyDisplay || "" }); showFeedback({ kind: "success", title: "Preferences saved", description: "Your journal preferences have been updated." }); }
    catch (cause) { showFeedback({ kind: "failure", title: "Preferences weren’t saved", description: cause instanceof Error ? cause.message : "Please try again." }); }
    finally { setSaving(false); }
  };

  const preferencesChanged = draft.timezone !== settings.timezone || draft.timeFormat !== settings.timeFormat || draft.currencyDisplay !== settings.currencyDisplay;
  const openProfileEditor = (focusPhoneField = false) => {
    setEditName(name);
    setDraft(settings);
    setEditing(true);
    setFocusPhone(focusPhoneField);
  };

  const changeAvatar = async (file?: File) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { showFeedback({ kind: "failure", title: "Unsupported image", description: "Choose a PNG, JPEG, or WebP image." }); return; }
    if (file.size > 300_000) { showFeedback({ kind: "failure", title: "Image is too large", description: "Choose an image smaller than 300 KB." }); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      try { await saveSettings({ avatarData: String(reader.result) }); showFeedback({ kind: "success", title: "Profile photo updated", description: "Your new photo is saved." }); }
      catch (cause) { showFeedback({ kind: "failure", title: "Profile photo wasn’t saved", description: cause instanceof Error ? cause.message : "Please try again." }); }
    };
    reader.onerror = () => showFeedback({ kind: "failure", title: "Image couldn’t be read", description: "Choose another image and try again." });
    reader.readAsDataURL(file);
  };

  const displayName = name.trim() || "Your profile";
  const handle = (name.trim() || email.split("@")[0] || "trader").split(/[\s._-]+/)[0].toLowerCase();
  const updateDraft = <K extends keyof ProfileSettings>(key: K, value: ProfileSettings[K]) => setDraft((previous) => ({ ...previous, [key]: value }));

  return <main className="w-full space-y-5 p-4">
    <header className="flex flex-wrap items-end justify-between gap-4"><h1 className="text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-[2.1rem]">Profile</h1><ProfileActions/></header>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
      <div className="space-y-5">
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <div className="relative h-28 overflow-hidden rounded-t-2xl bg-[radial-gradient(ellipse_at_20%_30%,color-mix(in_oklab,var(--primary)_36%,transparent),transparent_50%),linear-gradient(115deg,color-mix(in_oklab,var(--primary)_13%,var(--card)),var(--card)_70%)] sm:h-36">
            <div className="absolute inset-0 opacity-35" aria-hidden="true" style={{ backgroundImage: "repeating-linear-gradient(132deg, transparent 0 42px, color-mix(in oklab, var(--primary) 13%, transparent) 43px 44px)" }}/>
            <span className="absolute right-5 top-4 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/65 px-2.5 py-1 text-[10px] font-medium text-muted-foreground backdrop-blur-md"><Sparkles size={12} className="text-primary"/> EdgePro account</span>
          </div>
          <CardContent className="relative px-5 pb-5 pt-0 sm:px-7 sm:pb-7">
            <div className="-mt-9 flex flex-wrap items-end justify-between gap-4 sm:-mt-11">
              <div className="flex min-w-0 items-end gap-4 sm:gap-5">
                <div className="relative">
                  {settings.avatarData ? <img src={settings.avatarData} alt={`${displayName} profile`} className="size-[76px] rounded-2xl border-4 border-card object-cover shadow-md sm:size-[92px]"/> : <div aria-label={`${displayName} avatar`} className="flex size-[76px] items-center justify-center rounded-2xl border-4 border-card bg-gradient-to-br from-violet-500 to-indigo-700 text-xl font-semibold text-white shadow-md sm:size-[92px] sm:text-2xl">{initials(name, email)}</div>}
                  <button type="button" onClick={() => avatarInput.current?.click()} aria-label="Change profile photo" className="absolute -bottom-1.5 -right-1.5 flex size-8 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm transition-transform active:scale-95"><Camera size={14}/></button>
                  <input ref={avatarInput} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => { void changeAvatar(event.target.files?.[0]); event.currentTarget.value = ""; }}/>
                </div>
                <div className="min-w-0 pb-1"><h2 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{displayName}</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><AtSign size={14}/>{handle}</p></div>
              </div>
              {!editing && <Button size="sm" variant="outline" onClick={() => openProfileEditor()}>Edit profile</Button>}
            </div>
            {editing ? <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-xs font-medium text-muted-foreground">Display name<Input className="h-9" value={editName} maxLength={100} onChange={(event) => setEditName(event.target.value)} autoComplete="name"/></label>
              <div className="space-y-2"><span className="block text-xs font-medium text-muted-foreground">Contact phone</span><div className="grid grid-cols-[minmax(160px,1fr)_minmax(0,0.8fr)] gap-2"><CountryCodePicker value={draft.phoneCountryCode} regionCode={draft.phoneRegion} onChange={(region, code) => { updateDraft("phoneRegion", region); updateDraft("phoneCountryCode", code); }}/><label className="sr-only" htmlFor="profile-phone-number">Phone number</label><Input className="h-9" ref={phoneInput} id="profile-phone-number" value={draft.phoneNumber} maxLength={32} onChange={(event) => updateDraft("phoneNumber", event.target.value)} type="tel" autoComplete="tel-national" placeholder="Phone number"/></div></div>
              <div className="flex gap-2 sm:col-span-2"><Button size="sm" onClick={saveProfile} disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button><Button size="sm" variant="outline" onClick={() => { setEditing(false); setDraft(settings); }}>Cancel</Button></div>
            </div> : <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Detail label="Email address" value={email} icon={Mail}/>
              <div className="flex min-w-0 items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.08] p-4 dark:border-amber-400/20 dark:bg-amber-400/[0.07]">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-300"><ShieldCheck size={17}/></span>
                <div className="min-w-0 flex-1"><p className="text-xs font-medium text-foreground">Contact phone</p><p className="mt-0.5 text-sm text-muted-foreground">{settings.phoneNumber ? `${settings.phoneCountryCode} ${settings.phoneNumber}` : "Not set · add a contact number"}</p></div>
                <Button size="sm" variant="ghost" className="ml-auto shrink-0 px-2 text-xs text-primary" onClick={() => openProfileEditor(true)}>{settings.phoneNumber ? "Change" : "Add phone number"}<ArrowUpRight size={14}/></Button>
              </div>
              <p className="text-xs text-muted-foreground sm:col-span-2">Email changes require a verified email flow and aren’t available in this account setup.</p>
            </div>}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0 px-5 pb-4 pt-5 sm:px-6 sm:pt-6"><div><CardTitle className="text-base font-semibold tracking-tight">Preferences</CardTitle><p className="mt-1 text-xs text-muted-foreground">Regional settings for your trading journal.</p></div><Globe2 size={18} className="text-primary" aria-hidden="true"/></CardHeader>
          <CardContent className="grid gap-3 px-5 pb-5 sm:grid-cols-2 sm:px-6 sm:pb-6">
            <label className="space-y-2 text-xs font-medium text-muted-foreground">Timezone<select value={draft.timezone} onChange={(event) => updateDraft("timezone", event.target.value)} disabled={loading} className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">{timezones.map((zone) => <option value={zone} key={zone}>{zone.replaceAll("_", " ")}</option>)}</select></label>
            <label className="space-y-2 text-xs font-medium text-muted-foreground">Time format<select value={draft.timeFormat} onChange={(event) => updateDraft("timeFormat", event.target.value as "12h" | "24h")} disabled={loading} className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="24h">24-hour</option><option value="12h">12-hour</option></select></label>
            <label className="space-y-2 text-xs font-medium text-muted-foreground">Currency display<select value={draft.currencyDisplay} onChange={(event) => updateDraft("currencyDisplay", event.target.value)} disabled={loading} className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">Not set</option>{currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}</select></label>
            <div className="flex items-end"><Button size="sm" onClick={savePreferences} disabled={saving || loading || !preferencesChanged}>{saving ? "Saving…" : "Save preferences"}</Button></div>
          </CardContent>
        </Card>
      </div>
      <aside className="space-y-5">
        <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="flex-row items-center justify-between space-y-0 px-5 pb-3 pt-5"><div><CardTitle className="text-base font-semibold tracking-tight">Appearance</CardTitle><p className="mt-1 text-xs text-muted-foreground">Choose how EdgePro looks.</p></div><Sparkles size={17} className="text-primary" aria-hidden="true"/></CardHeader><CardContent className="px-5 pb-5"><ThemePreference/></CardContent></Card>
        <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="flex-row items-center gap-3 space-y-0 px-5 pb-3 pt-5"><span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserRound size={17}/></span><div><CardTitle className="text-sm font-semibold">Account access</CardTitle><p className="mt-0.5 text-xs text-muted-foreground">Signed in with your email</p></div></CardHeader><CardContent className="px-5 pb-5"><p className="break-all text-sm text-foreground">{email}</p></CardContent></Card>
      </aside>
    </div>
  </main>;
}
