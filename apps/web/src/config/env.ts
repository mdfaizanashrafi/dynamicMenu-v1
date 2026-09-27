const required = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value as string;
};

export const env = {
  apiBaseUrl:
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    "http://localhost:4000",
  clerkPublishableKey: import.meta.env
    .VITE_CLERK_PUBLISHABLE_KEY as string | undefined,
  sentryDsn: import.meta.env.VITE_SENTRY_DSN as string | undefined,
  isProduction: import.meta.env.PROD,
  required,
};
