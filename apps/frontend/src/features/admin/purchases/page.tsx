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
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">Purchases</h2>
        <p className="text-sm text-muted-foreground">
          Events with no purchase keep their Event Tier on the event itself —
          change it from Organizations, on the event.
        </p>
      </div>

      <PurchasesTable purchases={purchases} onChangeTier={setChanging} />

      <ChangeEventTierDialog
        purchase={changing}
        onOpenChange={(open) => !open && setChanging(null)}
      />
    </div>
  );
}
