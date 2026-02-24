import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CalendarIcon, CreditCardIcon } from "lucide-react";
import { useManage } from "../../api/mutations";

export function Subscribed() {
  const { mutateAsync, isPending } = useManage();

  const handleManage = async () => {
    await mutateAsync({}).then((data) => (window.location.href = data.url));
  };

  return (
    <div className="flex flex-col gap-6 px-2">
      <div className="relative overflow-hidden rounded-2xl">
        <div
          className="absolute inset-0 bg-cover bg-right"
          style={{
            backgroundImage: `url('https://marketing.studio2stadium.com/_astro/partners.DL9k8Vh1_1wBFw5.webp')`,
          }}
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/60 to-black/50 max-sm:backdrop-blur-sm" />

        <div className="relative flex flex-col gap-4 p-6 text-white sm:p-8 lg:p-10">
          <Badge variant="brand" className="w-fit">
            Active Member
          </Badge>

          <div className="max-w-lg">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Studio2Stadium Premium
            </h1>
            <p className="mt-2 text-sm text-white/80 sm:text-base">
              You have full access to all premium features, exclusive content,
              and priority support. Keep dancing and reaching for the stars!
            </p>
          </div>

          <div className="mt-2 flex items-center gap-2 text-sm text-white/70">
            <CalendarIcon className="text-brand size-4" />
            <span>Renews on March 15, 2026</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Manage Subscription</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Update payment method, view billing history, or cancel your
              subscription.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManage}
            disabled={isPending}
          >
            {isPending ? <Spinner /> : <CreditCardIcon />} Billing
          </Button>
        </div>
      </div>
    </div>
  );
}
