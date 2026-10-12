# Growth Rings · v45.1

沉淀每一轮研究，接续每一次判断。

这是用户确认的完整前端产品，供 REDcowork 克隆运行。**v45.1 已将用户批准用于递交演示的完整 V3 收入前端资源：12 条对话记录，其中 11 条含用户发言，以及 4 条研究小结。** 全新浏览器普通访问即可查看完整作品，无需已有浏览器存档，也无需先聊四轮生成 V3。

## 使用本仓库

| 版本 | 仓库 | 用途 |
| --- | --- | --- |
| **本次完整演示 v45.1** | **https://github.com/Morii-si/growth-rings-workbench-v45** | REDcowork 本次导入或升级使用 |
| 同仓库历史发布 v45 | 上述新仓库的 `ui-v45` | 保留历史，不作为本次交付入口 |
| 旧产品仓库 | https://github.com/Morii-si/growth-rings-workbench | 与本次独立交付分开，不更新 |

本次固定标签为 **`ui-v45.1`**，包版本 `0.45.1`。原 `ui-v45` 标签保留。v45.1 是产品发布版本；产品内 V1、V2、V3 是研究轮次。

```sh
git clone --branch ui-v45.1 --single-branch https://github.com/Morii-si/growth-rings-workbench-v45.git
cd growth-rings-workbench-v45
npm ci
npm run dev
```

使用 Node.js 24（`.nvmrc` 已提供）。开发服务默认 http://localhost:5173，也读取平台提供的 `PORT`。已有 REDcowork 项目必须先核对远端是 `growth-rings-workbench-v45`，再按 [导入说明](RED_COWORK_IMPORT.md) 升级；不要在旧产品仓库拉取。

## 查看与演示

1. 普通访问 `/`，从“我的研究工作台”进入泡泡玛特，已有完整讨论和 V3。
2. 看板入口 `/?screen=company&tab=boards&version=3`：查看四条可展开研究小结；“讨论原文”包含完整用户提问和助手回复。
3. 讨论入口 `/?screen=company&tab=discussion&mode=conversation`：续接已存档的对话。
4. 展开小结并点击“引用并讨论”，带着原文继续交流；点击“更新研究看板”后才纳入新内容，历史快照保留。
5. 若要从头演示，使用 `/?entry=opening`。它创建独立空会话，从半年报提示开始逐条聊天，再生成看板；顶部“返回原讨论”回到普通存档中的完整作品。

普通访问会优先保留用户在本站新增的本机记录。独立开场不清空普通存档。交付资源自带演示作品，因此换浏览器或新域名也能看见同一份内置 V3；之后产生的本机记录不跨设备同步。

当前 UI 无独立草稿、待查事项、AI 主动跟进、直接编辑表单、“讨论新类目”按钮或“演示说明”。这是纯静态前端案例：预设问题有本地预置回复，自由问题保留原文，未连接实时 AI、后端或数据库。“导出”下载当前存档 JSON。

## 运行与部署

先阅读 [RED_COWORK_IMPORT.md](RED_COWORK_IMPORT.md)，原样运行现有代码和资源。正式构建：

```sh
npm test
npm run build
```

发布 **`dist/`**，保留 `index.html` 与全部 `assets/`。部署后只需静态文件服务，无需 API Key、数据库或 Node 后端。`npm run preview` 默认使用端口 4173。ES module 源码需通过 HTTP(S) 访问，不用 `file://` 打开。

## 文件与资源

- `index.html`、根目录 JavaScript/CSS：完整前端源码。
- `bundled-research-content.js`、`bundled-research-demo.js`：已批准的 V3 存档和安全初始化逻辑，由 Vite 打入浏览器资源。
- `assets/`：年轮 Logo、favicon、聊天图标和第三方许可；构建时完整复制到 `dist/`。
- `scripts/build.mjs`、锁文件与根目录 `*.test.js`：构建与模型测试。
- [documentation/architecture.md](documentation/architecture.md)：初始化、存档与架构边界。
- [documentation/release-validation.md](documentation/release-validation.md)：分版本验证状态。
- [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)：第三方来源与许可。
- `release-manifest.json`：源文件及资源校验清单。

财报 PDF 保留公告外链，打开时需要联网。Logo、图标和演示内容均在包内，页面没有运行时远程字体或图片依赖。

## 平台配置

Vite 预览若提示 `Blocked request`，将实际预览域名加入 `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` 后重启；生产静态目录无需此配置。iframe 应允许脚本、同源存储、新窗口和下载；权限不足时提供独立页面。

验收必须使用一次全新浏览器普通访问，确认 **12 条对话、11 条用户发言和 4 条小结**均可直接看到，再检查独立开场、返回作品、引用更新、导出与手机布局。最新结果以验证记录为准。
