export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="h-screen">
      <div className="flex p-4 flex-col items-center justify-center h-full w-full">
        {children}
      </div>
    </main>
  );
}
