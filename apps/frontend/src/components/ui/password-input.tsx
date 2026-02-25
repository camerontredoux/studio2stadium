import { EyeIcon, EyeOffIcon, LockIcon } from "lucide-react";
import { useReducer } from "react";
import type { InputProps } from "./input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./input-group";
import { Toggle } from "./toggle";

export function PasswordInput(props: Omit<InputProps, "type">) {
  const [visible, toggle] = useReducer((state) => !state, false);

  return (
    <InputGroup>
      <InputGroupAddon align="inline-start">
        <LockIcon className="size-3.5" />
      </InputGroupAddon>
      <InputGroupInput type={visible ? "text" : "password"} {...props} />
      <InputGroupAddon align="inline-end">
        <Toggle tabIndex={-1} size="xs" onClick={toggle}>
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </Toggle>
      </InputGroupAddon>
    </InputGroup>
  );
}
