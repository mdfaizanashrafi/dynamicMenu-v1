import * as Dialog from "@radix-ui/react-dialog";

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Minimal accessible confirm dialog (DESIGN.md §20 Modal). */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-modal border border-border-default bg-surface-primary p-6 shadow-xl focus:outline-none">
          <Dialog.Title className="text-lg font-semibold text-text-primary">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-text-secondary">
            {description}
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                disabled={busy}
                className="h-10 rounded-lg border border-border-default px-4 text-sm font-medium text-text-primary hover:border-text-secondary disabled:opacity-60"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              disabled={busy}
              onClick={onConfirm}
              className={
                destructive
                  ? "h-10 rounded-lg bg-error px-4 text-sm font-semibold text-white disabled:opacity-60"
                  : "h-10 rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white hover:bg-brand-primary-hover disabled:opacity-60"
              }
            >
              {busy ? "Working…" : confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
