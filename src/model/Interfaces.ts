// import { Download } from "@src/model/Download"


export interface IMod {
    id: number
    nexus_id?: string
    mods_author: string
    mods_content: string
    mods_createTime: string
    mods_desc?: string
    mods_image_url?: string
    mods_images_url?: string
    mods_isRecommend: number
    mods_original: number
    mods_title: string
    mods_updateTime: string
    mods_version?: string
    user_nickName: string
    mods_credits?: number
    mods_directions?: string
    mods_key?: string
    mods_original_url?: string
    mods_publish: number
    mods_state: number
    mods_type_id?: number
    mods_type_name?: string
    mods_showAD: number
    mods_license?: string

    mods_SilverSnakeCoin_cnt: number
    mods_click_cnt: number
    mods_collection_cnt: number
    mods_download_cnt: number
    mods_mark_cnt: number

    user_Intr?: string
    user_avatar?: string
    user_tag?: string
    user_tag_colour?: string
    user_fan: number

    game_cover_imgUrl?: string
    game_name?: string
    game_id?: number
    game_imgUrl?: string
    game_path?: string

    mods_resource_name: string
    mods_resource_desc?: string
    mods_resource_url: string
    mods_resource_createTime: string
    mods_resource_size: string

    mods_charge_content?: number
    mods_adult_content?: number
    mods_API?: number
}

export interface IUser {
    id: number
    user_Intr?: string
    user_avatar?: string
    user_fan?: number
    user_gender?: number
    user_nickName?: string
    user_tag?: string
    user_tag_colour?: string
    user_silverSnakeCoin?: number
    user_state?: number
    user_p_show_adult?: -1 | 1
    user_p_show_charge?: -1 | 1
    user_tag_p?: -1 | 1
    user_p_favor?: -1 | 1
    user_p_tobbs?: -1 | 1
    user_p_ckmsg?: -1 | 1
    user_p_ctmsg?: -1 | 1
    mod_count?: number
    mod_original_conut?: number
    mod_translate_conut?: number
    user_protocol_time?: string
    timeout?: number
}

export interface IModInfo {
    id: number
    webId?: number
    nexus_id?: string
    modName: string
    gameID?: number
    md5: string
    modVersion: string
    isUpdate?: boolean
    modType?: number
    isInstalled: boolean
    weight: number
    modFiles: string[]
    modDesc?: string
    modAuthor?: string
    modWebsite?: string
    corePlugins?: [
        { id: number, name: string }
    ]
}

export interface IGameExe {
    name: string
    rootPath: string
}
export interface IStartExe {
    name: string
    exePath: string
}

export interface IGameInfo {
    gameID: number
    steamAppID: number
    installdir?: string
    gameName: string
    gameExe: string | IGameExe[]
    startExe?: string | IStartExe[]
    gamePath?: string
    gameVersion?: string
    gameCoverImg?: string
    NexusMods?: {
        game_id: number
        game_domain_name: string
    }
}

export interface IPlugins {
    id: number
    name: string
    version: string
    website: string
    modAuthor?: string
    installPath: string
    md5?: string[]
}


export interface IState {
    file: string,
    state: boolean
}

export interface IType {
    id: number | "plugin"
    name: string
    installPath?: string
    corePlugins?: IPlugins[]
    install: (mod: IModInfo) => Promise<IState[] | boolean>
    uninstall: (mod: IModInfo) => Promise<IState[] | boolean>
    checkPlugin?: (plugin: IModInfo) => boolean
}

export interface ISupportedGames extends IGameInfo {
    modType: IType[]
    // corePlugins?: IPlugins[]
    checkModType: (mod: IModInfo) => number
}

export interface ISettings {
    managerGame?: ISupportedGames
    managerGameList: ISupportedGames[]
    modStorageLocation: string
    tourGameList: number[]
    proxy: string
    // UnzipPath: string
    autoInstall: boolean
    leftMenuRail: boolean
    autoLaunch: boolean
    language: string
    theme: 'light' | 'dark' | 'system'
    fold: boolean,
    exploreType: "GlossMod" | "NexusMods"
}

export interface IDownloadTask {
    id: number
    nexus_id?: string
    type: "GlossMod" | "NexusMods"
    gid?: string
    name: string
    version: string
    status: "active" | "waiting" | "paused" | "error" | "complete" | "removed"
    speed: number
    totalSize: number
    downloadedSize: number
    link: string
    modAuthor: string
}

export interface IFileTreeNode {
    label: string;
    path: string;
    checked?: boolean;
    children?: IFileTreeNode[];
}


export interface IInfo {
    name?: string
    version: string
    description?: string
    gameID?: number
    author?: string
}

export interface IAria2Request {
    jsonrpc: string;
    id?: string;
    method: string;
    params: any[];
}
