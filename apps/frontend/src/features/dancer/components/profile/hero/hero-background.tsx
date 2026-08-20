export function HeroBackground() {
  return (
    <div className="relative isolate transform-gpu overflow-clip sm:border-b">
      <img
        src="https://studio2stadium.com/img/home-sm.png?type=feed"
        alt="Hero background"
        className="hidden h-32 w-full scale-105 rounded-2xl object-cover blur-sm sm:block sm:h-48"
      />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/70 via-black/20 to-transparent" />
    </div>
  );
}
