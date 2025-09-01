#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('./app');
var debug = require('debug')('zaixianwget:server');
var http = require('http');
var socketio = require('socket.io');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '6868');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Create Socket.IO instance
 */
var io = socketio(server);

/**
 * Socket.IO connection handling
 */
io.on('connection', function(socket) {
  console.log('新的客户端连接:', socket.id);
  
  // 监听下载请求
  socket.on('request', function(data) {
    console.log('收到下载请求:', JSON.stringify(data, null, 2));
    
    // 验证数据
    if (!data.token || !data.website) {
      console.error('缺少必要参数 - Token:', data.token, 'Website:', data.website);
      return;
    }
    
    // 确保 mergeFiles 有默认值，并记录其值
    if (typeof data.mergeFiles === 'undefined') {
      data.mergeFiles = false;
      console.log('设置 mergeFiles 默认值为 false');
    }
    
    console.log('===== 处理下载请求 =====');
    console.log('Token:', data.token);
    console.log('Website:', data.website);
    console.log('MergeFiles 值:', data.mergeFiles, '(类型:', typeof data.mergeFiles, ')');
    console.log('================================');
    
    // 调用下载处理逻辑
    try {
      const wgetHandler = require('./wget');
      wgetHandler(io, data);
    } catch (error) {
      console.error('下载处理出错:', error);
      io.emit(data.token, {
        progress: 'Error: ' + error.message
      });
    }
  });
  
  socket.on('disconnect', function() {
    console.log('客户端断开连接:', socket.id);
  });
});

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(err) {
  if (err.syscall !== 'listen') {
    throw err;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (err.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw err;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log('服务器启动在端口: ' + addr.port);
  debug('Listening on ' + bind);
}