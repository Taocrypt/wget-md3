var archiver = require('archiver');
var fs = require('fs');
var path = require('path');
var paths = require('../config/paths');


module.exports= (file, io, data, mergedFilePath = null, isMerged = false)=>{

    console.log('===== ARCHIVER 模块处理 =====');
    console.log('file:', file);
    console.log('mergedFilePath:', mergedFilePath);
    console.log('isMerged:', isMerged, '(类型:', typeof isMerged, ')');
    console.log('data.mergeFiles:', data.mergeFiles, '(类型:', typeof data.mergeFiles, ')');
    console.log('===============================');

    // 确保缓存目录存在
    paths.ensureDirectories();

    // 如果是合并文件模式，使用不同的文件名
    const outputFileName = isMerged ? `${file}_merged.zip` : `${file}.zip`;
    var output = fs.createWriteStream(path.join(paths.ZIPS_DIR, outputFileName));
    var archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });
     
    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', function() {
      console.log(archive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.');
      
      // 返回不包含.zip扩展名的文件名
      const fileNameWithoutExt = isMerged ? `${file}_merged` : file;
      io.emit(data.token, {progress: "Completed", file: fileNameWithoutExt, isMerged: isMerged});
    });
     
    // This event is fired when the data source is drained no matter what was the data source.
    // It is not part of this library but rather from the NodeJS Stream API.
    // @see: https://nodejs.org/api/stream.html#stream_event_end
    output.on('end', function() {
      console.log('Data has been drained');
    });
     
    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function(err) {
      if (err.code === 'ENOENT') {
        // log warning
        console.warn('Archiver warning:', err);
      } else {
        // throw error
        throw err;
      }
    });
     
    // good practice to catch this error explicitly
    archive.on('error', function(err) {
      console.error('Archiver error:', err);
      io.emit(data.token, {progress: "Error: " + err.message});
    });
     
    // pipe archive data to the file
    archive.pipe(output);

    if (isMerged && mergedFilePath) {
        // 合并模式：只打包合并后的HTML文件
        console.log(`打包合并文件: ${mergedFilePath}`);
        
        if (fs.existsSync(mergedFilePath)) {
            archive.file(mergedFilePath, { name: path.basename(mergedFilePath) });
        } else {
            console.error(`合并文件不存在: ${mergedFilePath}`);
            // 回退到标准模式
            archive.directory('./' + file, false);
        }
    } else {
        // 标准模式：打包整个目录
        const downloadDir = path.join(paths.DOWNLOADS_DIR, file);
        console.log(`打包整个目录: ${downloadDir}`);
        
        if (fs.existsSync(downloadDir)) {
            archive.directory(downloadDir, false);
        } else {
            console.error(`目录不存在: ${downloadDir}`);
            io.emit(data.token, {progress: "Error: 目录不存在"});
            return;
        }
    }

    // finalize the archive (ie we are done appending files but streams have to finish yet)
    // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
    archive.finalize();

 }