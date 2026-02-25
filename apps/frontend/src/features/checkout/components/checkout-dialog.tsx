import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useCheckout } from "../api/mutations";

const stripe = loadStripe(import.meta.env.VITE_STRIPE_KEY);

export function CheckoutDialog({
  billingCycle,
}: {
  billingCycle: "monthly" | "yearly" | null;
}) {
  const { mutate, isPending, data } = useCheckout();

  const handleCheckout = () => {
    if (!billingCycle) {
      return;
    }

    mutate({
      body: {
        type: billingCycle,
      },
    });
  };

  return (
    <Dialog>
      <DialogTrigger
        disabled={!billingCycle}
        render={
          <Button size="lg" disabled={isPending} onClick={handleCheckout} />
        }
      >
        {isPending ? <Spinner label="Checking out..." /> : "Checkout"}
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="overflow-clip">
        {data ? (
          <div className="overflow-auto bg-white py-2">
            <EmbeddedCheckoutProvider
              stripe={stripe}
              options={{ clientSecret: data?.clientSecret }}
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
