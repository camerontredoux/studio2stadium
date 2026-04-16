import { TabsContent } from "@/components/ui/tabs";
import { PartnerList } from "./components/partner-list";

export function PartnersPage() {
  return (
    <TabsContent value="/resources/partners">
      <div className="relative flex flex-col">
        <PartnerList />
      </div>
    </TabsContent>
  )
}
