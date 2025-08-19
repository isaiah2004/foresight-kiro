import { SignUp } from '@clerk/nextjs'
import { clerkTheme } from '@/lib/clerk-theme'

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Join Foresight
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Start your journey to financial wellness
          </p>
        </div>
        <div className="flex justify-center">
          <SignUp appearance={clerkTheme} />
        </div>
      </div>
    </div>
  )
}