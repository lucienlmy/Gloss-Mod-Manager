import { reactive, readonly } from "vue";

interface IAppUpdateInstallDialogState {
    open: boolean;
    version: string;
    notes: string;
}

const dialogState = reactive<IAppUpdateInstallDialogState>({
    open: false,
    version: "",
    notes: "",
});

let resolveConfirmation: ((confirmed: boolean) => void) | null = null;

function settleAppUpdateInstallDialog(confirmed: boolean) {
    dialogState.open = false;

    const resolver = resolveConfirmation;

    resolveConfirmation = null;
    resolver?.(confirmed);
}

export function useAppUpdateInstallDialogState() {
    return readonly(dialogState);
}

export async function requestAppUpdateInstallConfirmation(
    version: string,
    notes?: string,
) {
    if (resolveConfirmation) {
        resolveConfirmation(false);
    }

    dialogState.version = version;
    dialogState.notes = notes?.trim() ?? "";
    dialogState.open = true;

    return await new Promise<boolean>((resolve) => {
        resolveConfirmation = resolve;
    });
}

export function confirmAppUpdateInstallDialog() {
    settleAppUpdateInstallDialog(true);
}

export function cancelAppUpdateInstallDialog() {
    settleAppUpdateInstallDialog(false);
}

export function syncAppUpdateInstallDialogOpen(open: boolean) {
    if (open) {
        dialogState.open = true;
        return;
    }

    if (dialogState.open) {
        settleAppUpdateInstallDialog(false);
    }
}
