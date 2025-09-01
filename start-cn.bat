@echo off
setlocal enabledelayedexpansion

:: 设置中文编码
chcp 936 >nul 2>&1

:: 设置窗口标题
title Wget MD3 启动脚本

:: 清屏并显示标题
cls
echo.
echo ====================================
echo    Wget MD3 网站下载器
echo    启动脚本 v1.4 
echo ====================================
echo.

:: 步骤1: 检查Node.js
echo [1/4] 检查Node.js环境...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到Node.js
    echo.
    echo 解决方法:
    echo 1. 访问 https://nodejs.org/
    echo 2. 下载并安装LTS版本
    echo 3. 重启命令行后重试
    echo.
    goto error_exit
)

:: 获取Node.js版本
for /f "tokens=*" %%a in ('node --version 2^>nul') do set NODE_VERSION=%%a
echo [成功] Node.js版本: %NODE_VERSION%

:: 步骤2: 检查npm
echo [2/4] 检查npm环境...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] npm未找到
    echo npm通常随Node.js一起安装，请重新安装Node.js
    goto error_exit
)

:: 获取npm版本
for /f "tokens=*" %%a in ('npm --version 2^>nul') do set NPM_VERSION=%%a
echo [成功] npm版本: %NPM_VERSION%

:: 步骤3: 检查项目文件
echo [3/4] 检查项目文件...
if not exist "package.json" (
    echo [错误] package.json文件不存在
    echo 请确保在项目根目录下运行此脚本
    echo 当前目录: %CD%
    goto error_exit
)
echo [成功] 项目文件检查通过

:: 步骤4: 检查并安装依赖
echo [4/4] 检查项目依赖...
if not exist "node_modules" (
    echo [信息] 首次运行，正在安装依赖...
    echo 这可能需要几分钟时间，请耐心等待...
    echo.
    
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        echo.
        echo 可能的解决方案:
        echo 1. 检查网络连接
        echo 2. 使用国内镜像源:
        echo    npm config set registry https://registry.npmmirror.com
        echo 3. 清除npm缓存:
        echo    npm cache clean --force
        goto error_exit
    )
    echo [成功] 依赖安装完成
) else (
    echo [成功] 项目依赖已安装
)

:: 检查启动文件
if not exist "server.js" (
    echo [错误] 启动文件server.js不存在
    echo 请检查项目文件完整性
    goto error_exit
)

echo.
echo ====================================
echo    准备启动项目
echo ====================================
echo.
echo 项目信息:
echo - 访问地址: http://localhost:6868/
echo - 支持完整网站资源下载  
echo - Material Design 3界面
echo - 文件合并功能
echo.
echo 提示: 
echo - 项目启动后将自动打开浏览器
echo - 按 Ctrl+C 可停止服务器
echo - 如需帮助请查看README.md
echo.

:: 启动项目
echo 正在启动服务器...
echo.

:: 延迟3秒后打开浏览器
start /min "" cmd /c "ping localhost -n 4 >nul 2>&1 && start http://localhost:6868/"

:: 显示启动信息
echo ====================================
echo   服务器正在启动中...
echo   浏览器将在3秒后自动打开
echo   访问地址: http://localhost:6868/
echo ====================================
echo.

:: 启动Node.js服务器
node server.js

:: 正常退出
echo.
echo ====================================
echo 项目已停止运行
echo 感谢使用 Wget MD3！
echo ====================================
echo.
pause
exit /b 0

:: 错误退出标签
:error_exit
echo.
echo ====================================
echo 启动失败
echo ====================================
echo 请根据上述错误信息解决问题后重试
echo.
echo 如需帮助:
echo 1. 查看README.md文件
echo 2. 访问项目主页: https://github.com/taocrypt/wget-md3
echo.
pause
exit /b 1