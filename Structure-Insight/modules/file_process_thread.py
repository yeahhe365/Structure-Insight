# modules/file_process_thread.py

import os
import mimetypes
import logging
from PyQt5.QtCore import QThread, pyqtSignal, QMutex, QMutexLocker

class FileProcessThread(QThread):
    # 用于在处理过程中发送各种信号给UI线程
    update_signal = pyqtSignal(str, str, str, str)   # (name, content, content_type, file_path)
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

        # 跳过的扩展名（大多为非文本/二进制文件）
        self.skip_extensions = {
            '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.mp3', '.mp4',
            '.avi', '.mov', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'
        }

        # 允许被当作文本处理的扩展名：即使它们出现在 skip_extensions 中，也优先提取
        # 这里根据需要增加了各种常见文本、脚本、配置类后缀
        self.allowed_extensions = {
            # 原先已有
            '.js', '.json',

            # 常见的纯文本/标记/配置
            '.txt', '.log', '.md', '.rst', '.csv', '.tsv', '.tab', '.tex',
            '.rtf', '.html', '.htm', '.xml', '.yaml', '.yml', '.toml', '.ini',
            '.conf', '.cfg', '.properties',

            # 各类脚本/代码文件
            '.py', '.ipynb', '.php', '.jsx', '.ts', '.tsx', '.sh', '.bash',
            '.zsh', '.bat', '.cmd', '.ps1', '.go', '.rb', '.pl', '.pm', '.lua',
            '.java', '.jsp', '.kt', '.swift', '.dart', '.groovy', '.scala',
            '.clj', '.hs', '.ml', '.fs', '.c', '.cpp', '.cxx', '.cc', '.h',
            '.hpp', '.hxx', '.cs', '.vb', '.bas', '.css', '.scss', '.less',
            '.sql',

            # 其他常见文本配置/元数据
            '.env', '.gitignore', '.dockerignore', '.dockerfile',
            '.editorconfig', '.gitattributes', '.babelrc', '.eslintignore',
            '.eslintcache', '.eslintrc', '.prettierrc', '.stylelintrc'
        }

    def run(self):
        try:
            # 先获取结构
            file_structure = self.get_file_structure(self.path)
            self.update_signal.emit("structure", file_structure, "structure", self.path)

            # 若是文件夹，则递归处理；若是单文件，则直接处理
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
        """
        获取类似“tree”命令的文件树结构字符串
        """
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
                # 使用特定符号来显示树结构
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
        file_extension = file_extension.lower()

        # 如果在 skip_extensions 中且不在 allowed_extensions，跳过
        if file_extension in self.skip_extensions and file_extension not in self.allowed_extensions:
            self.update_signal.emit(file_name, "跳过该文件类型", "skipped", file_path)
            return

        if not self.extract_content:
            # 不提取内容时，只输出文件名
            self.update_signal.emit(file_name, "", "file_no_content", file_path)
            with QMutexLocker(self.mutex):
                self.file_count += 1
            self.progress_signal.emit(self.file_count)
            return

        # 大于10MB的文件跳过
        if os.path.getsize(file_path) > 10 * 1024 * 1024:
            self.update_signal.emit(file_name, "文件过大，已跳过", "skipped", file_path)
            return

        # 检查 MIME 类型（文本类型或在 allowed_mime_types 列表中）
        mime_type, _ = mimetypes.guess_type(file_path)
        allowed_mime_types = ['text', 'application/javascript', 'application/json']

        if mime_type:
            if not (mime_type.startswith('text') or mime_type in allowed_mime_types):
                self.update_signal.emit(file_name, "非文本文件，已跳过", "skipped", file_path)
                return
        else:
            # 如果 MIME 不确定，就再看扩展名是否在 allowed_extensions
            if file_extension not in self.allowed_extensions:
                self.update_signal.emit(file_name, "无法确定文件类型，已跳过", "skipped", file_path)
                return

        # 读取内容
        content = self.read_file_content(file_path)
        if content is not None:
            self.update_signal.emit(file_name, content, "file", file_path)
        else:
            error_msg = f"无法读取 {file_path}"
            self.update_signal.emit(file_name, error_msg, "error", file_path)

        # 更新计数并发射进度
        with QMutexLocker(self.mutex):
            self.file_count += 1
            if self.file_count >= self.max_files:
                self.cancelled = True
        self.progress_signal.emit(self.file_count)

    def read_file_content(self, file_path):
        """
        尝试多种编码读取文本文件
        """
        encodings = ['utf-8', 'gbk', 'latin1']
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding, errors='ignore') as file:
                    return file.read()
            except Exception as e:
                logging.error(f"读取 {file_path} 时使用编码 {encoding} 失败: {str(e)}")
        return None

    def cancel(self):
        """
        外部可调用此方法来取消线程运行
        """
        with QMutexLocker(self.mutex):
            self.cancelled = True