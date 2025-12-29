class NineGridCutter {
    constructor() {
        this.currentImage = null;
        this.cutImages = [];
        this.fileInput = document.getElementById('fileInput');
        this.uploadArea = document.getElementById('uploadArea');
        this.originalImage = document.getElementById('originalImage');
        this.originalInfo = document.getElementById('originalInfo');
        this.processingSection = document.getElementById('processingSection');
        this.resultSection = document.getElementById('resultSection');
        this.gridContainer = document.getElementById('gridContainer');
        this.splitBtn = document.getElementById('splitBtn');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.messageToast = document.getElementById('messageToast');

        this.initEventListeners();
    }

    initEventListeners() {
        // 文件选择事件
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileUpload(e.target.files[0]);
            }
        });

        // 拖拽上传事件
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload(files[0]);
            }
        });

        // 切割按钮事件
        this.splitBtn.addEventListener('click', () => {
            this.splitImage();
        });

        // 打包下载按钮事件
        this.downloadAllBtn.addEventListener('click', () => {
            this.downloadAllImages();
        });
    }

    async handleFileUpload(file) {
        // 文件验证
        if (!this.validateFile(file)) {
            return;
        }

        try {
            this.showLoading();
            
            // 创建图片对象
            const imageUrl = URL.createObjectURL(file);
            const img = new Image();
            
            img.onload = () => {
                this.currentImage = img;
                this.displayOriginalImage(img, file);
                this.hideLoading();
                this.showMessage('图片上传成功！', 'success');
            };

            img.onerror = () => {
                this.hideLoading();
                this.showMessage('图片加载失败，请重试', 'error');
                URL.revokeObjectURL(imageUrl);
            };

            img.src = imageUrl;
        } catch (error) {
            this.hideLoading();
            this.showMessage('图片处理失败', 'error');
            console.error('Error loading image:', error);
        }
    }

    validateFile(file) {
        // 检查文件类型
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            this.showMessage('仅支持 PNG 和 JPG 格式的图片', 'error');
            return false;
        }

        // 检查文件大小 (10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showMessage('文件大小不能超过 10MB', 'error');
            return false;
        }

        return true;
    }

    displayOriginalImage(img, file) {
        // 显示处理区域
        this.processingSection.style.display = 'block';
        
        // 显示原始图片
        this.originalImage.src = img.src;
        
        // 显示图片信息
        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        this.originalInfo.textContent = 
            `尺寸: ${img.naturalWidth} × ${img.naturalHeight}px | ` +
            `文件大小: ${fileSize}MB | ` +
            `格式: ${file.type.split('/')[1].toUpperCase()}`;
        
        // 滚动到处理区域
        this.processingSection.scrollIntoView({ behavior: 'smooth' });
    }

    async splitImage() {
        if (!this.currentImage) {
            this.showMessage('请先上传图片', 'warning');
            return;
        }

        this.showLoading();

        try {
            // 等待一小段时间以显示加载动画
            await new Promise(resolve => setTimeout(resolve, 500));

            // 创建 canvas 进行图片切割
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const originalWidth = this.currentImage.naturalWidth;
            const originalHeight = this.currentImage.naturalHeight;
            
            // 计算每个格子的尺寸
            const cellWidth = originalWidth / 3;
            const cellHeight = originalHeight / 3;
            
            this.cutImages = [];
            
            // 切割图片为9个格子
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 3; col++) {
                    const x = col * cellWidth;
                    const y = row * cellHeight;
                    
                    // 设置 canvas 尺寸
                    canvas.width = cellWidth;
                    canvas.height = cellHeight;
                    
                    // 绘制切割后的图片
                    ctx.drawImage(
                        this.currentImage,
                        x, y, cellWidth, cellHeight,  // 源区域
                        0, 0, cellWidth, cellHeight   // 目标区域
                    );
                    
                    // 转换为 blob
                    const blob = await new Promise(resolve => {
                        canvas.toBlob(resolve, 'image/png', 1.0);
                    });
                    
                    const cutImageData = {
                        blob: blob,
                        url: URL.createObjectURL(blob),
                        index: row * 3 + col,
                        position: { row, col },
                        size: { width: cellWidth, height: cellHeight }
                    };
                    
                    this.cutImages.push(cutImageData);
                }
            }
            
            this.displayCutImages();
            this.hideLoading();
            this.showMessage('图片切割完成！', 'success');
            
        } catch (error) {
            this.hideLoading();
            this.showMessage('图片切割失败', 'error');
            console.error('Error splitting image:', error);
        }
    }

    displayCutImages() {
        // 显示结果区域
        this.resultSection.style.display = 'block';
        
        // 清空容器
        this.gridContainer.innerHTML = '';
        
        // 创建9个格子
        this.cutImages.forEach((imageData, index) => {
            const gridItem = document.createElement('div');
            gridItem.className = 'grid-item';
            
            const img = document.createElement('img');
            img.src = imageData.url;
            img.alt = `切割图片 ${index + 1}`;
            
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-btn';
            downloadBtn.textContent = '下载';
            downloadBtn.onclick = () => this.downloadSingleImage(imageData);
            
            const info = document.createElement('div');
            info.className = 'grid-item-info';
            const row = imageData.position.row + 1;
            const col = imageData.position.col + 1;
            info.textContent = `位置: ${row}-${col} | ${imageData.size.width.toFixed(0)}×${imageData.size.height.toFixed(0)}px`;
            
            gridItem.appendChild(img);
            gridItem.appendChild(downloadBtn);
            gridItem.appendChild(info);
            
            this.gridContainer.appendChild(gridItem);
        });
        
        // 滚动到结果区域
        this.resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    async downloadSingleImage(imageData) {
        try {
            const link = document.createElement('a');
            link.href = imageData.url;
            link.download = `九宫格_${imageData.position.row + 1}-${imageData.position.col + 1}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showMessage('图片下载开始', 'success');
        } catch (error) {
            this.showMessage('下载失败', 'error');
            console.error('Error downloading image:', error);
        }
    }

    async downloadAllImages() {
        if (this.cutImages.length === 0) {
            this.showMessage('没有可下载的图片', 'warning');
            return;
        }

        // 显示下载进度
        this.showMessage('正在准备批量下载...', 'info');

        try {
            // 禁用下载按钮防止重复点击
            this.downloadAllBtn.disabled = true;
            this.downloadAllBtn.textContent = '下载中...';

            // 逐个下载图片，使用更长的延迟和进度提示
            for (let i = 0; i < this.cutImages.length; i++) {
                const imageData = this.cutImages[i];
                
                // 更新进度提示
                this.showMessage(`正在下载第 ${i + 1}/9 张图片...`, 'info');
                
                // 下载图片
                this.downloadSingleImage(imageData);
                
                // 使用更长的延迟，避免同时弹出多个保存对话框
                await new Promise(resolve => setTimeout(resolve, 800));
            }
            
            // 恢复下载按钮
            this.downloadAllBtn.disabled = false;
            this.downloadAllBtn.textContent = '打包下载所有图片';
            
            this.showMessage('所有图片下载已开始，请查看浏览器下载文件夹', 'success');
        } catch (error) {
            // 恢复下载按钮
            this.downloadAllBtn.disabled = false;
            this.downloadAllBtn.textContent = '打包下载所有图片';
            
            this.showMessage('批量下载失败', 'error');
            console.error('Error downloading all images:', error);
        }
    }

    showLoading() {
        this.loadingOverlay.style.display = 'flex';
    }

    hideLoading() {
        this.loadingOverlay.style.display = 'none';
    }

    showMessage(message, type = 'success') {
        this.messageToast.textContent = message;
        this.messageToast.className = `message-toast ${type}`;
        this.messageToast.classList.add('show');
        
        // 自动隐藏消息
        setTimeout(() => {
            this.messageToast.classList.remove('show');
        }, 3000);
    }

    // 清理资源
    cleanup() {
        // 释放图片 URL
        if (this.currentImage) {
            URL.revokeObjectURL(this.currentImage.src);
        }
        
        this.cutImages.forEach(imageData => {
            URL.revokeObjectURL(imageData.url);
        });
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    const app = new NineGridCutter();
    
    // 页面卸载时清理资源
    window.addEventListener('beforeunload', () => {
        app.cleanup();
    });
});