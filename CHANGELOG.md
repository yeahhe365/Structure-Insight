# Changelog

## [5.4.0] - 2026-04-12

### Features
- 新增导出格式增强：仓库分析汇总、预计 Token 指标与敏感信息告警摘要
- 新增浏览器端敏感内容扫描，支持在状态栏与导出结果中提示潜在密钥/私钥/内联凭据
- 新增安全提示详情面板，可查看每条风险的文件位置、级别与命中片段
- 新增导出拆分阈值，保存时可按字符数自动拆分为多份文件
- 扩展忽略规则支持，兼容分层 `.gitignore` 与 `.ignore`

### Platform
- 注册 Service Worker，补齐 PWA 应用壳缓存与离线重访能力
- 修复并统一 manifest/favicon 资源，移除失效的图标引用
- 移除 `index.html` 中的外部 CDN 依赖，改为本地 Tailwind 构建、本地图标资源和本地语法高亮资源
- 继续瘦身前端产物：将 FileTree / CodeView / StructureView 拆分为独立 chunk，主入口包体从约 599 kB 降至约 299 kB
- 图标体系改为仅使用 solid 子集，并在构建阶段移除 `.ttf` 回退资源，仅保留 `woff2`
- 新增 `typecheck` 与 `check` 脚本
- 新增 GitHub Actions CI，覆盖安装、类型检查、测试与构建

### Documentation
- 更新根 README 与应用 README，明确仓库结构、启动路径和可用脚本
- 为本轮 P0/P1 工作补充设计文档与实施计划

## [5.3.0] - 2025-03-30

### Bug Fixes
- 修复搜索结果计数重复显示
- 移除 FileTree 组件中未使用的 wordWrap prop
- 修复 FileTree 展开状态在重新渲染时丢失的问题（提升至中央 Set 管理）
- 修复拖放操作中双重 AbortController 创建
- 修复 ScrollToTopButton 中不稳定的 ref 依赖

### Performance
- 为大对象 localStorage 写入添加防抖机制（>200KB 延迟 500ms）
- 文件排序优化：移除逐插入排序，改为单次递归排序
- 文件处理批量让出主线程（每 50 个文件 yield 一次）
- CodeView 高亮 DOM 操作添加缓存 key 避免重复执行
- React.lazy 代码拆分：SettingsDialog、SearchDialog、FileRankDialog、KeyboardShortcutsDialog
- 窗口 resize 事件添加 100ms 防抖
- 移除 18 个冗余的 hljs 语言加载脚本（核心包已包含）

### UX
- FileTree 添加键盘导航（方向键、Enter、Escape）
- FileTree 添加全部展开/折叠按钮
- CodeView 面包屑导航优化（文件夹图标 + 箭头分隔符）
- 状态栏添加文件类型摘要（前 3 种扩展名）
- Toast 添加彩色边框区分成功/错误/信息
- 键盘快捷键对话框全面中文化
- 搜索结果计数显示在输入框内

### Architecture
- 提取 CSS 自定义属性到 index.css
- 启用 TypeScript strict 模式
- 提取常量到 services/constants.ts
- 添加 ErrorBoundary 错误边界组件
- 添加 ARIA 无障碍标签
- HTML lang 属性设置为 zh-CN
