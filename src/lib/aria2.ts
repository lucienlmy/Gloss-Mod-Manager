import { Sidecar, type SidecarCommandOptions } from "@/lib/sidecar";

export interface Aria2DownloadOptions extends SidecarCommandOptions {
    uris: string[];
    outputDirectory: string;
    fileName?: string;
    continueDownload?: boolean;
    allowOverwrite?: boolean;
    split?: number;
    connectionsPerServer?: number;
    minSplitSize?: string;
    headers?: Record<string, string>;
    userAgent?: string;
    referer?: string;
    loadCookies?: string;
    saveCookies?: string;
    checksum?: string;
    maxDownloadLimit?: string;
    maxOverallDownloadLimit?: string;
    timeoutSeconds?: number;
    extraArgs?: string[];
}

export interface Aria2RpcServerOptions extends SidecarCommandOptions {
    outputDirectory?: string;
    listenPort?: number;
    secret?: string;
    listenAll?: boolean;
    continueDownload?: boolean;
    extraArgs?: string[];
}

export class Aria2 {
    /**
     * 向参数列表追加 --key=value 形式的可选参数。
     */
    private static pushOptionalArg(
        args: string[],
        name: string,
        value?: string | number | boolean,
    ) {
        if (value === undefined) {
            return;
        }

        args.push(`--${name}=${String(value)}`);
    }

    /**
     * 将请求头批量展开为 aria2 可识别的命令行参数。
     */
    private static pushHeaders(
        args: string[],
        headers?: Record<string, string>,
    ) {
        for (const [key, value] of Object.entries(headers ?? {})) {
            args.push(`--header=${key}: ${value}`);
        }
    }

    /**
     * 根据下载配置生成 aria2 下载命令参数。
     */
    public static buildDownloadArgs(options: Aria2DownloadOptions) {
        if (options.uris.length === 0) {
            throw new Error("aria2 requires at least one URI");
        }

        const args: string[] = [];

        Aria2.pushOptionalArg(args, "dir", options.outputDirectory);
        Aria2.pushOptionalArg(args, "out", options.fileName);
        Aria2.pushOptionalArg(
            args,
            "continue",
            options.continueDownload ?? true,
        );
        Aria2.pushOptionalArg(
            args,
            "allow-overwrite",
            options.allowOverwrite ?? true,
        );
        Aria2.pushOptionalArg(args, "split", options.split);
        Aria2.pushOptionalArg(
            args,
            "max-connection-per-server",
            options.connectionsPerServer,
        );
        Aria2.pushOptionalArg(args, "min-split-size", options.minSplitSize);
        Aria2.pushOptionalArg(args, "user-agent", options.userAgent);
        Aria2.pushOptionalArg(args, "referer", options.referer);
        Aria2.pushOptionalArg(args, "load-cookies", options.loadCookies);
        Aria2.pushOptionalArg(args, "save-cookies", options.saveCookies);
        Aria2.pushOptionalArg(args, "checksum", options.checksum);
        Aria2.pushOptionalArg(
            args,
            "max-download-limit",
            options.maxDownloadLimit,
        );
        Aria2.pushOptionalArg(
            args,
            "max-overall-download-limit",
            options.maxOverallDownloadLimit,
        );
        Aria2.pushOptionalArg(args, "timeout", options.timeoutSeconds);
        Aria2.pushHeaders(args, options.headers);
        args.push(...(options.extraArgs ?? []));
        args.push(...options.uris);

        return args;
    }

    /**
     * 生成 aria2 RPC 服务启动参数。
     */
    public static buildRpcServerArgs(options: Aria2RpcServerOptions = {}) {
        const args = ["--enable-rpc=true"];

        Aria2.pushOptionalArg(args, "dir", options.outputDirectory);
        Aria2.pushOptionalArg(
            args,
            "rpc-listen-port",
            options.listenPort ?? 6800,
        );
        Aria2.pushOptionalArg(args, "rpc-secret", options.secret);
        Aria2.pushOptionalArg(
            args,
            "rpc-listen-all",
            options.listenAll ?? false,
        );
        Aria2.pushOptionalArg(
            args,
            "continue",
            options.continueDownload ?? true,
        );
        args.push(...(options.extraArgs ?? []));

        return args;
    }

    /**
     * 直接执行一次 aria2 下载命令。
     */
    public static async download(options: Aria2DownloadOptions) {
        return Sidecar.executeAria2(Aria2.buildDownloadArgs(options), options);
    }

    /**
     * 以子进程形式启动下载任务，便于后续持续控制。
     */
    public static async spawnDownload(options: Aria2DownloadOptions) {
        return Sidecar.spawnAria2(Aria2.buildDownloadArgs(options), options);
    }

    /**
     * 启动 aria2 RPC 服务进程。
     */
    public static async startRpcServer(options: Aria2RpcServerOptions = {}) {
        return Sidecar.spawnAria2(Aria2.buildRpcServerArgs(options), options);
    }

    /**
     * 透传参数执行自定义 aria2 命令。
     */
    public static async runCommand(
        args: readonly string[],
        options: SidecarCommandOptions = {},
    ) {
        return Sidecar.executeAria2(args, options);
    }
}
