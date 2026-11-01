import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function SchoolLogo({
  school,
}: {
  school: { name: string; avatar: string | null };
}) {
  return (
    <Avatar className="size-7 rounded-md border">
      {school.avatar && <AvatarImage src={school.avatar} alt="" />}
      <AvatarFallback className="text-[0.625rem] font-semibold">
        {school.name.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
