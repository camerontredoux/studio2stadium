import type { ErrorComponentProps } from "@tanstack/react-router";
import { AppLayout } from "./app-layout";

export function ErrorComponent({ error }: ErrorComponentProps) {
  return (
    <AppLayout>
      <div>Error: {error.message}</div>
    </AppLayout>
  );
}
