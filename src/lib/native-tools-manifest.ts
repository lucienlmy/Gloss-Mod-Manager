const embeddedToolVersions = {
    sevenZip: "26.00",
    aria2: "1.37.0",
} as const;

const sidecarBaseNames = {
    sevenZip: "sevenzip",
    aria2: "aria2c",
} as const;

const sidecarCommands = {
    sevenZip: "binaries/sevenzip",
    aria2: "binaries/aria2c",
} as const;

const windowsSevenZipSupportFiles = ["7z.dll"] as const;

export class NativeToolsManifest {
    public static readonly EMBEDDED_TOOL_VERSIONS = embeddedToolVersions;
    public static readonly SIDECAR_BASE_NAMES = sidecarBaseNames;
    public static readonly SIDECAR_COMMANDS = sidecarCommands;
    public static readonly WINDOWS_SEVEN_ZIP_SUPPORT_FILES =
        windowsSevenZipSupportFiles;
}

export const EMBEDDED_TOOL_VERSIONS =
    NativeToolsManifest.EMBEDDED_TOOL_VERSIONS;
export const SIDECAR_BASE_NAMES = NativeToolsManifest.SIDECAR_BASE_NAMES;
export const SIDECAR_COMMANDS = NativeToolsManifest.SIDECAR_COMMANDS;
export const WINDOWS_SEVEN_ZIP_SUPPORT_FILES =
    NativeToolsManifest.WINDOWS_SEVEN_ZIP_SUPPORT_FILES;

export type EmbeddedToolName = keyof typeof embeddedToolVersions;
export type EmbeddedSidecarCommand = (typeof sidecarCommands)[EmbeddedToolName];
