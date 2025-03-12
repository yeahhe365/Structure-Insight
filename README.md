# Structure Insight Web

Structure Insight Web 是一个强大的基于浏览器的文件结构分析和代码查看工具。它专为开发者设计，帮助您快速可视化项目结构并生成格式化输出，**特别适合与ChatGPT、Claude等AI语言模型分享和讨论您的代码项目**。通过这个工具，您可以轻松地让AI理解您的项目结构和代码内容，获得更准确的帮助和建议。

## 🔗 访问地址

**在线使用**: [https://structure-insight.pages.dev/](https://structure-insight.pages.dev/)

## 📸 应用界面

![应用界面](https://github.com/user-attachments/assets/ff79f825-924b-400c-9599-3c837d1810b0)

## 🤖 与语言模型协作示例

通过 Structure Insight Web 生成的结构化输出，可以直接粘贴给语言模型，帮助AI更好地理解您的代码：

![image](https://github.com/user-attachments/assets/c78f4a37-aaa1-49c1-9462-fe82e676f24b)

![与语言模型协作](https://github.com/user-attachments/assets/87d0c78a-ad88-4e88-aa04-0d1fecd69563)

## 🌟 功能特点

- **提升AI代码理解**: 生成结构化的项目概览，帮助语言模型更好地理解您的代码上下文
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
- **无需服务器**：完全在您的浏览器中运行，保护您的代码隐私

## 💡 与语言模型协作

Structure Insight Web 特别适合与AI语言模型协作时使用:

1. **上传您的项目**: 将您的代码文件夹拖放到应用中
2. **生成结构化输出**: 自动生成包含文件结构和代码内容的格式化文本
3. **复制并分享**: 一键复制输出结果，直接粘贴到AI对话中
4. **高效沟通**: 让AI立即理解您的代码结构、依赖关系和实现细节
5. **获取精准建议**: 帮助AI提供更有针对性的代码建议、Bug修复和架构优化

## 📋 使用方法

1. **打开应用**：访问[https://structure-insight.pages.dev/](https://structure-insight.pages.dev/)或在浏览器中打开`index.html`
2. **加载文件**：将文件夹拖放到页面上或点击文件夹图标选择文件
3. **浏览**：使用右侧的文件树导航浏览您的文件
4. **查看/编辑**：使用语法高亮查看文件内容或直接在浏览器中编辑
5. **复制到AI**：使用复制按钮复制内容，粘贴到与AI的对话中
6. **调整设置**：通过齿轮图标更改主题、字体大小和其他设置

## 💻 安装

### 方法一：直接使用在线版
访问[https://structure-insight.pages.dev/](https://structure-insight.pages.dev/)即可开始使用

### 方法二：本地安装
克隆存储库并在网络浏览器中打开`index.html`：

```bash
git clone https://github.com/yourusername/structure-insight-web.git
cd structure-insight-web
# 在浏览器中打开index.html
```

### 方法三：PWA安装
1. 访问[https://structure-insight.pages.dev/](https://structure-insight.pages.dev/)
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
4. 生成适合与AI分享的格式化输出
5. 所有处理都在浏览器中进行 - 不会向任何服务器发送数据，保护您的代码隐私

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
- AI辅助代码分析功能
- 简化AI协作的特殊输出格式
- 结构分析的导出选项
- 协作功能

---
