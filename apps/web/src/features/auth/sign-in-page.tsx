import { SignIn, useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { env } from "../../config/env";

export function SignInPage() {
  // No Clerk context exists without a key, so this check must come before
  // any Clerk hook (they throw outside a ClerkProvider).
  if (!env.clerkPublishableKey) {
    return <AuthNotConfigured />;
  }
  return <ConfiguredSignIn />;
}

function ConfiguredSignIn() {
  const { isSignedIn } = useUser();
  if (isSignedIn) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-secondary px-4">
      <SignIn routing="path" path="/sign-in" />
    </div>
  );
}

function AuthNotConfigured() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="max-w-md rounded-card border border-border-default bg-surface-primary p-6 text-center">
        <h1 className="text-xl font-semibold text-text-primary">
          Authentication not configured
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Set <code>VITE_CLERK_PUBLISHABLE_KEY</code> in{" "}
          <code>apps/web/.env</code> (see .env.example) and restart the dev
          server to enable sign-in.
        </p>
      </div>
    </div>
  );
}

export { AuthNotConfigured };
