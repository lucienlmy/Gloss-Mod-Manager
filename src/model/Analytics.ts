/**
 * 数据分享
 */
// import { _hmt } from "@src/ts/hmt";

export class Analytics {
    /**
     * 启动应用
     */
    public static startApp() {
        _hmt.push(['_trackPageview', "/?start_app"]);
    }
    /**
     * 安装Mod
     */
    public static installMod() {
        _hmt.push(['_trackPageview', "/?install_mod"]);
    }
    /**
     * 卸载Mod
     */
    public static uninstallMod() {
        _hmt.push(['_trackPageview', "/?uninstall_mod"]);
    }

    /**
     * 选择游戏
     * @param game 
     */
    public static selectGame(game: string) {
        _hmt.push(['_trackPageview', `/?select_game_${game}`]);
    }

    /**
     * 游览Mod
     */
    public static viewMod() {
        _hmt.push(['_trackPageview', "/?view_mod"]);
    }
    /**
     * 下载管理
     */
    public static downloadManager() {
        _hmt.push(['_trackPageview', "/?download_manager"]);
    }

    /**
     * 设置
     */
    public static setting() {
        _hmt.push(['_trackPageview', "/?setting"]);
    }

    /**
     * 关于
     */
    public static about() {
        _hmt.push(['_trackPageview', "/?about"]);
    }

    /**
     * 通用
     */
    public static general(key: string) {
        _hmt.push(['_trackPageview', `/?${key}`]);
    }
}