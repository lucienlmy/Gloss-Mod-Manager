
export interface IMod {
    id: number
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
}

export interface IModInfo {
    id: number
    modName: string
    modVersion: string
    modType: number
    isInstalled: boolean
    weight: number
    modFiles: string[]
    modDesc?: string
    modAuthor?: string
    modWebsite?: string
    corePlugins?: IPlugins[]
}

export interface IGameInfo {
    gameName: string
    gameEnName: string
    gameExe: string
    gamePath?: string
    gameVersion?: string
    gameCoverImg?: string
}

export interface IPlugins {
    id: number
    name: string
    version: string
    website: string
    modAuthor?: string
    installPath: string
}

export interface IType {
    id: number | "plugin"
    name: string
    installPath: string
    corePlugins?: IPlugins[]
    install: (mod: IModInfo) => void
    uninstall: (mod: IModInfo) => void
}

export interface ISupportedGames extends IGameInfo {
    modType: IType[]
    corePlugins?: IPlugins[]
}

export interface ISettings {
    managerGame: ISupportedGames
    modStorageLocation: string
    proxy: string
}