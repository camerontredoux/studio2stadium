import { UploadSimpleIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/event/button";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/event/data-table";
import { Icon } from "@/components/event/icon";
import { Panel } from "@/components/event/panel";
import { ProgressBar } from "@/components/event/progress-bar";
import { cn } from "@/components/utils/cn";
import {
  rosterQueries,
  type RosterType,
} from "@/features/org/api/roster-queries";
import { CsvUploadDialog } from "@/features/org/components/csv-upload-dialog";
import { useAdminCommandListener } from "@/features/org/hooks/use-admin-commands";

// Main.dc.html `.rt`: one column set for the whole table. ≤1180 the Roster column narrows;
// ≤800 Activation drops and the counts split the width; ≤480 Active drops too.
const columns =
  "[--rt-cols:minmax(90px,160px)_52px_52px_60px_minmax(130px,2fr)_minmax(100px,1fr)] " +
  "bp-board:[--rt-cols:minmax(80px,120px)_52px_52px_60px_minmax(130px,2fr)_minmax(88px,1fr)] " +
  "[--rt-cols-phone:max-content_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(max-content,1fr)] " +
  "bp-small:[--rt-cols-phone:max-content_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]";

function pct(split: Pick<RosterSplit, "activated" | "total">) {
  return split.total === 0
    ? 0
    : Math.round((split.activated / split.total) * 100);
}

const ROWS: { type: RosterType; label: string; plural: string }[] = [
  { type: "dancer", label: "Dancers", plural: "dancers" },
  { type: "coach", label: "Coaches", plural: "coaches" },
];

type RosterSplit = { activated: number; pending: number; total: number };

function toSplit(
  stats: { total: number; active: number; pending: number } | undefined,
): RosterSplit {
  return {
    activated: stats?.active ?? 0,
    pending: stats?.pending ?? 0,
    total: stats?.total ?? 0,
  };
}

/**
 * The Rosters summary: Dancers, Coaches and All with total, active, pending and
 * activation, plus each roster's CSV upload. Replaces the old stat tiles and the
 * two roster preview cards.
 */
export function RostersPanel({
  orgSlug,
  eventId,
}: {
  orgSlug: string;
  eventId: string;
}) {
  // The roster stats, not /stats: CSV uploads, claim matches and roster edits invalidate these.
  const dancers = useQuery(rosterQueries.stats(orgSlug, eventId, "dancer"));
  const coaches = useQuery(rosterQueries.stats(orgSlug, eventId, "coach"));
  const isPending = dancers.isPending || coaches.isPending;
  const [upload, setUpload] = useState<RosterType | null>(null);

  // The command palette's "Upload dancers / coaches" actions.
  useAdminCommandListener(
    (action) => action.type === "open-upload",
    (action) => {
      if (action.type === "open-upload") setUpload(action.kind);
    },
  );

  const splits: Record<RosterType, RosterSplit> = {
    dancer: toSplit(dancers.data),
    coach: toSplit(coaches.data),
  };
  const all: RosterSplit = {
    activated: splits.dancer.activated + splits.coach.activated,
    pending: splits.dancer.pending + splits.coach.pending,
    total: splits.dancer.total + splits.coach.total,
  };
  const value = (n: number) => (isPending ? "—" : n.toLocaleString());

  return (
    <Panel aria-label="Rosters">
      <div className="bp-phone:overflow-x-visible overflow-x-auto">
        <DataTable
          columns="var(--rt-cols)"
          phoneColumns="var(--rt-cols-phone)"
          className={cn(columns, "bp-phone:min-w-0 min-w-[560px]")}
        >
          <DataTableHead>
            <DataTableHeaderCell>Roster</DataTableHeaderCell>
            <DataTableHeaderCell align="end">Total</DataTableHeaderCell>
            <DataTableHeaderCell align="end" className="bp-small:hidden">
              Active
            </DataTableHeaderCell>
            <DataTableHeaderCell align="end">Pending</DataTableHeaderCell>
            <DataTableHeaderCell className="bp-phone:hidden">
              Activation
            </DataTableHeaderCell>
            <span role="columnheader" aria-label="Upload" />
          </DataTableHead>
          <DataTableBody>
            {ROWS.map((row) => {
              const split = splits[row.type];
              const to =
                row.type === "dancer"
                  ? ("/o/$orgSlug/admin/dancers" as const)
                  : ("/o/$orgSlug/admin/coaches" as const);
              return (
                <DataTableRow key={row.type}>
                  <DataTableCell kind="strong">
                    <Link
                      to={to}
                      params={{ orgSlug }}
                      className="text-fg s2s-focus rounded-(--radius-4) no-underline hover:underline"
                    >
                      {row.label}
                    </Link>
                  </DataTableCell>
                  <DataTableCell kind="num">{value(split.total)}</DataTableCell>
                  <DataTableCell kind="num" className="bp-small:hidden">
                    {value(split.activated)}
                  </DataTableCell>
                  <DataTableCell kind="num">
                    {split.pending > 0 ? (
                      <Link
                        to={to}
                        params={{ orgSlug }}
                        search={{ status: "pending" }}
                        aria-label={`${split.pending} pending ${row.plural}, open roster filtered to pending`}
                        className="text-fg decoration-line-strong hover:decoration-fg-2 s2s-focus rounded-(--radius-4) underline underline-offset-3"
                      >
                        {split.pending.toLocaleString()}
                      </Link>
                    ) : (
                      <span className="text-fg-3">{value(split.pending)}</span>
                    )}
                  </DataTableCell>
                  <DataTableCell className="bp-phone:hidden">
                    <ProgressBar
                      value={pct(split)}
                      label={`${row.label} activated`}
                    />
                  </DataTableCell>
                  <DataTableCell className="flex justify-end">
                    <Button
                      onClick={() => setUpload(row.type)}
                      aria-label={`Upload ${row.plural} CSV`}
                      title="Upload CSV"
                      className="bp-small:w-(--control) bp-small:px-0"
                    >
                      <Icon icon={UploadSimpleIcon} />
                      <span className="bp-small:hidden">Upload</span>
                    </Button>
                  </DataTableCell>
                </DataTableRow>
              );
            })}
            <DataTableRow total className="min-h-10">
              <DataTableCell className="text-fg-2">All</DataTableCell>
              <DataTableCell kind="num" className="font-medium">
                {value(all.total)}
              </DataTableCell>
              <DataTableCell kind="num" className="bp-small:hidden font-medium">
                {value(all.activated)}
              </DataTableCell>
              <DataTableCell kind="num" className="font-medium">
                {value(all.pending)}
              </DataTableCell>
              <DataTableCell className="bp-phone:hidden">
                <ProgressBar value={pct(all)} label="All activated" strong />
              </DataTableCell>
              <span role="cell" />
            </DataTableRow>
          </DataTableBody>
        </DataTable>
      </div>

      {ROWS.map((row) => (
        <CsvUploadDialog
          key={row.type}
          orgSlug={orgSlug}
          eventId={eventId}
          type={row.type}
          open={upload === row.type}
          onOpenChange={(open) => setUpload(open ? row.type : null)}
        />
      ))}
    </Panel>
  );
}
