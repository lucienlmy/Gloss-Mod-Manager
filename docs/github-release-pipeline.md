# GitHub Releases 自动发布

本文档说明当前仓库的 GitHub Actions 发布流程，以及需要提前配置的仓库设置与 Secrets。

## 已实现内容

- 工作流文件：`.github/workflows/release.yml`
- 触发方式：推送 `v*` 版本标签，或手动执行 `workflow_dispatch`
- 发布目标：自动构建并上传 Windows x64、Linux x64、macOS x64、macOS arm64 安装包到 GitHub Releases
- 版本校验：`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml` 三处版本必须一致

## 触发规则

### 自动发布

1. 先把以下文件中的版本号改成同一个值：
   - `package.json`
   - `src-tauri/tauri.conf.json`
   - `src-tauri/Cargo.toml`
2. 推送版本标签：

```bash
git tag v2.0.1
git push origin v2.0.1
```

工作流会校验标签是否与版本一致，不一致会直接失败。

### 手动发布

在 GitHub 仓库的 `Actions -> release` 中手动运行即可。

手动运行时，工作流会基于当前代码版本创建或更新 `v__VERSION__` 对应的 Release。

## 仓库设置

发布前请确认 GitHub 仓库已开启：

1. `Settings -> Actions -> General -> Workflow permissions`
2. 选择 `Read and write permissions`

否则 `GITHUB_TOKEN` 只有只读权限，上传 Release 资产时会报 `Resource not accessible by integration`。

## Secrets

### 必需项

当前这套 GitHub Releases 流程没有额外必填 Secret。

- `GITHUB_TOKEN` 由 GitHub Actions 自动提供

### 可选项

以下 Secret 已经在工作流里接好，配置后会自动生效：

- `GLOSS_MOD_KEY`：Gloss Mod 相关接口鉴权 key
- `MODID_KEY`：mod.io 接口 key
- `MODID_UID_KEY`：mod.io 用户维度接口 key
- `CURSE_FORGE_KEY`：CurseForge 接口 key
- `TAURI_SIGNING_PRIVATE_KEY`：Tauri updater / 签名私钥内容
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`：私钥密码
- `APPLE_CERTIFICATE`：导出的 `.p12` 证书 base64 内容
- `APPLE_CERTIFICATE_PASSWORD`：`.p12` 证书密码
- `APPLE_SIGNING_IDENTITY`：可选，macOS 签名 identity
- `APPLE_API_ISSUER`：Apple Notarization 的 issuer id
- `APPLE_API_KEY`：Apple Notarization 的 key id
- `APPLE_API_KEY_CONTENT`：`.p8` 私钥文件内容

如果你希望发布包里的探索 / 详情 / 第三方平台检索功能可直接使用，建议同时在 GitHub 仓库 Secrets 中配置上面这四个业务接口变量。它们会在构建阶段注入到 Vite 环境中，行为与本地 `.env` 一致。

## 平台说明

### macOS

- 工作流支持 x64 与 arm64 原生 runner 打包
- 如果未配置 Apple 证书，macOS 产物仍可能构建成功，但不会完成代码签名 / 公证
- 当前工作流已经支持把 `APPLE_API_KEY_CONTENT` 写入临时文件，并导出为 `APPLE_API_KEY_PATH`

### Linux

仓库的 `scripts/prepare-sidecars.ts` 会在 Linux 上从源码编译 aria2，因此工作流里额外安装了：

- `build-essential`
- `autoconf` / `automake` / `libtool`
- `openssl` / `libxml2` / `zlib` / `sqlite` / `libssh2` / `c-ares` 相关开发包

### Windows

工作流默认发布常规 Windows 安装包到 GitHub Releases。

## Microsoft Store

当前发布流程的目标是 GitHub Releases，不会直接上传到 Microsoft Store。

仓库已额外提供 `src-tauri/tauri.microsoftstore.conf.json`，用于 Microsoft Store 场景下切换到 `offlineInstaller` 模式。后续如果要接入商店发布，可以在单独 job 中执行：

```bash
yarn tauri build -- --bundles nsis,msi --config src-tauri/tauri.microsoftstore.conf.json
```

如果要真正上架 Microsoft Store，还需要额外确认：

- Partner Center 中的应用保留名
- 代码签名配置
- `bundle.publisher` 是否与商店配置匹配

## 备注

- 当前工作流使用 `actions/checkout@v6` 与 `actions/setup-node@v6`，以避免 GitHub Actions 对 Node.js 20 runtime 的弃用告警
- 当前工作流继续使用 `tauri-apps/tauri-action@v0`，对应 updater 配置项为 `includeUpdaterJson`
- macOS 依赖安装步骤仅在 Homebrew 缺少对应 formula 时才执行，避免 `already installed and up-to-date` 警告注解
- 当前工作流显式使用 `macos-13` 与 `macos-14`，避免 sidecar 在交叉构建时生成错误架构的内嵌二进制
- 当前工作流已启用 `includeUpdaterJson: true`，并通过附加配置 `src-tauri/tauri.release.conf.json` 仅在 CI 发布时开启 `createUpdaterArtifacts`
- 默认的 `yarn tauri build` 不会生成 updater 签名产物，因此不会因为本地缺少 `TAURI_SIGNING_PRIVATE_KEY` 而失败
- GitHub Releases 静态 JSON 端点使用 `https://github.com/GlossMod/Gloss-Mod-Manager/releases/latest/download/latest.json`
- updater 公钥当前在 `src-tauri/src/lib.rs` 中通过 Rust builder 注入，仓库内仍使用显式占位符，正式发布前必须替换为真实的 Tauri 公钥 PEM 文本
- 只有在发布构建环境中提供 `TAURI_SIGNING_PRIVATE_KEY` 与 `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` 时，`latest.json` 和对应签名构件才能被正确生成