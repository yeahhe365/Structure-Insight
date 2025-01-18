# modules/file_drop_widget.py

import os
import logging
import mimetypes

from PyQt5.QtWidgets import (
    QWidget, QTextEdit, QVBoxLayout, QHBoxLayout, QSplitter,
    QPushButton, QFileDialog, QMessageBox, QLabel, QProgressBar,
    QCheckBox, QInputDialog, QAction, QTreeWidget, QTreeWidgetItem,
    QStatusBar, QStyle, QApplication
)
from PyQt5.QtGui import QDropEvent, QFont, QIcon, QTextCursor
from PyQt5.QtCore import Qt, QThread

from .file_process_thread import FileProcessThread
from .utils import resource_path

class FileDropWidget(QWidget):
    def __init__(self):
        super().__init__()
        self.files_content = []
        self.file_structure = ""
        self.process_thread = None
        self.file_positions = {}   # 用于记录文件名在文本框中的光标位置
        self.dir_items = {}        # 用于记录在树状视图中，每个路径对应的QTreeWidgetItem
        self.isDarkTheme = True    # 默认使用暗色主题
        self.lastPath = None       # 记录上一次处理的路径
        self.initUI()

    def initUI(self):
        # 获取应用实例，用于动态切换样式表
        self.app = QApplication.instance()

        # 定义暗色和浅色主题
        self.darkTheme = """
        QWidget {
            background-color: #2B2B2B;
            color: #DDDDDD;
            font-family: "Microsoft YaHei";
        }

        QTextEdit {
            background-color: #333333;
            border: 1px solid #4A4A4A;
            padding: 4px;
        }

        QTreeWidget {
            background-color: #333333;
            border: 1px solid #4A4A4A;
            padding: 4px;
        }

        QPushButton {
            background-color: #444444;
            border: 1px solid #666666;
            border-radius: 4px;
            padding: 6px;
        }
        QPushButton:hover {
            background-color: #505050;
        }
        QPushButton:disabled {
            color: #777777;
            background-color: #3C3C3C;
            border: 1px solid #555555;
        }

        QCheckBox {
            spacing: 5px;
        }

        QProgressBar {
            border: 1px solid #666666;
            border-radius: 4px;
            text-align: center;
            background: #3C3C3C;
            color: #FFFFFF;
            height: 16px;
        }
        QProgressBar::chunk {
            background-color: #4CAF50;
            border-radius: 4px;
        }

        QStatusBar {
            background-color: #2F2F2F;
            border-top: 1px solid #4A4A4A;
            color: #AAAAAA;
        }

        QScrollBar:vertical {
            background: #3C3C3C;
            width: 10px;
            border-radius: 5px;
        }
        QScrollBar::handle:vertical {
            background: #5C5C5C;
            min-height: 20px;
            border-radius: 5px;
        }
        QScrollBar::handle:vertical:hover {
            background: #6C6C6C;
        }
        QScrollBar::sub-line:vertical, QScrollBar::add-line:vertical {
            height: 0px;
        }
        """

        self.lightTheme = """
        QWidget {
            background-color: #F0F0F0;
            color: #333333;
            font-family: "Microsoft YaHei";
        }

        QTextEdit {
            background-color: #FFFFFF;
            border: 1px solid #CCCCCC;
            padding: 4px;
        }

        QTreeWidget {
            background-color: #FFFFFF;
            border: 1px solid #CCCCCC;
            padding: 4px;
        }

        QPushButton {
            background-color: #E0E0E0;
            border: 1px solid #BFBFBF;
            border-radius: 4px;
            padding: 6px;
            color: #333333;
        }
        QPushButton:hover {
            background-color: #D0D0D0;
        }
        QPushButton:disabled {
            color: #AAAAAA;
            background-color: #E8E8E8;
            border: 1px solid #DDDDDD;
        }

        QCheckBox {
            spacing: 5px;
        }

        QProgressBar {
            border: 1px solid #BFBFBF;
            border-radius: 4px;
            text-align: center;
            background: #FFFFFF;
            color: #333333;
            height: 16px;
        }
        QProgressBar::chunk {
            background-color: #4CAF50;
            border-radius: 4px;
        }

        QStatusBar {
            background-color: #ECECEC;
            border-top: 1px solid #CCCCCC;
            color: #666666;
        }

        QScrollBar:vertical {
            background: #F0F0F0;
            width: 10px;
            border-radius: 5px;
        }
        QScrollBar::handle:vertical {
            background: #CCCCCC;
            min-height: 20px;
            border-radius: 5px;
        }
        QScrollBar::handle:vertical:hover {
            background: #BBBBBB;
        }
        QScrollBar::sub-line:vertical, QScrollBar::add-line:vertical {
            height: 0px;
        }
        """

        # 默认使用暗色主题
        self.app.setStyleSheet(self.darkTheme)

        # 检测图标文件
        icon_ico_path = resource_path('ico.ico')
        icon_png_path = resource_path('ico.png')
        icon = None
        if os.path.exists(icon_ico_path):
            icon = QIcon(icon_ico_path)
        elif os.path.exists(icon_png_path):
            icon = QIcon(icon_png_path)
        if icon:
            self.setWindowIcon(icon)

        self.setAcceptDrops(True)
        self.setWindowFlags(Qt.WindowMinimizeButtonHint | Qt.WindowCloseButtonHint)
        self.setWindowTitle('Structure Insight')

        # 设置默认窗口大小(16:9)
        self.resize(1280, 720)

        # 设置字体
        font = QFont()
        font.setPointSize(11)
        font.setBold(False)
        self.setFont(font)

        # 文本编辑器
        self.textEdit = QTextEdit()
        self.textEdit.setReadOnly(False)
        self.textEdit.setFont(font)
        self.textEdit.setToolTip("文件结构和文件内容将在这里显示")
        self.textEdit.textChanged.connect(self.update_line_char_count_in_status_bar)

        # 创建按钮等控件
        self.openFolderButton = QPushButton()
        self.openFolderButton.setToolTip("选择一个文件夹开始分析")
        open_icon = self.style().standardIcon(QStyle.SP_DialogOpenButton)
        self.openFolderButton.setIcon(open_icon)
        self.openFolderButton.clicked.connect(self.openFolder)

        self.copyButton = QPushButton()
        self.copyButton.setToolTip("复制全部内容到剪贴板")
        copy_icon = self.style().standardIcon(QStyle.SP_FileDialogDetailedView)
        self.copyButton.setIcon(copy_icon)
        self.copyButton.clicked.connect(self.copyContent)
        self.copyButton.setEnabled(False)

        self.saveButton = QPushButton()
        self.saveButton.setToolTip("将内容保存为文本文件")
        save_icon = self.style().standardIcon(QStyle.SP_DialogSaveButton)
        self.saveButton.setIcon(save_icon)
        self.saveButton.clicked.connect(self.saveContent)
        self.saveButton.setEnabled(False)

        self.resetButton = QPushButton()
        self.resetButton.setToolTip("清空当前结果并重置")
        reset_icon = self.style().standardIcon(QStyle.SP_TrashIcon)
        self.resetButton.setIcon(reset_icon)
        self.resetButton.clicked.connect(self.resetContent)
        self.resetButton.setEnabled(False)

        self.refreshButton = QPushButton()
        self.refreshButton.setToolTip("刷新当前路径")
        refresh_icon = self.style().standardIcon(QStyle.SP_BrowserReload)
        self.refreshButton.setIcon(refresh_icon)
        self.refreshButton.clicked.connect(self.refreshContent)
        self.refreshButton.setEnabled(False)

        self.cancelButton = QPushButton()
        self.cancelButton.setToolTip("取消当前处理")
        cancel_icon = self.style().standardIcon(QStyle.SP_DialogCancelButton)
        self.cancelButton.setIcon(cancel_icon)
        self.cancelButton.clicked.connect(self.cancelProcessing)
        self.cancelButton.setEnabled(False)

        self.extractContentCheckbox = QCheckBox("提取文件内容")
        self.extractContentCheckbox.setToolTip("若取消勾选，将仅显示文件结构与文件名，不读取内容")
        self.extractContentCheckbox.setChecked(True)

        self.themeButton = QPushButton()
        self.themeButton.setToolTip("在深色和浅色主题之间切换")
        theme_icon = self.style().standardIcon(QStyle.SP_DesktopIcon)
        self.themeButton.setIcon(theme_icon)
        self.themeButton.clicked.connect(self.toggleTheme)

        # 按钮布局
        buttonLayout = QHBoxLayout()
        buttonLayout.setSpacing(8)
        buttonLayout.setContentsMargins(0, 0, 0, 0)
        buttonLayout.addWidget(self.openFolderButton)
        buttonLayout.addWidget(self.copyButton)
        buttonLayout.addWidget(self.saveButton)
        buttonLayout.addWidget(self.resetButton)
        buttonLayout.addWidget(self.refreshButton)
        buttonLayout.addWidget(self.cancelButton)
        buttonLayout.addWidget(self.extractContentCheckbox)
        buttonLayout.addWidget(self.themeButton)

        topLayout = QHBoxLayout()
        topLayout.setSpacing(10)
        topLayout.setContentsMargins(0,0,0,0)
        topLayout.addLayout(buttonLayout)

        self.progressBar = QProgressBar()
        self.progressBar.setToolTip("处理进度条")

        leftLayout = QVBoxLayout()
        leftLayout.setContentsMargins(5,5,5,5)
        leftLayout.setSpacing(8)
        leftLayout.addLayout(topLayout)
        leftLayout.addWidget(self.textEdit)
        leftLayout.addWidget(self.progressBar)

        leftWidget = QWidget()
        leftWidget.setLayout(leftLayout)

        fileListLabel = QLabel("文件列表：")
        fileListLabel.setFont(font)

        self.fileTreeWidget = QTreeWidget()
        self.fileTreeWidget.setFont(font)
        self.fileTreeWidget.setHeaderHidden(True)
        self.fileTreeWidget.itemClicked.connect(self.jump_to_file_content)
        self.fileTreeWidget.setToolTip("显示文件结构和文件列表，点击可跳转对应内容")

        self.deleteButton = QPushButton()
        self.deleteButton.setToolTip("从结果中删除选中的文件条目")
        delete_icon = self.style().standardIcon(QStyle.SP_TrashIcon)
        self.deleteButton.setIcon(delete_icon)
        self.deleteButton.clicked.connect(self.deleteSelectedFiles)

        rightLayout = QVBoxLayout()
        rightLayout.setContentsMargins(5,5,5,5)
        rightLayout.setSpacing(8)
        rightLayout.addWidget(fileListLabel)
        rightLayout.addWidget(self.fileTreeWidget)
        rightLayout.addWidget(self.deleteButton)

        rightWidget = QWidget()
        rightWidget.setLayout(rightLayout)

        splitter = QSplitter(Qt.Horizontal)
        splitter.addWidget(leftWidget)
        splitter.addWidget(rightWidget)
        splitter.setSizes([960, 320])  # 初始占比

        self.statusBar = QStatusBar()
        self.statusBar.showMessage("就绪")
        self.statusBar.setSizeGripEnabled(False)
        self.statusBar.setFixedHeight(24)

        mainLayout = QVBoxLayout()
        mainLayout.setContentsMargins(0,0,0,0)
        mainLayout.setSpacing(0)
        mainLayout.addWidget(splitter)
        mainLayout.addWidget(self.statusBar)

        self.setLayout(mainLayout)

        # 搜索快捷键(Ctrl+F)
        searchAction = QAction(self)
        searchAction.setShortcut('Ctrl+F')
        searchAction.triggered.connect(self.open_search_dialog)
        self.addAction(searchAction)

    def toggleTheme(self):
        """切换深色/浅色主题"""
        if self.isDarkTheme:
            self.app.setStyleSheet(self.lightTheme)
            self.isDarkTheme = False
        else:
            self.app.setStyleSheet(self.darkTheme)
            self.isDarkTheme = True

    def dragEnterEvent(self, event: QDropEvent):
        """拖进来的内容如果是文件或文件夹，就接受，否则忽略"""
        if event.mimeData().hasUrls():
            event.accept()
        else:
            event.ignore()

    def dropEvent(self, event: QDropEvent):
        """放开鼠标后，读取所有拖拽进来的文件/文件夹路径，并开始分析"""
        urls = event.mimeData().urls()
        for url in urls:
            path = url.toLocalFile()
            self.startProcessing(path)

    def startProcessing(self, path):
        """开始处理文件或文件夹"""
        # 先重置之前的结果
        self.resetContent()
        self.lastPath = path

        extract_content = self.extractContentCheckbox.isChecked()
        self.process_thread = FileProcessThread(path, extract_content=extract_content)

        # 统计一下总文件数，用于进度条显示
        total_files = self.count_total_files(path)
        if total_files == 0:
            QMessageBox.information(self, "信息", "没有可处理的文件。")
            return

        self.process_thread.total_files = total_files
        self.process_thread.update_signal.connect(self.update_content)
        self.process_thread.finished_signal.connect(self.process_finished)
        self.process_thread.progress_signal.connect(self.update_progress)
        self.process_thread.start()

        # 更新按钮状态
        self.copyButton.setEnabled(False)
        self.saveButton.setEnabled(False)
        self.resetButton.setEnabled(False)
        self.refreshButton.setEnabled(False)
        self.cancelButton.setEnabled(True)
        self.extractContentCheckbox.setEnabled(False)
        self.progressBar.setRange(0, total_files)
        self.progressBar.setValue(0)
        self.statusBar.showMessage("处理中...")

    def refreshContent(self):
        """刷新当前已加载的路径"""
        if self.lastPath:
            self.startProcessing(self.lastPath)

    def count_total_files(self, path):
        """统计即将处理的文件数量，用于进度条最大值"""
        total_files = 0
        max_depth = self.process_thread.max_depth
        skip_extensions = self.process_thread.skip_extensions
        allowed_extensions = self.process_thread.allowed_extensions
        extract_content = self.process_thread.extract_content

        def count(path, depth=0):
            nonlocal total_files
            if depth > max_depth or total_files >= self.process_thread.max_files:
                return
            try:
                if os.path.isdir(path):
                    with os.scandir(path) as entries:
                        for entry in entries:
                            if total_files >= self.process_thread.max_files:
                                return
                            if entry.is_dir(follow_symlinks=False):
                                count(entry.path, depth + 1)
                            elif entry.is_file():
                                file_name = entry.name
                                _, file_extension = os.path.splitext(file_name)
                                if file_extension.lower() in skip_extensions and file_extension.lower() not in allowed_extensions:
                                    continue
                                if not extract_content:
                                    total_files += 1
                                else:
                                    if entry.stat().st_size > 10 * 1024 * 1024:
                                        continue
                                    mime_type, _ = mimetypes.guess_type(entry.path)
                                    allowed_mime_types = ['text', 'application/javascript', 'application/json']
                                    if mime_type and not (mime_type.startswith('text') or mime_type in allowed_mime_types):
                                        continue
                                    total_files += 1
                elif os.path.isfile(path):
                    file_name = os.path.basename(path)
                    _, file_extension = os.path.splitext(file_name)
                    if file_extension.lower() in skip_extensions and file_extension.lower() not in allowed_extensions:
                        return
                    if not extract_content:
                        total_files += 1
                    else:
                        if os.path.getsize(path) > 10 * 1024 * 1024:
                            return
                        mime_type, _ = mimetypes.guess_type(path)
                        allowed_mime_types = ['text', 'application/javascript', 'application/json']
                        if mime_type and not (mime_type.startswith('text') or mime_type in allowed_mime_types):
                            return
                        total_files += 1
            except PermissionError as e:
                logging.error(f"无法访问 {path}: {str(e)}")

        count(path)
        return total_files

    def update_content(self, name, content, content_type, file_path):
        """将分析结果更新到文本区与树形控件"""
        if content_type == "structure":
            # 文件/文件夹层次结构
            self.file_structure = content
            self.update_text_edit(initial=True)
            root_item = QTreeWidgetItem(self.fileTreeWidget)
            root_item.setText(0, os.path.basename(file_path))
            root_item.setData(0, Qt.UserRole, file_path)
            self.dir_items[file_path] = root_item
        elif content_type in ["file", "file_no_content", "skipped", "error"]:
            parent_path = os.path.dirname(file_path)
            parent_item = self.dir_items.get(parent_path)
            if not parent_item:
                parent_item = self.create_parent_items(parent_path)
            item = QTreeWidgetItem(parent_item)

            display_name = name
            if content_type == "skipped":
                display_name = f"跳过: {name}"
            elif content_type == "error":
                display_name = f"错误: {name}"
            item.setText(0, display_name)
            item.setData(0, Qt.UserRole, file_path)

            # 若提取了内容，就追加到文本框
            if content_type == "file":
                self.files_content.append((name, content))
                self.append_text_edit(name, content)
            elif content_type == "file_no_content":
                self.files_content.append((name, None))
                self.append_text_edit(name, None)

        self.fileTreeWidget.expandAll()

    def create_parent_items(self, path):
        """递归创建树形控件的父节点"""
        if path in self.dir_items:
            return self.dir_items[path]
        parent_path = os.path.dirname(path)
        if parent_path != path:
            parent_item = self.create_parent_items(parent_path)
        else:
            parent_item = self.fileTreeWidget
        dir_name = os.path.basename(path)
        item = QTreeWidgetItem(parent_item)
        item.setText(0, dir_name)
        item.setData(0, Qt.UserRole, path)
        self.dir_items[path] = item
        return item

    def update_text_edit(self, initial=False):
        """更新文本编辑器内容"""
        if initial:
            self.textEdit.clear()
            full_content = f"文件结构:\n{self.file_structure}\n\n"
            if self.extractContentCheckbox.isChecked():
                full_content += "文件内容:\n"
            self.textEdit.setText(full_content)
            self.file_positions.clear()

    def append_text_edit(self, name, content):
        """在文本编辑器中追加文件名和内容"""
        if not self.extractContentCheckbox.isChecked():
            return
        self.textEdit.moveCursor(QTextCursor.End)
        position = self.textEdit.textCursor().position()

        new_content = f"{'=' * 40}\n文件名: {name}\n{'-' * 71}\n"
        if content is not None:
            new_content += f"{content}\n\n"
        else:
            new_content += "（未提取内容）\n\n"

        self.textEdit.insertPlainText(new_content)
        self.file_positions[name] = position
        self.textEdit.verticalScrollBar().setValue(self.textEdit.verticalScrollBar().maximum())

    def jump_to_file_content(self, item):
        """点击右侧树形控件，文本区滚动到对应文件内容"""
        file_name = item.text(0)
        if file_name.startswith('跳过: ') or file_name.startswith('错误: ') or item.childCount() > 0:
            return

        name = os.path.basename(item.data(0, Qt.UserRole))
        position = self.file_positions.get(name)
        if position is not None:
            cursor = self.textEdit.textCursor()
            cursor.setPosition(position)
            self.textEdit.setTextCursor(cursor)
            self.textEdit.setFocus()
            self.textEdit.ensureCursorVisible()

    def process_finished(self):
        """处理完成后，更新界面按钮状态"""
        self.copyButton.setEnabled(True)
        self.saveButton.setEnabled(True)
        self.resetButton.setEnabled(True)
        if self.lastPath:
            self.refreshButton.setEnabled(True)
        self.cancelButton.setEnabled(False)
        self.extractContentCheckbox.setEnabled(True)
        self.progressBar.setValue(self.progressBar.maximum())

        # 刷新状态栏统计
        self.update_line_char_count_in_status_bar()

    def update_progress(self, value):
        """更新进度条"""
        self.progressBar.setValue(value)

    def copyContent(self):
        """复制全部内容到剪贴板"""
        full_content = self.textEdit.toPlainText()
        QApplication.clipboard().setText(full_content)
        QMessageBox.information(self, "复制成功", "内容已复制到剪贴板")

    def saveContent(self):
        """将当前内容保存到文本文件"""
        file_name, _ = QFileDialog.getSaveFileName(self, "保存文件", "", "Text Files (*.txt)")
        if file_name:
            try:
                with open(file_name, 'w', encoding='utf-8') as file:
                    full_content = self.textEdit.toPlainText()
                    file.write(full_content)
                QMessageBox.information(self, "保存成功", f"内容已保存到 {file_name}")
            except Exception as e:
                logging.error(f"保存文件时出错: {str(e)}")
                QMessageBox.warning(self, "保存失败", f"无法保存文件：{str(e)}")

    def resetContent(self):
        """清空当前结果并重置"""
        if self.process_thread and self.process_thread.isRunning():
            self.process_thread.cancel()
            self.process_thread.wait()
        self.files_content = []
        self.file_structure = ""
        self.textEdit.clear()
        self.fileTreeWidget.clear()
        self.progressBar.reset()
        self.extractContentCheckbox.setEnabled(True)
        self.file_positions.clear()
        self.dir_items.clear()
        self.statusBar.showMessage("就绪")
        self.refreshButton.setEnabled(False)

    def cancelProcessing(self):
        """取消处理"""
        if self.process_thread:
            self.process_thread.cancel()
            self.process_thread.wait()
            self.process_finished()

    def openFolder(self):
        """选择文件夹进行分析"""
        folder_path = QFileDialog.getExistingDirectory(self, "选择文件夹")
        if folder_path:
            self.startProcessing(folder_path)

    def deleteSelectedFiles(self):
        """从结果中删除选中的文件条目"""
        selected_items = self.fileTreeWidget.selectedItems()
        if not selected_items:
            return

        for item in selected_items:
            file_path = item.data(0, Qt.UserRole)
            if os.path.isdir(file_path):
                # 如果选中的是一个文件夹节点，可自行添加删除逻辑
                continue
            name = os.path.basename(file_path)
            parent = item.parent()
            if parent:
                parent.removeChild(item)
            else:
                index = self.fileTreeWidget.indexOfTopLevelItem(item)
                self.fileTreeWidget.takeTopLevelItem(index)

            # 从 files_content 列表中移除对应文件
            self.files_content = [(fname, c) for fname, c in self.files_content if fname != name]
            if name in self.file_positions:
                del self.file_positions[name]

        # 重新生成文本内容
        self.update_text_edit(initial=True)
        for fname, content in self.files_content:
            self.append_text_edit(fname, content)

    def open_search_dialog(self):
        """打开搜索弹窗"""
        text, ok = QInputDialog.getText(self, '搜索', '请输入搜索内容:')
        if ok and text:
            self.find_in_text_edit(text)

    def find_in_text_edit(self, text):
        """在文本编辑器中查找文本"""
        cursor = self.textEdit.textCursor()
        found = self.textEdit.find(text)
        if not found:
            # 如果没找到，就回到开头重新找
            cursor.setPosition(0)
            self.textEdit.setTextCursor(cursor)
            found = self.textEdit.find(text)
            if not found:
                QMessageBox.information(self, '搜索结果', '未找到指定内容。')
            else:
                self.textEdit.setFocus()
        else:
            self.textEdit.setFocus()

    def update_line_char_count_in_status_bar(self):
        """文本内容变化时，更新状态栏行数/字符数"""
        full_text = self.textEdit.toPlainText()
        line_count = len(full_text.splitlines())
        char_count = len(full_text)
        self.statusBar.showMessage(f"就绪 - 共 {line_count} 行, {char_count} 字符")