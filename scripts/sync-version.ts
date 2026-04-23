/// <reference types="node" />

import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface IPackageManifest {
    name: string;
    version: string;
}

interface IJsonObject {
    [key: string]: unknown;
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const tauriDir = join(projectRoot, "src-tauri");
const packageJsonPath = join(projectRoot, "package.json");
const cargoTomlPath = join(tauriDir, "Cargo.toml");
const cargoLockPath = join(tauriDir, "Cargo.lock");
const tauriConfigFilePattern = /^tauri(?:\.[^.]+)*\.conf\.json$/;

function log(message: string) {
    console.log(`[sync-version] ${message}`);
}

function ensurePackageManifest(value: unknown): IPackageManifest {
    if (
        !value ||
        typeof value !== "object" ||
        typeof (value as Partial<IPackageManifest>).name !== "string" ||
        typeof (value as Partial<IPackageManifest>).version !== "string"
    ) {
        throw new Error("package.json 缺少有效的 name 或 version 字段。");
    }

    return value as IPackageManifest;
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function syncJsonVersion(filePath: string, version: string) {
    const rawContent = await readFile(filePath, "utf8");
    const parsedContent = JSON.parse(rawContent) as IJsonObject;

    if (typeof parsedContent.version !== "string") {
        return false;
    }

    if (parsedContent.version === version) {
        return false;
    }

    const versionPattern = /("version"\s*:\s*")(.*?)(")/;

    if (!versionPattern.test(rawContent)) {
        throw new Error(`未在 ${filePath} 中找到可同步的 version 字段。`);
    }

    const nextContent = rawContent.replace(versionPattern, `$1${version}$3`);
    await writeFile(filePath, nextContent, "utf8");
    return true;
}

async function syncTauriConfigs(version: string) {
    const entries = await readdir(tauriDir, { withFileTypes: true });
    let updatedCount = 0;

    for (const entry of entries) {
        if (!entry.isFile() || !tauriConfigFilePattern.test(entry.name)) {
            continue;
        }

        const filePath = join(tauriDir, entry.name);
        const updated = await syncJsonVersion(filePath, version);

        if (updated) {
            updatedCount += 1;
            log(`已同步 ${entry.name}`);
        }
    }

    return updatedCount;
}

async function syncCargoToml(version: string) {
    const rawContent = await readFile(cargoTomlPath, "utf8");
    const packageVersionPattern =
        /(\[package\][\s\S]*?^\s*version = ")(.*?)(")/m;
    const matched = rawContent.match(packageVersionPattern);

    if (!matched) {
        throw new Error("未在 Cargo.toml 的 [package] 段中找到 version 字段。");
    }

    if (matched[2] === version) {
        return false;
    }

    const nextContent = rawContent.replace(
        packageVersionPattern,
        `$1${version}$3`,
    );
    await writeFile(cargoTomlPath, nextContent, "utf8");
    log("已同步 Cargo.toml");
    return true;
}

async function syncCargoLock(packageName: string, version: string) {
    const rawContent = await readFile(cargoLockPath, "utf8");
    const packageNamePattern = escapeRegExp(packageName);
    const packageVersionPattern = new RegExp(
        `(\\[\\[package\\]\\](?:\\r?\\n)name = \"${packageNamePattern}\"(?:\\r?\\n)version = \")(.*?)(\")`,
        "m",
    );
    const matched = rawContent.match(packageVersionPattern);

    if (!matched) {
        throw new Error(`未在 Cargo.lock 中找到 ${packageName} 的根包版本。`);
    }

    if (matched[2] === version) {
        return false;
    }

    const nextContent = rawContent.replace(
        packageVersionPattern,
        `$1${version}$3`,
    );
    await writeFile(cargoLockPath, nextContent, "utf8");
    log("已同步 Cargo.lock");
    return true;
}

async function main() {
    const packageManifest = ensurePackageManifest(
        JSON.parse(await readFile(packageJsonPath, "utf8")),
    );
    const { name, version } = packageManifest;

    log(`开始同步版本 ${version}`);

    const tauriConfigUpdatedCount = await syncTauriConfigs(version);
    const cargoTomlUpdated = await syncCargoToml(version);
    const cargoLockUpdated = await syncCargoLock(name, version);

    if (
        tauriConfigUpdatedCount === 0 &&
        !cargoTomlUpdated &&
        !cargoLockUpdated
    ) {
        log("所有版本号已是最新，无需更新。");
        return;
    }

    log("版本同步完成。");
}

main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[sync-version] ${message}`);
    process.exitCode = 1;
});
