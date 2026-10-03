import { SignUp, useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { env } from "../../config/env";
import { AuthNotConfigured } from "./sign-in-page";

export function SignUpPage() {
  // No Clerk context exists without a key, so this check must come before
  // any Clerk hook (they throw outside a ClerkProvider).
  if (!env.clerkPublishableKey) {
    return <AuthNotConfigured />;
  }
  return <ConfiguredSignUp />;
}

function ConfiguredSignUp() {
  const { isSignedIn } = useUser();
  if (isSignedIn) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-secondary px-4">
      <SignUp routing="path" path="/sign-up" />
    </div>
  );
}
