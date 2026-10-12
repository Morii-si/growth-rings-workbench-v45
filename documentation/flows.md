# Flows

以下操作均由当前浏览器使用者发起。没有服务端角色或资源授权检查；限制由本机 UI/model 校验实现。[Permissions](permissions.md) 说明其适用边界。

| 场景 / 前提 | UI → 数据过程 | 成功结果与拒绝条件 |
| --- | --- | --- |
| 普通初访与恢复 | `resolveResearchSession()` 选 key → `loadBundledResearchState()` 读取并校验 → 缺失时创建内置完整作品，有效旧存档则恢复 | 全新普通访问直接有 12 条对话、11 条用户发言和 4 条小结；普通已有新增记录优先保留；损坏/读取失败不覆盖原值 |
| 已识别旧记录修复 | 完整状态精确指纹匹配 → 保存旧 raw 字符串并读回核对 → 保留兼容数据并加入批准作品 | 只迁移已确认指纹；不同备份已存在或备份失败则保留旧状态并阻止保存。重复访问不重复迁移，不以类目数或消息数判断 |
| 独立开场 | `entry=opening` 创建新 `demo-session` → 空会话开场 → 可自行发送并生成看板 | 不注入批准 V3，不覆盖普通 key；顶部返回原讨论回到普通完整作品和后续本机修改 |
| 发送讨论 | 输入保存到 `conversationDraft` → 发送调用 `sendRoundInput()` → 精确匹配案例问句后取本地回复 → `persist()` | 消息及引用快照保存在本机。空输入或伪造/不匹配的预置问句被拒绝；未匹配的自由输入原样保存，未生成的答复保持空值 |
| 首次生成看板 | 用户点击生成 → `generateConversationBoard()` 汇总实际已发送讨论 → 深拷贝记录及 V3 看板 → localStorage | 无已发送用户消息时拒绝生成；类目来自实际讨论，生成不要求任务勾选，不创建待查事项或后台任务 |
| 引用并修改研究 | 选中内容或点击类目「引用并讨论」→ 冻结 `boardConversationReference` → 用户发送 → 形成本地 `boardChange` 提议 → 用户点击更新 → 校验后追加新快照 | 引用、取消、发送均不改已保存看板。目标内容已变化或提议非法时拒绝更新，不部分写入；成功后保留旧快照及当时引用。支持的改写是确定性案例/明确文字指令，非自由 LLM 编辑 |
| 回看历史 | 历史菜单选择 V1/V2/V3 → `openHistoryBoard()` 改 UI 路由与展示范围 | 不重写研究内容；普通初访已有内置 V3；独立空开场尚未生成时不提供该会话的 V3 选项。较早历史不补入之后的材料或讨论 |
| 本机保存与跨窗口 | `persist()` 序列化整份 state → localStorage；同源另一窗口收到当前 key 的 `storage` 事件后恢复 | 存储失败显示错误并建议导出；跨窗口是整份状态替换，没有并发合并。记录在清理浏览器存储后可能丢失 |
| 导出研究记录 | 当前 state → JSON → Blob → 浏览器下载 | 导出包含当前存档完整研究原文，不上传服务器，不改动本机存档 |
| 查看外部材料 | 用户点击公告链接 → 浏览器新标签打开资料站点 | 这是浏览器→外部站点的边界；链接带 `noopener noreferrer`，应用不把聊天原文作为请求参数发送 |

主要代码：[bundled-research-demo.js](../bundled-research-demo.js)、[app.js](../app.js)、[research-session.js](../research-session.js)、[research-draft-model.js](../research-draft-model.js)、[research-draft-view.js](../research-draft-view.js)。所有流程均不经过后台任务、邮件服务或远程 AI provider。
