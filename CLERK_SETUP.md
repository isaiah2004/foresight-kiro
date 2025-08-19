# Clerk Authentication Setup

This document provides instructions for setting up Clerk authentication in the Foresight application.

## Environment Variables

To complete the Clerk setup, you need to add your Clerk API keys to the `.env.local` file:

1. Sign up for a Clerk account at [https://clerk.com](https://clerk.com)
2. Create a new application in your Clerk dashboard
3. Copy your API keys from the Clerk dashboard
4. Update the `.env.local` file with your actual keys:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Clerk URLs (these are already configured)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

## Features Implemented

✅ **Authentication Pages**
- Sign-in page at `/sign-in`
- Sign-up page at `/sign-up`
- User profile page at `/profile`

✅ **Route Protection**
- Middleware protects `/dashboard` and `/profile` routes
- Automatic redirect to sign-in for unauthenticated users
- Automatic redirect to dashboard for authenticated users on home page

✅ **Custom Styling**
- Clerk components styled to match the financial app theme
- Emerald color scheme for consistency
- Responsive design

✅ **Components**
- `AuthWrapper` component for protecting pages
- Custom themed Clerk components
- User button with profile access

## Usage

1. **Development**: Run `npm run dev` and visit `http://localhost:3000`
2. **Authentication Flow**:
   - Unauthenticated users see the home page with sign-in/sign-up buttons
   - After authentication, users are redirected to the dashboard
   - Protected routes automatically redirect to sign-in if not authenticated

## File Structure

```
src/
├── app/
│   ├── sign-in/[[...sign-in]]/page.tsx    # Sign-in page
│   ├── sign-up/[[...sign-up]]/page.tsx    # Sign-up page
│   ├── dashboard/page.tsx                  # Protected dashboard
│   ├── profile/page.tsx                    # User profile page
│   └── page.tsx                           # Home page with auth logic
├── components/auth/
│   ├── auth-wrapper.tsx                   # Authentication wrapper
│   └── auth-buttons.tsx                   # Navigation buttons
├── lib/
│   └── clerk-theme.ts                     # Custom Clerk styling
├── middleware.ts                          # Route protection
└── .env.local                            # Environment variables
```

## Next Steps

The authentication system is now ready for the next phase of development. You can proceed with implementing the Firebase integration and financial data models.