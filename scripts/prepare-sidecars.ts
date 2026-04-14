import { execFileSync } from "node:child_process";
import { createWriteStream, existsSync } from "node:fs";
import {
    chmod,
    copyFile,
    mkdir,
    readFile,
    readdir,
    rm,
    writeFile,
} from "node:fs/promises";
import { cpus } from "node:os";
import { dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import {
    EMBEDDED_TOOL_VERSIONS,
    SIDECAR_BASE_NAMES,
    WINDOWS_SEVEN_ZIP_SUPPORT_FILES,
} from "../src/lib/native-tools-manifest";

type RuntimePlatform = "windows" | "linux" | "macos";
type RuntimeArch = "x64" | "x86" | "arm64" | "arm";

interface ResolvedTarget {
    platform: RuntimePlatform;
    arch: RuntimeArch;
    triple: string;
    extension: string;
}

interface PreparedState {
    targetTriple: string;
    platform: RuntimePlatform;
    arch: RuntimeArch;
    versions: typeof EMBEDDED_TOOL_VERSIONS;
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const tauriDir = join(projectRoot, "src-tauri");
const binariesDir = join(tauriDir, "binaries");
const tempDir = join(binariesDir, ".tmp");
const stateFile = join(binariesDir, ".prepared-sidecars.json");

const sevenZipLinuxAssetByArch: Record<RuntimeArch, string | null> = {
    x64: "https://github.com/ip7z/7zip/releases/download/26.00/7z2600-linux-x64.tar.xz",
    x86: "https://github.com/ip7z/7zip/releases/download/26.00/7z2600-linux-x86.tar.xz",
    arm64: "https://github.com/ip7z/7zip/releases/download/26.00/7z2600-linux-arm64.tar.xz",
    arm: "https://github.com/ip7z/7zip/releases/download/26.00/7z2600-linux-arm.tar.xz",
};

const sevenZipMacAsset =
    "https://github.com/ip7z/7zip/releases/download/26.00/7z2600-mac.tar.xz";

const sevenZipWindowsExtractorAsset =
    "https://github.com/ip7z/7zip/releases/download/26.00/7zr.exe";

const sevenZipWindowsInstallerAssetByArch: Record<RuntimeArch, string | null> = {
    x64: "https://github.com/ip7z/7zip/releases/download/26.00/7z2600-x64.exe",
    x86: "https://github.com/ip7z/7zip/releases/download/26.00/7z2600.exe",
    arm64: "https://github.com/ip7z/7zip/releases/download/26.00/7z2600-arm64.exe",
    arm: "https://github.com/ip7z/7zip/releases/download/26.00/7z2600-arm.exe",
};

const aria2WindowsAssetByArch: Record<RuntimeArch, string | null> = {
    x64: "https://github.com/aria2/aria2/releases/download/release-1.37.0/aria2-1.37.0-win-64bit-build1.zip",
    x86: "https://github.com/aria2/aria2/releases/download/release-1.37.0/aria2-1.37.0-win-32bit-build1.zip",
    arm64: "https://github.com/aria2/aria2/releases/download/release-1.37.0/aria2-1.37.0-win-64bit-build1.zip",
    arm: null,
};

const aria2SourceAsset =
    "https://github.com/aria2/aria2/releases/download/release-1.37.0/aria2-1.37.0.tar.xz";

const legacyWindowsSevenZipSupportFiles = ["7za.dll", "7zxa.dll"] as const;
const allKnownWindowsSevenZipSupportFiles = new Set<string>([
    ...WINDOWS_SEVEN_ZIP_SUPPORT_FILES,
    ...legacyWindowsSevenZipSupportFiles,
]);
const currentWindowsSevenZipSupportFiles = new Set<string>(
    WINDOWS_SEVEN_ZIP_SUPPORT_FILES,
);

function log(message: string) {
    console.log(`[sidecars] ${message}`);
}

function normalizePlatform(
    platform: string | undefined,
): RuntimePlatform | null {
    switch (platform?.toLowerCase()) {
        case "win32":
        case "windows":
            return "windows";
        case "darwin":
        case "mac":
        case "macos":
            return "macos";
        case "linux":
            return "linux";
        default:
            return null;
    }
}

function normalizeArch(arch: string | undefined): RuntimeArch | null {
    switch (arch?.toLowerCase()) {
        case "x64":
        case "x86_64":
        case "amd64":
            return "x64";
        case "x86":
        case "ia32":
        case "i686":
            return "x86";
        case "arm64":
        case "aarch64":
            return "arm64";
        case "arm":
        case "armv7":
        case "armv7l":
            return "arm";
        default:
            return null;
    }
}

function fallbackTargetTriple(platform: RuntimePlatform, arch: RuntimeArch) {
    if (platform === "windows") {
        if (arch === "x64") {
            return "x86_64-pc-windows-msvc";
        }

        if (arch === "x86") {
            return "i686-pc-windows-msvc";
        }

        if (arch === "arm64") {
            return "aarch64-pc-windows-msvc";
        }
    }

    if (platform === "linux") {
        if (arch === "x64") {
            return "x86_64-unknown-linux-gnu";
        }

        if (arch === "x86") {
            return "i686-unknown-linux-gnu";
        }

        if (arch === "arm64") {
            return "aarch64-unknown-linux-gnu";
        }

        if (arch === "arm") {
            return "armv7-unknown-linux-gnueabihf";
        }
    }

    if (platform === "macos") {
        if (arch === "x64") {
            return "x86_64-apple-darwin";
        }

        if (arch === "arm64") {
            return "aarch64-apple-darwin";
        }
    }

    throw new Error(
        `Unsupported platform/arch combination: ${platform}/${arch}`,
    );
}

function parseTargetTriple(triple: string): ResolvedTarget {
    const platform = normalizePlatform(
        triple.includes("windows")
            ? "windows"
            : triple.includes("apple-darwin")
                ? "macos"
                : triple.includes("linux")
                    ? "linux"
                    : undefined,
    );
    const arch = normalizeArch(
        triple.startsWith("x86_64")
            ? "x64"
            : triple.startsWith("i686") || triple.startsWith("i586")
                ? "x86"
                : triple.startsWith("aarch64")
                    ? "arm64"
                    : triple.startsWith("arm")
                        ? "arm"
                        : undefined,
    );

    if (!platform || !arch) {
        throw new Error(`Unsupported target triple: ${triple}`);
    }

    return {
        platform,
        arch,
        triple,
        extension: platform === "windows" ? ".exe" : "",
    };
}

function resolveTarget() {
    const overrideTriple =
        process.env.GMM_TARGET_TRIPLE ??
        process.env.SIDECAR_TARGET_TRIPLE ??
        process.env.CARGO_BUILD_TARGET ??
        process.env.TARGET_TRIPLE;

    if (overrideTriple) {
        return parseTargetTriple(overrideTriple.trim());
    }

    try {
        const rustcTriple = execFileSync("rustc", ["--print", "host-tuple"], {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
        }).trim();

        if (rustcTriple) {
            return parseTargetTriple(rustcTriple);
        }
    } catch {
        log(
            "rustc --print host-tuple unavailable, falling back to TAURI_ENV_* and Node runtime",
        );
    }

    const platform =
        normalizePlatform(process.env.TAURI_ENV_PLATFORM) ??
        normalizePlatform(process.platform);
    const arch =
        normalizeArch(process.env.TAURI_ENV_ARCH) ??
        normalizeArch(process.arch);

    if (!platform || !arch) {
        throw new Error(
            "Unable to determine build target platform/arch for sidecar preparation",
        );
    }

    return parseTargetTriple(fallbackTargetTriple(platform, arch));
}

function sidecarOutputPath(baseName: string, target: ResolvedTarget) {
    return join(binariesDir, `${baseName}-${target.triple}${target.extension}`);
}

async function downloadFile(url: string, destination: string) {
    const response = await fetch(url, {
        headers: {
            "User-Agent": "Gloss-Mod-Manager-sidecar-preparer",
        },
    });

    if (!response.ok || !response.body) {
        throw new Error(
            `Failed to download ${url}: ${response.status} ${response.statusText}`,
        );
    }

    await mkdir(dirname(destination), { recursive: true });
    await pipeline(
        Readable.fromWeb(
            response.body as globalThis.ReadableStream<Uint8Array>,
        ),
        createWriteStream(destination),
    );
}

function runCommand(command: string, args: string[], cwd?: string) {
    execFileSync(command, args, {
        cwd,
        stdio: "inherit",
        env: process.env,
    });
}

async function extractZipOnWindows(archivePath: string, outputDir: string) {
    await mkdir(outputDir, { recursive: true });

    runCommand("powershell.exe", [
        "-NoProfile",
        "-Command",
        `Expand-Archive -LiteralPath '${archivePath.replace(/'/gu, "''")}' -DestinationPath '${outputDir.replace(/'/gu, "''")}' -Force`,
    ]);
}

async function extractTarXz(archivePath: string, outputDir: string) {
    await mkdir(outputDir, { recursive: true });
    runCommand("tar", ["-xf", archivePath, "-C", outputDir]);
}

async function readPreparedState() {
    try {
        const raw = await readFile(stateFile, "utf8");
        return JSON.parse(raw) as PreparedState;
    } catch {
        return null;
    }
}

async function writePreparedState(target: ResolvedTarget) {
    const state: PreparedState = {
        targetTriple: target.triple,
        platform: target.platform,
        arch: target.arch,
        versions: EMBEDDED_TOOL_VERSIONS,
    };

    await writeFile(stateFile, JSON.stringify(state, null, 2));
}

async function findFirstMatch(
    rootDir: string,
    candidates: readonly string[],
): Promise<string | null> {
    const entries = await readdir(rootDir, { withFileTypes: true });

    for (const entry of entries) {
        const entryPath = join(rootDir, entry.name);

        if (entry.isFile() && candidates.includes(entry.name)) {
            return entryPath;
        }

        if (entry.isDirectory()) {
            const match = await findFirstMatch(entryPath, candidates);

            if (match) {
                return match;
            }
        }
    }

    return null;
}

async function ensureExecutable(filePath: string) {
    if (process.platform !== "win32") {
        await chmod(filePath, 0o755);
    }
}

async function cleanupManagedArtifacts(target: ResolvedTarget) {
    const entries = await readdir(binariesDir, { withFileTypes: true });
    const currentSevenZip = `${SIDECAR_BASE_NAMES.sevenZip}-${target.triple}${target.extension}`;
    const currentAria2 = `${SIDECAR_BASE_NAMES.aria2}-${target.triple}${target.extension}`;
    const legacySevenZipPrefix = "7zip-";

    for (const entry of entries) {
        if (!entry.isFile()) {
            continue;
        }

        const shouldDeleteSevenZip =
            entry.name.startsWith(`${SIDECAR_BASE_NAMES.sevenZip}-`) &&
            entry.name !== currentSevenZip;
        const shouldDeleteLegacySevenZip =
            entry.name.startsWith(legacySevenZipPrefix) &&
            entry.name !== currentSevenZip;
        const shouldDeleteAria2 =
            entry.name.startsWith(`${SIDECAR_BASE_NAMES.aria2}-`) &&
            entry.name !== currentAria2;
        const shouldDeleteWindowsSupport =
            allKnownWindowsSevenZipSupportFiles.has(entry.name) &&
            (target.platform !== "windows" ||
                !currentWindowsSevenZipSupportFiles.has(entry.name));

        if (
            shouldDeleteSevenZip ||
            shouldDeleteLegacySevenZip ||
            shouldDeleteAria2 ||
            shouldDeleteWindowsSupport
        ) {
            await rm(join(binariesDir, entry.name), { force: true });
        }
    }
}

function hasPreparedOutputs(target: ResolvedTarget) {
    const requiredFiles = [
        sidecarOutputPath(SIDECAR_BASE_NAMES.sevenZip, target),
        sidecarOutputPath(SIDECAR_BASE_NAMES.aria2, target),
    ];

    if (target.platform === "windows") {
        requiredFiles.push(
            ...WINDOWS_SEVEN_ZIP_SUPPORT_FILES.map((file) =>
                join(binariesDir, file),
            ),
        );
    }

    return requiredFiles.every((file) => existsSync(file));
}

function stateMatches(state: PreparedState | null, target: ResolvedTarget) {
    if (!state) {
        return false;
    }

    return (
        state.targetTriple === target.triple &&
        state.platform === target.platform &&
        state.arch === target.arch &&
        state.versions.sevenZip === EMBEDDED_TOOL_VERSIONS.sevenZip &&
        state.versions.aria2 === EMBEDDED_TOOL_VERSIONS.aria2
    );
}

async function prepareSevenZip(target: ResolvedTarget) {
    log(
        `Preparing 7-Zip ${EMBEDDED_TOOL_VERSIONS.sevenZip} for ${target.triple}`,
    );

    const outputPath = sidecarOutputPath(SIDECAR_BASE_NAMES.sevenZip, target);
    const sevenZipWorkDir = join(tempDir, "7zip");

    await rm(sevenZipWorkDir, { recursive: true, force: true });
    await mkdir(sevenZipWorkDir, { recursive: true });

    if (target.platform === "windows") {
        const extractorPath = join(sevenZipWorkDir, "7zr.exe");
        const installerAsset = sevenZipWindowsInstallerAssetByArch[target.arch];
        const installerPath = join(sevenZipWorkDir, "7zip-installer.exe");
        const extractDir = join(sevenZipWorkDir, "out");

        if (!installerAsset) {
            throw new Error(
                `No official 7-Zip Windows installer mapping for ${target.arch}`,
            );
        }

        await downloadFile(sevenZipWindowsExtractorAsset, extractorPath);
        await downloadFile(installerAsset, installerPath);
        runCommand(extractorPath, ["x", installerPath, `-o${extractDir}`, "-y"]);

        // Windows 上使用完整的 7z.exe，而不是精简的 7za.exe，才能稳定处理 RAR 等格式。
        await copyFile(join(extractDir, "7z.exe"), outputPath);
        await copyFile(join(extractDir, "7z.dll"), join(binariesDir, "7z.dll"));
        return;
    }

    const assetUrl =
        target.platform === "macos"
            ? sevenZipMacAsset
            : sevenZipLinuxAssetByArch[target.arch];

    if (!assetUrl) {
        throw new Error(
            `No official 7-Zip asset mapping for ${target.platform}/${target.arch}`,
        );
    }

    const archivePath = join(sevenZipWorkDir, "7zip.tar.xz");
    const extractDir = join(sevenZipWorkDir, "out");

    await downloadFile(assetUrl, archivePath);
    await extractTarXz(archivePath, extractDir);

    const binaryPath = await findFirstMatch(extractDir, ["7zz", "7zzs", "7z"]);

    if (!binaryPath) {
        throw new Error(
            "Unable to find a 7-Zip executable in the downloaded archive",
        );
    }

    await copyFile(binaryPath, outputPath);
    await ensureExecutable(outputPath);
}

async function prepareAria2(target: ResolvedTarget) {
    log(`Preparing aria2 ${EMBEDDED_TOOL_VERSIONS.aria2} for ${target.triple}`);

    const outputPath = sidecarOutputPath(SIDECAR_BASE_NAMES.aria2, target);
    const aria2WorkDir = join(tempDir, "aria2");

    await rm(aria2WorkDir, { recursive: true, force: true });
    await mkdir(aria2WorkDir, { recursive: true });

    if (target.platform === "windows") {
        const assetUrl = aria2WindowsAssetByArch[target.arch];

        if (!assetUrl) {
            throw new Error(
                `No official aria2 Windows asset mapping for ${target.arch}`,
            );
        }

        if (target.arch === "arm64") {
            log(
                "aria2 does not publish a native Windows ARM64 binary; using the official x64 build",
            );
        }

        const archivePath = join(aria2WorkDir, "aria2.zip");
        const extractDir = join(aria2WorkDir, "out");

        await downloadFile(assetUrl, archivePath);
        await extractZipOnWindows(archivePath, extractDir);

        const binaryPath = await findFirstMatch(extractDir, ["aria2c.exe"]);

        if (!binaryPath) {
            throw new Error(
                "Unable to find aria2c.exe in the downloaded archive",
            );
        }

        await copyFile(binaryPath, outputPath);
        return;
    }

    const archivePath = join(aria2WorkDir, "aria2.tar.xz");
    const extractDir = join(aria2WorkDir, "out");

    await downloadFile(aria2SourceAsset, archivePath);
    await extractTarXz(archivePath, extractDir);

    const configurePath = await findFirstMatch(extractDir, ["configure"]);

    if (!configurePath) {
        throw new Error(
            "Unable to find aria2 configure script after extracting source archive",
        );
    }

    const sourceRoot = dirname(configurePath);

    log("Building aria2 from the official source tarball for this platform");
    runCommand("sh", ["./configure"], sourceRoot);
    runCommand("make", ["-j", String(Math.max(1, cpus().length))], sourceRoot);

    const binaryPath = join(sourceRoot, "src", "aria2c");

    if (!existsSync(binaryPath)) {
        throw new Error("aria2 build completed without producing src/aria2c");
    }

    await copyFile(binaryPath, outputPath);
    await ensureExecutable(outputPath);
}

async function main() {
    if (process.env.GMM_SKIP_SIDECAR_PREPARE === "1") {
        log("Skipping sidecar preparation because GMM_SKIP_SIDECAR_PREPARE=1");
        return;
    }

    const target = resolveTarget();

    await mkdir(binariesDir, { recursive: true });

    const state = await readPreparedState();
    const forceRefresh = process.env.GMM_FORCE_SIDECAR_REFRESH === "1";

    if (
        !forceRefresh &&
        stateMatches(state, target) &&
        hasPreparedOutputs(target)
    ) {
        log(`Using cached sidecars for ${target.triple}`);
        return;
    }

    await rm(tempDir, { recursive: true, force: true });
    await mkdir(tempDir, { recursive: true });

    try {
        await prepareSevenZip(target);
        await prepareAria2(target);
        await cleanupManagedArtifacts(target);
        await writePreparedState(target);
        log(`Prepared embedded tools for ${target.triple}`);
    } finally {
        await rm(tempDir, { recursive: true, force: true });
    }
}

void main().catch((error) => {
    const message =
        error instanceof Error ? (error.stack ?? error.message) : String(error);

    console.error(`[sidecars] ${message}`);
    process.exitCode = 1;
});
