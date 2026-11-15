import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { toastApiError } from "@/lib/api/errors";
import type { PaidPlan } from "@/lib/plans";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";
import { useCheckout } from "../api/mutations";

const stripe = loadStripe(import.meta.env.VITE_STRIPE_KEY);

export function CheckoutDialog({
  plan,
  label,
}: {
  plan: PaidPlan;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending, data, reset } = useCheckout();

  const handleCheckout = () => {
    setOpen(true);
    mutate(
      { body: { plan } },
      {
        // Close the dialog rather than leave it spinning, and say why.
        onError: (error) => {
          setOpen(false);
          toastApiError(error);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // A Checkout Session is single-use; start a fresh one next time.
        if (!next) reset();
      }}
    >
      <Button size="lg" disabled={isPending} onClick={handleCheckout}>
        {isPending ? <Spinner label="Checking out..." /> : label}
      </Button>
      <DialogContent showCloseButton={false} className="overflow-clip">
        {data ? (
          <div className="overflow-auto bg-white py-2">
            <EmbeddedCheckoutProvider
              stripe={stripe}
              options={{ clientSecret: data.clientSecret }}
            >
              <EmbeddedCheckout className="w-full" />
            </EmbeddedCheckoutProvider>
          </div>
        ) : (
          <div className="flex h-96 w-full items-center justify-center">
            <Spinner label="Loading..." />
          </div>
        )}
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
