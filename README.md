# <center>极光模组管理器 <small>Gloss Mod Manager </small> </center>

<center> 

![][license] ![][author] ![][Electron] ![][vue] ![][vuetify] [![][GitHub]](https://github.com/GlossMod/Gloss-Mod-Manager)
</center> 

---- 

### 这是什么？
极光模组管理器(Gloss Mod Manager) 简称GMM, 是一款综合性的游戏模组管理器.
是一款功能强大的综合性游戏Mod管理器, 它为游戏玩家提供了简单易用的方式来管理和安装各种游戏Mod.
无论你是新手还是老手,使用GMM都会让你的Mod安装和管理更加轻松和快捷.

### 如何使用？
- 下载并安装它,
- 解压到任意位置.
- 运行 `Gloss Mod Manager`.
- 选择您游玩的游戏
- 开始享受吧!

### 支持的游戏
- [x] 艾尔登法环 (完全支持)
- [x] 只狼 (完全支持)
- [x] 霍格沃兹之遗 (完全支持)
- [x] 求生之路 (完全支持)
- [x] 赛博朋克2077 (完全支持)
- [ ] ~~模拟人生4 (计划中)  (无法打开游戏 暂时搁置)~~
- [x] 怪物猎人:世界 (完全支持)
- [ ] 怪物猎人:崛起 (计划中)
- [x] 鬼谷八荒 (完全支持)
- [x] 太吾绘卷 (完全支持)
- [x] 觅长生 (完全支持)
- [x] 噬血代码 (完全支持)
- [x] 生化危机4 重制版 (部分支持)
    - 目前仅适配基于 REFramework 的脚本
- [x] 星露谷物语 (完全支持)
- [ ] 生化危机3 重制版 (计划中)
- [ ] 生化危机2 重制版 (计划中)
- [ ] 生化危机8 (计划中)
- [ ] 巫师3 (计划中)
- [ ] 鬼泣5 (计划中)
- [ ] 上古卷轴5 天际 (计划中)
- [ ] 上古卷轴5 天际 重制版 (计划中)
- [ ] 辐射4 (计划中)
- [ ] 巫师5 (计划中)
- [ ] 戴森球计划 (计划中)
- [ ] ... (计划中)

### 反馈问题

- [GitHub](https://github.com/GlossMod)
- [Discord](https://discord.gg/TF46tu7Upw)
- [Patreon](https://www.patreon.com/GlossModManager)


### 开发计划
- [x] 设计工具整体风格和界面样式。
- [x] 完成工具基础架构, 制作游览Mod功能。
- [x] 添加下载Mod功能。
- [x] 实现安装和管理Mod功能。
- [x] 适配一些热门游戏
- [x] 自动检查更新
- [ ] 实现制作Mod包功能
- [ ] 添加上传Mod包功能到Mod站。
- [ ] 自动检查Mod更新功能
- [ ] 实现Mod排序功能, 并允许用户自定义排序方式。
- [ ] 自动处理Mod冲突问题
- [ ] 用户登录功能，以便管理云端数据。
- [x] 添加启动游戏功能，并允许用户选择游戏路径。
    - 部分游戏已支持
- [x] 多语言国际化，允许用户切换应用程序语言。


### 代码规范

1. 命名规范:
 - 类名使用 PascalCase（即每个单词首字母大写）。
 - 变量名和函数名使用 camelCase（即除了首个单词，其他单词首字符大写）。
 - 文件名使用 kebab-case（即将单词用短横线分隔）。
 - 接口名使用 I 前缀，枚举名使用 E 前缀。
 - 类型别名和 泛型类型使用 PascalCase。

2. 类型：
 - 对于简单的类型，使用内置 TypeScript 类型（例如 string、number）。
 - 对于复杂的类型，使用接口。
 - 如果声明变量时没有指定类型，则尽可能给出类型。
 - 在代码中使用 readonly 替代 const。

3. 引用：
 - 在文件开头先 import 导入需要的文件。
 - 一个 import 语句只引用一个模块。
 - 避免使用命名空间，而是使用 ES6 的 export 和 import 语句。

4. 注释：
 - 随缘 根据自己的习惯

5. 缩进：
 - 使用 4 个空格缩进。
 - 不要使用 tab 字符。

6. 格式：
 - 将大括号放在同一行的语句块中。
 - 在关键字前后加上空格（例如 if 和 else）。
 - 在函数名和调用之间使用空格（例如 function foo()）。
 - 使用字符串模板代替字符串连接。

7. 其他规范：
 - 避免使用 any 类型。
 - 使用默认参数而不是函数重载。
 - 避免使用无意义的变量名。
 - 遵循单一职责原则，一个类、一个组件只负责一项功能。
 - 优先使用对象解构来获取变量。
 - 避免代码冗余，将相似的代码封装到函数或组件中。



[license]:https://p.aoe.top/shields/github/license/GlossMod/Gloss-Mod-Manager.svg
[author]: https://p.aoe.top/shields/badge/作者-小莫-blue?logo=Cloudera
[Electron]: https://p.aoe.top/shields/badge/Electron-22.0.3-47848F?logo=electron
[vue]: https://p.aoe.top/shields/badge/Vue3-3.2.45-4FC08D?logo=vuedotjs
[vuetify]: https://p.aoe.top/shields/badge/Vuetify-3.1.15-1867C0?logo=vuetify
[pinia]: https://p.aoe.top/shields/badge/pinia-2.0.30-1867C0?logo=vuetify
[typescript]: https://p.aoe.top/shields/badge/TypeScript-5.0.4-3178C6?logo=typescript
[GitHub]: https://p.aoe.top/shields/github/stars/GlossMod/Gloss-Mod-Manager.svg?style=social&label=Stars
