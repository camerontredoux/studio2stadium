export function ProfilePicture({ avatar }: { avatar: string | null }) {
  return (
    <img
      src={avatar || undefined}
      alt="Profile picture"
      className="border-brand/20 top-15 left-4 z-20 size-20 rounded-full border bg-black object-cover shadow-xs sm:absolute sm:top-29 sm:size-24"
    />
  );
}
