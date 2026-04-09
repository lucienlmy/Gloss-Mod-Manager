import { Command, type Child } from "@tauri-apps/plugin-shell";
import {
    NativeToolsManifest,
    type EmbeddedSidecarCommand,
} from "@/lib/native-tools-manifest";

export interface SidecarCommandOptions {
    cwd?: string;
    env?: Record<string, string>;
}

export interface SidecarResult {
    code: number | null;
    signal: number | null;
    stdout: string;
    stderr: string;
    ok: boolean;
}

export interface SpawnedSidecarProcess {
    child: Child;
    command: Command<string>;
    stop: () => Promise<void>;
}

export class SidecarExecutionError extends Error {
    public readonly commandName: EmbeddedSidecarCommand;
    public readonly args: readonly string[];
    public readonly result: SidecarResult;

    /**
     * 构造包含命令上下文的 sidecar 执行异常。
     */
    public constructor(
        commandName: EmbeddedSidecarCommand,
        args: readonly string[],
        result: SidecarResult,
    ) {
        const detail =
            result.stderr.trim() ||
            result.stdout.trim() ||
            "sidecar execution failed";

        super(
            `${commandName} ${args.join(" ")} exited with code ${result.code ?? "null"}: ${detail}`,
        );

        this.name = "SidecarExecutionError";
        this.commandName = commandName;
        this.args = [...args];
        this.result = result;
    }
}

export class Sidecar {
    /**
     * 将 shell 插件返回结果标准化为统一结构。
     */
    private static toResult(output: {
        code: number | null;
        signal: number | null;
        stdout: string;
        stderr: string;
    }): SidecarResult {
        return {
            ...output,
            ok: output.code === 0,
        };
    }

    /**
     * 执行 sidecar 命令，并在失败时抛出带上下文的异常。
     */
    public static async execute(
        commandName: EmbeddedSidecarCommand,
        args: readonly string[],
        options: SidecarCommandOptions = {},
    ): Promise<SidecarResult> {
        const output = await Command.sidecar(
            commandName,
            [...args],
            options,
        ).execute();
        const result = Sidecar.toResult(output);

        if (!result.ok) {
            throw new SidecarExecutionError(commandName, args, result);
        }

        return result;
    }

    /**
     * 启动一个可持续控制的 sidecar 子进程。
     */
    public static async spawn(
        commandName: EmbeddedSidecarCommand,
        args: readonly string[],
        options: SidecarCommandOptions = {},
    ): Promise<SpawnedSidecarProcess> {
        const command = Command.sidecar(commandName, [...args], options);
        const child = await command.spawn();

        return {
            child,
            command,
            stop: async () => child.kill(),
        };
    }

    /**
     * 执行 7-Zip sidecar。
     */
    public static async executeSevenZip(
        args: readonly string[],
        options: SidecarCommandOptions = {},
    ) {
        return Sidecar.execute(
            NativeToolsManifest.SIDECAR_COMMANDS.sevenZip,
            args,
            options,
        );
    }

    /**
     * 执行 aria2 sidecar。
     */
    public static async executeAria2(
        args: readonly string[],
        options: SidecarCommandOptions = {},
    ) {
        return Sidecar.execute(
            NativeToolsManifest.SIDECAR_COMMANDS.aria2,
            args,
            options,
        );
    }

    /**
     * 启动 aria2 sidecar 子进程。
     */
    public static async spawnAria2(
        args: readonly string[],
        options: SidecarCommandOptions = {},
    ) {
        return Sidecar.spawn(
            NativeToolsManifest.SIDECAR_COMMANDS.aria2,
            args,
            options,
        );
    }
}
