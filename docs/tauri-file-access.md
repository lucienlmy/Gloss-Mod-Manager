# Tauri 任意路径文件访问说明

## 背景

`@tauri-apps/plugin-fs` 的前端 API 默认要求路径相对于某个 `baseDir`，不直接支持绝对路径访问。

这意味着仅在 capability 中放宽 `fs` 权限，并不能让前端直接读写 `C:/`、`D:/`、Steam 库目录或其他任意位置。

## 当前实现

项目在 [src-tauri/src/lib.rs](../src-tauri/src/lib.rs) 中新增了一组 `native_fs_*` 命令，直接使用 Rust 标准库处理绝对路径文件操作：

- 判断存在
- 创建目录
- 读取文本/二进制文件
- 写入文本/二进制文件
- 复制文件
- 重命名
- 删除文件或目录
- 读取元数据
- 枚举目录

前端的 [src/lib/FileHandler.ts](../src/lib/FileHandler.ts) 会在检测到绝对路径时自动走这些 Rust 命令；相对路径仍继续使用 `@tauri-apps/plugin-fs`。

## 这样做的原因

这种分流方式有两个目的：

1. 保留现有基于 `plugin-fs` 的相对路径能力，不破坏应用内已有逻辑。
2. 为游戏目录、Steam 库、用户自定义安装路径等绝对路径场景提供稳定的读写能力。

## 注意事项

- 这等同于把桌面端文件访问能力提升到宿主机原生权限级别，调用入口必须尽量集中在 `FileHandler`，避免在业务代码中到处分散直接 `invoke`。
- 如果后续需要限制访问范围，应优先在 `FileHandler` 中增加白名单或路径校验，而不是回退到前端直接调用 `plugin-fs` 处理绝对路径。