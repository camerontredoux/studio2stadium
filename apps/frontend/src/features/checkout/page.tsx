import { Checkout } from "./components/checkout";

export function CheckoutPage() {
  return (
    <div className="mobile:pb-14 flex flex-col gap-3 lg:gap-4">
      <Checkout />
    </div>
  );
}
