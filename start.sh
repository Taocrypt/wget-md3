#!/bin/bash

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 打印标题
print_title() {
    echo -e "${BLUE}=====================================${NC}"
    echo -e "${CYAN}   Wget MD3 - Material Design 3 网站下载器${NC}"
    echo -e "${CYAN}   启动脚本 v1.0${NC}"
    echo -e "${BLUE}=====================================${NC}"
    echo
}

# 打印成功信息
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 打印错误信息
print_error() {
    echo -e "${RED}❌ 错误: $1${NC}"
}

# 打印警告信息
print_warning() {
    echo -e "${YELLOW}⚠️  警告: $1${NC}"
}

# 打印信息
print_info() {
    echo -e "${CYAN}📋 $1${NC}"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查端口是否被占用
check_port() {
    if command_exists lsof; then
        lsof -ti:6868 >/dev/null 2>&1
    elif command_exists netstat; then
        netstat -tuln | grep ":6868 " >/dev/null 2>&1
    else
        return 1
    fi
}

# 自动打开浏览器
open_browser() {
    local url="http://localhost:6868/"
    
    if command_exists xdg-open; then
        # Linux
        (sleep 3 && xdg-open "$url") &
    elif command_exists open; then
        # macOS
        (sleep 3 && open "$url") &
    else
        echo -e "${YELLOW}💡 请手动在浏览器中打开: $url${NC}"
    fi
}

# 主函数
main() {
    print_title
    
    # 1. 检查Node.js环境
    echo "[1/5] 检查Node.js环境..."
    if ! command_exists node; then
        print_error "未检测到Node.js环境"
        echo
        print_info "解决方案:"
        echo "   1. 请访问 https://nodejs.org/ 下载并安装Node.js"
        echo "   2. 建议安装LTS版本（Node.js 14+）"
        echo "   3. 安装完成后重新运行此脚本"
        echo
        echo "   Ubuntu/Debian: sudo apt-get install nodejs npm"
        echo "   CentOS/RHEL: sudo yum install nodejs npm"
        echo "   macOS: brew install node"
        echo
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    print_success "Node.js环境检测通过: $NODE_VERSION"
    
    # 2. 检查npm环境
    echo "[2/5] 检查npm环境..."
    if ! command_exists npm; then
        print_error "npm未正确安装"
        print_info "npm通常随Node.js一起安装，请重新安装Node.js"
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    print_success "npm环境检测通过: $NPM_VERSION"
    
    # 3. 检查项目配置
    echo "[3/5] 检查项目配置..."
    if [ ! -f "package.json" ]; then
        print_error "未找到package.json文件"
        print_info "请确保在项目根目录下运行此脚本"
        exit 1
    fi
    print_success "项目配置文件检测通过"
    
    # 4. 检查项目依赖
    echo "[4/5] 检查项目依赖..."
    if [ ! -d "node_modules" ]; then
        echo -e "${CYAN}📦 首次运行，正在安装项目依赖...${NC}"
        echo "   这可能需要几分钟时间，请耐心等待..."
        echo
        npm install
        if [ $? -ne 0 ]; then
            print_error "依赖安装失败"
            print_info "请检查网络连接或尝试使用国内镜像:"
            echo "   npm config set registry https://registry.npmmirror.com"
            exit 1
        fi
        print_success "依赖安装完成"
    else
        print_success "项目依赖检测通过"
    fi
    
    # 5. 检查端口可用性
    echo "[5/5] 检查端口可用性..."
    if check_port; then
        print_warning "端口6868已被占用"
        print_info "建议关闭占用端口的程序或修改项目端口配置"
        echo
        read -p "是否继续启动项目 (可能会失败)? [y/N]: " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "用户取消启动"
            exit 0
        fi
    else
        print_success "端口6868可用"
    fi
    
    echo
    echo -e "${BLUE}=====================================${NC}"
    echo -e "${CYAN}   🚀 启动 Wget MD3 项目${NC}"
    echo -e "${BLUE}=====================================${NC}"
    echo
    echo -e "${CYAN}📖 使用说明:${NC}"
    echo "   • 项目将在 http://localhost:6868/ 启动"
    echo "   • 支持完整网站资源下载"
    echo "   • 支持Material Design 3界面"
    echo "   • 支持文件合并功能"
    echo
    echo -e "${CYAN}💡 功能特色:${NC}"
    echo "   • 输入网站地址进行下载"
    echo "   • 可选择标准模式或合并模式"
    echo "   • 实时显示下载进度"
    echo "   • 自动打包为ZIP或HTML文件"
    echo
    
    # 检查启动文件
    if [ ! -f "server.js" ]; then
        print_error "检测到缺少启动文件"
        print_info "请手动启动项目: npm start 或 node app.js"
        exit 1
    fi
    
    echo -e "${YELLOW}⏳ 正在启动服务器...${NC}"
    echo
    echo -e "${GREEN}🌐 项目启动中...${NC}"
    echo -e "${GREEN}📍 访问地址: http://localhost:6868/${NC}"
    echo -e "${GREEN}🛑 按 Ctrl+C 停止服务器${NC}"
    echo
    
    # 延迟后自动打开浏览器
    open_browser
    
    # 启动项目
    node server.js
    
    echo
    echo -e "${CYAN}👋 感谢使用 Wget MD3！${NC}"
}

# 运行主函数
main "$@"