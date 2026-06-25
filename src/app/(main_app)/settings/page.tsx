import { UserProfile } from "@clerk/nextjs";

export default async function SettingsPage() {
  return (
    <div className="w-full pb-12 pl-15 pr-15 pt-8 max-w-5xl mx-auto">
      <UserProfile />
    </div>
  );
}
