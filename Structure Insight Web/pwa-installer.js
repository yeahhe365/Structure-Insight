/**
 * Structure Insight Web - PWA Installer
 * 用于处理PWA安装和更新
 */

class PWAInstaller {
	constructor() {
	  this.deferredPrompt = null;
	  this.isInstallable = false;
	  this.isInstalled = false;
	  this.toastContainer = null;
	  this.refreshing = false;
	  
	  // 初始化
	  this.init();
	}
	
	init() {
	  // 检查应用是否已安装
	  this.checkIfInstalled();
	  
	  // 注册Service Worker
	  if ('serviceWorker' in navigator) {
		window.addEventListener('load', () => {
		  navigator.serviceWorker.register('/service-worker.js')
			.then(registration => {
			  console.log('Service Worker 注册成功:', registration.scope);
			  
			  // 检查更新
			  this.checkForUpdates(registration);
			  
			  // 设置定期检查更新（每小时）
			  setInterval(() => {
				this.checkForUpdates(registration);
			  }, 60 * 60 * 1000);
			})
			.catch(error => {
			  console.error('Service Worker 注册失败:', error);
			});
		});
        
        // 修复：在初始化时只添加一次 controllerchange 事件监听器
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (this.refreshing) return;
          this.refreshing = true;
          window.location.reload();
        });
	  }
	  
	  // 监听 beforeinstallprompt 事件
	  window.addEventListener('beforeinstallprompt', (e) => {
		// 阻止 Chrome 67 及更早版本自动显示安装提示
		e.preventDefault();
		
		// 保存事件，以便稍后触发
		this.deferredPrompt = e;
		this.isInstallable = true;
		
		// 发送安装状态变化事件
		this.triggerInstallStateChange();
	  });
	  
	  // 监听应用安装状态
	  window.addEventListener('appinstalled', (e) => {
		// 应用已安装
		this.isInstalled = true;
		this.isInstallable = false;
		this.deferredPrompt = null;
		
		// 显示安装成功通知
		this.showToast('应用已成功安装到您的设备');
		
		// 发送安装状态变化事件
		this.triggerInstallStateChange();
		
		// 记录安装事件
		console.log('应用已安装', e);
	  });
	}
	
	// 检查应用是否已安装
	checkIfInstalled() {
	  // 检查窗口是否在独立的浏览上下文中运行 (installed PWA)
	  if (window.matchMedia('(display-mode: standalone)').matches || 
		  window.navigator.standalone === true) {
		this.isInstalled = true;
	  }
	}
	
	// 触发安装状态变化事件
	triggerInstallStateChange() {
	  const event = new CustomEvent('pwainstallstatechange', {
		detail: {
		  isInstallable: this.isInstallable,
		  isInstalled: this.isInstalled
		}
	  });
	  document.dispatchEvent(event);
	}
	
	// 安装PWA
	async installPWA() {
	  if (!this.deferredPrompt) {
		return { success: false, message: '当前不可安装' };
	  }
	  
	  // 显示安装提示
	  this.deferredPrompt.prompt();
	  
	  // 等待用户响应
	  const choiceResult = await this.deferredPrompt.userChoice;
	  
	  // 用户操作后重置延迟提示
	  this.deferredPrompt = null;
	  
	  // 如果用户选择了接受
	  if (choiceResult.outcome === 'accepted') {
		this.showToast('应用安装中...');
		return { success: true, message: '安装已启动' };
	  } else {
		console.log('用户取消了安装');
		return { success: false, message: '用户取消了安装' };
	  }
	}
	
	// 获取安装状态
	getInstallState() {
	  return {
		isInstallable: this.isInstallable,
		isInstalled: this.isInstalled
	  };
	}
	
	// 检查Service Worker更新
	checkForUpdates(registration) {
	  registration.update()
		.then(() => {
		  // 检查新的Service Worker
		  if (registration.waiting) {
			this.updateReady(registration.waiting);
		  }
		  
		  // 监听新的Service Worker的安装
		  registration.addEventListener('updatefound', () => {
			const newWorker = registration.installing;
			
			if (newWorker) {
			  newWorker.addEventListener('statechange', () => {
				// 新的Service Worker状态变为已安装
				if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
				  this.updateReady(newWorker);
				}
			  });
			}
		  });
		})
		.catch(error => {
		  console.error('检查更新失败:', error);
		});
	  
	  // 修复: 移除了这里的 controllerchange 事件监听器，已在初始化中添加
	}
	
	// 有新版本可用
	updateReady(worker) {
	  // 显示更新通知
	  this.showUpdateToast('发现新版本', '点击刷新以应用更新', () => {
		// 用户点击更新按钮，通知service worker激活新版本
		worker.postMessage({ type: 'SKIP_WAITING' });
	  });
	}
	
	// 显示简单通知
	showToast(message, duration = 3000) {
	  this.initToastContainer();
	  
	  const toastEl = document.createElement('div');
	  toastEl.classList.add('pwa-toast');
	  toastEl.textContent = message;
	  
	  this.toastContainer.appendChild(toastEl);
	  
	  // 显示动画
	  setTimeout(() => toastEl.classList.add('visible'), 10);
	  
	  // 自动隐藏
	  setTimeout(() => {
		toastEl.classList.remove('visible');
		setTimeout(() => toastEl.remove(), 300);
	  }, duration);
	}
	
	// 显示更新通知
	showUpdateToast(title, message, action) {
	  this.initToastContainer();
	  
	  const toastEl = document.createElement('div');
	  toastEl.classList.add('pwa-update-toast');
	  
	  toastEl.innerHTML = `
		<div class="toast-header">
		  <strong>${title}</strong>
		  <button class="toast-close"><i class="fas fa-times"></i></button>
		</div>
		<div class="toast-body">
		  <p>${message}</p>
		  <button class="toast-action">立即更新</button>
		</div>
	  `;
	  
	  // 关闭按钮事件
	  toastEl.querySelector('.toast-close').addEventListener('click', () => {
		toastEl.classList.remove('visible');
		setTimeout(() => toastEl.remove(), 300);
	  });
	  
	  // 更新按钮事件
	  toastEl.querySelector('.toast-action').addEventListener('click', () => {
		if (typeof action === 'function') action();
		toastEl.classList.remove('visible');
		setTimeout(() => toastEl.remove(), 300);
	  });
	  
	  this.toastContainer.appendChild(toastEl);
	  
	  // 显示动画
	  setTimeout(() => toastEl.classList.add('visible'), 10);
	}
	
	// 初始化通知容器
	initToastContainer() {
	  if (!this.toastContainer) {
		const container = document.createElement('div');
		container.classList.add('pwa-toast-container');
		document.body.appendChild(container);
		this.toastContainer = container;
	  }
	}
}
  
// 创建并导出实例
window.pwaInstaller = new PWAInstaller();