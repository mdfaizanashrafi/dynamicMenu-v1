import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../services/api";
import type { CustomerMenuData } from "./customer-menu.types";
import { CustomerMenuShell } from "./customer-menu-shell";
import { CustomerMenuError } from "./customer-menu-error";
import { CustomerMenuLoading } from "./customer-menu-loading";

/**
 * Customer landing page for scanned QR codes (/q/:token).
 * Phase 6 loads the published menu, theme, and active offers for the
 * resolved restaurant + table (PHASES.md §10, DESIGN.md §14).
 */
export function CustomerMenuPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "error"; message: string }
    | { kind: "resolved"; data: CustomerMenuData }
  >({ kind: "loading" });

  useEffect(() => {
    if (!token) {
      setState({
        kind: "error",
        message:
          "This QR code is unavailable. Please ask restaurant staff for a new QR code.",
      });
      return;
    }
    let cancelled = false;
    apiFetch<CustomerMenuData>(`/api/v1/public/qr/${token}/menu`)
      .then((data) => {
        if (!cancelled) setState({ kind: "resolved", data });
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setState({
            kind: "error",
            message:
              e instanceof Error && e.message
                ? e.message
                : "This QR code is unavailable. Please ask restaurant staff for a new QR code.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state.kind === "loading") {
    return <CustomerMenuLoading />;
  }

  if (state.kind === "error") {
    return <CustomerMenuError message={state.message} />;
  }

  return <CustomerMenuShell data={state.data} />;
}
