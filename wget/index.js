var util = require('util'),
    exec = require('child_process').exec;
    var archiver = require('../archiver')
    var FileMerger = require('../merger')
    var SimpleDownloader = require('../downloader/simple-downloader')
    var paths = require('../config/paths')
    var path = require('path')


module.exports=(io,data)=>{

// 确保缓存目录存在
paths.ensureDirectories();

// download all website assets using Node.js downloader
let website ="";
const downloader = new SimpleDownloader();

// 从URL中提取网站名称
try {
    const url = new URL(data.website);
    website = url.hostname;
    console.log(`网站名称: ${website}`);
} catch (err) {
    // 如果URL解析失败，使用时间戳作为备用名称
    website = 'website_' + Date.now();
    console.log(`使用备用网站名称: ${website}`);
}

// 开始下载
downloader.downloadWebsite(data.website, (progress) => {
    console.log(progress);
    io.emit(data.token, {progress: progress});
}).then(async (outputDir) => {
    io.emit(data.token, {progress: "Converting"})
    
    try {
        console.log('===== WGET 模块处理 =====');
        console.log('data.mergeFiles 值:', data.mergeFiles, '(类型:', typeof data.mergeFiles, ')');
        console.log('==========================');
        
        // 如果用户选择了合并文件选项
        if(data.mergeFiles) {
            console.log('用户选择合并文件，开始合并处理...');
            
            // 使用下载器返回的目录
            if(outputDir && require('fs').existsSync(outputDir)) {
                const merger = new FileMerger(outputDir, website);
                const mergedFilePath = await merger.mergeFiles();
                
                console.log('合并模式：直接提供HTML文件下载，不进行ZIP压缩');
                // 合并模式：直接返回HTML文件，不压缩
                io.emit(data.token, {
                    progress: "Completed", 
                    file: path.basename(mergedFilePath, '.html'), 
                    isMerged: true,
                    filePath: mergedFilePath
                });
            } else {
                console.warn('未找到网站目录，使用标准流程');
                archiver(website, io, data, null, false);
            }
        } else {
            console.log('用户选择标准模式，不合并文件');
            // 标准流程
            archiver(website, io, data, null, false);
        }
    } catch (error) {
        console.error('处理过程出错:', error);
        io.emit(data.token, {progress: 'Error: ' + error.message});
        // 出错时回退到标准流程，明确指定非合并模式
        archiver(website, io, data, null, false);
    }
}).catch(error => {
    console.error('下载失败:', error);
    io.emit(data.token, {progress: 'Error: ' + error.message});
});

}
