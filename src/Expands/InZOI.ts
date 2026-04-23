import { basename, join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";
import { Manager } from "@/lib/Manager";
import { UnrealEngine } from "@/lib/UnrealEngine";

/**
 * @description inZOI 支持
 */
async function enableModManifest(mod: IModInfo) {
    const modStorage = await Manager.getModStoragePath(mod.id);

    if (!modStorage) {
        return;
    }

    for (const item of mod.modFiles) {
        if ((await basename(item)) !== "mod_manifest.json") {
            continue;
        }

        const jsonFilePath = await join(modStorage, item);
        const raw = await FileHandler.readFile(jsonFilePath, "{}");
        const data = JSON.parse(raw) as Record<string, unknown>;
        data.bEnable = true;
        await FileHandler.writeFile(
            jsonFilePath,
            JSON.stringify(data, null, 4),
        );
    }
}

export const supportedGames = async () =>
    ({
        GlossGameId: 421,
        steamAppID: 2456740,
        nexusMods: {
            game_domain_name: "inzoi",
            game_id: 7480,
        },
        curseforge: 88849,
        installdir: await join("inZOI"),
        gameName: "inZOI",
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/2456740",
            },
            {
                name: "直接启动",
                exePath: "inZOI.exe",
            },
        ],
        gameExe: "inZOI.exe",
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/mod/202503/MOD67c7ff0ec9f40.webp@webp",
        modType: [
            ...(await UnrealEngine.modType("BlueClient", false)),
            {
                id: 7,
                name: "MODkit",
                installPath: await join(
                    await FileHandler.getMyDocuments(),
                    "inZOI",
                    "Mods",
                ),
                async install(mod) {
                    await enableModManifest(mod);
                    return Manager.installByFile(
                        mod,
                        this.installPath ?? "",
                        "mod_manifest.json",
                        true,
                        false,
                        false,
                    );
                },
                async uninstall(mod) {
                    return Manager.installByFile(
                        mod,
                        this.installPath ?? "",
                        "mod_manifest.json",
                        false,
                        false,
                        false,
                    );
                },
            },
        ],
        async checkModType(mod) {
            let typeId = 99;

            for (const item of mod.modFiles) {
                if ((await basename(item)) === "mod_manifest.json") {
                    return 7;
                }
            }

            typeId = await UnrealEngine.checkModType(mod);
            if (typeId !== 99) {
                return typeId;
            }

            for (const item of mod.modFiles) {
                const pathParts = FileHandler.pathToArray(item);
                if (pathParts.includes("BlueClient")) {
                    return 6;
                }
            }

            return typeId;
        },
    }) as ISupportedGames;
