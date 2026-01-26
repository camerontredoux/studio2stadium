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
import { Spinner } from "@/components/ui/spinner";
import { debounce } from "@tanstack/pacer";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { CheckIcon, InfoIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { queries } from "../api/queries";
import { MAX_USERNAME_LENGTH } from "../schemas";

export function DancerInputGroup() {
  const [username, setUsername] = useState("");
  const [debounced, setDebouncedUsername] = useState("");
  const [typing, setTyping] = useState(false);

  const { data, isFetching, error } = useQuery(queries.available(debounced));

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
        autoCorrect="off"
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
        {checking ? (
          <Spinner />
        ) : (
          <InputGroupText className="text-xs">
            {data ? (
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
            ) : error ? (
              <span className="text-destructive">{error.message}</span>
            ) : (
              "Minimum 4 characters"
            )}
          </InputGroupText>
        )}
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
