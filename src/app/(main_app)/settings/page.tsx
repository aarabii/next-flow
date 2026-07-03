import { UserProfile } from "@clerk/nextjs";

export default async function SettingsPage() {
  return (
    <div className="w-full pb-12 px-4 sm:px-8 pt-8 max-w-5xl mx-auto">
      <UserProfile />
    </div>
  );
}
