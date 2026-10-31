import { format, parseISO } from "date-fns";

import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@/components/event/menu";
import { ShellSidebarBrand } from "@/components/event/shell";
import type { MyRoster } from "@/features/org/context/org-context";
import { useOrg } from "@/features/org/context/use-org";
import { monogram } from "@/features/org/live/shared/monogram";

/**
 * For a dancer on several Org Events' rosters: the sidebar brand opening an
 * "Events" menu to pick which event the dashboard shows.
 */
export function DancerEventSwitcher({
  rosters,
  value,
  onValueChange,
}: {
  rosters: MyRoster[];
  value: string;
  onValueChange: (eventId: string) => void;
}) {
  const { org } = useOrg();
  return (
    <Menu>
      <MenuTrigger
        render={
          <ShellSidebarBrand
            mark={monogram(org.name)}
            name={org.name}
            aria-label={`${org.name}: switch event`}
          />
        }
      />
      <MenuPopup align="start" className="w-[300px] max-w-[calc(100vw-16px)]">
        <MenuGroup>
          <MenuGroupLabel>Events</MenuGroupLabel>
          <MenuRadioGroup
            value={value}
            onValueChange={(eventId: string) => {
              if (eventId) onValueChange(eventId);
            }}
          >
            {rosters.map((roster) => (
              <MenuRadioItem
                key={roster.eventId}
                value={roster.eventId}
                indicator="start"
                hint={format(parseISO(roster.eventStartDate), "MM/dd/yy")}
              >
                {roster.eventName}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuGroup>
      </MenuPopup>
    </Menu>
  );
}
