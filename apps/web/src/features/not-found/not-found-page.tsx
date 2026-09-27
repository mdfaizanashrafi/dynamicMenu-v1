import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold text-text-primary">Page not found</h1>
      <Link to="/" className="font-medium text-brand-primary hover:underline">
        Back to home
      </Link>
    </div>
  );
}
