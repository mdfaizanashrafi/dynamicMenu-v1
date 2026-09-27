import { useParams } from "react-router-dom";

/**
 * Customer QR menu. Placeholder for Phase 5–6:
 * token → restaurant + table → published menu.
 */
export function CustomerMenuPage() {
  const { token } = useParams<{ token: string }>();

  return (
    <div className="mx-auto flex min-h-dvh max-w-[600px] items-center justify-center px-6 text-center">
      <p className="text-text-secondary">
        Table QR token: <code className="font-mono">{token}</code>
        <br />
        Customer menu arrives in Phase 6.
      </p>
    </div>
  );
}
