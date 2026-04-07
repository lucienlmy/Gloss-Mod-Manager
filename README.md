# Gloss Mod Manager

### 这是什么？
Gloss Mod Manager (GMM) 是一款综合性的现代化游戏模组管理器.
它为游戏玩家提供了一个简单易用的方式来管理和安装各种游戏Mod.
安全无毒, 简单易用, 可帮助您快捷的 下载、安装、卸载 Mod.
无论你是新手还是老手,使用GMM都会让你的Mod安装和管理更加轻松和快捷.

### 兼容平台
- Windows 
- macOS 
- Linux 

### 内嵌工具链
项目现在会把以下工具作为 Tauri sidecar 自动准备并打包进应用：

- 7-Zip 26.00
- aria2 1.37.0

自动准备会在以下时机触发：

- `npm install`
- `npm run dev`
- `npm run build`

实现位置：

- `scripts/prepare-sidecars.ts`
- `src/lib/sevenZip.ts`
- `src/lib/aria2.ts`
- `src/lib/sidecar.ts`

平台策略：

- Windows：下载官方 7-Zip 与 aria2 发布包，并将对应二进制重命名为 Tauri sidecar 需要的目标三元组文件名。
- macOS / Linux：下载官方 7-Zip 发布包；aria2 使用官方源码包在当前平台本地构建后再内嵌。

可用环境变量：

- `GMM_TARGET_TRIPLE`：手动覆盖 sidecar 目标 triple，适合交叉构建场景。
- `GMM_FORCE_SIDECAR_REFRESH=1`：强制重新下载/重新构建 sidecar。
- `GMM_SKIP_SIDECAR_PREPARE=1`：跳过 sidecar 自动准备。

注意：

- macOS / Linux 上的 aria2 来自官方源码构建，因此需要本机具备编译工具链与相关依赖库；如果缺少依赖，`prepare:sidecars` 会直接失败。
- Windows 上 7-Zip 会额外打包 `7za.dll` 与 `7zxa.dll`，以保证 sidecar 在发布包内可用。

