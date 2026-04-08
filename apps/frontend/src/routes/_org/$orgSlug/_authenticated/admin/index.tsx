import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { adminQueries, type OrgEvent } from "@/features/org/api/admin-queries";
import { client } from "@/lib/api/client";
import { StatCard } from "@/features/org/components/stat-card";
import { CsvUploader } from "@/features/org/components/csv-uploader";
import { UploadResultCard } from "@/features/org/components/upload-result-card";
import { useState } from "react";

export const Route = createFileRoute("/_org/$orgSlug/_authenticated/admin/")({
  component: AdminHome,
});

type UploadResult = {
  rowsAdded: number;
  rowsUpdated: number;
  rowsErrored: number;
  errors: Array<{ row: number; reason: string }>;
};

function AdminDashboard({ orgSlug, activeEvent }: { orgSlug: string; activeEvent: OrgEvent }) {
  const [lastUpload, setLastUpload] = useState<UploadResult | null>(null);
  const qc = useQueryClient();
  const { data: stats } = useSuspenseQuery(adminQueries.stats(orgSlug, activeEvent.id));

  const rawClient = client as unknown as {
    POST: (path: string, opts: { body: FormData }) => Promise<{ data: UploadResult }>;
  };

  const uploadDancers = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await rawClient.POST(
        `/orgs/${orgSlug}/events/${activeEvent.id}/upload/dancers`,
        { body: form },
      );
      return res.data;
    },
    onSuccess: (data) => {
      setLastUpload(data);
      qc.invalidateQueries(adminQueries.stats(orgSlug, activeEvent.id));
    },
  });

  const uploadCoaches = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await rawClient.POST(
        `/orgs/${orgSlug}/events/${activeEvent.id}/upload/coaches`,
        { body: form },
      );
      return res.data;
    },
    onSuccess: (data) => {
      setLastUpload(data);
      qc.invalidateQueries(adminQueries.stats(orgSlug, activeEvent.id));
    },
  });

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6" style={{ color: "white" }}>
      <h1 className="text-3xl font-bold">{activeEvent.name}</h1>
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Coaches" value={stats.coaches} />
        <StatCard label="Dancers" value={stats.dancers} />
        <StatCard label="Registered" value={stats.registered} />
        <StatCard label="Pending" value={stats.pending} />
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <CsvUploader
          title="Upload dancer roster"
          description="CSV with email, firstName, lastName, bibNumber"
          isPending={uploadDancers.isPending}
          onUpload={(file) => uploadDancers.mutate(file)}
        />
        <CsvUploader
          title="Upload coach roster"
          description="CSV with email, firstName, lastName, organization"
          isPending={uploadCoaches.isPending}
          onUpload={(file) => uploadCoaches.mutate(file)}
        />
      </section>
      {lastUpload && <UploadResultCard result={lastUpload} />}
    </main>
  );
}

function AdminHome() {
  const { orgSlug } = Route.useParams();
  const { data: events } = useSuspenseQuery(adminQueries.events(orgSlug));
  const activeEvent = events?.find((e) => e.isActive);

  if (!activeEvent) {
    return (
      <div className="mx-auto max-w-md p-12 text-center" style={{ color: "white" }}>
        <h1 className="text-2xl font-semibold">No active event</h1>
        <p className="mt-2 opacity-70">Create an event to get started.</p>
      </div>
    );
  }

  return <AdminDashboard orgSlug={orgSlug} activeEvent={activeEvent} />;
}
