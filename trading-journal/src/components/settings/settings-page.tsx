"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, Info, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfileActions } from "@/components/profile/profile-actions";
import { CountryCodePicker } from "@/components/profile/country-code-picker";
import { ThemePreference } from "@/components/profile/theme-preference";
import { useOperationFeedback } from "@/components/ui/operation-feedback";
import { useUserPreferences } from "@/components/user-preferences-provider";
import { authClient } from "@/lib/auth/client";
import { PreMarketRoutineSettings } from "@/components/settings/pre-market-routine-settings";
import { AboutSettings } from "@/components/settings/about-settings";

type SettingsPageProps = { name: string | null; email: string };
type AccountSettings = {
  phoneNumber: string;
  phoneCountryCode: string;
  phoneRegion: string;
  timezone: string;
  timeFormat: "12h" | "24h";
  currencyDisplay: string;
  avatarData: string | null;
};

const initialSettings: AccountSettings = {
  phoneNumber: "",
  phoneCountryCode: "+1",
  phoneRegion: "US",
  timezone: "Europe/Paris",
  timeFormat: "24h",
  currencyDisplay: "",
  avatarData: null,
};
const timezones = ["Europe/Paris", "Europe/London", "Europe/Berlin", "Europe/Athens", "Asia/Jerusalem", "Asia/Dubai", "Asia/Tokyo", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Australia/Sydney", "UTC"];
const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "NZD"];
const tabs = ["Account", "Pre-Market Routine", "Journaling", "Trading Preferences", "Notifications", "Integrations", "Data and Privacy", "Security", "Billing", "Support", "About"];

function getInitials(name: string | null, email: string) {
  return (name?.trim() || email.split("@")[0] || "U")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

export function SettingsPage({ name: initialName, email }: SettingsPageProps) {
  const router = useRouter();
  const { showFeedback } = useOperationFeedback();
  const { preferences, updatePreferences } = useUserPreferences();
  const avatarInput = useRef<HTMLInputElement>(null);
  const phoneInput = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("Account");
  const [name, setName] = useState(initialName ?? "");
  const [nameDraft, setNameDraft] = useState(initialName ?? "");
  const [settings, setSettings] = useState<AccountSettings>({ ...initialSettings, ...preferences });
  const [draft, setDraft] = useState<AccountSettings>({ ...initialSettings, ...preferences });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [focusPhone, setFocusPhone] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/profile", { cache: "no-store" }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Couldn’t load account settings.");
      if (active) {
        setSettings(data);
        setDraft(data);
      }
    }).catch((error: unknown) => {
      if (active) showFeedback({ kind: "failure", title: "Settings couldn’t load", description: error instanceof Error ? error.message : "Please refresh and try again." });
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [showFeedback]);

  useEffect(() => {
    if (editing && focusPhone) {
      phoneInput.current?.focus();
      setFocusPhone(false);
    }
  }, [editing, focusPhone]);

  const saveSettings = async (changes: Partial<AccountSettings>) => {
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Couldn’t save settings.");
    setSettings(result);
    setDraft(result);
    updatePreferences({ timezone: result.timezone, timeFormat: result.timeFormat, currencyDisplay: result.currencyDisplay, theme: result.theme });
  };

  const saveAccount = async () => {
    const nextName = nameDraft.trim();
    if (!nextName || nextName.length > 100) {
      showFeedback({ kind: "failure", title: "Name is required", description: "Enter a name up to 100 characters." });
      return;
    }
    setSaving(true);
    try {
      if (nextName !== name) {
        const { error } = await authClient.updateUser({ name: nextName });
        if (error) throw new Error(error.message || "Couldn’t update your name.");
        setName(nextName);
      }
      await saveSettings({ phoneNumber: draft.phoneNumber, phoneCountryCode: draft.phoneCountryCode, phoneRegion: draft.phoneRegion });
      setEditing(false);
      showFeedback({ kind: "success", title: "Account updated", description: "Your account details have been saved." });
      router.refresh();
    } catch (error) {
      showFeedback({ kind: "failure", title: "Account wasn’t updated", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await saveSettings({ timezone: draft.timezone, timeFormat: draft.timeFormat, currencyDisplay: draft.currencyDisplay || null });
      showFeedback({ kind: "success", title: "Preferences saved", description: "Your journal preferences have been updated." });
    } catch (error) {
      showFeedback({ kind: "failure", title: "Preferences weren’t saved", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const changeAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      showFeedback({ kind: "failure", title: "Unsupported image", description: "Choose a PNG, JPEG, or WebP image." });
      return;
    }
    if (file.size > 300_000) {
      showFeedback({ kind: "failure", title: "Image is too large", description: "Choose an image smaller than 300 KB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await saveSettings({ avatarData: String(reader.result) });
        showFeedback({ kind: "success", title: "Photo updated", description: "Your account photo has been saved." });
      } catch (error) {
        showFeedback({ kind: "failure", title: "Photo wasn’t saved", description: error instanceof Error ? error.message : "Please try again." });
      }
    };
    reader.onerror = () => showFeedback({ kind: "failure", title: "Image couldn’t be read", description: "Choose another image and try again." });
    reader.readAsDataURL(file);
  };

  const openEditor = (withPhoneFocus = false) => {
    setNameDraft(name);
    setDraft(settings);
    setEditing(true);
    setFocusPhone(withPhoneFocus);
  };
  const preferencesChanged = draft.timezone !== settings.timezone || draft.timeFormat !== settings.timeFormat || draft.currencyDisplay !== settings.currencyDisplay;
  const handle = (name.trim() || email.split("@")[0] || "trader").split(/[\s._-]+/)[0].toLowerCase();

  return <main className="w-full p-4 sm:p-5">
    <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pb-5">
      <h1 className="text-2xl font-semibold tracking-[-0.025em] text-foreground">Settings</h1>
      <p className="text-sm text-muted-foreground">Set your rules, risk limits, hours, and alerts.</p>
    </header>

    <nav aria-label="Settings sections" className="-mx-4 overflow-x-auto border-y border-border/70 px-4 sm:-mx-5 sm:px-5">
      <div role="tablist" aria-label="Settings sections" className="flex min-w-max items-center gap-1 py-1">
        {tabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} className={`relative min-h-9 whitespace-nowrap rounded-none px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeTab === tab ? "bg-primary/10 font-medium text-primary after:absolute after:-bottom-px after:left-0 after:right-0 after:h-0.5 after:bg-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}>
          {tab}{tab === "Notifications" && <span aria-label="Unread notifications" className="ml-1.5 inline-block size-2 rounded-full bg-primary align-middle"/>}
        </button>)}
      </div>
    </nav>

    {activeTab === "Pre-Market Routine" ? <PreMarketRoutineSettings/> : activeTab === "About" ? <AboutSettings/> : activeTab === "Account" ? <section role="tabpanel" aria-label="Account settings" className="pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-medium text-foreground">Account</h2>
        <div className="flex items-center gap-2"><ProfileActions/>{editing ? <><Button size="sm" onClick={saveAccount} disabled={saving}>{saving ? "Saving…" : "Save"}</Button><Button size="sm" variant="outline" onClick={() => { setEditing(false); setDraft(settings); setNameDraft(name); }}>Cancel</Button></> : <Button size="sm" variant="default" onClick={() => openEditor()}><PencilLine size={14}/>Edit</Button>}</div>
      </div>

      <div className="mt-5 grid gap-7 md:grid-cols-[156px_minmax(0,620px)]">
        <div className="flex flex-col items-start gap-3">
          <div className="relative">
            {settings.avatarData ? <img src={settings.avatarData} alt={`${name || "Account"} profile`} className="size-[116px] rounded-full border border-border object-cover"/> : <div aria-label={`${name || "Account"} avatar`} className="flex size-[116px] items-center justify-center rounded-full border border-border bg-gradient-to-br from-violet-500 to-indigo-700 text-3xl font-semibold text-white">{getInitials(name, email)}</div>}
            <button type="button" aria-label="Change profile photo" onClick={() => avatarInput.current?.click()} className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm transition-transform active:scale-95"><Camera size={14}/></button>
            <input ref={avatarInput} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={changeAvatar}/>
          </div>
          <Button size="sm" variant="ghost" onClick={() => avatarInput.current?.click()}><Camera size={14}/>Change</Button>
        </div>

        <div className="min-w-0 space-y-5">
          <div>
            {editing ? <Input aria-label="Name" className="h-9 max-w-sm text-base font-medium" value={nameDraft} maxLength={100} onChange={(event) => setNameDraft(event.target.value)} autoComplete="name"/> : <p className="text-base font-medium text-foreground">{name || "Your account"}</p>}
            <p className="mt-1 text-sm text-muted-foreground">@{handle}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Phone</p>
            {editing ? <div className="grid max-w-[620px] grid-cols-[minmax(170px,1fr)_minmax(120px,0.85fr)] gap-2 sm:grid-cols-[220px_minmax(0,1fr)]">
              <CountryCodePicker value={draft.phoneCountryCode} regionCode={draft.phoneRegion} onChange={(region, code) => setDraft((current) => ({ ...current, phoneRegion: region, phoneCountryCode: code }))}/>
              <Input ref={phoneInput} className="h-9" type="tel" autoComplete="tel-national" aria-label="Phone number" placeholder="Phone number" value={draft.phoneNumber} maxLength={32} onChange={(event) => setDraft((current) => ({ ...current, phoneNumber: event.target.value }))}/>
            </div> : <div className="flex max-w-[620px] flex-wrap items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.08] p-3.5 dark:border-amber-400/20 dark:bg-amber-400/[0.07]">
              <Info size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden="true"/>
              <div className="min-w-0 flex-1"><p className="text-sm text-foreground">{settings.phoneNumber ? `${settings.phoneCountryCode} ${settings.phoneNumber}` : "Phone number is not set. Add a contact number to your profile."}</p>{!settings.phoneNumber && <Button size="sm" variant="link" className="mt-1 h-auto px-0 py-0" onClick={() => openEditor(true)}>Add phone number</Button>}</div>
            </div>}
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="mt-1 text-sm text-foreground">{email}</p>
          </div>

          <div className="pt-2">
            <h3 className="text-sm font-medium text-foreground">Preferences</h3>
            <div className="mt-4 grid max-w-[620px] gap-x-8 gap-y-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs text-muted-foreground">Timezone<select value={draft.timezone} disabled={loading} onChange={(event) => setDraft((current) => ({ ...current, timezone: event.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">{timezones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}</select></label>
              <label className="space-y-1.5 text-xs text-muted-foreground">Time format<select value={draft.timeFormat} disabled={loading} onChange={(event) => setDraft((current) => ({ ...current, timeFormat: event.target.value as "12h" | "24h" }))} className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="24h">24h</option><option value="12h">12h</option></select></label>
              <label className="space-y-1.5 text-xs text-muted-foreground">Currency display<span className="ml-1 inline-flex align-middle" title="Choose a preferred display currency"><Info size={12}/></span><select value={draft.currencyDisplay} disabled={loading} onChange={(event) => setDraft((current) => ({ ...current, currencyDisplay: event.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">Not set</option>{currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}</select></label>
              <div className="flex items-end"><Button size="sm" disabled={saving || loading || !preferencesChanged} onClick={savePreferences}>{saving ? "Saving…" : "Save preferences"}</Button></div>
            </div>
          </div>

          <div className="pt-1"><h3 className="mb-3 text-sm font-medium text-foreground">Theme</h3><div className="max-w-[400px]"><ThemePreference/></div></div>
        </div>
      </div>
    </section> : <section role="tabpanel" aria-label={`${activeTab} settings`} className="pt-7">
      <h2 className="text-base font-medium text-foreground">{activeTab}</h2>
      <p className="mt-2 text-sm text-muted-foreground">This settings section isn’t available yet.</p>
    </section>}
  </main>;
}
