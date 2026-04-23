import { basename, dirname, join } from "@tauri-apps/api/path";
import { Command } from "@tauri-apps/plugin-shell";
import { ElMessage } from "element-plus-message";
import { FileHandler } from "@/lib/FileHandler";
import { Manager } from "@/lib/Manager";

function toPowerShellLiteral(value: string) {
    return `'${value.replace(/'/g, "''")}'`;
}

async function handleSMAPI(mod: IModInfo, isInstall: boolean) {
    const modStorage = await Manager.getModStoragePath(mod.id);
    const { gameStorage } = await Manager.getContext();

    if (!modStorage || !gameStorage) {
        return false;
    }

    let installerDirectory = modStorage;
    for (const item of mod.modFiles) {
        if ((await basename(item)) === "SMAPI.Installer.exe") {
            installerDirectory = await join(modStorage, await dirname(item));
            break;
        }
    }

    const installerPath = await join(installerDirectory, "SMAPI.Installer.exe");
    if (!(await FileHandler.fileExists(installerPath))) {
        ElMessage.warning("未找到 SMAPI.Installer.exe，无法执行自动安装。");
        return false;
    }

    const script = [
        "$ErrorActionPreference = 'Stop'",
        `$installer = ${toPowerShellLiteral(installerPath)}`,
        `$workingDirectory = ${toPowerShellLiteral(installerDirectory)}`,
        `$gamePath = ${toPowerShellLiteral(gameStorage)}`,
        "$arguments = @('--no-prompt')",
        isInstall ? "$arguments += '--install'" : "$arguments += '--uninstall'",
        "$arguments += '--game-path'",
        "$arguments += $gamePath",
        "Start-Process -FilePath $installer -WorkingDirectory $workingDirectory -ArgumentList $arguments -Wait",
    ].join("; ");

    const result = await Command.create(
        "powershell",
        [
            "-NoLogo",
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            script,
        ],
        { encoding: "raw" },
    ).execute();

    return result.code === 0;
}

/**
 * @description 星露谷物语支持
 */
export const supportedGames = async () =>
    ({
        GlossGameId: 10,
        steamAppID: 413150,
        curseforge: 669,
        nexusMods: {
            game_domain_name: "stardewvalley",
            game_id: 1303,
        },
        installdir: "Stardew Valley",
        gameName: "Stardew Valley",
        gameExe: "Stardew Valley.exe",
        startExe: [
            {
                name: "启用 Mod 并启动游戏",
                exePath: "StardewModdingAPI.exe",
            },
            {
                name: "禁用 Mod 并启动游戏",
                exePath: "Stardew Valley.exe",
            },
            {
                name: "Steam 启动 (无 Mod)",
                cmd: "steam://rungameid/413150",
            },
        ],
        archivePath: await join(
            await FileHandler.GetAppData(),
            "Roaming",
            "StardewValley",
        ),
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/game/10.jpg",
        modType: [
            {
                id: 1,
                name: "SMAPI",
                installPath: "",
                async install(mod) {
                    return handleSMAPI(mod, true);
                },
                async uninstall(mod) {
                    return handleSMAPI(mod, false);
                },
            },
            {
                id: 2,
                name: "通用",
                installPath: "Mods",
                async install(mod) {
                    return Manager.installByFile(
                        mod,
                        this.installPath ?? "",
                        "manifest.json",
                        true,
                        false,
                    );
                },
                async uninstall(mod) {
                    return Manager.installByFile(
                        mod,
                        this.installPath ?? "",
                        "manifest.json",
                        false,
                        false,
                    );
                },
            },
            {
                id: 99,
                name: "未知",
                installPath: "",
                async install(_mod) {
                    ElMessage.warning("未知类型，请手动安装");
                    return false;
                },
                async uninstall(_mod) {
                    return true;
                },
            },
        ],
        async checkModType(mod) {
            let plugins = false;
            let smapi = false;

            for (const item of mod.modFiles) {
                if ((await basename(item)) === "SMAPI.Installer.dll")
                    smapi = true;
                if ((await basename(item)) === "manifest.json") plugins = true;
            }

            if (smapi) return 1;
            if (plugins) return 2;

            return 99;
        },
    }) as ISupportedGames;
