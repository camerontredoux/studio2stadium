import { SchoolPage } from "../page";

interface SchoolProfileProps {
  username: string;
}

export function SchoolProfile({ username }: SchoolProfileProps) {
  return <SchoolPage username={username} />;
}
