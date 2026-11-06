export default function SanctuaryLoading() {
  return (
    <div className="w-full h-full space-y-6 animate-pulse p-2">
      <div className="h-10 w-72 rounded-full bg-muted/60" />
      <div className="h-72 w-full rounded-3xl bg-muted/50" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-44 rounded-2xl bg-muted/40" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-44 rounded-3xl bg-muted/40" />
        <div className="h-44 rounded-3xl bg-muted/40" />
      </div>
    </div>
  );
}

