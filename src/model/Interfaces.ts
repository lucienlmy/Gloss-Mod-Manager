// import { Download } from "@src/model/Download"

export type sourceType = "GlossMod" | "NexusMods" | "Thunderstore" | "ModIo"


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
    from?: sourceType
    webId?: number
    nexus_id?: string
    modIo_id?: number
    modName: string
    gameID?: number
    md5: string
    modVersion: string
    tags?: ITag[]
    isUpdate?: boolean
    modType?: number
    isInstalled: boolean
    weight: number
    modFiles: string[]
    modDesc?: string
    modAuthor?: string
    modWebsite?: string
    advanced?: {
        enabled: boolean
        data: any
    }
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
    GlossGameId: number
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
    },
    Thunderstore?: {
        community_identifier: string
    },
    mod_io?: {
        game_id: number
    }
}

export interface IState {
    file: string,
    state: boolean
}

interface IAdvancedItem {
    type: "input" | "selects" | "switch"
    label: string
    key: string
    selectItem?: { name: string, value: string }[]
    defaultValue?: string | boolean
}

export interface IType {
    id: number
    name: string
    installPath?: string
    advanced?: {
        name: string
        icon: string
        item: IAdvancedItem[]
    }
    install: (mod: IModInfo) => Promise<IState[] | boolean>
    uninstall: (mod: IModInfo) => Promise<IState[] | boolean>
    checkPlugin?: (plugin: IModInfo) => boolean
}

export interface ISupportedGames extends IGameInfo {
    modType: IType[]
    checkModType: (mod: IModInfo) => number
    sortMod?: (list: IModInfo[]) => boolean
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
    exploreType: sourceType
    selectGameByFolder: boolean
    showPakeMessage: boolean
}

export interface IDownloadTask {
    id: number | string
    nexus_id?: string
    Thunderstore?: {
        full_name?: string
    }
    type: sourceType
    gid?: string
    name: string
    version: string
    status: "active" | "waiting" | "paused" | "error" | "complete" | "removed"
    speed: number
    totalSize: number
    downloadedSize: number
    link: string
    modAuthor: string
    website?: string
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


export interface ITag {
    name: string
    color: string
}

export interface IThunderstoreModVersions {
    name: string
    full_name: string
    description: string
    icon: string
    version_number: string
    dependencies: string[]
    download_url: string
    downloads: number
    date_created: string
    website_url: string
    is_active: boolean
    uuid4: string
    file_size: number
}

export interface IThunderstoreMod {
    name: string
    full_name: string
    owner: string
    package_url: string
    date_created: string
    date_updated: string
    uuid4: string
    rating_score: number
    is_pinned: boolean
    is_deprecated: boolean
    has_nsfw_content: boolean
    categories: string[]
    versions: IThunderstoreModVersions[]
    latest: IThunderstoreModVersions
}

export interface IModIo {
    id: number;
    game_id: number;
    status: number;
    visible: number;
    submitted_by: IModIoSubmittedBy;
    date_added: number;
    date_updated: number;
    date_live: number;
    maturity_option: number;
    community_options: number;
    monetization_options: number;
    price: number;
    tax: number;
    logo: IModIoLogo;
    homepage_url: string;
    name: string;
    name_id: string;
    summary: string;
    description: string;
    description_plaintext: string;
    metadata_blob: null;
    profile_url: string;
    media: IModIoMedia;
    modfile: IModIoModfile;
    dependencies: boolean;
    platforms: any[];
    metadata_kvp: any[];
    tags: IModIoTag[];
    stats: IModIoStats;
}


export interface IModIoStats {
    mod_id: number;
    popularity_rank_position: number;
    popularity_rank_total_mods: number;
    downloads_today: number;
    downloads_total: number;
    subscribers_total: number;
    ratings_total: number;
    ratings_positive: number;
    ratings_negative: number;
    ratings_percentage_positive: number;
    ratings_weighted_aggregate: number;
    ratings_display_text: string;
    date_expires: number;
}

export interface IModIoTag {
    name: string;
    date_added: number;
}

export interface IModIoModfile {
    id: number;
    mod_id: number;
    date_added: number;
    date_updated: number;
    date_scanned: number;
    virus_status: number;
    virus_positive: number;
    virustotal_hash: null;
    filesize: number;
    filesize_uncompressed: number;
    filehash: IModIoFilehash;
    filename: string;
    version: string;
    changelog: null;
    metadata_blob: null;
    download: IModIoDownload;
    platforms: any[];
}

export interface IModIoDownload {
    binary_url: string;
    date_expires: number;
}

export interface IModIoFilehash {
    md5: string;
}

export interface IModIoMedia {
    youtube: any[];
    sketchfab: any[];
    images: IModIoImage[];
}

export interface IModIoImage {
    filename: string;
    original: string;
    thumb_320x180: string;
    thumb_1280x720: string;
}

export interface IModIoLogo {
    filename: string;
    original: string;
    thumb_320x180: string;
    thumb_640x360: string;
    thumb_1280x720: string;
}

export interface IModIoSubmittedBy {
    id: number;
    name_id: string;
    username: string;
    display_name_portal: null;
    date_online: number;
    date_joined: number;
    avatar: IModIoAvatar;
    timezone: string;
    language: string;
    profile_url: string;
}

export interface IModIoAvatar {
    filename: string;
    original: string;
    thumb_50x50: string;
    thumb_100x100: string;
}