# Variables and secrets

当前源码没有 API key、数据库凭据或远程 AI 密钥配置，也没有读取并打包客户端 secret 的逻辑。用户已明确批准的完整 V3 作为本次公开演示资源随前端提供；运行后的新增记录保存在浏览器。不要把其他用户 JSON 导出、原始恢复备份或 QA 样本提交到公开资源。

| Name | Used by / scope | Source / default | Rotation | Risk |
| --- | --- | --- | --- | --- |
| `PORT` | `vite.config.js`；开发/预览进程 | 环境变量；开发 `5173`，预览 `4173` | 无需轮换 | 部署平台指定端口时必须一致；它不进入客户端业务 state |
| `host` | Vite 开发和预览监听 | 配置固定 `0.0.0.0` | 不适用 | 监听所有网卡；host 监听与允许的 Host 请求头是不同配置 |
| `allowedHosts` | Vite 请求 host 校验 | 当前配置未显式覆盖，沿用 Vite 默认值 | 域名变化时更新 | 平台预览域名若被拒绝，应显式允许所需域名，不无条件放行所有 host |
| `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` | 已安装 Vite 读取的开发/预览进程环境变量 | 平台配置实际预览域名，例如 `preview.example.com`；默认未设置 | 预览域名变化时更新 | 显式增加平台所需 host，不配置任意域名放行；这不是客户端 secret |
| `base` | Vite 资源路径 | `./` | 不适用 | 保持相对路径，便于静态目录托管；仍需验证实际部署路径 |
| `RESEARCH_STORAGE_KEY` | `research-session.js`；客户端 | `yanji-comparison-v1` | 修改需考虑迁移 | 同源、同 key 共享存档；换域名或端口不迁移原存档 |
| `legacyResearchBackupKey(key)` | `bundled-research-demo.js`；本机兼容迁移 | `<key>:backup:before-bundled-research-v45.1` | 不覆写不同旧值 | 保存迁移前原始字符串并读回核对；不是公开资源 |
| `BUNDLED_RESEARCH_REVISION` | `bundled-research-demo.js`；客户端 | `v45.1` | 随批准演示发布更新 | 无 secret；完整作品独立于访问者旧 storage |
| `demo-session` | URL → 客户端存储命名空间 | `yanji-comparison-v1:demo:<id>`；开场随机生成 id | 新开场生成新 id | 非认证凭据，不跨浏览器共享数据；独立存档持续保留直到清理 |
| `entry=opening` | `research-session.js`；客户端路由 | 显式开场入口；一次消费后换成 session URL | 不适用 | 每次使用创建新演示，刷新已解析 URL 继续同一存档 |
| `screen` / `tab` / `version` | `app.js`；客户端路由 | 首页、讨论、历史版本选择 | 不适用 | 路由值不是授权；兼容参数 `view=review` 会进入旧演示视图 |
| `SOURCE` / `DATA` / `reports` | `engine.js`、`research-data.js`；客户端 | 仓库内固定案例、数值与外部资料 URL | 人工核对修改 | 所有访客可查看；不随新公告自动更新 |

## Before publishing

- 使用 `package-lock.json` 安装，在目标 Node 版本构建；发布 `dist/` 时保留构建复制的 assets。
- 按平台配置端口与具体允许的预览 host，验证实际 URL；不要把开发监听地址当作身份保护。
- 检查部署物和提交列表不含 `.env*`、凭据、未批准的用户导出或原始恢复备份。批准的 V3 演示资源必须保留；运行不需要 secret。
- 验证目标域名下的本机保存、导出及独立开场；新域名直接加载包内完整作品；旧域名新增的个人存档不会自动迁移。
