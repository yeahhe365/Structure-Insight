# Structure Insight Web

Structure Insight Web 是一个强大的基于浏览器的文件结构分析和代码查看工具。它允许您在浏览器中快速可视化并探索项目的文件结构，查看和编辑文件内容，以及分析代码结构。

![PixPin_2025-03-12_12-21-22](https://github.com/user-attachments/assets/ff79f825-924b-400c-9599-3c837d1810b0)

## 🌟 功能特点

- **文件结构分析**：即时可视化您的项目文件结构
- **支持语法高亮的代码查看器**：支持多种编程语言
- **简便的文件加载**：拖放文件夹或使用文件夹选择器
- **ZIP文件支持**：自动解压并处理ZIP文件
- **树形导航**：交互式文件树便于导航
- **代码编辑**：直接在浏览器中修改文件
- **深色/浅色主题**：选择您喜欢的视觉风格
- **Markdown预览**：内置Markdown渲染功能
- **移动端响应式**：优化的UI适用于所有设备
- **PWA支持**：可作为独立应用安装并支持离线使用
- **无需服务器**：完全在您的浏览器中运行

## 📋 使用方法

1. **打开应用**：访问已部署版本或在浏览器中打开`index.html`
2. **加载文件**：将文件夹拖放到页面上或点击文件夹图标选择文件
3. **浏览**：使用右侧的文件树导航浏览您的文件
4. **查看/编辑**：使用语法高亮查看文件内容或直接在浏览器中编辑
5. **调整设置**：通过齿轮图标更改主题、字体大小和其他设置

## 💻 安装

### 方法一：直接使用
只需克隆存储库并在网络浏览器中打开`index.html`：

```bash
git clone https://github.com/yourusername/structure-insight-web.git
cd structure-insight-web
# 在浏览器中打开index.html
```

### 方法二：PWA安装
1. 访问应用的已部署版本
2. 点击设置图标
3. 选择"安装应用"将其作为PWA安装

## 🔧 技术细节

Structure Insight Web使用现代Web技术构建：

- **React**：使用Babel独立版本（无需构建步骤）
- **CSS自定义属性**：用于主题和样式
- **Service Workers**：提供离线功能
- **JavaScript模块**：用于代码组织
- **外部库**：
  - Highlight.js用于语法高亮
  - JSZip用于处理ZIP文件
  - Marked用于Markdown渲染
  - FontAwesome提供图标

## 🔄 工作原理

1. 文件在客户端使用File API进行处理
2. 分析文件结构并构建成可导航的树形图
3. 提取文件内容并使用语法高亮显示
4. 所有处理都在浏览器中进行 - 不会向任何服务器发送数据

## 🤝 贡献

欢迎贡献！请随时提交Pull Request。

1. Fork该存储库
2. 创建您的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m '添加某个惊人的功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开Pull Request

## 📱 移动端使用

Structure Insight Web完全响应式，可在移动设备上使用：
- 使用浮动操作按钮在文件树和编辑器视图之间切换
- 点击树中的文件查看其内容
- 使用设置对话框调整应用以获得最佳移动体验

## 📄 许可证

本项目采用MIT许可证 - 详情请参阅LICENSE文件。

## 🔮 未来计划

- 跨文件搜索功能
- 更多语言的语法高亮支持
- 增强的编辑功能
- 结构分析的导出选项
- 协作功能

