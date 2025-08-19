import { UserProfile } from "@clerk/nextjs";
import { clerkTheme } from "@/lib/clerk-theme";

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Profile Settings
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>
        <div className="flex justify-center">
          <UserProfile appearance={clerkTheme} />
        </div>
      </div>
    </div>
  );
}
