import { ref } from "vue";

export const INTERNAL_DRAG_THRESHOLD = 6;

export const managerDragKind = ref<"tag" | "mod" | null>(null);
export const managerDraggingTagName = ref("");
export const managerDraggingModId = ref<number | null>(null);

export function startManagerTagDrag(tagName: string) {
    managerDragKind.value = "tag";
    managerDraggingTagName.value = tagName;
    managerDraggingModId.value = null;
}

export function startManagerModDrag(modId: number) {
    managerDragKind.value = "mod";
    managerDraggingModId.value = modId;
    managerDraggingTagName.value = "";
}

export function clearManagerInternalDrag() {
    managerDragKind.value = null;
    managerDraggingTagName.value = "";
    managerDraggingModId.value = null;
}
