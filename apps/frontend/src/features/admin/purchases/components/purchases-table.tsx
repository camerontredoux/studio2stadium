import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Frame } from "@/components/ui/frame";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { eventTierLabel } from "@/lib/event-tiers";
import { Link } from "@tanstack/react-router";
import { SearchIcon } from "lucide-react";
import { useState } from "react";

import {
  describeTierChange,
  formatPurchaseAmount,
  formatPurchaseDate,
  matchesPurchaseSearch,
  personName,
  purchaseStatus,
  type EventTierPurchase,
} from "../lib";

interface PurchasesTableProps {
  purchases: EventTierPurchase[];
  onChangeTier: (purchase: EventTierPurchase) => void;
}

const COLUMN_COUNT = 7;

export function PurchasesTable({
  purchases,
  onChangeTier,
}: PurchasesTableProps) {
  const [search, setSearch] = useState("");
  const filtered = purchases.filter((p) => matchesPurchaseSearch(p, search));

  return (
    <div className="space-y-4">
      <InputGroup className="sm:max-w-sm">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search buyer, organization, or event..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </InputGroup>

      <Frame>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Buyer</TableHead>
              <TableHead>Org Event</TableHead>
              <TableHead>Event Tier</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="hidden sm:table-cell">Purchased</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMN_COUNT}
                  className="text-muted-foreground text-center"
                >
                  {search
                    ? "No purchases match your search"
                    : "No purchases yet"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((purchase) => (
                <PurchaseRow
                  key={purchase.id}
                  purchase={purchase}
                  onChangeTier={onChangeTier}
                />
              ))
            )}
          </TableBody>
        </Table>
      </Frame>
    </div>
  );
}

function PurchaseRow({
  purchase,
  onChangeTier,
}: {
  purchase: EventTierPurchase;
  onChangeTier: (purchase: EventTierPurchase) => void;
}) {
  const status = purchaseStatus(purchase);
  const tierChange = describeTierChange(purchase.lastEventTierChange);
  const tierMoved = purchase.event.eventTier !== purchase.eventTier;

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{personName(purchase.buyer)}</div>
        <div className="text-muted-foreground text-xs">
          {purchase.buyer.email}
        </div>
      </TableCell>
      <TableCell>
        <Link
          to="/o/$orgSlug/admin"
          params={{ orgSlug: purchase.org.slug }}
          className="font-medium hover:underline"
        >
          {purchase.event.name}
        </Link>
        <div className="text-muted-foreground text-xs">{purchase.org.name}</div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" title="Event Tier bought">
            {eventTierLabel(purchase.eventTier)}
          </Badge>
          {tierMoved && (
            <Badge variant="info" title="Event Tier now">
              Now {eventTierLabel(purchase.event.eventTier)}
            </Badge>
          )}
        </div>
        {tierChange && (
          <div className="text-muted-foreground mt-1 text-xs">{tierChange}</div>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatPurchaseAmount(purchase.amountTotal, purchase.currency)}
      </TableCell>
      <TableCell className="hidden whitespace-nowrap sm:table-cell">
        {formatPurchaseDate(purchase.createdAt)}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Badge variant={status.variant}>{status.label}</Badge>
      </TableCell>
      <TableCell>
        <Button
          size="xs"
          variant="outline"
          onClick={() => onChangeTier(purchase)}
        >
          Change tier
        </Button>
      </TableCell>
    </TableRow>
  );
}
