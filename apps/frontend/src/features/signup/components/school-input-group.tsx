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
import { MAX_SCHOOL_NAME_LENGTH, schemas } from "../api/schemas";

export function SchoolInputGroup() {
  const [schoolName, setSchoolName] = useState("");
  const [debounced, setDebouncedSchoolName] = useState("");
  const [typing, setTyping] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, isFetching, error } = useQuery(
    queries.schoolAvailable(debounced),
  );

  const debouncedSchoolName = debounce(
    (schoolName: string) => {
      setDebouncedSchoolName(schoolName);
      setTyping(false);
    },
    {
      wait: 500,
    },
  );

  const navigate = useNavigate();

  const slugify = (name: string) =>
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const onSubmit = () => {
    navigate({
      to: "/signup/$type",
      params: { type: "school" },
      search: { username: slugify(schoolName) },
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSchoolName(value);

    if (!value) {
      setErrorMessage(null);
      return;
    }

    const result = schemas.schoolAvailable.safeParse({ schoolName: value });
    if (!result.success) {
      setErrorMessage(
        result.error.issues.map((issue) => issue.message).join(", "),
      );
      return;
    }

    setErrorMessage(null);
    setTyping(true);
    debouncedSchoolName(value);
  };

  const checking = typing || isFetching;
  const message = errorMessage ?? error?.message;

  return (
    <InputGroup className="rounded-xl">
      <InputGroupInput
        maxLength={MAX_SCHOOL_NAME_LENGTH}
        autoComplete="off"
        spellCheck="false"
        autoCapitalize="off"
        autoCorrect="off"
        placeholder="Enter school name"
        size="sm"
        autoFocus
        value={schoolName}
        onChange={handleChange}
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
        {checking ? (
          <Spinner />
        ) : (
          <InputGroupText className="text-xs">
            {message ? (
              <span className="text-destructive">{message}</span>
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
            ) : (
              "Minimum 2 characters"
            )}
          </InputGroupText>
        )}
        <div className="ml-auto">
          <Button
            variant="default"
            size="sm"
            disabled={!schoolName || !data?.available || checking || !!message}
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
