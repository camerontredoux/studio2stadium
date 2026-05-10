export function ThemedPending() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: "var(--org-primary, #0f172a)" }}
    >
      <div className="size-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
    </div>
  );
}
