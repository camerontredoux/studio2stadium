import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Radio, RadioGroup } from "@/components/ui/radio-group";
import type { AccountType } from "@/lib/access";
import { Link, useNavigate } from "@tanstack/react-router";
import { CheckIcon, InfoIcon, XIcon } from "lucide-react";
import { useReducer, useState } from "react";

export function ChooseType() {
  const [accountType, setAccountType] = useState<AccountType>("dancer");

  return (
    <RadioGroup value={accountType} onValueChange={setAccountType}>
      {accountType === "dancer" && <DancerInputGroup />}
      {accountType !== "dancer" && (
        <RadioItem
          value="dancer"
          title="Dancer"
          description="Create a dancer account"
        />
      )}
      {accountType === "school" && <SchoolInputGroup />}
      {accountType !== "school" && (
        <RadioItem
          value="school"
          title="School"
          description="Create a school account"
        />
      )}

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Button
          type="button"
          variant="link"
          className="p-0 text-sm font-medium text-brand"
          render={<Link to="/login" />}
        >
          Login
        </Button>
      </p>
    </RadioGroup>
  );
}

function RadioItem({
  value,
  title,
  description,
}: {
  value: string;
  title: string;
  description: string;
}) {
  return (
    <Label className="flex items-start gap-2 rounded-lg border p-3 hover:bg-accent/50 has-data-checked:border-primary/48 has-data-checked:bg-accent/50">
      <Radio value={value} />
      <div className="flex flex-col gap-1">
        <p>{title}</p>
        <p className="text-muted-foreground font-light text-xs">
          {description}
        </p>
      </div>
    </Label>
  );
}

function DancerInputGroup() {
  const [taken, toggleTaken] = useReducer((state) => !state, false);
  const [username, setUsername] = useState("");

  const navigate = useNavigate();

  const onSubmit = () => {
    navigate({
      to: "/signup/$type",
      params: { type: "dancer" },
      search: { username },
    });
  };

  return (
    <InputGroup>
      <InputGroupInput
        autoComplete="off"
        autoCapitalize="off"
        placeholder="Enter username"
        size="sm"
        autoFocus
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <InputGroupAddon align="block-start" className="border-b">
        <Label className="font-medium">Dancer</Label>
        <Popover>
          <PopoverTrigger
            className="ml-auto"
            render={<Button className="-m-1" variant="ghost" size="icon-xs" />}
          >
            <InfoIcon />
          </PopoverTrigger>
          <PopoverContent side="top" tooltipStyle>
            <p>Username must be unique</p>
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
      <InputGroupAddon align="block-end">
        <InputGroupText className="text-xs">
          {taken ? (
            <div className="flex items-center gap-2 text-red-600">
              <XIcon className="size-3" />
              Taken
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckIcon className="size-3" />
              Available
            </div>
          )}
        </InputGroupText>
        <Button
          variant="default"
          size="sm"
          disabled={!username}
          className="ml-auto"
          onClick={onSubmit}
        >
          Next
        </Button>
      </InputGroupAddon>
    </InputGroup>
  );
}

function SchoolInputGroup() {
  return (
    <InputGroup>
      <InputGroupInput
        size="sm"
        autoComplete="off"
        autoCapitalize="off"
        placeholder="Enter school name"
        autoFocus
      />
      <InputGroupAddon align="block-start" className="border-b">
        <Label className="font-medium">School</Label>
        <Popover>
          <PopoverTrigger
            className="ml-auto"
            render={<Button className="-m-1" variant="ghost" size="icon-xs" />}
          >
            <InfoIcon />
          </PopoverTrigger>
          <PopoverContent side="top" tooltipStyle>
            <p>Schools will be verified by the admin</p>
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
      <InputGroupAddon align="block-end">
        <Button variant="default" size="sm" className="ml-auto">
          Next
        </Button>
      </InputGroupAddon>
    </InputGroup>
  );
}
