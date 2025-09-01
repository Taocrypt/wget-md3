const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const paths = require('../config/paths');

/**
 * 简单的网站下载器 - 使用Node.js内置模块
 */
class SimpleDownloader {
    constructor() {
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    }

    /**
     * 下载网站主页面
     */
    async downloadWebsite(url, progressCallback = () => {}) {
        try {
            const parsedUrl = new URL(url);
            const hostname = parsedUrl.hostname;
            const outputDir = path.join(paths.DOWNLOADS_DIR, hostname);

            // 创建输出目录
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            progressCallback(`正在下载主页面: ${url}`);

            // 下载主页面
            const html = await this.downloadFile(url);
            
            // 转换HTML中的链接为相对路径
            const convertedHtml = this.convertLinksToRelative(html, url);
            
            // 保存主页面
            const mainPagePath = path.join(outputDir, 'index.html');
            fs.writeFileSync(mainPagePath, convertedHtml);
            
            progressCallback(`已保存主页面: ${mainPagePath}`);

            // 解析HTML中的资源链接
            const resources = this.parseResources(html, url);
            
            // 添加常见的根目录文件
            const commonRootFiles = await this.discoverCommonFiles(url);
            resources.push(...commonRootFiles);
            
            // 发现其他页面链接
            const additionalPages = this.parsePageLinks(html, url);
            
            progressCallback(`发现 ${resources.length} 个资源文件和 ${additionalPages.length} 个页面`);

            // 下载资源文件
            let downloadedCount = 0;
            for (const resource of resources) {
                try {
                    await this.downloadResource(resource, outputDir, url);
                    downloadedCount++;
                    progressCallback(`已下载 ${downloadedCount}/${resources.length} 个资源文件`);
                } catch (error) {
                    console.warn(`下载资源失败: ${resource}`, error.message);
                    progressCallback(`警告: 下载 ${resource} 失败`);
                }
            }
            
            // 下载其他页面
            let pageCount = 0;
            for (const pageUrl of additionalPages) {
                try {
                    await this.downloadAdditionalPage(pageUrl, outputDir, url);
                    pageCount++;
                    progressCallback(`已下载 ${pageCount}/${additionalPages.length} 个页面`);
                } catch (error) {
                    console.warn(`下载页面失败: ${pageUrl}`, error.message);
                    progressCallback(`警告: 下载页面 ${pageUrl} 失败`);
                }
            }

            progressCallback(`下载完成！保存到目录: ${outputDir}`);
            return outputDir;

        } catch (error) {
            throw new Error(`下载失败: ${error.message}`);
        }
    }

    /**
     * 下载单个文件
     */
    downloadFile(url) {
        return new Promise((resolve, reject) => {
            const client = url.startsWith('https:') ? https : http;
            
            const options = {
                headers: {
                    'User-Agent': this.userAgent
                }
            };

            const req = client.get(url, options, (res) => {
                if (res.statusCode === 301 || res.statusCode === 302) {
                    // 处理重定向
                    return this.downloadFile(res.headers.location).then(resolve).catch(reject);
                }

                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    return;
                }

                let data = '';
                res.setEncoding('utf8');
                
                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    resolve(data);
                });
            });

            req.on('error', (err) => {
                reject(err);
            });

            req.setTimeout(30000, () => {
                req.abort();
                reject(new Error('请求超时'));
            });
        });
    }

    /**
     * 下载二进制文件
     */
    downloadBinaryFile(url) {
        return new Promise((resolve, reject) => {
            const client = url.startsWith('https:') ? https : http;
            
            const options = {
                headers: {
                    'User-Agent': this.userAgent
                }
            };

            const req = client.get(url, options, (res) => {
                if (res.statusCode === 301 || res.statusCode === 302) {
                    return this.downloadBinaryFile(res.headers.location).then(resolve).catch(reject);
                }

                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    return;
                }

                const chunks = [];
                
                res.on('data', (chunk) => {
                    chunks.push(chunk);
                });

                res.on('end', () => {
                    resolve(Buffer.concat(chunks));
                });
            });

            req.on('error', (err) => {
                reject(err);
            });

            req.setTimeout(30000, () => {
                req.abort();
                reject(new Error('请求超时'));
            });
        });
    }

    /**
     * 解析HTML中的资源链接
     */
    parseResources(html, baseUrl) {
        const resources = [];
        const parsedBaseUrl = new URL(baseUrl);
        
        // 增强的正则表达式解析
        const patterns = [
            // CSS文件
            /<link[^>]+href=['"]([^'"]+\.css[^'"]*)['"][^>]*>/gi,
            // JS文件
            /<script[^>]+src=['"]([^'"]+\.js[^'"]*)['"][^>]*>/gi,
            // 图片文件（更全面）
            /<img[^>]+src=['"]([^'"]+\.(jpg|jpeg|png|gif|svg|ico|webp|bmp)[^'"]*)['"][^>]*>/gi,
            // 背景图片（CSS中）
            /background[^:]*:[^;]*url\(['"]?([^'"()]+\.(jpg|jpeg|png|gif|svg|ico|webp|bmp))['"]?\)/gi,
            // 图标
            /<link[^>]+rel=['"][^'"]*icon[^'"]*['"][^>]+href=['"]([^'"]+)['"][^>]*>/gi,
            // 视频文件
            /<video[^>]+src=['"]([^'"]+\.(mp4|webm|ogg|avi|mov))['"][^>]*>/gi,
            /<source[^>]+src=['"]([^'"]+\.(mp4|webm|ogg|avi|mov))['"][^>]*>/gi,
            // 音频文件
            /<audio[^>]+src=['"]([^'"]+\.(mp3|wav|ogg|aac|flac))['"][^>]*>/gi,
            // 字体文件
            /@font-face[^}]*url\(['"]?([^'"()]+\.(woff2?|ttf|otf|eot))['"]?\)/gi,
            // PDF和文档
            /<a[^>]+href=['"]([^'"]+\.(pdf|doc|docx|xls|xlsx|ppt|pptx))['"][^>]*>/gi,
            // Manifest文件
            /<link[^>]+rel=['"]manifest['"][^>]+href=['"]([^'"]+)['"][^>]*>/gi
        ];

        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                let resourceUrl = match[1];
                
                // 过滤掉无效的URL
                if (!resourceUrl || resourceUrl.startsWith('data:') || resourceUrl.startsWith('javascript:')) {
                    continue;
                }
                
                // 转换相对URL为绝对URL
                if (resourceUrl.startsWith('//')) {
                    resourceUrl = parsedBaseUrl.protocol + resourceUrl;
                } else if (resourceUrl.startsWith('/')) {
                    resourceUrl = `${parsedBaseUrl.protocol}//${parsedBaseUrl.hostname}${resourceUrl}`;
                } else if (!resourceUrl.startsWith('http')) {
                    resourceUrl = new URL(resourceUrl, baseUrl).href;
                }
                
                // 确保不重复且是同一域名
                const resourceUrlObj = new URL(resourceUrl);
                if (resourceUrlObj.hostname === parsedBaseUrl.hostname && !resources.includes(resourceUrl)) {
                    resources.push(resourceUrl);
                }
            }
        });

        return resources;
    }

    /**
     * 发现常见的根目录文件
     */
    async discoverCommonFiles(baseUrl) {
        const commonFiles = [
            'robots.txt',
            'sitemap.xml',
            'favicon.ico',
            'favicon.svg',
            'favicon.png',
            'apple-touch-icon.png',
            'manifest.json',
            '.well-known/security.txt'
        ];
        
        const foundFiles = [];
        const parsedBaseUrl = new URL(baseUrl);
        const baseUrlRoot = `${parsedBaseUrl.protocol}//${parsedBaseUrl.hostname}`;
        
        for (const file of commonFiles) {
            try {
                const fileUrl = `${baseUrlRoot}/${file}`;
                // 尝试发送HEAD请求检查文件是否存在
                const exists = await this.checkFileExists(fileUrl);
                if (exists) {
                    foundFiles.push(fileUrl);
                }
            } catch (error) {
                // 静默失败，继续检查下一个
            }
        }
        
        return foundFiles;
    }
    
    /**
     * 检查文件是否存在
     */
    checkFileExists(url) {
        return new Promise((resolve) => {
            const client = url.startsWith('https:') ? https : http;
            
            const options = {
                method: 'HEAD',
                headers: {
                    'User-Agent': this.userAgent
                }
            };
            
            const req = client.request(url, options, (res) => {
                resolve(res.statusCode === 200);
            });
            
            req.on('error', () => resolve(false));
            req.setTimeout(5000, () => {
                req.abort();
                resolve(false);
            });
            
            req.end();
        });
    }
    
    /**
     * 解析HTML中的页面链接
     */
    parsePageLinks(html, baseUrl) {
        const pages = [];
        const parsedBaseUrl = new URL(baseUrl);
        
        // 匹配内部链接
        const linkPattern = /<a[^>]+href=['"]((?!https?:\/\/|mailto:|tel:|#)[^'"]+\.html?)['"][^>]*>/gi;
        
        let match;
        while ((match = linkPattern.exec(html)) !== null) {
            let pageUrl = match[1];
            
            // 转换相对URL为绝对URL
            if (pageUrl.startsWith('/')) {
                pageUrl = `${parsedBaseUrl.protocol}//${parsedBaseUrl.hostname}${pageUrl}`;
            } else if (!pageUrl.startsWith('http')) {
                pageUrl = new URL(pageUrl, baseUrl).href;
            }
            
            // 确保是同一域名且不重复
            const pageUrlObj = new URL(pageUrl);
            if (pageUrlObj.hostname === parsedBaseUrl.hostname && !pages.includes(pageUrl)) {
                pages.push(pageUrl);
            }
        }
        
        return pages;
    }
    
    /**
     * 下载其他页面
     */
    async downloadAdditionalPage(pageUrl, outputDir, baseUrl) {
        try {
            const parsedUrl = new URL(pageUrl);
            let localPath = parsedUrl.pathname;
            
            // 处理路径
            if (localPath === '/' || localPath === '') {
                localPath = '/index.html';
            }
            
            // 移除开头的斜杠
            localPath = localPath.replace(/^\//, '');
            
            const fullLocalPath = path.join(outputDir, localPath);
            
            // 创建目录
            const dir = path.dirname(fullLocalPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // 下载页面内容
            const content = await this.downloadFile(pageUrl);
            
            // 转换链接为相对路径
            const convertedContent = this.convertLinksToRelative(content, pageUrl);
            
            fs.writeFileSync(fullLocalPath, convertedContent);
            
            // 解析该页面的资源
            const pageResources = this.parseResources(content, pageUrl);
            
            // 下载该页面的资源
            for (const resource of pageResources) {
                try {
                    await this.downloadResource(resource, outputDir, pageUrl);
                } catch (error) {
                    console.warn(`下载页面资源失败: ${resource}`, error.message);
                }
            }

        } catch (error) {
            throw error;
        }
    }

    /**
     * 下载资源文件
     */
    async downloadResource(resourceUrl, outputDir, baseUrl) {
        try {
            const parsedUrl = new URL(resourceUrl);
            let localPath = parsedUrl.pathname;
            
            // 处理空路径或根路径
            if (localPath === '/' || localPath === '') {
                localPath = '/index.html';
            }
            
            // 移除开头的斜杠
            localPath = localPath.replace(/^\//, '');
            
            const fullLocalPath = path.join(outputDir, localPath);
            
            // 创建目录
            const dir = path.dirname(fullLocalPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // 根据文件类型选择下载方法
            const isTextFile = /\.(css|js|html|htm|xml|txt|json)$/i.test(localPath);
            
            if (isTextFile) {
                const content = await this.downloadFile(resourceUrl);
                fs.writeFileSync(fullLocalPath, content);
            } else {
                const buffer = await this.downloadBinaryFile(resourceUrl);
                fs.writeFileSync(fullLocalPath, buffer);
            }

        } catch (error) {
            // 静默处理错误，不中断整个下载过程
            throw error;
        }
    }
    
    /**
     * 将HTML中的绝对链接转换为相对链接
     */
    convertLinksToRelative(html, baseUrl) {
        const parsedBaseUrl = new URL(baseUrl);
        const hostname = parsedBaseUrl.hostname;
        const protocol = parsedBaseUrl.protocol;
        
        // 转换各类资源链接
        let convertedHtml = html;
        
        // 转换CSS文件链接
        convertedHtml = convertedHtml.replace(
            /<link([^>]+)href=['"]([^'"]+)['"]([^>]*)>/gi,
            (match, before, href, after) => {
                const newHref = this.convertSingleLink(href, baseUrl);
                return `<link${before}href="${newHref}"${after}>`;
            }
        );
        
        // 转换JS文件链接
        convertedHtml = convertedHtml.replace(
            /<script([^>]+)src=['"]([^'"]+)['"]([^>]*)>/gi,
            (match, before, src, after) => {
                const newSrc = this.convertSingleLink(src, baseUrl);
                return `<script${before}src="${newSrc}"${after}>`;
            }
        );
        
        // 转换图片链接
        convertedHtml = convertedHtml.replace(
            /<img([^>]+)src=['"]([^'"]+)['"]([^>]*)>/gi,
            (match, before, src, after) => {
                const newSrc = this.convertSingleLink(src, baseUrl);
                return `<img${before}src="${newSrc}"${after}>`;
            }
        );
        
        // 转换页面链接
        convertedHtml = convertedHtml.replace(
            /<a([^>]+)href=['"]([^'"]+)['"]([^>]*)>/gi,
            (match, before, href, after) => {
                const newHref = this.convertSingleLink(href, baseUrl);
                return `<a${before}href="${newHref}"${after}>`;
            }
        );
        
        return convertedHtml;
    }
    
    /**
     * 转换单个链接
     */
    convertSingleLink(originalUrl, baseUrl) {
        // 如果已经是相对链接或外部链接，不做处理
        if (!originalUrl || 
            originalUrl.startsWith('http') || 
            originalUrl.startsWith('mailto:') || 
            originalUrl.startsWith('tel:') ||
            originalUrl.startsWith('#') ||
            originalUrl.startsWith('data:') ||
            originalUrl.startsWith('javascript:') ||
            !originalUrl.startsWith('/')) {
            return originalUrl;
        }
        
        try {
            const parsedBaseUrl = new URL(baseUrl);
            
            // 如果是同一域名的绝对路径，转换为相对路径
            if (originalUrl.startsWith('/')) {
                // 移除开头的斜杠，转换为相对路径
                return originalUrl.substring(1) || 'index.html';
            }
            
            return originalUrl;
        } catch (error) {
            return originalUrl;
        }
    }
}

module.exports = SimpleDownloader;