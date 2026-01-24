import { Button } from "@/components/ui/button";

export function SignupFooter() {
  return (
    <div className="animate-fade-in-up animate-delay-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
      Studio 2 Stadium &copy; {new Date().getFullYear()}
      <span>|</span>
      <Button variant="link" className="p-0 text-xs!">
        Privacy Policy
      </Button>
    </div>
  );
}
