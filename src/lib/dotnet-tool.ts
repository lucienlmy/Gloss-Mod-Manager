import { appLocalDataDir, basename, dirname, join } from "@tauri-apps/api/path";
import { platform } from "@tauri-apps/plugin-os";
import { Command } from "@tauri-apps/plugin-shell";
import { FileHandler } from "@/lib/FileHandler";
import { Manager } from "@/lib/Manager";
import { useManager } from "@/stores/manager";

interface IDotNetInvokeOptions {
    assemblyPath: string;
    typeName: string;
    methodName: string;
    payload?: unknown;
    runtimeMode?: "original" | "isolatedDirectory";
}

interface IPreparedManagedToolRuntime {
    assemblyPath: string;
    runtimeDirectory: string;
}

const jsonBridgeTypeDefinition = [
    "using System;",
    "using System.Collections;",
    "using System.Collections.Generic;",
    "using System.Dynamic;",
    "using System.Web.Script.Serialization;",
    "public static class CopilotDynamicJsonBridge {",
    "    public static object Parse(string json) {",
    "        if (String.IsNullOrWhiteSpace(json)) {",
    "            return null;",
    "        }",
    "",
    "        var serializer = new JavaScriptSerializer();",
    "        return ToDynamic(serializer.DeserializeObject(json));",
    "    }",
    "",
    "    private static object ToDynamic(object value) {",
    "        var dictionary = value as IDictionary<string, object>;",
    "        if (dictionary != null) {",
    "            IDictionary<string, object> expando = new ExpandoObject();",
    "            foreach (var pair in dictionary) {",
    "                expando[pair.Key] = ToDynamic(pair.Value);",
    "            }",
    "",
    "            return (ExpandoObject)expando;",
    "        }",
    "",
    "        var list = value as ArrayList;",
    "        if (list != null) {",
    "            var result = new List<object>();",
    "            foreach (var item in list) {",
    "                result.Add(ToDynamic(item));",
    "            }",
    "",
    "            return result;",
    "        }",
    "",
    "        return value;",
    "    }",
    "}",
].join("\n");

function getRelativeBaseName(filePath: string) {
    return (
        filePath
            .replace(/[\\/]+/gu, "/")
            .split("/")
            .pop()
            ?.toLowerCase() ?? ""
    );
}

function toPowerShellLiteral(value: string) {
    return `'${value.replace(/'/gu, "''")}'`;
}

function sanitizePathSegment(value: string) {
    return value
        .replace(/[<>:"/\\|?*\u0000-\u001f]+/gu, "_")
        .replace(/\s+/gu, "-")
        .replace(/_+/gu, "_")
        .replace(/-+/gu, "-")
        .replace(/^[-_]+|[-_]+$/gu, "");
}

function toOutputBytes(output: unknown) {
    if (output instanceof Uint8Array) {
        return output;
    }

    if (output instanceof ArrayBuffer) {
        return new Uint8Array(output);
    }

    if (ArrayBuffer.isView(output)) {
        return new Uint8Array(
            output.buffer,
            output.byteOffset,
            output.byteLength,
        );
    }

    if (Array.isArray(output)) {
        return Uint8Array.from(output);
    }

    if (
        output &&
        typeof output === "object" &&
        "data" in output &&
        Array.isArray(output.data)
    ) {
        return Uint8Array.from(output.data);
    }

    return new Uint8Array();
}

function decodeOutput(output: unknown) {
    if (typeof output === "string") {
        return output.trim();
    }

    const bytes = toOutputBytes(output);

    if (bytes.length === 0) {
        return "";
    }

    try {
        return new TextDecoder("utf-8", { fatal: true }).decode(bytes).trim();
    } catch {
        return new TextDecoder().decode(bytes).trim();
    }
}

async function executePowerShell(script: string) {
    if (platform() !== "windows") {
        throw new Error("当前仅支持在 Windows 环境下调用 .NET 工具。");
    }

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
        {
            encoding: "raw",
        },
    ).execute();

    if (result.code === 0) {
        return decodeOutput(result.stdout);
    }

    throw new Error(
        decodeOutput(result.stderr) ||
            decodeOutput(result.stdout) ||
            `PowerShell exited with code ${result.code ?? "null"}`,
    );
}

/**
 * Tauri 前端无法直接复用 Electron Edge，这里退回到 PowerShell + 反射调用托管 DLL。
 */
export class DotNetTool {
    /**
     * 个别托管工具会读取同目录下的附属文件，隔离复制后执行可以避开源目录文件锁问题。
     */
    private static async prepareRuntimeDirectory(
        options: IDotNetInvokeOptions,
    ): Promise<IPreparedManagedToolRuntime | null> {
        if (options.runtimeMode !== "isolatedDirectory") {
            return null;
        }

        const sourceDirectory = await dirname(options.assemblyPath);
        const assemblyFileName = await basename(options.assemblyPath);
        const runtimeRoot = await join(await appLocalDataDir(), "dotnet-tools");
        const runtimeDirectoryName = [
            sanitizePathSegment(options.typeName) || "tool",
            sanitizePathSegment(assemblyFileName) || "assembly",
            Date.now().toString(),
            Math.random().toString(36).slice(2, 8),
        ].join("-");
        const runtimeDirectory = await join(runtimeRoot, runtimeDirectoryName);
        const copied = await FileHandler.copyFolder(
            sourceDirectory,
            runtimeDirectory,
        );

        if (!copied) {
            throw new Error(
                `复制托管工具运行目录失败：${options.assemblyPath}`,
            );
        }

        const runtimeAssemblyPath = await join(
            runtimeDirectory,
            assemblyFileName,
        );

        if (!(await FileHandler.fileExists(runtimeAssemblyPath))) {
            throw new Error(
                `隔离运行目录中缺少托管工具：${runtimeAssemblyPath}`,
            );
        }

        return {
            assemblyPath: runtimeAssemblyPath,
            runtimeDirectory,
        };
    }

    public static async resolveManagedToolPath(
        fileName: string,
        webId?: number | string,
    ) {
        const manager = useManager();
        const normalizedFileName = fileName.toLowerCase();
        const toolMod = manager.managerModList.find((mod) => {
            if (
                webId !== undefined &&
                String(mod.webId ?? "") === String(webId)
            ) {
                return true;
            }

            return mod.modFiles.some(
                (item) => getRelativeBaseName(item) === normalizedFileName,
            );
        });

        if (!toolMod) {
            return "";
        }

        const modStorage = await Manager.getModStoragePath(toolMod.id);

        if (!modStorage) {
            return "";
        }

        for (const item of toolMod.modFiles) {
            if (getRelativeBaseName(item) !== normalizedFileName) {
                continue;
            }

            const candidatePath = await join(modStorage, item);

            if (await FileHandler.fileExists(candidatePath)) {
                return candidatePath;
            }
        }

        const directCandidate = await join(modStorage, fileName);
        return (await FileHandler.fileExists(directCandidate))
            ? directCandidate
            : "";
    }

    public static async invoke<T = unknown>(options: IDotNetInvokeOptions) {
        const hasPayload = "payload" in options;

        if (!(await FileHandler.fileExists(options.assemblyPath))) {
            throw new Error(`未找到托管工具：${options.assemblyPath}`);
        }

        const runtime = await DotNetTool.prepareRuntimeDirectory(options);
        const assemblyPath = runtime?.assemblyPath ?? options.assemblyPath;
        const payloadText = JSON.stringify(hasPayload ? options.payload : null);
        const script = [
            "$ErrorActionPreference = 'Stop'",
            "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8",
            `$assemblyPath = ${toPowerShellLiteral(assemblyPath)}`,
            `$typeName = ${toPowerShellLiteral(options.typeName)}`,
            `$methodName = ${toPowerShellLiteral(options.methodName)}`,
            `$payloadText = ${toPowerShellLiteral(payloadText)}`,
            `$hasPayload = ${toPowerShellLiteral(hasPayload ? "1" : "0")}`,
            `$jsonBridgeTypeDefinition = ${toPowerShellLiteral(
                jsonBridgeTypeDefinition,
            )}`,
            "if (-not ('CopilotDynamicJsonBridge' -as [type])) { Add-Type -ReferencedAssemblies 'System.Web.Extensions' -TypeDefinition $jsonBridgeTypeDefinition }",
            "$assembly = [Reflection.Assembly]::LoadFrom($assemblyPath)",
            "$type = $assembly.GetType($typeName, $true)",
            "$bindingFlags = [Reflection.BindingFlags]'Public, NonPublic, Instance, Static, DeclaredOnly'",
            "$expectedParameterCount = if ($hasPayload -eq '1') { 1 } else { 0 }",
            "$methodCandidates = $type.GetMethods($bindingFlags) | Where-Object { $_.Name -eq $methodName }",
            "$method = $methodCandidates | Where-Object { $_.GetParameters().Length -eq $expectedParameterCount } | Select-Object -First 1",
            "if ($null -eq $method -and $expectedParameterCount -eq 0) { $method = $methodCandidates | Where-Object { $_.GetParameters().Length -eq 1 } | Select-Object -First 1 }",
            'if ($null -eq $method) { throw "未找到方法: $typeName::$methodName" }',
            "$payload = $null",
            "if ($hasPayload -eq '1') { $payload = [CopilotDynamicJsonBridge]::Parse($payloadText) }",
            "$instance = if ($method.IsStatic) { $null } else { [Activator]::CreateInstance($type, $true) }",
            "$parameterCount = $method.GetParameters().Length",
            'if ($parameterCount -gt 1) { throw "暂不支持调用多参数方法: $typeName::$methodName" }',
            "$parameters = New-Object object[] $parameterCount",
            "if ($parameterCount -eq 1) { $parameters[0] = $payload; }",
            "$result = $method.Invoke($instance, $parameters)",
            "if ($result -is [System.Threading.Tasks.Task]) { $result.GetAwaiter().GetResult() | Out-Null; $resultType = $result.GetType(); if ($resultType.IsGenericType) { $result = $resultType.GetProperty('Result').GetValue($result) } else { $result = $null } }",
            "[Console]::Write((ConvertTo-Json -Depth 100 -Compress -InputObject $result))",
        ].join("\n");

        try {
            const raw = await executePowerShell(script);
            return (raw ? JSON.parse(raw) : null) as T;
        } finally {
            if (runtime?.runtimeDirectory) {
                await FileHandler.deleteFolder(runtime.runtimeDirectory);
            }
        }
    }
}
