import { Button } from "@/components/ui/button";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu";
import { useSession } from "@/lib/session";
import { Link, useLocation } from "@tanstack/react-router";
import { HiOutlineSparkles, HiOutlineStar, HiSparkles } from "react-icons/hi2";

/**
 * The Recruiting nav entry as a dropdown: the Recruiting home plus a
 * spotlights page tailored to the account type — schools get "Priority
 * Spotlights", dancers get "My Spotlights".
 */
export function RecruitingNav() {
  const session = useSession();
  const pathname = useLocation({ select: (l) => l.pathname });
  const active = pathname.startsWith("/recruiting");
  const Icon = active ? HiSparkles : HiOutlineSparkles;

  const spotlights =
    session.type === "school"
      ? { to: "/recruiting/priority-spotlights" as const, label: "Dancer Spotlights" }
      : { to: "/recruiting/my-spotlights" as const, label: "My Spotlights" };

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant={active ? "secondary" : "ghost"}
            className="size-9 justify-center p-0 sm:size-8 xl:h-10 xl:w-full xl:justify-start xl:gap-4 xl:px-4"
          />
        }
      >
        <Icon
          className={
            active
              ? "size-6 text-black sm:size-5.5 dark:text-white"
              : "size-6 sm:size-5.5"
          }
        />
        <span className="sr-only text-base xl:not-sr-only">Recruiting</span>
      </MenuTrigger>
      <MenuPopup align="start" className="min-w-52">
        <MenuItem closeOnClick render={<Link to="/recruiting" />}>
          <HiSparkles className="size-4" />
          Recruiting
        </MenuItem>
        <MenuItem closeOnClick render={<Link to={spotlights.to} />}>
          <HiOutlineStar className="size-4" />
          {spotlights.label}
        </MenuItem>
      </MenuPopup>
    </Menu>
  );
}
