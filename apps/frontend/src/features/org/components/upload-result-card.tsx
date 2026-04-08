import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type UploadResult = {
  rowsAdded: number;
  rowsUpdated: number;
  rowsErrored: number;
  errors: Array<{ row: number; reason: string }>;
};

function downloadErroredRows(errors: Array<{ row: number; reason: string }>) {
  const csv = ["row,reason", ...errors.map((e) => `${e.row},"${e.reason}"`)].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "errored-rows.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function UploadResultCard({ result }: { result: UploadResult }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload result</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-2xl font-bold tabular-nums">{result.rowsAdded}</div>
            <div className="text-muted-foreground">Added</div>
          </div>
          <div>
            <div className="text-2xl font-bold tabular-nums">{result.rowsUpdated}</div>
            <div className="text-muted-foreground">Updated</div>
          </div>
          <div>
            <div className="text-2xl font-bold tabular-nums">{result.rowsErrored}</div>
            <div className="text-muted-foreground">Errored</div>
          </div>
        </div>
        {result.errors.length > 0 && (
          <div className="space-y-2">
            <details className="text-sm">
              <summary className="cursor-pointer font-medium">
                {result.errors.length} error{result.errors.length !== 1 ? "s" : ""}
              </summary>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {result.errors.map((e, i) => (
                  <li key={i}>
                    Row {e.row}: {e.reason}
                  </li>
                ))}
              </ul>
            </details>
            <Button variant="outline" size="sm" onClick={() => downloadErroredRows(result.errors)}>
              Download errored rows
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
