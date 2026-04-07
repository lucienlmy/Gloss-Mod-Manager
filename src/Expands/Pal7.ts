/**
 * @description 仙剑奇侠传7 支持
 */

import { join } from "@tauri-apps/api/path";
import { appDataDir } from "@tauri-apps/api/path";

export class Pal7 {
    public object: ISupportedGames = {} as ISupportedGames;
    public info: ISupportedGames | null = null;

    constructor(object: ISupportedGames) {
        this.object = object;
        this.setInfo();
    }

    async setInfo() {
        this.info = {
            GlossGameId: 277,
            steamAppID: 1543030,
            nexusMods: {
                game_domain_name: "swordandfairy7",
                game_id: 4194,
            },
            installdir: await join("仙剑奇侠传七"),
            gameName: "Pal7",
            gameExe: "Pal7.exe",
            startExe: [
                {
                    name: "Steam 启动",
                    cmd: "steam://rungameid/1543030",
                },
                {
                    name: "直接启动",
                    exePath: "Pal7.exe",
                },
            ],
            archivePath: await join(
                await appDataDir(),
                "Local",
                "Pal7",
                "Saved",
            ),

            gameCoverImg:
                "https://assets-mod.3dmgame.com/static/upload/game/6256729d72a41.png",
            modType: UnrealEngine.modType("Pal7", false),
            checkModType: UnrealEngine.checkModType,
        };
    }
}
