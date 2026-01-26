import { Button } from "@/components/ui/button";
import { Frame, FramePanel } from "@/components/ui/frame";
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
import { Spinner } from "@/components/ui/spinner";
import type { AccountType } from "@/lib/access";
import { debounce } from "@tanstack/pacer";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { CheckIcon, InfoIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { queries } from "../api/queries";
import { MAX_USERNAME_LENGTH } from "../schemas";

export function ChooseType() {
  const [accountType, setAccountType] = useState<AccountType>("dancer");

  return (
    <RadioGroup value={accountType} onValueChange={setAccountType}>
      <Frame className="gap-2">
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
      </Frame>
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
    <FramePanel className="p-0!">
      <Label className="flex items-start gap-2 hover:bg-accent/50 p-3">
        <Radio value={value} />
        <div className="flex flex-col gap-1">
          <p>{title}</p>
          <p className="text-muted-foreground font-light text-xs">
            {description}
          </p>
        </div>
      </Label>
    </FramePanel>
  );
}

function DancerInputGroup() {
  const [username, setUsername] = useState("");
  const [debounced, setDebouncedUsername] = useState("");
  const [typing, setTyping] = useState(false);

  const { data, isFetching } = useQuery(queries.available(debounced));

  const debouncedUsername = debounce(
    (username: string) => {
      setDebouncedUsername(username);
      setTyping(false);
    },
    {
      wait: 500,
    },
  );

  const navigate = useNavigate();

  const onSubmit = () => {
    navigate({
      to: "/signup/$type",
      params: { type: "dancer" },
      search: { username },
    });
  };

  const checking = typing || isFetching;

  return (
    <InputGroup className="rounded-xl">
      <InputGroupInput
        maxLength={MAX_USERNAME_LENGTH}
        autoComplete="off"
        spellCheck="false"
        autoCapitalize="off"
        placeholder="Enter username"
        size="sm"
        autoFocus
        value={username}
        onChange={(e) => {
          const value = e.target.value;
          setTyping(true);
          setUsername(value);
          debouncedUsername(value);
        }}
      />
      <InputGroupAddon align="block-start">
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
      <InputGroupAddon align="block-end" className="border-t">
        <InputGroupText className="text-xs">
          {checking ? (
            <Spinner />
          ) : data ? (
            data.available ? (
              <div className="flex items-center gap-2 text-green-600">
                Available
                <CheckIcon className="size-3" />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                Taken
                <XIcon className="size-3" />
              </div>
            )
          ) : null}
        </InputGroupText>
        <div className="ml-auto">
          <Button
            variant="default"
            size="sm"
            disabled={!username || !data?.available || checking}
            className="-m-1"
            onClick={onSubmit}
          >
            Next
          </Button>
        </div>
      </InputGroupAddon>
    </InputGroup>
  );
}

function SchoolInputGroup() {
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
