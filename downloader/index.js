const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

/**
 * Node.js网站下载器 - 替代wget的功能
 */
class WebsiteDownloader {
    constructor() {
        this.downloadedUrls = new Set();
        this.pendingUrls = [];
        this.baseUrl = '';
        this.outputDir = '';
    }

    /**
     * 下载网站
     * @param {string} url - 要下载的网站URL
     * @param {function} progressCallback - 进度回调函数
     */
    async downloadWebsite(url, progressCallback = () => {}) {
        try {
            const parsedUrl = new URL(url);
            this.baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
            this.outputDir = parsedUrl.hostname;

            // 创建输出目录
            if (!fs.existsSync(this.outputDir)) {
                fs.mkdirSync(this.outputDir, { recursive: true });
            }

            progressCallback(`正在启动浏览器...`);
            
            // 启动无头浏览器
            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            
            // 设置用户代理
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

            progressCallback(`正在访问 ${url}...`);
            
            // 访问主页面
            await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
            
            // 获取页面内容
            const content = await page.content();
            
            // 保存主页面
            const mainPagePath = path.join(this.outputDir, 'index.html');
            fs.writeFileSync(mainPagePath, content);
            
            progressCallback(`已保存主页面: ${mainPagePath}`);

            // 获取页面中的所有资源链接
            const resources = await page.evaluate(() => {
                const links = [];
                
                // 获取CSS文件
                document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
                    if (link.href) links.push({ url: link.href, type: 'css' });
                });
                
                // 获取JS文件
                document.querySelectorAll('script[src]').forEach(script => {
                    if (script.src) links.push({ url: script.src, type: 'js' });
                });
                
                // 获取图片
                document.querySelectorAll('img[src]').forEach(img => {
                    if (img.src) links.push({ url: img.src, type: 'img' });
                });
                
                // 获取图标
                document.querySelectorAll('link[rel*="icon"]').forEach(link => {
                    if (link.href) links.push({ url: link.href, type: 'icon' });
                });
                
                return links;
            });

            progressCallback(`发现 ${resources.length} 个资源文件`);

            // 下载资源文件
            let downloadedCount = 0;
            for (const resource of resources) {
                try {
                    await this.downloadResource(page, resource.url, resource.type);
                    downloadedCount++;
                    progressCallback(`已下载 ${downloadedCount}/${resources.length} 个资源文件`);
                } catch (error) {
                    console.warn(`下载资源失败: ${resource.url}`, error.message);
                }
            }

            await browser.close();
            
            progressCallback(`下载完成！共下载了 ${downloadedCount} 个资源文件`);
            return this.outputDir;

        } catch (error) {
            throw new Error(`下载失败: ${error.message}`);
        }
    }

    /**
     * 下载单个资源文件
     */
    async downloadResource(page, resourceUrl, type) {
        try {
            const parsedUrl = new URL(resourceUrl, this.baseUrl);
            const pathname = parsedUrl.pathname;
            
            // 生成本地文件路径
            let localPath = pathname;
            if (localPath === '/' || localPath === '') {
                localPath = '/index.html';
            }
            
            // 确保路径以正斜杠开头
            if (!localPath.startsWith('/')) {
                localPath = '/' + localPath;
            }
            
            const fullLocalPath = path.join(this.outputDir, localPath.replace(/^\//, ''));
            
            // 创建目录
            const dir = path.dirname(fullLocalPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // 下载文件
            const response = await page.goto(parsedUrl.href, { timeout: 10000 });
            if (response.ok()) {
                const buffer = await response.buffer();
                fs.writeFileSync(fullLocalPath, buffer);
            }

        } catch (error) {
            // 静默处理错误，不中断整个下载过程
            console.warn(`资源下载警告: ${resourceUrl} - ${error.message}`);
        }
    }
}

module.exports = WebsiteDownloader;