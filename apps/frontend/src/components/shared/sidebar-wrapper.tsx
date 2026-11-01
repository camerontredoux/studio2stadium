export function SidebarWrapper({ children }: { children: React.ReactNode }) {
  return (
    <aside className="hidden w-80 shrink-0 lg:block">
      {/*
        Bound the sticky panel to the viewport and give it its own scroll, so
        the sidebar scrolls independently of the center feed instead of only
        revealing its overflow once the main column has scrolled. top-16 (4rem)
        clears the fixed top bar; the max-height leaves a small gap at the
        bottom.
      */}
      <div className="sticky top-16 max-h-[calc(100svh-5rem)] space-y-2 overflow-y-auto overscroll-contain xl:space-y-4">
        {children}
      </div>
    </aside>
  );
}
