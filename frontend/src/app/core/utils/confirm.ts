import { ConfirmationService } from 'primeng/api';

/** Destructive confirmation with consistent wording and a red primary action. */
export function confirmDelete(
  confirmation: ConfirmationService,
  opts: { header: string; message: string; accept: () => void; acceptLabel?: string },
): void {
  confirmation.confirm({
    header: opts.header,
    message: opts.message,
    icon: 'pi pi-exclamation-circle',
    acceptLabel: opts.acceptLabel ?? 'Delete',
    rejectLabel: 'Cancel',
    acceptButtonProps: { severity: 'danger' },
    rejectButtonProps: { severity: 'secondary', text: true },
    defaultFocus: 'reject',
    accept: opts.accept,
  });
}
