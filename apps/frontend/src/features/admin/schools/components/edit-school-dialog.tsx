import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTab } from "@/components/ui/tabs";
import { adminQueries } from "@/features/admin/api/queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useRef, useState, useEffect } from "react";
import { AccountTab } from "./tabs/account-tab";
import { AvatarTab } from "./tabs/avatar-tab";
import { ProfileTab } from "./tabs/profile-tab";
import { SkillsTab } from "./tabs/skills-tab";
import { SportsTab } from "./tabs/sports-tab";
import { StylesTab } from "./tabs/styles-tab";
import type { TabHandle } from "./tabs/types";

interface EditSchoolDialogProps {
  school: { username: string; name: string } | null;
  onOpenChange: (open: boolean) => void;
}

type TabValue = "profile" | "account" | "avatar" | "skills" | "styles" | "sports";

const TAB_LABELS: Record<TabValue, string> = {
  profile: "Save Profile",
  account: "Save Account",
  avatar: "Upload Avatar",
  skills: "Save Skills",
  styles: "Save Styles",
  sports: "Save Sports",
};

interface FooterState {
  onSave: () => void;
  isDirty: boolean;
  isPending: boolean;
  label: string;
}

interface EditSchoolDialogContentProps {
  username: string;
  activeTab: TabValue;
  onFooterStateChange: (state: FooterState) => void;
}

function EditSchoolDialogContent({ username, activeTab, onFooterStateChange }: EditSchoolDialogContentProps) {
  const { data } = useSuspenseQuery(adminQueries.schoolEvents(username));
  const [tabStates, setTabStates] = useState<Record<TabValue, { isDirty: boolean; isPending: boolean }>>({
    profile: { isDirty: false, isPending: false },
    account: { isDirty: false, isPending: false },
    avatar: { isDirty: false, isPending: false },
    skills: { isDirty: false, isPending: false },
    styles: { isDirty: false, isPending: false },
    sports: { isDirty: false, isPending: false },
  });

  const profileRef = useRef<TabHandle>(null);
  const accountRef = useRef<TabHandle>(null);
  const avatarRef = useRef<TabHandle>(null);
  const skillsRef = useRef<TabHandle>(null);
  const stylesRef = useRef<TabHandle>(null);
  const sportsRef = useRef<TabHandle>(null);

  const refs: Record<TabValue, React.RefObject<TabHandle | null>> = {
    profile: profileRef,
    account: accountRef,
    avatar: avatarRef,
    skills: skillsRef,
    styles: stylesRef,
    sports: sportsRef,
  };

  const handleStateChange = (tab: TabValue) => (state: { isDirty: boolean; isPending: boolean }) => {
    setTabStates((prev) => ({ ...prev, [tab]: state }));
  };

  const activeState = tabStates[activeTab];

  const activeRef = refs[activeTab];

  // Update footer state when active tab or its state changes
  useEffect(() => {
    onFooterStateChange({
      onSave: () => activeRef.current?.save(),
      isDirty: activeState.isDirty,
      isPending: activeState.isPending,
      label: TAB_LABELS[activeTab],
    });
  }, [activeTab, activeState, activeRef, onFooterStateChange]);

  const skillIds = data.skills.map((s) => s.slug);
  const styleIds = data.styles.map((s) => s.slug);
  const sportIds = data.sports.map((s) => s.slug);

  return (
    <>
      <TabsContent value="profile" className="flex-1 overflow-hidden">
        <ProfileTab ref={profileRef} username={username} data={data} onStateChange={handleStateChange("profile")} />
      </TabsContent>

      <TabsContent value="account" className="flex-1 overflow-hidden">
        <AccountTab ref={accountRef} username={username} displayEmail={data.displayEmail} onStateChange={handleStateChange("account")} />
      </TabsContent>

      <TabsContent value="avatar" className="flex-1 overflow-hidden">
        <AvatarTab
          ref={avatarRef}
          username={username}
          currentAvatar={data.avatar}
          schoolName={data.name}
          onStateChange={handleStateChange("avatar")}
        />
      </TabsContent>

      <TabsContent value="skills" className="flex-1 overflow-hidden">
        <SkillsTab ref={skillsRef} username={username} selectedSkillIds={skillIds} onStateChange={handleStateChange("skills")} />
      </TabsContent>

      <TabsContent value="styles" className="flex-1 overflow-hidden">
        <StylesTab ref={stylesRef} username={username} selectedStyleIds={styleIds} onStateChange={handleStateChange("styles")} />
      </TabsContent>

      <TabsContent value="sports" className="flex-1 overflow-hidden">
        <SportsTab ref={sportsRef} username={username} selectedSportIds={sportIds} onStateChange={handleStateChange("sports")} />
      </TabsContent>
    </>
  );
}

function EditSchoolDialogFallback() {
  return (
    <div className="space-y-4 pt-4">
      <Skeleton className="h-4 w-32" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

export function EditSchoolDialog({ school, onOpenChange }: EditSchoolDialogProps) {
  const [footerState, setFooterState] = useState<FooterState | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>("profile");

  return (
    <Dialog open={school !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-w-4xl flex-col sm:h-[85vh] sm:max-h-[800px]">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabValue)}
          className="flex h-full flex-col"
        >
          <DialogHeader>
            <DialogTitle>Edit School: {school?.name}</DialogTitle>
            <DialogDescription>
              Manage all aspects of this school&apos;s profile
            </DialogDescription>
            <TabsList className="mt-4">
              <TabsTab value="profile">Profile</TabsTab>
              <TabsTab value="account">Account</TabsTab>
              <TabsTab value="avatar">Avatar</TabsTab>
              <TabsTab value="skills">Skills</TabsTab>
              <TabsTab value="styles">Styles</TabsTab>
              <TabsTab value="sports">Sports</TabsTab>
            </TabsList>
          </DialogHeader>
          <DialogPanel className="flex-1 overflow-hidden">
            {school && (
              <Suspense fallback={<EditSchoolDialogFallback />}>
                <EditSchoolDialogContent
                  username={school.username}
                  activeTab={activeTab}
                  onFooterStateChange={setFooterState}
                />
              </Suspense>
            )}
          </DialogPanel>
          {footerState && (
            <DialogFooter>
              <Button
                onClick={footerState.onSave}
                disabled={footerState.isPending || !footerState.isDirty}
              >
                {footerState.isPending ? (
                  <Spinner label="Saving..." />
                ) : (
                  footerState.label
                )}
              </Button>
            </DialogFooter>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
