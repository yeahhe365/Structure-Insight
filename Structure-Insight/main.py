# main.py

import sys
import logging
from PyQt5.QtWidgets import QApplication
from modules.file_drop_widget import FileDropWidget

def main():
    # 初始化日志配置
    logging.basicConfig(
        filename='file_reader.log',
        level=logging.ERROR,
        format='%(asctime)s %(levelname)s:%(message)s'
    )

    # 创建应用
    app = QApplication(sys.argv)
    # 创建主界面
    ex = FileDropWidget()
    ex.show()
    # 进入事件循环
    sys.exit(app.exec_())

if __name__ == '__main__':
    main()