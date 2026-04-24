interface IOpenGmmImportAction {
    type: "open-gmm-import";
    filePath: string;
    token: string;
}

export type TManagerLaunchAction = IOpenGmmImportAction;

export const useLaunchStore = defineStore("Launch", () => {
    const pendingManagerActions = ref<TManagerLaunchAction[]>([]);

    function enqueueManagerAction(action: Omit<TManagerLaunchAction, "token">) {
        pendingManagerActions.value = [
            ...pendingManagerActions.value,
            {
                ...action,
                token: crypto.randomUUID(),
            },
        ];
    }

    function takeNextManagerAction() {
        const [nextAction, ...restActions] = pendingManagerActions.value;

        if (!nextAction) {
            return null;
        }

        pendingManagerActions.value = restActions;
        return nextAction;
    }

    return {
        pendingManagerActions,
        enqueueManagerAction,
        takeNextManagerAction,
    };
});
