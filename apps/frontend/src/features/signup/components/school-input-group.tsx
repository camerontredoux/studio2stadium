import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { InfoIcon } from "lucide-react";

export function SchoolInputGroup() {
  return (
    <InputGroup className="rounded-xl">
      <InputGroupInput
        size="sm"
        autoComplete="off"
        autoCapitalize="off"
        placeholder="Enter school name"
        autoFocus
      />
      <InputGroupAddon align="block-start">
        <Label className="font-medium">School</Label>
        <Popover>
          <PopoverTrigger
            className="ml-auto"
            render={<Button className="-m-1" variant="ghost" size="icon-xs" />}
          >
            <InfoIcon />
          </PopoverTrigger>
          <PopoverContent side="top" tooltipStyle>
            <p>Schools will be verified by our team</p>
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
      <InputGroupAddon align="block-end" className="border-t">
        <div className="ml-auto">
          <Button variant="default" size="sm" className="-m-1">
            Next
          </Button>
        </div>
      </InputGroupAddon>
    </InputGroup>
  );
}
