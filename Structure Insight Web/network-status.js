/**
 * Structure Insight Web - Network Status Manager
 * 用于检测和处理网络连接状态
 */

class NetworkStatusManager {
	constructor() {
	  this.online = navigator.onLine;
	  this.statusIndicator = null;

	  // 初始化
	  this.init();
	}

	init() {
	  // 监听网络状态变化
	  window.addEventListener('online', () => this.handleNetworkChange(true));
	  window.addEventListener('offline', () => this.handleNetworkChange(false));

	  // 创建状态指示器
	  this.createStatusIndicator(); // <--- 问题点：运行时机可能早于React渲染

	  // 设置初始状态
	  this.updateStatus(this.online);

	  // 定期检测网络状态
	  setInterval(() => this.checkNetworkStatus(), 30000);
	}

	// 创建网络状态指示器
	createStatusIndicator() {
	  // 查找App标题区域
	  const appTitle = document.querySelector('.app-logo'); // <--- 问题点：可能为 null
	  if (!appTitle) return;

	  // 创建状态指示器元素
	  const indicator = document.createElement('div');
	  indicator.className = 'pwa-status';
	  indicator.innerHTML = `
		<span class="status-icon ${this.online ? 'status-online' : 'status-offline'}"></span>
		<span class="status-text">${this.online ? '在线' : '离线'}</span>
	  `;

	  // 添加到app标题旁边
	  appTitle.appendChild(indicator);
	  this.statusIndicator = indicator;
	}

	// 处理网络状态变化
	handleNetworkChange(isOnline) {
	  this.online = isOnline;
	  this.updateStatus(isOnline);

	  // 显示通知
	  if (window.pwaInstaller) {
		if (isOnline) {
		  window.pwaInstaller.showToast('网络已连接');
		} else {
		  window.pwaInstaller.showToast('网络已断开，将使用离线模式');
		}
	  }
	}

	// 更新UI状态
	updateStatus(isOnline) {
	  // 更新body类名
	  document.body.classList.toggle('offline-mode', !isOnline);

	  // 更新状态指示器
	  if (this.statusIndicator) {
		const iconElement = this.statusIndicator.querySelector('.status-icon');
		const textElement = this.statusIndicator.querySelector('.status-text');

		if (iconElement) {
		  iconElement.className = `status-icon ${isOnline ? 'status-online' : 'status-offline'}`;

		  // 添加动画效果
		  iconElement.classList.add('pulsing');
		  setTimeout(() => {
			iconElement.classList.remove('pulsing');
		  }, 2000);
		}

		if (textElement) {
		  textElement.textContent = isOnline ? '在线' : '离线';
		}
	  }
	}

	// 主动检测网络状态
	async checkNetworkStatus() {
	  try {
		// 尝试发送请求到一个快速响应的端点
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 5000);

		const response = await fetch('/manifest.json', {
		  method: 'HEAD',
		  cache: 'no-store',
		  signal: controller.signal
		});

		clearTimeout(timeoutId);

		// 如果请求成功，假设我们在线
		const isOnline = response.ok;

		// 如果状态与当前记录的不同，更新它
		if (isOnline !== this.online) {
		  this.handleNetworkChange(isOnline);
		}
	  } catch (error) {
		// 如果请求失败，假设我们离线
		if (this.online) {
		  this.handleNetworkChange(false);
		}
	  }
	}
  }

  // 创建并导出实例
  window.networkStatus = new NetworkStatusManager();