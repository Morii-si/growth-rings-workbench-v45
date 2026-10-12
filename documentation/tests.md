# Verification map

`npm test` 执行仓库根目录的 `*.test.js`（Node 内置 test runner），`npm run build` 执行 Vite 构建和 assets 复制。v45.1 已通过 138/138 项单元测试（含 14 项内置作品与存储保护测试）、生产构建及 7 项浏览器验收，页面错误和网络请求错误均为 0。详情见 [Release validation](release-validation.md) 与 [内置作品浏览器验证](bundled-data-validation.md)；公开发布后的匿名 clone 尚待核对，这些命令可在 clone 后重跑。旧标签 `ui-v45` 的 124 项单测记录单独保留为历史证据。仓库当前没有 `.github/workflows`，没有代码内声明的 CI 必须通过项；托管平台的分支保护配置未由本文件核验。

## Existing coverage

| Use case → rule | Expected behavior / negative case | Evidence | Status |
| --- | --- | --- | --- |
| 完整作品初始化 | 无本机存档的普通访问直接载入 12 条对话 / 11 条用户发言 / 4 条小结；不重复追加 | `bundled-research-demo.test.js`；[浏览器验证](bundled-data-validation.md) | Passed：unit + desktop/mobile browser |
| 既有本机记录保留 | 已有用户新增文字/快照保持；少消息或单类目不触发覆盖 | `bundled-research-demo.test.js`；[浏览器验证](bundled-data-validation.md) | Passed：unit + browser |
| 精确旧记录迁移与失败 | 仅完整状态指纹匹配才迁移；先写 raw 备份并读回；冲突/失败/损坏阻止覆盖 | `bundled-research-demo.test.js`；[浏览器验证](bundled-data-validation.md) | Passed：unit；browser 验证精确恢复与相似存档保护 |
| 开场存档隔离 | 新开场不覆盖普通 key；刷新恢复相同 key；非法 session id 不能逃逸命名空间 | [Flows](flows.md)；`research-session.js` / `research-session.test.js` | Existing unit |
| 真实用户讨论后生成 | 仅开场或未发送输入不能生成；生成不要求待查任务；旧任务字段不影响新产物 | [Flows](flows.md)；`generateConversationBoard()` / `research-board-direct.test.js` | Existing unit |
| 显式更新与冻结快照 | 新讨论不静默纳入；旧类目、原文、引用、人工编辑及已有快照保留 | [Architecture](architecture.md)；`research-draft-model.js` / `research-board-direct.test.js`、`research-board-quote.test.js` | Existing unit |
| 引用后讨论 | 引用/取消不发送或修改；未发送文字和引用可恢复；清除引用后普通问题不继承它 | [Flows](flows.md)；`setBoardConversationReference()` / `research-board-quote.test.js` | Existing unit |
| 修改提议完整性 | 不匹配的建议 id/文字拒绝；目标变化拒绝且不部分写入；其他类目更新不误阻塞 | [Permissions](permissions.md)；`sendBoardConversationInput()`、`generateConversationBoard()` / `research-board-quote.test.js` | Existing unit |
| 预置回复与自由输入 | 未匹配原文完整保留，不伪造回答/金融事实；国内口径不被集团数据替代 | [Architecture](architecture.md)；`research-draft-model.js` / `research-draft.test.js`、`research-board-quote.test.js` | Existing unit |
| 历史范围与显示安全 | 旧历史不获得未来讨论/材料；任意输入的 HTML 被转义；损坏基础状态回初始值 | [Permissions](permissions.md)；`engine.js`、`research-memory.js` / `engine.test.js`、`discussion.test.js`、`research-dialogue.test.js` | Existing unit |
| 案例计算一致性 | 披露维度之和匹配集团收入，同期计算保留来源口径 | [Architecture](architecture.md)；`research-data.js` / `research.test.js` | Existing unit |

部分旧测试仍覆盖草稿编辑、任务、跟进规则和直接编辑 model API（例如 `continuity.test.js`、`research-return.test.js`）。这些是兼容性覆盖，不能据此判断当前 UI 提供相应功能。现有计算测试验证固定数据内部一致性，不验证外部公告的真实性或可用性。

分版本浏览器验证记录在 [Release validation](release-validation.md)。旧 ui-v45 覆盖桌面/手机开场、生成看板、引用后显式更新、历史切换、导出及刷新恢复；v45.1 已在独立 Chrome 的 1470 × 760 和 390 × 844 视口覆盖完整作品初访、导出与刷新保留、独立开场返回、精确旧存档原样备份、相似存档保护及纯静态请求边界，共 7 项通过。备份写入/读回失败、冲突及损坏状态由单元测试覆盖。该记录按版本说明实际检查结果；浏览器脚本和样本未纳入仓库，不属于 `npm test` 的自动覆盖。

## Proposed tests

| Use case → rule | Expected behavior / negative case | Evidence | Status / type |
| --- | --- | --- | --- |
| 浏览器端到端主流程 | 开场→发送→生成→引用→提议→明确更新；发送前/更新前旧看板不变，无直接编辑入口 | [Flows](flows.md)；`app.js`、`research-draft-view.js` | Proposed automated browser integration |
| 保存失败与导出 | 存储配额/拒绝写入显示错误；导出含当前完整原文且不改存档 | [Flows](flows.md)；`persist()`、`export` | Proposed automated browser integration |
| 独立 clone 与平台托管 | `npm ci`、测试、构建成功；目标 PORT/允许 host、生效资源路径无错误 | [Variables](variables.md)；`package.json`、`vite.config.js`、`scripts/build.mjs` | Proposed guarded deployment smoke |
| 菜单和布局可访问性 | 版本菜单键盘/触摸可用；窄屏无横溢；聊天输入、弹层可见；降低动效偏好有效 | [Architecture](architecture.md)；`board-version-menu.js`、`research-text-type.js`、CSS | Proposed automated browser integration + manual review |

## Gaps

| Priority / exposure | Rule and expected boundary | Evidence | Status |
| --- | --- | --- | --- |
| High：同时编辑可能丢失一端更新 | 多窗口当前为整份 state 替换；没有冲突合并保证，应先测试冲突行为再宣称协作支持 | [Architecture](architecture.md)；`app.js` 的 `storage` 监听 | None：无并发覆盖测试 |
| Medium：本机记录容量与损坏 | 基础 restore 有测试；大体量快照、配额边界、深层异常结构不应被声称已覆盖 | [Flows](flows.md)；`restore()`、`persist()` | None：无容量/深层状态专项测试 |
| Medium：资料链接或预置数值过期 | 发布检查应核对外部资料与页面口径；本应用不自动验证或更新 | [Variables](variables.md)；`SOURCE`、`reports` | None：无外部来源验真测试 |
| Medium：发布检查未自动设门槛 | 单元测试和构建应成为后续 CI 必须项；当前不声称已有自动合并保护 | 本文开头；`package.json` | None：无仓库内 CI workflow |

本交接范围没有真实用户账号、后端或远程 AI。身份授权、云存储及 provider 调用测试不适用于当前实现；接入这些能力时须先更新边界文档。
