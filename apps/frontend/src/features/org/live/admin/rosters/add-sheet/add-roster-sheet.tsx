import { LinkSimpleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import type * as React from "react";

import { Button } from "@/components/event/button";
import { Icon } from "@/components/event/icon";
import { Select } from "@/components/event/select";
import { toastManager } from "@/components/ui/toast-manager";
import {
  type RosterType,
  useCreateRoster,
} from "@/features/org/api/roster-queries";
import { BusyLabel } from "@/features/org/live/shared/busy-label";
import { ConfirmDialog } from "@/features/org/live/shared/confirm-dialog";
import {
  DetailSheet,
  DetailSheetFooter,
  DetailSheetForm,
  DetailSheetHeader,
  DetailSheetPrimary,
  DetailSheetSection,
} from "@/features/org/live/shared/detail-sheet";
import {
  SheetField,
  SheetFieldFrame,
} from "@/features/org/live/shared/sheet-field";

import type { AccountResult } from "../account-search";
import {
  type AddRosterErrors,
  type AddRosterField,
  type AddRosterValues,
  addRosterFields,
  buildAddRosterBody,
  EMPTY_ADD_VALUES,
  mapAddRosterError,
  validateAddRoster,
} from "./add-roster-model";
import { LinkAccountDialog } from "./link-account-dialog";

interface AddRosterSheetProps {
  type: RosterType;
  orgSlug: string;
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  freeTierEnabled?: boolean;
}

const FORM_ID = "add-roster-form";

const PAID_OPTIONS = [
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
];

/**
 * "Add" on the Dancers and Coaches pages: the fields a CSV row needs for this
 * type, and an optional existing account to link. Mount it fresh for each
 * open; it starts empty.
 */
export function AddRosterSheet({
  type,
  orgSlug,
  eventId,
  open,
  onOpenChange,
  freeTierEnabled = false,
}: AddRosterSheetProps) {
  const isDancer = type === "dancer";
  const createMutation = useCreateRoster();

  const [values, setValues] = useState<AddRosterValues>(EMPTY_ADD_VALUES);
  const [errors, setErrors] = useState<AddRosterErrors>({});
  const [account, setAccount] = useState<AccountResult | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const fields = addRosterFields(type, {
    freeTier: isDancer && freeTierEnabled,
    linked: account !== null,
  });
  const dirty =
    account !== null ||
    Object.values(values).some((value) => value.trim() !== "");

  const setField = (name: AddRosterField) => (value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  const field = (name: AddRosterField) => ({
    value: values[name],
    onValueChange: setField(name),
    error: errors[name],
    name,
  });

  const requestClose = () => {
    if (dirty && !createMutation.isPending) setDiscardOpen(true);
    else onOpenChange(false);
  };

  const handlePick = (picked: AccountResult) => {
    setAccount(picked);
    // Start from the account's name; the admin can still change it.
    setValues((prev) => ({
      ...prev,
      firstName: prev.firstName.trim()
        ? prev.firstName
        : (picked.firstName ?? ""),
      lastName: prev.lastName.trim() ? prev.lastName : (picked.lastName ?? ""),
    }));
    setErrors((prev) => ({
      ...prev,
      email: undefined,
      firstName: picked.firstName ? undefined : prev.firstName,
      lastName: picked.lastName ? undefined : prev.lastName,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (createMutation.isPending) return;
    const invalid = validateAddRoster(values, fields);
    if (Object.keys(invalid).length > 0) {
      setErrors(invalid);
      return;
    }
    try {
      const created = await createMutation.mutateAsync({
        params: { path: { slug: orgSlug, id: eventId } },
        body: buildAddRosterBody(type, values, fields, account),
      });
      const name = `${created.firstName} ${created.lastName}`.trim();
      toastManager.add({
        title: `${name} added`,
        description: created.isRegistered
          ? "Linked to their account."
          : `Invite sent to ${created.email}.`,
        type: "success",
      });
      onOpenChange(false);
    } catch (err) {
      const { fieldErrors, message } = mapAddRosterError(err, account !== null);
      setErrors(fieldErrors);
      toastManager.add({
        title: `Couldn't add this ${type}`,
        description: message,
        type: "error",
      });
    }
  };

  return (
    <DetailSheet
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : requestClose())}
      data-testid="add-roster-sheet"
    >
      <DetailSheetHeader
        title={isDancer ? "Add dancer" : "Add coach"}
        onClose={requestClose}
      />

      <DetailSheetForm id={FORM_ID} onSubmit={handleSubmit}>
        {/* Account: the same row as the roster detail sheet. */}
        <div
          data-testid="roster-account"
          className="flex items-center gap-(--space-12) px-(--space-16) py-(--space-14)"
        >
          <div className="min-w-0 flex-1">
            <p className="type-body text-fg truncate text-[13.5px]">
              {account ? account.email : "No linked account"}
            </p>
            <p className="type-meta text-fg-3 truncate">
              {account ? "Linked account" : "We email them an invite."}
            </p>
          </div>
          <Button onClick={() => setLinkOpen(true)}>
            <Icon icon={LinkSimpleIcon} />
            {account ? "Change" : "Link account"}
          </Button>
        </div>

        <DetailSheetSection title="Roster">
          {isDancer && (
            <SheetField
              label="Bib number"
              inputMode="numeric"
              autoComplete="off"
              mono
              className="w-[120px]"
              {...field("bibNumber")}
            />
          )}
          <div className="grid grid-cols-2 gap-(--space-12)">
            <SheetField
              label="First name"
              autoComplete="off"
              {...field("firstName")}
            />
            <SheetField
              label="Last name"
              autoComplete="off"
              {...field("lastName")}
            />
          </div>
          {fields.includes("email") && (
            <SheetField
              label="Email"
              type="email"
              autoComplete="off"
              {...field("email")}
            />
          )}
          {fields.includes("organization") && (
            <SheetField
              label="School"
              autoComplete="off"
              {...field("organization")}
            />
          )}
          {fields.includes("paid") && (
            <SheetFieldFrame
              label="Access"
              error={errors.paid}
              className="w-[160px]"
            >
              <Select
                size="lg"
                options={PAID_OPTIONS}
                value={values.paid || null}
                onChange={(value) => setField("paid")(value ?? "")}
                placeholder="Choose"
                label="Access"
                className={errors.paid ? "border-danger" : undefined}
              />
            </SheetFieldFrame>
          )}
        </DetailSheetSection>
      </DetailSheetForm>

      <DetailSheetFooter>
        <Button
          variant="ghost"
          size="lg"
          onClick={requestClose}
          className="ms-auto"
        >
          Cancel
        </Button>
        <DetailSheetPrimary
          type="submit"
          form={FORM_ID}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <BusyLabel label="Adding…" />
          ) : isDancer ? (
            "Add dancer"
          ) : (
            "Add coach"
          )}
        </DetailSheetPrimary>
      </DetailSheetFooter>

      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="Discard this entry?"
        description={<>What you entered won&rsquo;t be saved.</>}
        cancelLabel="Keep editing"
        confirmLabel="Discard"
        onConfirm={() => {
          setDiscardOpen(false);
          onOpenChange(false);
        }}
      />
      <LinkAccountDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        orgSlug={orgSlug}
        eventId={eventId}
        type={type}
        linked={account !== null}
        onPick={handlePick}
        onUnlink={() => setAccount(null)}
      />
    </DetailSheet>
  );
}
