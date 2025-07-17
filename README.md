
# Structure Insight Web

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/yeahhe365/Structure-Insight?style=social)](https://github.com/yeahhe365/Structure-Insight)

**一个强大的浏览器端工具，用于快速分析和可视化任何代码项目的文件结构和内容。旨在帮助开发人员生成格式化的输出，非常适合与 Gemini 等 AI 语言模型共享和讨论代码。**

---

### [**🚀 在线体验 &raquo;**](https://structure-insight-website.pages.dev/)

### [**⌨️ GitHub 仓库 &raquo;**](https://github.com/yeahhe365/Structure-Insight)

---

## 📖 简介 (Introduction)

在与 AI 语言模型（如 Google Gemini）协作进行代码审查、调试或功能开发时，提供清晰、完整的项目上下文至关重要。手动整理文件结构和复制代码是一项繁琐且容易出错的任务。

**Structure Insight** 解决了这个问题。它允许您简单地将整个项目文件夹拖放到浏览器中。应用会立即：
1.  分析您的文件和目录结构。
2.  读取并高亮显示代码内容。
3.  生成一个干净、格式化的文本输出，您可以轻松地复制并粘贴到 AI 的提示中。
4.  内置 AI 聊天功能，可以直接在应用内就您的代码库进行对话。

所有处理都在您的浏览器本地进行，确保您的代码永远不会离开您的计算机，保障了隐私和安全。

## ✨ 主要功能 (Key Features)

*   **📁 拖放式文件处理**: 支持直接拖放文件夹和 `.zip` 压缩文件进行分析。
*   **🌳 清晰的树状视图**: 以直观的树状结构展示项目，并显示文件统计信息（行数、字符数）。
*   **👁️ 代码查看器**: 内置代码查看器，支持多种语言的语法高亮。
*   **✂️ 文件内容管理**:
    *   直接在界面中**编辑**文件内容。
    *   从视图中**删除**不需要的文件或文件夹。
    *   为 Markdown 文件提供**预览**模式。
*   **📋 一键复制**: 轻松复制整个项目结构和代码内容，或单独复制部分内容。
*   **🤖 AI 聊天集成**:
    *   与 **Google Gemini** 模型无缝集成。
    *   自动将您的项目作为上下文，让您可以就代码提问、寻求建议或进行调试。
*   **🔍 全局搜索**: 在所有已加载的文件中进行高效搜索，支持正则表达式、大小写匹配和全词匹配。
*   **📱 响应式与 PWA**:
    *   完全响应式设计，在桌面和移动设备上均可良好运行。
    *   支持**渐进式网络应用 (PWA)**，可“安装”到您的设备上以供离线使用。
*   **⚙️ 高度可定制**:
    *   切换浅色/深色主题。
    *   调整代码字体大小。
    *   可选择是否提取文件内容（仅分析结构）。
*   **🔒 隐私优先**: 所有文件处理均在浏览器端完成。您的代码和 API 密钥安全地存储在本地。

## 📸 应用截图 (Screenshots)

*主界面 (深色模式)*
<img width="1920" height="887" alt="image" src="https://github.com/user-attachments/assets/ae0a19ad-c253-4aac-9982-8181c7ec2575" />

*AI 聊天面板*
<img width="1920" height="838" alt="image" src="https://github.com/user-attachments/assets/45bfe3fd-e329-4b4b-8d3e-2db9d9a25ddc" />

*文件搜索功能*
<img width="631" height="383" alt="image" src="https://github.com/user-attachments/assets/62a05635-6bd2-49dd-8e6c-df6abcde4453" />

## 🛠️ 技术栈 (Technology Stack)

*   **前端框架**: [React](https://reactjs.org/)
*   **语言**: [TypeScript](https://www.typescriptlang.org/)
*   **AI 模型**: [Google Gemini API](https://ai.google.dev/)
*   **样式**: [Tailwind CSS](https://tailwindcss.com/)
*   **动画**: [Framer Motion](https://www.framer.com/motion/)
*   **语法高亮**: [Highlight.js](https://highlightjs.org/)
*   **ZIP 处理**: [JSZip](https://stuk.github.io/jszip/)
*   **Markdown 解析**: [Marked](https://marked.js.org/)

## ▶️ 本地开发 (Local Development)

您可以轻松地在本地运行此项目。

**1. 克隆仓库**
```bash
git clone https://github.com/yeahhe365/Structure-Insight.git
cd Structure-Insight
```

**2. 安装依赖**
```bash
npm install
```

**3. 设置环境变量**
为了使用 AI 聊天功能，您需要一个 Google Gemini API 密钥。

*   前往 [Google AI for Developers](https://makersuite.google.com/app/apikey) 获取您的 API 密钥。
*   在项目根目录创建一个 `.env` 文件。
*   将您的密钥添加到 `.env` 文件中：

```
# .env
VITE_GEMINI_API_KEY="YOUR_API_KEY_HERE"
```
*注意：即使没有 API 密钥，应用的核心功能（文件分析和格式化）仍然可用。*

**4. 运行开发服务器**
```bash
npm run dev
```
应用将在 `http://localhost:5173` (或其他可用端口) 上启动。

## 🔑 配置 Gemini API 密钥

您有两种方式配置 Gemini API 密钥：
1.  **环境变量 (推荐)**: 如上所述，通过在 `.env` 文件中设置 `VITE_GEMINI_API_KEY`。
2.  **应用内设置**: 在应用的设置菜单中，您可以直接输入您的 API 密钥。此密钥将安全地存储在您浏览器的 `localStorage` 中，不会上传到任何服务器。

## 🤝 贡献 (Contributing)

欢迎各种形式的贡献！如果您有功能建议、发现错误或希望改进代码，请随时：
-   开启一个 [Issue](https://github.com/yeahhe365/Structure-Insight/issues) 来讨论。
-   创建一个 [Pull Request](https://github.com/yeahhe365/Structure-Insight/pulls) 来提交您的更改。

## 📄 许可证 (License)

该项目使用 [MIT License](https://opensource.org/licenses/MIT) 授权。
