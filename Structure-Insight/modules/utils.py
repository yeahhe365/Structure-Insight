# modules/utils.py

import os
import sys

def resource_path(relative_path: str) -> str:
    """
    获取资源文件的绝对路径，兼容打包和未打包状态
    """
    if hasattr(sys, '_MEIPASS'):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.dirname(os.path.abspath(__file__))

    # 注意：如果此函数在其他文件中被调用，需要考虑当前文件的位置
    # 这里假定 resources 与本文件在同层目录或更上层，
    # 若层级变化，请根据实际情况修正
    return os.path.join(os.path.dirname(base_path), relative_path)