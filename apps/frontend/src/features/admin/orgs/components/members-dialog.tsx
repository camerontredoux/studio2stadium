import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toastManager } from "@/components/ui/toast-manager";
import {
  useAddOrgMember,
  useRemoveOrgMember,
  useUpdateOrgMember,
} from "@/features/admin/api/mutations";
import { adminQueries } from "@/features/admin/api/queries";
import { useQuery } from "@tanstack/react-query";
import { Search, Trash2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";

const ROLE_ITEMS = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
];

const TYPE_ITEMS = [
  { value: "coach", label: "Coach" },
  { value: "dancer", label: "Dancer" },
];

interface Org {
  id: string;
  name: string;
}

interface MembersDialogProps {
  org: Org | null;
  onOpenChange: (open: boolean) => void;
}

export function MembersDialog({ org, onOpenChange }: MembersDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member" | null>("member");
  const [type, setType] = useState<"coach" | "dancer" | null>("coach");
  const [search, setSearch] = useState("");

  const { data: members, isLoading } = useQuery({
    ...adminQueries.orgMembers(org?.id ?? ""),
    enabled: !!org,
  });

  const { mutate: addMember, isPending: isAdding } = useAddOrgMember(
    org?.id ?? "",
  );
  const filteredMembers = useMemo(() => {
    if (!members) return [];
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter((m) => {
      const name = `${m.user?.firstName ?? ""} ${m.user?.lastName ?? ""}`.toLowerCase();
      const email = m.user?.email?.toLowerCase() ?? "";
      return name.includes(q) || email.includes(q);
    });
  }, [members, search]);

  const { mutate: updateMember } = useUpdateOrgMember(org?.id ?? "");
  const { mutate: removeMember, isPending: isRemoving } = useRemoveOrgMember(
    org?.id ?? "",
  );

  const handleAdd = () => {
    if (!org || !email.trim() || !role || !type) return;
    addMember(
      {
        params: { path: { id: org.id } },
        body: { email: email.trim(), role, type },
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Member added",
            description: `${email} added to ${org.name}`,
            type: "success",
          });
          setEmail("");
        },
        onError: () => {
          toastManager.add({
            title: "Error",
            description: "Failed to add member. Check the email is correct and user exists.",
            type: "error",
          });
        },
      },
    );
  };

  const handleRemove = (memberId: string, name: string) => {
    if (!org) return;
    removeMember(
      {
        params: { path: { id: org.id, memberId } },
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Member removed",
            description: `${name} removed from ${org.name}`,
            type: "success",
          });
        },
        onError: () => {
          toastManager.add({
            title: "Error",
            description: "Failed to remove member",
            type: "error",
          });
        },
      },
    );
  };

  return (
    <Dialog open={!!org} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Members</DialogTitle>
          <DialogDescription>{org?.name}</DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm font-medium">Add Member</p>
              <Field name="email">
                <FieldLabel>Email</FieldLabel>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAdd();
                    }
                  }}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field name="role">
                  <FieldLabel>Role</FieldLabel>
                  <Select
                    value={role}
                    onValueChange={(v) => setRole(v as "admin" | "member")}
                    items={ROLE_ITEMS}
                  >
                    <SelectTrigger size="sm">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field name="type">
                  <FieldLabel>Type</FieldLabel>
                  <Select
                    value={type}
                    onValueChange={(v) => setType(v as "coach" | "dancer")}
                    items={TYPE_ITEMS}
                  >
                    <SelectTrigger size="sm">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={isAdding || !email.trim()}
                className="w-full"
              >
                <UserPlus className="size-3.5" />
                {isAdding ? "Adding..." : "Add Member"}
              </Button>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-2">
                Members{members ? ` (${members.length})` : ""}
              </p>
              <div className="relative mb-2">
                <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="h-8 pl-8 text-sm"
                />
              </div>
              {isLoading ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  Loading members...
                </p>
              ) : !filteredMembers || filteredMembers.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  {search.trim() ? "No matching members" : "No members yet"}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {member.user
                                ? `${member.user.firstName ?? ""} ${member.user.lastName ?? ""}`.trim() || member.user.email
                                : "Unknown user"}
                            </p>
                            {member.user?.email && (
                              <p className="text-muted-foreground truncate text-xs">
                                {member.user.email}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={member.role}
                            onValueChange={(v) => {
                              if (!org) return;
                              updateMember({
                                params: { path: { id: org.id, memberId: member.id } },
                                body: { role: v as "admin" | "member" },
                              });
                            }}
                            items={ROLE_ITEMS}
                          >
                            <SelectTrigger size="sm" className="h-7 min-h-0 w-24 text-xs sm:min-h-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLE_ITEMS.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={member.type}
                            onValueChange={(v) => {
                              if (!org) return;
                              updateMember({
                                params: { path: { id: org.id, memberId: member.id } },
                                body: { type: v as "coach" | "dancer" },
                              });
                            }}
                            items={TYPE_ITEMS}
                          >
                            <SelectTrigger size="sm" className="h-7 min-h-0 w-24 text-xs sm:min-h-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TYPE_ITEMS.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="xs"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            disabled={isRemoving}
                            onClick={() =>
                              handleRemove(
                                member.id,
                                member.user
                                  ? `${member.user.firstName ?? ""} ${member.user.lastName ?? ""}`.trim() || member.user.email
                                  : "member",
                              )
                            }
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </DialogPanel>
      </DialogContent>
    </Dialog>
  );
}
