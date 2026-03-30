# Changelog

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
- React.lazy 代码拆分：SettingsDialog、SearchDialog、AIChat、FileRankDialog、KeyboardShortcutsDialog
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
