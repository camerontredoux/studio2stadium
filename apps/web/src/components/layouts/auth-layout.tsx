export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 grid grid-cols-5">
        <div className="flex flex-col items-center justify-center col-span-2">
          <h1 className="text-4xl font-bold text-center">Welcome to DanceApp</h1>
          <p className="text-gray-500">Please login to continue</p>
          {children}
        </div>
        <div className="p-4 h-screen col-span-3">
          <img src="background.jpg" alt="Auth Background" className="w-full h-full object-cover rounded-md" />
        </div>
      </main>
    </div>
  )
}
