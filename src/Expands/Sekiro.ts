/**
 * @description 只狼 安装支持
 */

import { basename, join } from "@tauri-apps/api/path";
import { FileHandler } from "@/lib/FileHandler";

let dictionaryList: string[] = [];

export const supportedGames = async () =>
    ({
        GlossGameId: 185,
        steamAppID: 814380,
        nexusMods: {
            game_domain_name: "sekiro",
            game_id: 2763,
        },
        installdir: "Sekiro",
        gameName: "sekiro",
        gameExe: "sekiro.exe",
        startExe: [
            {
                name: "Steam 启动",
                cmd: "steam://rungameid/814380",
            },
            {
                name: "直接启动",
                exePath: "sekiro.exe",
            },
        ],
        gameCoverImg:
            "https://assets-mod.3dmgame.com/static/upload/game/185.png",
        modType: [],
        async checkModType(mod) {
            // if (mod.webId == 71282) return 2

            if (dictionaryList.length == 0) {
                // let SekiroDictionary = (await axios.get("res/SekiroDictionary.txt")).data
                let SekiroDictionary = await FileHandler.readFile(
                    await join(
                        await FileHandler.getResourcesPath(),
                        "res",
                        "SekiroDictionary.txt",
                    ),
                );
                dictionaryList = SekiroDictionary.split("\r\n");
            }

            let engine = false;
            let mods = false;

            for (const item of mod.modFiles) {
                if ((await basename(item)) == "dinput8.dll") engine = true;
                if (
                    dictionaryList.find((item2) =>
                        FileHandler.compareFileName(item, item2),
                    )
                )
                    mods = true;
            }

            if (engine) return 2;
            if (mods) return 1;

            return 99;
        },
    }) as ISupportedGames;
