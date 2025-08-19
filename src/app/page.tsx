import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignInButton, SignUpButton } from "@clerk/nextjs";

export default async function Home() {
  const user = await currentUser();

  // If user is authenticated, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">
          Welcome to Foresight
        </h1>
        <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
          Your personal financial education and planning application. Empowering
          everyday people to understand their finances and make informed money
          decisions.
        </p>

        {/* Clerk built-in authentication buttons */}
        <div className="flex justify-center space-x-4 mb-12">
          <SignInButton mode="modal">
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="bg-white hover:bg-gray-50 text-emerald-600 border border-emerald-600 px-6 py-3 rounded-lg font-medium transition-colors">
              Get Started
            </button>
          </SignUpButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-2 text-gray-900">
              Investment Portfolio
            </h2>
            <p className="text-gray-600">
              Track your investments and understand how your money is growing
            </p>
          </div>
          <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-2 text-gray-900">
              Income & Expenses
            </h2>
            <p className="text-gray-600">
              Manage your cash flow and optimize your spending
            </p>
          </div>
          <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-2 text-gray-900">
              Financial Goals
            </h2>
            <p className="text-gray-600">
              Set and track your financial objectives
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
