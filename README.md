# Growth Rings · v45

沉淀每一轮研究，接续每一次判断。

这是用户确认的 **v45 完整前端产品**，独立发布给 REDcowork 克隆运行。包含首页、全页聊天、V1/V2 历史研究、由本轮聊天生成的 V3 看板，以及全部 Logo、图标、样式与构建脚本。

## 使用本仓库

| 版本 | 仓库 | 用途 |
| --- | --- | --- |
| **本次确认版 v45** | **https://github.com/Morii-si/growth-rings-workbench-v45** | 本次 REDcowork 复刻使用 |
| 旧版 | https://github.com/Morii-si/growth-rings-workbench | 历史版本，本次未更新 |

固定版本标签：`ui-v45`。这里的 **v45 是界面发布版本**；产品内 V1、V2、V3 是研究轮次。

请在新目录或新的 REDcowork 项目中克隆本仓库。已有旧项目时，先核对远端地址，不要在旧仓库执行拉取后把它当作本次版本。

```sh
git clone --branch ui-v45 --single-branch https://github.com/Morii-si/growth-rings-workbench-v45.git
cd growth-rings-workbench-v45
npm ci
npm run dev
```

使用 Node.js 24（`.nvmrc` 已提供）。开发服务默认 http://localhost:5173；平台提供 `PORT` 时自动使用该端口。

## REDcowork 导入

将 [RED_COWORK_IMPORT.md](RED_COWORK_IMPORT.md) 的内容交给 REDcowork。请原样运行已有产品，不依据描述重新生成 UI。

正式构建：

```sh
npm test
npm run build
```

静态发布目录为 **`dist/`**，其中包含 `index.html` 和全部本地资源。部署后的运行环境只需静态文件服务，无需 Node 后端、数据库或 API Key。`npm run preview` 可本地检查构建产物，默认端口 4173。不要用 `file://` 直接打开 ES module 源码。

## 演示流程

1. 首页“我的研究工作台”选择泡泡玛特，进入本次讨论。
2. 助手提示半年报发布。选择预设问题逐条讨论，也可以输入自己的问题。
3. 点击输入框旁的“生成研究看板”，保存本轮讨论形成 V3。
4. 展开研究小结，点击“引用并讨论”，带着原文继续与助手交流。
5. 对话产生修改建议后，点击“更新研究看板”再纳入；历史讨论与快照保留。
6. 在“历史研究看板”菜单切换 V1、V2、V3，打开“讨论原文”回看。

全新浏览器没有本机生成的 V3，先讨论再生成即可。可用 `/?entry=opening` 从新的独立演示开场进入；它保留原本机记录。UI 已取消独立草稿、待查事项、主动跟进、“讨论新类目”按钮和底部“演示说明”。

这是纯前端案例：预设问题有预置回复，自由问题保留原文，不接实时 AI。新增记录保存在当前站点的浏览器 localStorage，刷新可恢复；“导出”下载 JSON。旧站点的个人浏览记录不在仓库中，也不会自动迁移到新域名。

## 文件与资源

- `index.html`、根目录 JavaScript/CSS：完整前端源码。
- `assets/`：年轮 Logo、favicon、聊天图标和第三方许可。
- `scripts/build.mjs`：Vite 构建并复制所有本地资源。
- `*.test.js`：现有研究模型和数据保留测试，执行 `npm test`。
- [documentation/architecture.md](documentation/architecture.md)：架构与交接资料。
- [documentation/release-validation.md](documentation/release-validation.md)：本次浏览器验证结果。
- [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)：第三方资源来源与许可。
- `release-manifest.json`：本次源文件及资源校验清单。

财报 PDF 保留公告外链，不属于仓库中的本地图片；打开时需要联网。页面使用系统字体，没有运行时远程字体或图片依赖。

## 平台配置

如 Vite 预览提示 `Blocked request`，只将实际平台预览域名加入 `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS`，然后重启预览。生产静态目录 `dist/` 不需要此设置。

如平台使用 iframe，需允许脚本、同源存储、新窗口和文件下载；相关权限不具备时使用独立页面预览。正式发布后检查 Logo/图标、生成与更新看板、历史切换、原文滚动、导出和手机布局。
