# Wget MD3 启动脚本 PowerShell版本
# 编码: UTF-8

param(
    [switch]$SkipBrowser,  # 跳过自动打开浏览器
    [switch]$Verbose,      # 详细输出
    [string]$Port = "6868" # 自定义端口
)

# 设置控制台编码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Wget MD3 - 启动脚本"

# 颜色定义
$Colors = @{
    Red    = "Red"
    Green  = "Green" 
    Yellow = "Yellow"
    Blue   = "Blue"
    Cyan   = "Cyan"
    White  = "White"
}

# 输出函数
function Write-Title {
    param([string]$Message)
    Write-Host "`n=====================================" -ForegroundColor Blue
    Write-Host "   $Message" -ForegroundColor Cyan
    Write-Host "=====================================" -ForegroundColor Blue
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ 错误: $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  警告: $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "📋 $Message" -ForegroundColor Cyan
}

function Write-Step {
    param([string]$Step, [string]$Message)
    Write-Host "[$Step] $Message" -ForegroundColor White
}

# 检查命令是否存在
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# 检查端口是否被占用
function Test-Port {
    param([int]$PortNumber)
    try {
        $connections = Get-NetTCPConnection -LocalPort $PortNumber -State Listen -ErrorAction SilentlyContinue
        return $connections.Count -gt 0
    }
    catch {
        # 回退到netstat
        $netstat = netstat -an | Select-String ":$PortNumber.*LISTENING"
        return $netstat.Count -gt 0
    }
}

# 安装依赖
function Install-Dependencies {
    Write-Host "📦 首次运行，正在安装项目依赖..." -ForegroundColor Cyan
    Write-Host "   这可能需要几分钟时间，请耐心等待..." -ForegroundColor Gray
    Write-Host ""
    
    $process = Start-Process -FilePath "npm" -ArgumentList "install" -NoNewWindow -Wait -PassThru
    
    if ($process.ExitCode -ne 0) {
        Write-Error "依赖安装失败"
        Write-Info "请检查网络连接或尝试使用国内镜像:"
        Write-Host "   npm config set registry https://registry.npmmirror.com" -ForegroundColor Gray
        return $false
    }
    
    Write-Success "依赖安装完成"
    return $true
}

# 自动打开浏览器
function Open-Browser {
    param([string]$Url)
    
    if (-not $SkipBrowser) {
        Start-Job -ScriptBlock {
            param($Url)
            Start-Sleep -Seconds 3
            Start-Process $Url
        } -ArgumentList $Url | Out-Null
    }
}

# 主函数
function Main {
    Write-Title "Wget MD3 - Material Design 3 网站下载器`n   启动脚本 v1.0 (PowerShell版)"
    
    # 1. 检查Node.js环境
    Write-Step "1/5" "检查Node.js环境..."
    if (-not (Test-Command "node")) {
        Write-Error "未检测到Node.js环境"
        Write-Host ""
        Write-Info "解决方案:"
        Write-Host "   1. 请访问 https://nodejs.org/ 下载并安装Node.js" -ForegroundColor Gray
        Write-Host "   2. 建议安装LTS版本（Node.js 14+）" -ForegroundColor Gray
        Write-Host "   3. 安装完成后重新运行此脚本" -ForegroundColor Gray
        Write-Host "   4. 或使用 Chocolatey: choco install nodejs" -ForegroundColor Gray
        Write-Host ""
        Read-Host "按任意键退出"
        exit 1
    }
    
    $nodeVersion = node --version
    Write-Success "Node.js环境检测通过: $nodeVersion"
    
    # 2. 检查npm环境
    Write-Step "2/5" "检查npm环境..."
    if (-not (Test-Command "npm")) {
        Write-Error "npm未正确安装"
        Write-Info "npm通常随Node.js一起安装，请重新安装Node.js"
        Read-Host "按任意键退出"
        exit 1
    }
    
    $npmVersion = npm --version
    Write-Success "npm环境检测通过: $npmVersion"
    
    # 3. 检查项目配置
    Write-Step "3/5" "检查项目配置..."
    if (-not (Test-Path "package.json")) {
        Write-Error "未找到package.json文件"
        Write-Info "请确保在项目根目录下运行此脚本"
        Write-Host "当前目录: $(Get-Location)" -ForegroundColor Gray
        Read-Host "按任意键退出"
        exit 1
    }
    Write-Success "项目配置文件检测通过"
    
    # 4. 检查项目依赖
    Write-Step "4/5" "检查项目依赖..."
    if (-not (Test-Path "node_modules")) {
        if (-not (Install-Dependencies)) {
            Read-Host "按任意键退出"
            exit 1
        }
    }
    else {
        Write-Success "项目依赖检测通过"
    }
    
    # 5. 检查端口可用性
    Write-Step "5/5" "检查端口可用性..."
    if (Test-Port -PortNumber $Port) {
        Write-Warning "端口$Port已被占用"
        Write-Info "建议关闭占用端口的程序或修改项目端口配置"
        Write-Host ""
        $continue = Read-Host "是否继续启动项目 (可能会失败)? [y/N]"
        if ($continue -notmatch "^[Yy]") {
            Write-Host "用户取消启动" -ForegroundColor Gray
            exit 0
        }
    }
    else {
        Write-Success "端口$Port可用"
    }
    
    Write-Title "🚀 启动 Wget MD3 项目"
    
    Write-Host "📖 使用说明:" -ForegroundColor Cyan
    Write-Host "   • 项目将在 http://localhost:$Port/ 启动" -ForegroundColor Gray
    Write-Host "   • 支持完整网站资源下载" -ForegroundColor Gray
    Write-Host "   • 支持Material Design 3界面" -ForegroundColor Gray
    Write-Host "   • 支持文件合并功能" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 功能特色:" -ForegroundColor Cyan
    Write-Host "   • 输入网站地址进行下载" -ForegroundColor Gray
    Write-Host "   • 可选择标准模式或合并模式" -ForegroundColor Gray
    Write-Host "   • 实时显示下载进度" -ForegroundColor Gray
    Write-Host "   • 自动打包为ZIP或HTML文件" -ForegroundColor Gray
    Write-Host ""
    
    # 检查启动文件
    if (-not (Test-Path "server.js")) {
        Write-Error "检测到缺少启动文件"
        Write-Info "请手动启动项目: npm start 或 node app.js"
        Read-Host "按任意键退出"
        exit 1
    }
    
    Write-Host "⏳ 正在启动服务器..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🌐 项目启动中..." -ForegroundColor Green
    Write-Host "📍 访问地址: http://localhost:$Port/" -ForegroundColor Green
    Write-Host "🛑 按 Ctrl+C 停止服务器" -ForegroundColor Green
    Write-Host ""
    
    # 自动打开浏览器
    $url = "http://localhost:$Port/"
    Open-Browser -Url $url
    
    # 启动项目
    try {
        if ($Port -ne "6868") {
            $env:PORT = $Port
        }
        
        node server.js
    }
    catch {
        Write-Error "项目启动失败: $($_.Exception.Message)"
    }
    finally {
        Write-Host ""
        Write-Host "👋 感谢使用 Wget MD3！" -ForegroundColor Cyan
        if (-not $SkipBrowser) {
            Read-Host "按任意键退出"
        }
    }
}

# 错误处理
trap {
    Write-Host ""
    Write-Error "脚本执行出现错误: $($_.Exception.Message)"
    Read-Host "按任意键退出"
    exit 1
}

# 运行主函数
Main