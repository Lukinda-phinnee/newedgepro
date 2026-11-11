export default function Sanctuary2Loading() {
  return (
    <div className="flex h-full w-full min-h-[500px] flex-col gap-6 animate-pulse select-none pb-12">
      <div className="h-44 w-full rounded-3xl bg-[#171A21]/60 border border-[#232733]" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-48 rounded-3xl bg-[#171A21]/40 border border-[#232733]" />
        <div className="h-48 rounded-3xl bg-[#171A21]/40 border border-[#232733]" />
        <div className="h-48 rounded-3xl bg-[#171A21]/40 border border-[#232733]" />
      </div>
      <div className="h-56 w-full rounded-3xl bg-[#171A21]/40 border border-[#232733]" />
    </div>
  );
}

