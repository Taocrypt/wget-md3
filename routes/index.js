var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var paths = require('../config/paths');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Wget MD3 - Material Design 3 网站下载器' });
});

/* Handle file downloads from cache directory */
router.get('/sites/:filename', function(req, res, next) {
  const filename = req.params.filename;
  
  // 检查是否是HTML文件下载
  if (filename.endsWith('.html')) {
    // HTML文件下载（合并模式）
    const filePath = path.join(paths.MERGED_DIR, filename);
    
    if (fs.existsSync(filePath)) {
      // 设置HTML文件下载头
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      
      // 发送文件
      res.sendFile(filePath, function(err) {
        if (err) {
          console.error('HTML文件下载错误:', err);
          res.status(404).send('文件未找到');
        }
      });
    } else {
      console.log(`HTML文件不存在: ${filePath}`);
      res.status(404).send('文件未找到');
    }
  } else {
    // ZIP文件下载（标准模式）
    const filePath = path.join(paths.ZIPS_DIR, filename + '.zip');
    
    if (fs.existsSync(filePath)) {
      // 设置ZIP文件下载头
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.zip"`);
      res.setHeader('Content-Type', 'application/zip');
      
      // 发送文件
      res.sendFile(filePath, function(err) {
        if (err) {
          console.error('ZIP文件下载错误:', err);
          res.status(404).send('文件未找到');
        }
      });
    } else {
      console.log(`ZIP文件不存在: ${filePath}`);
      res.status(404).send('文件未找到');
    }
  }
});

module.exports = router;
