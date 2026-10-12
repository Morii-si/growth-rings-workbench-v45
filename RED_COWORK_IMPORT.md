# 给 REDcowork 的 v45 导入指令

请克隆并原样运行这个完整前端产品：

**仓库：https://github.com/Morii-si/growth-rings-workbench-v45**

**固定标签：`ui-v45`**

这是独立的新仓库，与旧仓库 `Morii-si/growth-rings-workbench` 分开。请在新目录或新项目中导入，不要向旧仓库拉取本次版本。先用 `git remote -v` 核对地址包含 `growth-rings-workbench-v45`。

```sh
git clone --branch ui-v45 --single-branch https://github.com/Morii-si/growth-rings-workbench-v45.git
cd growth-rings-workbench-v45
npm ci
npm test
npm run build
```

使用 Node.js 24。开发预览执行 `npm run dev`，默认端口 5173，也读取平台的 `PORT`。正式发布 **`dist/`**，包根应直接包含 `index.html` 和 `assets/`。

请保持当前源码、视觉和交互，不重写成单页样稿，不重新设计，不更改预置研究数据。所有本地 Logo、favicon、聊天图标和许可证都在 `assets/`；构建脚本会将它们复制到 dist。

当前流程：公司首页 → 本次聊天 → 生成研究看板 → 引用看板某块内容继续对话 → 显式更新看板。V1/V2 供回看，V3 由本轮已发送的讨论生成。禁止根据旧版说明恢复独立草稿、待查事项、AI 主动跟进、内联编辑表单、“讨论新类目”按钮或“演示说明”。

无需 API Key、数据库或后端。回复为前端预置案例；自由问题保存原文，不伪造实时模型回答。不要添加真实 AI 服务、任务调度或登录系统。用户记录保存在该站点 localStorage；不要清空用户记录或预先导入旧站点个人记录。

新浏览器先显示已有 V1/V2，按下列步骤生成 V3。测试使用独立浏览器状态即可。

## 发布验收

1. 首页标题为“我的研究工作台”，三家公司卡片、年轮 Logo、红棕主问题正常。无“演示说明”。
2. 进入泡泡玛特聊天；`/?entry=opening` 可展示居中开场、加粗打字标题和 📖 半年报附件。
3. 选择 MOLLY、星星人、库存、现金流等预置问题，用户和助手消息逐条追加。
4. 点击“生成研究看板”，进入 V3；小结气泡可展开，来源可打开，无草稿中转或待查清单。
5. “引用并讨论”带入选中内容，发送建议后“更新研究看板”才保存；刷新后保留。
6. “历史研究看板”暖色下拉可切换 V1/V2/V3；“讨论原文”有内边距、独立滚动和固定标题。
7. 所有 Logo/图标正常加载，导出下载 JSON，公告 PDF 外链能打开，桌面和手机无横向溢出。

若预览域名被 Vite 拒绝，配置实际域名到 `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` 后重启；不要改成允许任意域名。iframe 需允许脚本、同源存储、打开新窗口和文件下载，或者提供独立页面预览。

完成后请返回：实际仓库地址、`git rev-parse HEAD`、预览/正式发布链接、构建及以上验收结果。安装成功不能代替发布验证。
