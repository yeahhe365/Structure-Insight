# modules/utils.py

import os
import sys

def resource_path(relative_path: str) -> str:
    """
    获取资源文件的绝对路径，兼容打包和未打包状态。
    
    在打包环境下（存在 sys._MEIPASS 属性）直接使用 sys._MEIPASS 目录，
    而在未打包状态下，假设当前文件位于 modules 目录中，则返回项目根目录。
    """
    if hasattr(sys, '_MEIPASS'):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base_path, relative_path)