# modules/file_drop_widget.py

import os
import logging
import mimetypes

from PyQt5.QtWidgets import (
    QWidget, QTextEdit, QPlainTextEdit, QVBoxLayout, QHBoxLayout, QSplitter,
    QPushButton, QFileDialog, QMessageBox, QLabel, QProgressBar,
    QCheckBox, QInputDialog, QAction, QTreeWidget, QTreeWidgetItem,
    QStatusBar, QStyle, QApplication
)
from PyQt5.QtGui import QDropEvent, QFont, QIcon, QTextCursor, QPainter, QColor, QTextFormat
from PyQt5.QtCore import Qt, QThread, QSize, QSettings

from .file_process_thread import FileProcessThread
from .utils import resource_path

# ---------------------------------------------------------------------------
# 支持行号显示的代码编辑器组件（参考 Qt 官方 Code Editor 示例）
# ---------------------------------------------------------------------------
class LineNumberArea(QWidget):
    def __init__(self, editor):
        super().__init__(editor)
        self.editor = editor

    def sizeHint(self):
        return QSize(self.editor.lineNumberAreaWidth(), 0)

    def paintEvent(self, event):
        self.editor.lineNumberAreaPaintEvent(event)

class CodeEditor(QPlainTextEdit):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.lineNumberArea = LineNumberArea(self)
        self.blockCountChanged.connect(self.updateLineNumberAreaWidth)
        self.updateRequest.connect(self.updateLineNumberArea)
        self.cursorPositionChanged.connect(self.highlightCurrentLine)
        self.updateLineNumberAreaWidth(0)
        self.highlightCurrentLine()

    def lineNumberAreaWidth(self):
        digits = 1
        max_value = max(1, self.blockCount())
        while max_value >= 10:
            max_value //= 10
            digits += 1
        space = 3 + self.fontMetrics().width('9') * digits
        return space

    def updateLineNumberAreaWidth(self, _):
        self.setViewportMargins(self.lineNumberAreaWidth(), 0, 0, 0)

    def updateLineNumberArea(self, rect, dy):
        if dy:
            self.lineNumberArea.scroll(0, dy)
        else:
            self.lineNumberArea.update(0, rect.y(), self.lineNumberArea.width(), rect.height())
        if rect.contains(self.viewport().rect()):
            self.updateLineNumberAreaWidth(0)

    def resizeEvent(self, event):
        super().resizeEvent(event)
        cr = self.contentsRect()
        self.lineNumberArea.setGeometry(cr.left(), cr.top(), self.lineNumberAreaWidth(), cr.height())

    def highlightCurrentLine(self):
        extraSelections = []
        if not self.isReadOnly():
            selection = QTextEdit.ExtraSelection()
            lineColor = QColor(Qt.yellow).lighter(160)
            selection.format.setBackground(lineColor)
            selection.format.setProperty(QTextFormat.FullWidthSelection, True)
            selection.cursor = self.textCursor()
            selection.cursor.clearSelection()
            extraSelections.append(selection)
        self.setExtraSelections(extraSelections)

    def lineNumberAreaPaintEvent(self, event):
        painter = QPainter(self.lineNumberArea)
        painter.fillRect(event.rect(), QColor(230, 230, 230))
        block = self.firstVisibleBlock()
        blockNumber = block.blockNumber()
        top = self.blockBoundingGeometry(block).translated(self.contentOffset()).top()
        bottom = top + self.blockBoundingRect(block).height()

        while block.isValid() and top <= event.rect().bottom():
            if block.isVisible() and bottom >= event.rect().top():
                number = str(blockNumber + 1)
                painter.setPen(Qt.black)
                width = self.lineNumberArea.width()
                painter.drawText(0, int(top), width - 2, self.fontMetrics().height(), Qt.AlignRight, number)
            block = block.next()
            top = self.blockBoundingGeometry(block).translated(self.contentOffset()).top()
            bottom = top + self.blockBoundingRect(block).height()
            blockNumber += 1
# ---------------------------------------------------------------------------
# 以上为 CodeEditor 及行号支持代码
# ---------------------------------------------------------------------------

class FileDropWidget(QWidget):
    def __init__(self):
        super().__init__()
        self.files_content = []
        self.file_structure = ""
        self.process_thread = None
        self.file_positions = {}   # 记录文件名在文本框中的光标位置
        self.dir_items = {}        # 记录树形控件中每个路径对应的 QTreeWidgetItem
        # 从配置中加载上次使用的主题，默认使用暗色主题
        settings = QSettings("MyCompany", "StructureInsight")
        theme = settings.value("theme", "dark")
        self.isDarkTheme = (theme == "dark")
        self.lastPath = None       # 记录上一次处理的路径
        self.initUI()

    def initUI(self):
        self.app = QApplication.instance()

        # 定义暗色和浅色主题
        self.darkTheme = """
        QWidget {
            background-color: #2B2B2B;
            color: #DDDDDD;
            font-family: "Microsoft YaHei";
        }

        QPlainTextEdit {
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

        QPlainTextEdit {
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

        # 根据上次保存的配置使用默认主题
        if self.isDarkTheme:
            self.app.setStyleSheet(self.darkTheme)
        else:
            self.app.setStyleSheet(self.lightTheme)

        # 图标设置
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
        self.resize(1280, 720)

        # 设置字体
        font = QFont()
        font.setPointSize(11)
        font.setBold(False)
        self.setFont(font)

        # 使用支持行号显示的 CodeEditor
        self.textEdit = CodeEditor()
        self.textEdit.setReadOnly(False)
        self.textEdit.setFont(font)
        self.textEdit.setToolTip("文件结构和文件内容将在这里显示")
        self.textEdit.textChanged.connect(self.update_line_char_count_in_status_bar)

        # 创建按钮及其它控件
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
        reset_icon = self.style().standardIcon(QStyle.SP_DialogResetButton)
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
        cancel_icon = self.style().standardIcon(QStyle.SP_MediaStop)
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

        # 布局
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
        splitter.setSizes([960, 320])  # 初始分配比例

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

        # 搜索快捷键 (Ctrl+F)
        searchAction = QAction(self)
        searchAction.setShortcut('Ctrl+F')
        searchAction.triggered.connect(self.open_search_dialog)
        self.addAction(searchAction)

    def toggleTheme(self):
        """切换深色/浅色主题，并保存设置"""
        if self.isDarkTheme:
            self.app.setStyleSheet(self.lightTheme)
            self.isDarkTheme = False
            theme = "light"
        else:
            self.app.setStyleSheet(self.darkTheme)
            self.isDarkTheme = True
            theme = "dark"
        settings = QSettings("MyCompany", "StructureInsight")
        settings.setValue("theme", theme)

    def dragEnterEvent(self, event: QDropEvent):
        """拖入的内容若为文件/文件夹，则接受"""
        if event.mimeData().hasUrls():
            event.accept()
        else:
            event.ignore()

    def dropEvent(self, event: QDropEvent):
        """拖放完成后，处理所有拖入的文件/文件夹路径"""
        urls = event.mimeData().urls()
        for url in urls:
            path = url.toLocalFile()
            self.startProcessing(path)

    def startProcessing(self, path):
        """开始处理指定的文件或文件夹"""
        self.resetContent()
        self.lastPath = path

        extract_content = self.extractContentCheckbox.isChecked()
        self.process_thread = FileProcessThread(path, extract_content=extract_content)

        # 统计待处理的文件数（用于进度条最大值）
        total_files = self.count_total_files(path)
        if total_files == 0:
            QMessageBox.information(self, "信息", "没有可处理的文件。")
            return

        self.process_thread.total_files = total_files
        self.process_thread.update_signal.connect(self.update_content)
        self.process_thread.finished_signal.connect(self.process_finished)
        self.process_thread.progress_signal.connect(self.update_progress)
        self.process_thread.start()

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
        """刷新当前处理的路径"""
        if self.lastPath:
            self.startProcessing(self.lastPath)

    def count_total_files(self, path):
        """统计符合条件的文件数量，用于进度条最大值（采用老版本的统计方式）"""
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
        """将处理结果更新到文本编辑器及文件树中"""
        if content_type == "structure":
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
            if content_type == "file":
                self.files_content.append((name, content))
                self.append_text_edit(name, content)
            elif content_type == "file_no_content":
                self.files_content.append((name, None))
                self.append_text_edit(name, None)
        self.fileTreeWidget.expandAll()

    def create_parent_items(self, path):
        """递归为文件树创建父节点"""
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
            self.textEdit.setPlainText(full_content)
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
        """点击文件树，文本编辑器跳转到对应内容位置"""
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
        """处理完成后更新界面按钮状态"""
        self.copyButton.setEnabled(True)
        self.saveButton.setEnabled(True)
        self.resetButton.setEnabled(True)
        if self.lastPath:
            self.refreshButton.setEnabled(True)
        self.cancelButton.setEnabled(False)
        self.extractContentCheckbox.setEnabled(True)
        self.progressBar.setValue(self.progressBar.maximum())
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
        """将当前内容保存为文本文件"""
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
        """取消当前处理"""
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
        """从文件树中删除选中的文件条目，并更新文本内容"""
        selected_items = self.fileTreeWidget.selectedItems()
        if not selected_items:
            return
        for item in selected_items:
            file_path = item.data(0, Qt.UserRole)
            if os.path.isdir(file_path):
                continue
            name = os.path.basename(file_path)
            parent = item.parent()
            if parent:
                parent.removeChild(item)
            else:
                index = self.fileTreeWidget.indexOfTopLevelItem(item)
                self.fileTreeWidget.takeTopLevelItem(index)
            self.files_content = [(fname, c) for fname, c in self.files_content if fname != name]
            if name in self.file_positions:
                del self.file_positions[name]
        self.update_text_edit(initial=True)
        for fname, content in self.files_content:
            self.append_text_edit(fname, content)

    def open_search_dialog(self):
        """打开搜索对话框"""
        text, ok = QInputDialog.getText(self, '搜索', '请输入搜索内容:')
        if ok and text:
            self.find_in_text_edit(text)

    def find_in_text_edit(self, text):
        """在文本编辑器中查找指定文本"""
        cursor = self.textEdit.textCursor()
        found = self.textEdit.find(text)
        if not found:
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
        """更新状态栏中行数与字符数统计"""
        full_text = self.textEdit.toPlainText()
        line_count = len(full_text.splitlines())
        char_count = len(full_text)
        self.statusBar.showMessage(f"就绪 - 共 {line_count} 行, {char_count} 字符")

    def closeEvent(self, event):
        """
        重写关闭事件，确保在关闭前取消正在运行的文件处理线程，
        避免因线程操作已销毁的控件而导致崩溃。
        """
        if self.process_thread and self.process_thread.isRunning():
            self.process_thread.cancel()
            self.process_thread.wait()
        event.accept()