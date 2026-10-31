import {
  CalendarBlankIcon,
  CaretDownIcon,
  LightningIcon,
  StackIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import type * as React from "react";

import { Button } from "@/components/event/button";
import { DateRangePicker } from "@/components/event/date-range-picker";
import { Icon } from "@/components/event/icon";
import { Label } from "@/components/event/label";
import {
  Menu,
  MenuCheckboxItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@/components/event/menu";
import { PanelToolbar } from "@/components/event/panel";
import { Search } from "@/components/event/search";
import { cn } from "@/components/utils/cn";
import { useIsPhone } from "@/features/org/live/admin/rosters/use-is-phone";
import type { AuditResource } from "@/features/org/api/audit-queries";

import {
  DATE_PRESETS,
  dateChipLabel,
  multiChipLabel,
  presetHint,
  type AuditFilters,
  type DatePreset,
  type EventDates,
} from "./audit-filters";
import {
  ACTION_LABELS,
  DISPLAY_ACTIONS,
  RESOURCE_LABELS,
  RESOURCES,
  type AuditDisplayAction,
} from "./audit-format";

type FilterChipProps = React.ComponentProps<typeof Button> & {
  icon: PhosphorIcon;
  text: string;
  on: boolean;
};

/** A toolbar chip that opens a filter menu; icon-only at 800px and under. */
function FilterChip({ icon, text, on, className, ...props }: FilterChipProps) {
  return (
    <Button
      data-on={on || undefined}
      className={cn(
        "data-on:border-line-focus data-on:bg-surface-pressed data-popup-open:bg-surface-pressed shrink-0",
        "bp-phone:w-(--control) bp-phone:px-0",
        className,
      )}
      {...props}
    >
      <Icon icon={icon} />
      <span className="bp-phone:hidden">{text}</span>
      <Icon icon={CaretDownIcon} className="text-fg-3 bp-phone:hidden" />
    </Button>
  );
}

function toggle<T>(list: readonly T[], value: T, checked: boolean): T[] {
  return checked
    ? [...list.filter((v) => v !== value), value]
    : list.filter((v) => v !== value);
}

export type AuditFilterBarProps = {
  filters: AuditFilters;
  onFiltersChange: (next: AuditFilters) => void;
  /** The search box's text; `filters.search` follows it after a pause. */
  searchText: string;
  onSearchTextChange: (text: string) => void;
  onClear: () => void;
  event: EventDates;
  now: Date;
  /** Entry counts per action, where the stats can say. */
  actionCounts: Partial<Record<AuditDisplayAction, number>>;
};

/** The audit log's toolbar: Date, Action and Resource chips, Clear and search; a custom-range row under it. */
export function AuditFilterBar({
  filters,
  onFiltersChange,
  searchText,
  onSearchTextChange,
  onClear,
  event,
  now,
  actionCounts,
}: AuditFilterBarProps) {
  const isPhone = useIsPhone();
  const set = (patch: Partial<AuditFilters>) =>
    onFiltersChange({ ...filters, ...patch });

  const dateLabel = dateChipLabel(filters);
  const actionLabel = multiChipLabel(
    "Action",
    filters.actions.map((a) => ACTION_LABELS[a]),
  );
  const resourceLabel = multiChipLabel(
    "Resource",
    filters.resources.map((r) => RESOURCE_LABELS[r]),
  );
  const canClear =
    filters.date !== "all" ||
    filters.actions.length > 0 ||
    filters.resources.length > 0 ||
    searchText.trim() !== "";

  return (
    <>
      <PanelToolbar>
        <Menu>
          <MenuTrigger
            render={
              <FilterChip
                icon={CalendarBlankIcon}
                text={dateLabel}
                on={filters.date !== "all"}
                aria-label={`Date range: ${dateLabel}`}
              />
            }
          />
          <MenuPopup align="start" density="compact" className="w-[260px]">
            <MenuRadioGroup
              value={filters.date}
              onValueChange={(value) => set({ date: value as DatePreset })}
            >
              {DATE_PRESETS.map((preset) => (
                <MenuRadioItem
                  key={preset.id}
                  value={preset.id}
                  indicator="start"
                  closeOnClick
                  hint={presetHint(preset.id, now, event)}
                  disabled={preset.id === "event" && !event}
                >
                  {preset.label}
                </MenuRadioItem>
              ))}
            </MenuRadioGroup>
          </MenuPopup>
        </Menu>

        <Menu>
          <MenuTrigger
            render={
              <FilterChip
                icon={LightningIcon}
                text={actionLabel}
                on={filters.actions.length > 0}
                aria-label={`Action filter: ${actionLabel}`}
              />
            }
          />
          <MenuPopup align="start" density="compact" className="w-[220px]">
            {DISPLAY_ACTIONS.map((action) => (
              <MenuCheckboxItem
                key={action}
                checked={filters.actions.includes(action)}
                onCheckedChange={(checked) =>
                  set({ actions: toggle(filters.actions, action, checked) })
                }
                hint={actionCounts[action]}
              >
                {ACTION_LABELS[action]}
              </MenuCheckboxItem>
            ))}
          </MenuPopup>
        </Menu>

        <Menu>
          <MenuTrigger
            render={
              <FilterChip
                icon={StackIcon}
                text={resourceLabel}
                on={filters.resources.length > 0}
                aria-label={`Resource filter: ${resourceLabel}`}
              />
            }
          />
          <MenuPopup align="start" density="compact" className="w-[220px]">
            {RESOURCES.map((resource: AuditResource) => (
              <MenuCheckboxItem
                key={resource}
                checked={filters.resources.includes(resource)}
                onCheckedChange={(checked) =>
                  set({
                    resources: toggle(filters.resources, resource, checked),
                  })
                }
              >
                {RESOURCE_LABELS[resource]}
              </MenuCheckboxItem>
            ))}
          </MenuPopup>
        </Menu>

        {canClear && (
          <Button variant="ghost" className="shrink-0" onClick={onClear}>
            Clear
          </Button>
        )}

        <Search
          // Phones show a shorter placeholder so it isn't cut off; the
          // accessible name stays the full one.
          placeholder={isPhone ? "Search" : "Search actor, dancer, email"}
          aria-label="Search audit log by actor, dancer or email"
          value={searchText}
          onChange={(e) => onSearchTextChange(e.target.value)}
        />
      </PanelToolbar>

      {filters.date === "custom" && (
        <PanelToolbar>
          <Label className="text-fg-3 shrink-0">Custom range</Label>
          <DateRangePicker
            className="max-w-[360px] flex-1"
            value={{ start: filters.customStart, end: filters.customEnd }}
            onChange={({ start, end }) =>
              set({ customStart: start, customEnd: end })
            }
            startLabel="From date"
            endLabel="To date"
            startPlaceholder="From"
            endPlaceholder="To"
          />
        </PanelToolbar>
      )}
    </>
  );
}
