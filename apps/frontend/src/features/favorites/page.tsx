import { TabsContent } from "@/components/ui/tabs";
import { FavoritesTable } from "./components/favorites-table";

export function FavoritesPage() {
  return (
    <TabsContent value="/resources/favorites">
      <div className="relative flex flex-col gap-2 py-4">
        <FavoritesTable />
      </div>
    </TabsContent>
  );
}
