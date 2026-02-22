import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeftIcon, ArrowRightIcon, SearchIcon } from "lucide-react";
import { useState } from "react";
import type { School } from "../types";
import { SchoolSelectRow } from "./school-select-row";

interface SchoolsStepProps {
  schools: School[];
  selectedSchools: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  onBack: () => void;
  onNext: () => void;
}

export function SchoolsStep({
  schools,
  selectedSchools,
  onSelectionChange,
  onBack,
  onNext,
}: SchoolsStepProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSchools = schools.filter(
    (school) =>
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.location.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleSchool = (id: string) => {
    const next = new Set(selectedSchools);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const selectAll = () => {
    onSelectionChange(new Set(filteredSchools.map((s) => s.id)));
  };

  const deselectAll = () => {
    onSelectionChange(new Set());
  };

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className="flex flex-col gap-4 rounded-xl border p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Select Schools</h2>
            <p className="text-muted-foreground text-sm">
              Choose which programs receive your video
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="brand">{selectedSchools.size} selected</Badge>
            <Button
              variant="ghost"
              size="xs"
              onClick={
                selectedSchools.size === filteredSchools.length
                  ? deselectAll
                  : selectAll
              }
            >
              {selectedSchools.size === filteredSchools.length
                ? "Deselect All"
                : "Select All"}
            </Button>
          </div>
        </div>

        <div className="relative">
          <InputGroup>
            <Input
              placeholder="Search schools by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            <InputGroupAddon align="inline-start">
              <SearchIcon />
            </InputGroupAddon>
          </InputGroup>
        </div>

        <ScrollArea scrollFade className="h-96">
          <div className="flex h-full flex-col gap-1.5">
            {filteredSchools.map((school) => (
              <SchoolSelectRow
                key={school.id}
                school={school}
                selected={selectedSchools.has(school.id)}
                onToggle={() => toggleSchool(school.id)}
              />
            ))}
            {filteredSchools.length === 0 && (
              <Empty className="h-full border">
                <EmptyDescription>No schools found</EmptyDescription>
              </Empty>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeftIcon /> Back
        </Button>
        <Button
          onClick={onNext}
          disabled={selectedSchools.size === 0}
          className="gap-2"
        >
          Review & Submit <ArrowRightIcon />
        </Button>
      </div>
    </div>
  );
}
