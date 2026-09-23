import { adminQueries } from "@/features/admin/api/queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";

import { ChangeEventTierDialog } from "./components/change-event-tier-dialog";
import { PurchasesTable } from "./components/purchases-table";
import type { EventTierPurchase } from "./lib";

export function PurchasesPage() {
  const { data: purchases } = useSuspenseQuery(
    adminQueries.eventTierPurchases(),
  );
  const [changing, setChanging] = useState<EventTierPurchase | null>(null);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Purchases</h2>

      <PurchasesTable purchases={purchases ?? []} onChangeTier={setChanging} />

      <ChangeEventTierDialog
        purchase={changing}
        onOpenChange={(open) => !open && setChanging(null)}
      />
    </div>
  );
}
