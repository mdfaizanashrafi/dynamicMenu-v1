import { useAuth, useUser } from "@clerk/clerk-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { env } from "../../config/env";
import { AuthNotConfigured } from "../../features/auth/sign-in-page";

/** Gate for protected routes: requires a configured Clerk session. */
export function AuthGuard() {
  // No Clerk context exists without a key, so this check must come first.
  if (!env.clerkPublishableKey) {
    return <AuthNotConfigured />;
  }
  return <ClerkSessionGuard />;
}

function ClerkSessionGuard() {
  const { isLoaded, isSignedIn } = useAuth();
  const { isSignedIn: userSignedIn } = useUser();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-text-secondary">Loading…</p>
      </div>
    );
  }
  if (!isSignedIn || !userSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
