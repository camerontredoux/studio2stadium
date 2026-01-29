export function SidebarWrapper({ children }: { children: React.ReactNode }) {
  return (
    <aside className="hidden lg:block w-80 shrink-0">
      <div className="sticky top-16 space-y-2 xl:space-y-4">{children}</div>
    </aside>
  );
}
