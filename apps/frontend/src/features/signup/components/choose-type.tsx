import { Button } from "@/components/ui/button";
import { Frame } from "@/components/ui/frame";
import { RadioGroup } from "@/components/ui/radio-group";
import type { AccountType } from "@/lib/access";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { AccountTypeItem } from "./account-type-item";
import { DancerInputGroup } from "./dancer-input-group";
import { SchoolInputGroup } from "./school-input-group";

export function ChooseType() {
  const [accountType, setAccountType] = useState<AccountType>("dancer");

  return (
    <RadioGroup value={accountType} onValueChange={setAccountType}>
      <Frame className="gap-2">
        {accountType === "dancer" && <DancerInputGroup />}
        {accountType !== "dancer" && (
          <AccountTypeItem
            value="dancer"
            title="Dancer"
            description="Create a dancer account"
          />
        )}
        {accountType === "school" && <SchoolInputGroup />}
        {accountType !== "school" && (
          <AccountTypeItem
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
