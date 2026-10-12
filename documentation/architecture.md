# Architecture

Growth Rings v45 是可独立运行的股票研究交互 Demo：用户通过聊天生成研究看板，引用看板内容继续讨论，再明确点击更新。V1/V2 是预置历史，V3 是当前浏览器生成的研究快照。对话和财报数据均来自仓库预置内容，未连接实时 AI 或金融数据服务。

## Runtime map

| 层 | 实际实现 |
| --- | --- |
| 页面与构建 | 原生 JavaScript ES modules、HTML/CSS、Vite；`index.html` → `app.js`；`scripts/build.mjs` 构建并复制本地 assets 到 `dist/` |
| 当前聊天与看板 | `research-chat-view.js`、`research-draft-view.js`；后者保留历史文件名，当前 UI 没有独立草稿页或直接编辑表单 |
| 对话、引用、显式更新 | `research-draft-model.js`；预置问答来自 `research-directions.js`，自由输入未匹配时保留原文，`answer=null` |
| 已保存记录 | `research-room-model.js` 的 `researchRoom.records` / `generatedBoards`；保存时深拷贝类目、消息、引用、基线和数据 |
| 财报及历史上下文 | `engine.js`、`research-data.js`、`research-memory.js`、`board.js`；只在相应历史范围展示材料 |
| 本机持久化 | `app.js` 的 `persist()` / `restore()`；`research-session.js` 选择当前 localStorage 命名空间 |
| 品牌与交互 | 本地 assets、分层 CSS、自定义版本菜单 `board-version-menu.js`、开场文字动效 `research-text-type.js` |

没有登录、token、角色声明、数据库或应用服务器。Vite 仅负责开发/预览静态文件；生产交付物是 `dist/`。浏览器加载静态资源，显式打开资料链接时访问外部公告站点；研究内容没有服务端上传路径。

## Boundaries and assumptions

- 浏览器同源存储是数据边界，`demo-session` 只是本机存档名称，不能作为身份认证。打开同一个链接不会跨设备共享研究记录（`research-session.js`）。
- 快照冻结依靠应用层深拷贝；用户仍可在开发者工具中修改 localStorage。它不是不可篡改审计存储（`appendConversationSnapshot()`）。
- 更新前校验被引用类目是否变化；冲突时要求重新引用，拒绝部分写入（`generateConversationBoard()`）。发送消息本身不更新看板。
- 多窗口通过 `storage` 事件恢复最新整份状态，没有合并或写入锁；同时编辑可能互相覆盖（`app.js`）。
- 预置财务数据与来源链接用于展示，页面不会自动刷新披露数据，也不会检验外部链接是否仍有效（`engine.js`、`research-data.js`）。
- 旧草稿、任务、提醒、`view=review` 等兼容代码和测试仍在仓库；它们不代表当前默认产品承诺。默认流程不生成待查任务，不运行 AI 主动跟进。`app.js` 中遗留的 `reset` / `confirm-reset` handler 没有当前 UI 入口。

不发送邮件、不运行定时任务或外部 agent/tool，故不另建 `emails.md`、`cron.md`、`automation.md`。页面仅有静态 metadata，没有路由级 SEO 或社交预览方案，本交接不另建 `seo.md`。

## Related documents

- [Flows](flows.md)：持久化、快照、引用及导出的副作用。
- [Permissions](permissions.md)：本机用户与数据访问边界。
- [Variables](variables.md)：端口、host、存储键与发布配置。
- [Tests](tests.md)：现有覆盖、建议测试与未验证项。
- [Release validation](release-validation.md)：本次交接的浏览器检查结果与范围。
