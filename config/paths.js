/**
 * 项目路径配置
 * 统一管理所有缓存和输出目录
 */

const path = require('path');

const CACHE_DIR = 'cache';

module.exports = {
    // 缓存根目录
    CACHE_ROOT: path.join(__dirname, '..', CACHE_DIR),
    
    // 下载的网站存储目录
    DOWNLOADS_DIR: path.join(__dirname, '..', CACHE_DIR, 'downloads'),
    
    // ZIP文件输出目录
    ZIPS_DIR: path.join(__dirname, '..', CACHE_DIR, 'zips'),
    
    // 合并文件临时目录
    MERGED_DIR: path.join(__dirname, '..', CACHE_DIR, 'merged'),
    
    // 临时文件目录
    TEMP_DIR: path.join(__dirname, '..', CACHE_DIR, 'temp'),
    
    // 静态文件服务目录
    PUBLIC_DIR: path.join(__dirname, '..', 'public'),
    
    // 创建所有必要的目录
    ensureDirectories() {
        const fs = require('fs');
        const dirs = [
            this.CACHE_ROOT,
            this.DOWNLOADS_DIR,
            this.ZIPS_DIR,
            this.MERGED_DIR,
            this.TEMP_DIR
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`Created directory: ${dir}`);
            }
        });
    }
};