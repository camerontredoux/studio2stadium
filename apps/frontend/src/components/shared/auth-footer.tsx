export function AuthFooter() {
  return (
    <div className="text-muted-foreground flex items-center justify-center gap-2 text-xs">
      <p>Studio 2 Stadium &copy; {new Date().getFullYear()}</p>
      <span>|</span>
      <a
        href="https://marketing.studio2stadium.com/privacy"
        target="_blank"
        className="text-brand"
      >
        Privacy Policy
      </a>
    </div>
  );
}
