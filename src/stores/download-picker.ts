export interface IDownloadFilePickerItem {
    id: string;
    title: string;
    description: string;
    badges: string[];
}

export interface IDownloadFilePickerRequest {
    title: string;
    description: string;
    note?: string;
    items: IDownloadFilePickerItem[];
    initialItemId?: string;
    confirmLabel?: string;
    cancelLabel?: string;
}

type DownloadFilePickerResolver = (value: string | null) => void;

export const useDownloadFilePickerStore = defineStore(
    "DownloadFilePicker",
    () => {
        const open = ref(false);
        const title = ref("");
        const description = ref("");
        const note = ref("");
        const items = ref<IDownloadFilePickerItem[]>([]);
        const selectedItemId = ref("");
        const confirmLabel = ref("下载选中文件");
        const cancelLabel = ref("取消");

        let resolver: DownloadFilePickerResolver | null = null;

        function resetState() {
            title.value = "";
            description.value = "";
            note.value = "";
            items.value = [];
            selectedItemId.value = "";
            confirmLabel.value = "下载选中文件";
            cancelLabel.value = "取消";
        }

        function selectItem(itemId: string) {
            if (!items.value.some((item) => item.id === itemId)) {
                return;
            }

            selectedItemId.value = itemId;
        }

        function cancelPending() {
            const currentResolver = resolver;

            resolver = null;
            open.value = false;
            resetState();
            currentResolver?.(null);
        }

        function confirmSelection(itemId?: string) {
            const nextItemId = itemId ?? selectedItemId.value;

            if (!items.value.some((item) => item.id === nextItemId)) {
                return;
            }

            const currentResolver = resolver;

            resolver = null;
            open.value = false;
            resetState();
            currentResolver?.(nextItemId);
        }

        function promptSelection(options: IDownloadFilePickerRequest) {
            if (resolver) {
                cancelPending();
            }

            title.value = options.title;
            description.value = options.description;
            note.value = options.note ?? "";
            items.value = [...options.items];
            selectedItemId.value =
                options.initialItemId &&
                options.items.some((item) => item.id === options.initialItemId)
                    ? options.initialItemId
                    : (options.items[0]?.id ?? "");
            confirmLabel.value = options.confirmLabel ?? "下载选中文件";
            cancelLabel.value = options.cancelLabel ?? "取消";
            open.value = true;

            return new Promise<string | null>((resolve) => {
                resolver = resolve;
            });
        }

        return {
            open,
            title,
            description,
            note,
            items,
            selectedItemId,
            confirmLabel,
            cancelLabel,
            selectItem,
            cancelPending,
            confirmSelection,
            promptSelection,
        };
    },
);
