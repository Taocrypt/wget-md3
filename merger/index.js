const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const paths = require('../config/paths');

/**
 * 文件合并处理模块
 * 将下载的网站文件合并成单个HTML文件
 */

class FileMerger {
    constructor(basePath, websiteName) {
        this.basePath = basePath;
        this.websiteName = websiteName;
        this.mergedHtml = '';
    }

    /**
     * 合并所有文件为单个HTML
     */
    async mergeFiles() {
        try {
            console.log(`开始合并文件: ${this.basePath}`);
            
            // 查找主HTML文件
            const htmlFiles = this.findHtmlFiles(this.basePath);
            console.log(`找到的HTML文件:`, htmlFiles);
            
            if (htmlFiles.length === 0) {
                throw new Error('未找到HTML文件');
            }

            // 智能选择主 HTML文件：优先选择 index.html
            let mainHtmlPath;
            
            // 先查找 index.html
            const indexFile = htmlFiles.find(file => {
                const fileName = path.basename(file).toLowerCase();
                return fileName === 'index.html';
            });
            
            if (indexFile) {
                mainHtmlPath = indexFile;
                console.log(`找到主页面: ${mainHtmlPath}`);
            } else {
                // 如果没有 index.html，优先选择根目录下的 HTML 文件
                const rootFiles = htmlFiles.filter(file => {
                    const relativePath = path.relative(this.basePath, file);
                    return !relativePath.includes(path.sep); // 不包含路径分隔符，即根目录文件
                });
                
                if (rootFiles.length > 0) {
                    mainHtmlPath = rootFiles[0];
                    console.log(`使用根目录下的HTML文件: ${mainHtmlPath}`);
                } else {
                    // 如果根目录没有HTML文件，使用第一个找到的文件
                    mainHtmlPath = htmlFiles[0];
                    console.log(`使用第一个HTML文件: ${mainHtmlPath}`);
                }
            }

            // 读取并处理主HTML文件
            const htmlContent = fs.readFileSync(mainHtmlPath, 'utf8');
            const dom = new JSDOM(htmlContent);
            const document = dom.window.document;

            // 内嵌CSS文件
            await this.inlineCSS(document);
            
            // 内嵌JavaScript文件
            await this.inlineJS(document);
            
            // 内嵌图片
            await this.inlineImages(document);
            
            // 处理其他资源链接
            this.processLinks(document);

            // 生成最终的HTML
            this.mergedHtml = dom.serialize();
            
            // 保存合并后的文件
            const outputPath = path.join(paths.MERGED_DIR, `${this.websiteName}_merged.html`);
            fs.writeFileSync(outputPath, this.mergedHtml, 'utf8');
            
            console.log(`文件合并完成: ${outputPath}`);
            return outputPath;
            
        } catch (error) {
            console.error('文件合并失败:', error);
            throw error;
        }
    }

    /**
     * 查找所有HTML文件
     */
    findHtmlFiles(dir) {
        const htmlFiles = [];
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                htmlFiles.push(...this.findHtmlFiles(filePath));
            } else if (path.extname(file).toLowerCase() === '.html') {
                htmlFiles.push(filePath);
            }
        }
        
        return htmlFiles;
    }

    /**
     * 内嵌CSS文件
     */
    async inlineCSS(document) {
        const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
        
        for (const link of linkElements) {
            try {
                const href = link.getAttribute('href');
                if (!href || href.startsWith('http')) continue;
                
                const cssPath = this.resolvePath(href);
                if (fs.existsSync(cssPath)) {
                    const cssContent = fs.readFileSync(cssPath, 'utf8');
                    
                    // 创建style标签替换link标签
                    const styleElement = document.createElement('style');
                    styleElement.setAttribute('type', 'text/css');
                    styleElement.textContent = cssContent;
                    
                    link.parentNode.replaceChild(styleElement, link);
                    console.log(`内嵌CSS: ${href}`);
                }
            } catch (error) {
                console.warn(`CSS内嵌失败: ${error.message}`);
            }
        }
    }

    /**
     * 内嵌JavaScript文件
     */
    async inlineJS(document) {
        const scriptElements = document.querySelectorAll('script[src]');
        
        for (const script of scriptElements) {
            try {
                const src = script.getAttribute('src');
                if (!src || src.startsWith('http')) continue;
                
                const jsPath = this.resolvePath(src);
                if (fs.existsSync(jsPath)) {
                    const jsContent = fs.readFileSync(jsPath, 'utf8');
                    
                    // 创建新的script标签
                    const newScript = document.createElement('script');
                    newScript.setAttribute('type', 'text/javascript');
                    newScript.textContent = jsContent;
                    
                    script.parentNode.replaceChild(newScript, script);
                    console.log(`内嵌JS: ${src}`);
                }
            } catch (error) {
                console.warn(`JS内嵌失败: ${error.message}`);
            }
        }
    }

    /**
     * 内嵌图片为base64
     */
    async inlineImages(document) {
        const imgElements = document.querySelectorAll('img');
        
        for (const img of imgElements) {
            try {
                const src = img.getAttribute('src');
                if (!src || src.startsWith('http') || src.startsWith('data:')) continue;
                
                const imgPath = this.resolvePath(src);
                if (fs.existsSync(imgPath)) {
                    const imgBuffer = fs.readFileSync(imgPath);
                    const ext = path.extname(imgPath).toLowerCase().slice(1);
                    const mimeType = this.getMimeType(ext);
                    const base64 = imgBuffer.toString('base64');
                    
                    img.setAttribute('src', `data:${mimeType};base64,${base64}`);
                    console.log(`内嵌图片: ${src}`);
                }
            } catch (error) {
                console.warn(`图片内嵌失败: ${error.message}`);
            }
        }
    }

    /**
     * 处理其他资源链接
     */
    processLinks(document) {
        // 移除外部资源链接，避免依赖外部文件
        const links = document.querySelectorAll('a[href]');
        for (const link of links) {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('#')) {
                // 将相对链接改为锚点或移除
                link.setAttribute('href', '#');
                link.style.textDecoration = 'line-through';
                link.title = `原链接: ${href} (已失效)`;
            }
        }
    }

    /**
     * 解析相对路径为绝对路径
     */
    resolvePath(relativePath) {
        return path.resolve(this.basePath, relativePath);
    }

    /**
     * 根据文件扩展名获取MIME类型
     */
    getMimeType(ext) {
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'bmp': 'image/bmp',
            'webp': 'image/webp',
            'ico': 'image/x-icon'
        };
        
        return mimeTypes[ext] || 'application/octet-stream';
    }
}

module.exports = FileMerger;