import sys
import os
import mimetypes
import logging
from PyQt5.QtWidgets import (
    QApplication, QWidget, QTextEdit, QVBoxLayout, QHBoxLayout,
    QSplitter, QPushButton, QFileDialog, QMessageBox, QLabel, QProgressBar, QCheckBox, QInputDialog, QAction, QTreeWidget, QTreeWidgetItem, QStatusBar, QStyle
)
from PyQt5.QtGui import QDropEvent, QFont, QIcon, QPixmap, QTextCursor
from PyQt5.QtCore import Qt, QThread, pyqtSignal, QMutex, QMutexLocker

logging.basicConfig(
    filename='file_reader.log',
    level=logging.ERROR,
    format='%(asctime)s %(levelname)s:%(message)s'
)

def resource_path(relative_path):
    """获取资源文件的绝对路径，兼容打包和未打包状态"""
    if hasattr(sys, '_MEIPASS'):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_path, relative_path)

class FileProcessThread(QThread):
    update_signal = pyqtSignal(str, str, str, str)  # (name, content, content_type, file_path)
    progress_signal = pyqtSignal(int)
    finished_signal = pyqtSignal()

    def __init__(self, path, extract_content=True, max_files=1000, max_depth=5):
        super().__init__()
        self.path = path
        self.extract_content = extract_content
        self.max_files = max_files
        self.max_depth = max_depth
        self.file_count = 0
        self.total_files = 0
        self.cancelled = False
        self.mutex = QMutex()
        self.skip_extensions = {
            '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.mp3', '.mp4',
            '.avi', '.mov', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'
        }
        # 添加允许处理的扩展名（例如 .js）
        self.allowed_extensions = {'.js', '.json'}

    def run(self):
        try:
            file_structure = self.get_file_structure(self.path)
            self.update_signal.emit("structure", file_structure, "structure", self.path)

            if os.path.isdir(self.path):
                self.process_directory(self.path)
            else:
                self.process_file(self.path)
        except Exception as e:
            logging.error(f"处理过程中发生错误: {str(e)}")
        finally:
            self.finished_signal.emit()

    def process_directory(self, dir_path, depth=0):
        if depth > self.max_depth or self.cancelled:
            return
        with QMutexLocker(self.mutex):
            if self.file_count >= self.max_files:
                self.cancelled = True
                return
        try:
            with os.scandir(dir_path) as entries:
                for entry in entries:
                    if self.cancelled:
                        return
                    with QMutexLocker(self.mutex):
                        if self.file_count >= self.max_files:
                            self.cancelled = True
                            return
                    if entry.is_symlink():
                        continue
                    if entry.is_dir(follow_symlinks=False):
                        self.process_directory(entry.path, depth + 1)
                    elif entry.is_file():
                        self.process_file(entry.path)
        except PermissionError as e:
            logging.error(f"无法访问目录 {dir_path}: {str(e)}")

    def get_file_structure(self, start_path):
        output = []
        max_depth = self.max_depth

        def print_directory(path, prefix='', depth=0):
            if depth > max_depth or self.cancelled:
                return
            try:
                contents = list(os.scandir(path))
            except PermissionError as e:
                logging.error(f"无法访问目录 {path}: {str(e)}")
                return

            for i, entry in enumerate(contents):
                if self.cancelled:
                    return
                is_last = (i == len(contents) - 1)
                output.append(f"{prefix}{'└── ' if is_last else '├── '}{entry.name}")
                if entry.is_dir(follow_symlinks=False):
                    extension = '    ' if is_last else '│   '
                    print_directory(entry.path, prefix + extension, depth + 1)

        output.append(os.path.basename(start_path))
        if os.path.isdir(start_path):
            print_directory(start_path)
        else:
            output.append(os.path.basename(start_path))
        return '\n'.join(output)

    def process_file(self, file_path):
        if self.cancelled:
            return

        with QMutexLocker(self.mutex):
            if self.file_count >= self.max_files:
                self.cancelled = True
                return

        file_name = os.path.basename(file_path)
        _, file_extension = os.path.splitext(file_name)

        # 检查是否跳过该文件类型，除非在允许的扩展名列表中
        if file_extension.lower() in self.skip_extensions and file_extension.lower() not in self.allowed_extensions:
            self.update_signal.emit(file_name, "跳过该文件类型", "skipped", file_path)
            return

        if not self.extract_content:
            self.update_signal.emit(file_name, "", "file_no_content", file_path)
            with QMutexLocker(self.mutex):
                self.file_count += 1
            self.progress_signal.emit(self.file_count)
            return

        # 大于10MB的文件跳过
        if os.path.getsize(file_path) > 10 * 1024 * 1024:
            self.update_signal.emit(file_name, "文件过大，已跳过", "skipped", file_path)
            return

        # 检查是否是文本文件或特定的 MIME 类型
        mime_type, _ = mimetypes.guess_type(file_path)
        # 添加 'application/javascript' 和 'application/json' 到允许的 MIME 类型
        allowed_mime_types = ['text', 'application/javascript', 'application/json']
        if mime_type:
            if not (mime_type.startswith('text') or mime_type in allowed_mime_types):
                self.update_signal.emit(file_name, "非文本文件，已跳过", "skipped", file_path)
                return
        else:
            # 如果无法猜测 MIME 类型，也可以选择跳过或处理
            self.update_signal.emit(file_name, "无法确定文件类型，已跳过", "skipped", file_path)
            return

        content = self.read_file_content(file_path)
        if content is not None:
            self.update_signal.emit(file_name, content, "file", file_path)
        else:
            error_msg = f"无法读取 {file_path}"
            self.update_signal.emit(file_name, error_msg, "error", file_path)

        with QMutexLocker(self.mutex):
            self.file_count += 1
            if self.file_count >= self.max_files:
                self.cancelled = True
        self.progress_signal.emit(self.file_count)

    def read_file_content(self, file_path):
        encodings = ['utf-8', 'gbk', 'latin1']
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding, errors='ignore') as file:
                    return file.read()
            except Exception as e:
                logging.error(f"读取 {file_path} 时使用编码 {encoding} 失败: {str(e)}")
        return None

    def cancel(self):
        with QMutexLocker(self.mutex):
            self.cancelled = True

class FileDropWidget(QWidget):
    def __init__(self):
        super().__init__()
        self.files_content = []
        self.file_structure = ""
        self.process_thread = None
        self.file_positions = {}
        self.dir_items = {}
        self.isDarkTheme = True  # 默认使用暗色主题
        self.lastPath = None     # 用于记录上一次处理的路径
        self.initUI()

    def initUI(self):
        # 获取应用实例，以便动态切换样式表
        self.app = QApplication.instance()
        # 定义两个主题的样式表
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

        # 默认应用暗色主题
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

        # 设置默认窗口大小为16:9的比例
        self.resize(1280, 720)

        # 设置字体(非粗体, 中等大小)
        font = QFont()
        font.setPointSize(11)
        font.setBold(False)
        self.setFont(font)

        # 文本编辑器
        self.textEdit = QTextEdit()
        self.textEdit.setReadOnly(False)
        self.textEdit.setFont(font)
        self.textEdit.setToolTip("文件结构和文件内容将在这里显示")

        # 当文本内容发生变化时，更新状态栏的行数和字符数
        self.textEdit.textChanged.connect(self.update_line_char_count_in_status_bar)

        # 按钮（图标化）
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

        # 这里是原本的“清空并重置”按钮，现在把图标换成“清扫”之类的图标 (示例使用垃圾桶图标)
        self.resetButton = QPushButton()
        self.resetButton.setToolTip("清空当前结果并重置")
        reset_icon = self.style().standardIcon(QStyle.SP_TrashIcon)  # 新的清扫图标
        self.resetButton.setIcon(reset_icon)
        self.resetButton.clicked.connect(self.resetContent)
        self.resetButton.setEnabled(False)

        # 新增“刷新”按钮，使用原先 resetButton 的 SP_BrowserReload 图标
        self.refreshButton = QPushButton()
        self.refreshButton.setToolTip("刷新当前路径")
        refresh_icon = self.style().standardIcon(QStyle.SP_BrowserReload)  # 原先 resetButton 的图标
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

        # 使用合适的图标进行主题切换按钮
        self.themeButton = QPushButton()
        self.themeButton.setToolTip("在深色和浅色主题之间切换")
        theme_icon = self.style().standardIcon(QStyle.SP_DesktopIcon)  # 使用桌面图标作为主题切换图标
        self.themeButton.setIcon(theme_icon)
        self.themeButton.clicked.connect(self.toggleTheme)

        # 按钮布局
        buttonLayout = QHBoxLayout()
        buttonLayout.setSpacing(8)
        buttonLayout.setContentsMargins(0,0,0,0)
        buttonLayout.addWidget(self.openFolderButton)
        buttonLayout.addWidget(self.copyButton)
        buttonLayout.addWidget(self.saveButton)
        buttonLayout.addWidget(self.resetButton)
        buttonLayout.addWidget(self.refreshButton)
        buttonLayout.addWidget(self.cancelButton)
        buttonLayout.addWidget(self.extractContentCheckbox)
        buttonLayout.addWidget(self.themeButton)

        # 顶部布局（仅有按钮）
        topLayout = QHBoxLayout()
        topLayout.setSpacing(10)
        topLayout.setContentsMargins(0,0,0,0)
        topLayout.addLayout(buttonLayout)

        self.progressBar = QProgressBar()
        self.progressBar.setToolTip("处理进度条")

        # 左侧布局（文本显示区 + 进度条）
        leftLayout = QVBoxLayout()
        leftLayout.setContentsMargins(5,5,5,5)
        leftLayout.setSpacing(8)
        leftLayout.addLayout(topLayout)
        leftLayout.addWidget(self.textEdit)
        leftLayout.addWidget(self.progressBar)

        leftWidget = QWidget()
        leftWidget.setLayout(leftLayout)

        # 右侧文件树
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

        # 分割器
        splitter = QSplitter(Qt.Horizontal)
        splitter.addWidget(leftWidget)
        splitter.addWidget(rightWidget)
        splitter.setSizes([960, 320])  # 将文件列表框的默认宽度缩小

        # 状态栏
        self.statusBar = QStatusBar()
        self.statusBar.showMessage("就绪")
        self.statusBar.setSizeGripEnabled(False)
        self.statusBar.setFixedHeight(24)

        # 主布局
        mainLayout = QVBoxLayout()
        mainLayout.setContentsMargins(0,0,0,0)
        mainLayout.setSpacing(0)
        mainLayout.addWidget(splitter)
        mainLayout.addWidget(self.statusBar)

        self.setLayout(mainLayout)

        # 搜索快捷键
        searchAction = QAction(self)
        searchAction.setShortcut('Ctrl+F')
        searchAction.triggered.connect(self.open_search_dialog)
        self.addAction(searchAction)

    # 新增一个函数：统计并更新状态栏的行数和字符数
    def update_line_char_count_in_status_bar(self):
        full_text = self.textEdit.toPlainText()
        line_count = len(full_text.splitlines())
        char_count = len(full_text)
        self.statusBar.showMessage(f"就绪 - 共 {line_count} 行, {char_count} 字符")

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
        self.resetContent()
        self.lastPath = path  # 记录最后一次处理的路径

        extract_content = self.extractContentCheckbox.isChecked()
        self.process_thread = FileProcessThread(path, extract_content=extract_content)

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
        """刷新当前已加载的路径"""
        if self.lastPath:
            self.startProcessing(self.lastPath)

    def count_total_files(self, path):
        """统计即将处理的文件数量，用于设置进度条最大值"""
        total_files = 0
        # 在这里可以从 self.process_thread 读取相关参数
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
        """将分析的结果更新到文本区与树形控件"""
        if content_type == "structure":
            # 显示文件/文件夹层次结构
            self.file_structure = content
            self.update_text_edit(initial=True)
            root_item = QTreeWidgetItem(self.fileTreeWidget)
            root_item.setText(0, os.path.basename(file_path))
            root_item.setData(0, Qt.UserRole, file_path)
            self.dir_items[file_path] = root_item
        elif content_type in ["file", "file_no_content", "skipped", "error"]:
            # 显示具体文件节点
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

            # 如果需要提取内容，则追加到文本框
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
        # 如果是“跳过: ***”或“错误: ***”开头，或者文件夹节点（有子项），则不跳转
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
        """处理完成后，更新界面按钮状态，并显示行数和字符数"""
        self.copyButton.setEnabled(True)
        self.saveButton.setEnabled(True)
        self.resetButton.setEnabled(True)
        if self.lastPath:
            self.refreshButton.setEnabled(True)  # 如果有处理的路径，就可以启用刷新按钮

        self.cancelButton.setEnabled(False)
        self.extractContentCheckbox.setEnabled(True)
        self.progressBar.setValue(self.progressBar.maximum())

        # 主动调用一下文本编辑器的行数/字符统计，让状态栏刷新
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
        """清空当前所有结果并重置"""
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

        # 状态栏恢复
        self.statusBar.showMessage("就绪")
        self.refreshButton.setEnabled(False)

    def cancelProcessing(self):
        """取消处理"""
        if self.process_thread:
            self.process_thread.cancel()
            self.process_thread.wait()
            self.process_finished()

    def openFolder(self):
        """弹出对话框选择文件夹进行分析"""
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
                # 如果选中的是一个文件夹节点，这里仅示例不进行删除，可自行添加逻辑
                continue
            name = os.path.basename(file_path)
            parent = item.parent()
            if parent:
                parent.removeChild(item)
            else:
                index = self.fileTreeWidget.indexOfTopLevelItem(item)
                self.fileTreeWidget.takeTopLevelItem(index)

            # 从 files_content 列表中去掉该文件
            self.files_content = [
                (fname, content) for fname, content in self.files_content if fname != name
            ]
            if name in self.file_positions:
                del self.file_positions[name]

        # 重新生成文本内容
        self.update_text_edit(initial=True)
        for name, content in self.files_content:
            self.append_text_edit(name, content)

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

if __name__ == '__main__':
    app = QApplication(sys.argv)
    ex = FileDropWidget()
    ex.show()
    sys.exit(app.exec_())