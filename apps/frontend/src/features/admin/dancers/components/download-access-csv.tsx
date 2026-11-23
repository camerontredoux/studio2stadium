import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { DownloadIcon } from "lucide-react";
import { useState } from "react";
import { downloadDancerAccessCsv } from "../../api/export-dancer-access";

/**
 * Every Dancer account with its login, display and billing emails and its
 * current access as the live app resolves it, for reconciling an email
 * audience.
 */
export function DownloadAccessCsvButton() {
  const [pending, setPending] = useState(false);

  const download = async () => {
    setPending(true);
    try {
      const { rowCount, failedLookups } = await downloadDancerAccessCsv();
      const rows =
        rowCount === null ? "" : `${rowCount.toLocaleString()} dancers. `;

      if (failedLookups) {
        toastManager.add({
          title: "Access CSV downloaded with unknown rows",
          description: `${rows}${failedLookups.toLocaleString()} access lookups failed and are marked "unknown", not free. Download again before using the file.`,
          type: "warning",
        });
      } else {
        toastManager.add({
          title: "Access CSV downloaded",
          description: `${rows}Access is as of the snapshot_at time in the file.`,
          type: "success",
        });
      }
    } catch (error) {
      toastManager.add({
        title: "Could not export access CSV",
        description: error instanceof Error ? error.message : undefined,
        type: "error",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => void download()}
    >
      {pending ? (
        <Spinner label="Exporting..." />
      ) : (
        <>
          <DownloadIcon /> Download access CSV
        </>
      )}
    </Button>
  );
}
