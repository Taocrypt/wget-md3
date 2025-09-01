# Wget MD3 - Material Design 3 网站下载器 💾

基于 Material Design 3 设计系统的现代化在线网站下载工具，支持完整网站资源抓取和文件合并功能。

[![GitHub stars](https://img.shields.io/github/stars/taocrypt/wget-md3.svg?style=flat-square)](https://github.com/taocrypt/wget-md3/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/taocrypt/wget-md3.svg?style=flat-square)](https://github.com/taocrypt/wget-md3/issues)
[![GitHub license](https://img.shields.io/github/license/taocrypt/wget-md3.svg?style=flat-square)](https://github.com/taocrypt/wget-md3/blob/main/LICENSE)

## ✨ 特性

- 🎨 **Material Design 3 界面** - 现代化、美观的用户界面
- 📦 **完整资源下载** - 支持HTML、CSS、JavaScript、图片等所有资源
- 🔗 **智能链接转换** - 自动转换为相对链接，支持离线浏览
- 📱 **响应式设计** - 适配各种设备屏幕
- ⚡ **实时进度显示** - Socket.IO实时传输下载状态
- 🔄 **文件合并功能** - 可选择将所有资源合并为单个HTML文件
- 🚀 **无需依赖wget** - 使用Node.js内置模块，支持Windows系统
- 🗂️ **统一缓存管理** - 所有临时文件和缓存统一存储在cache目录下

## 🛠️ 技术栈

- **前端**: HTML5 + CSS3 + Material Design 3 + Socket.IO客户端
- **后端**: Node.js + Express 4.19.2
- **实时通信**: Socket.IO 2.5.0
- **文件处理**: archiver 3.1.1 + jsdom 22.1.0
- **模板引擎**: Handlebars (hbs)

## 📸 截图

![界面预览](./1.png)

## 📋 功能说明

### 核心功能
- **网站资源抓取**: 使用Node.js内置模块下载网站内容
- **资源压缩**: 将下载的资源打包为ZIP格式
- **实时传输**: 通过Socket.IO将下载状态实时传输给用户
- **离线浏览优化**: 自动转换链接、添加扩展名

### 高级功能
- **文件合并**: 将CSS、JavaScript和图片内嵌到HTML中，生成独立文件
- **智能解析**: 自动识别和下载页面所需的所有资源
- **跨平台支持**: 兼容Windows、Linux、macOS系统

## 🚀 快速开始

### 环境要求
- Node.js 14+
- npm 或 yarn

### 方法一：使用启动脚本（推荐）

我们提供了便捷的启动脚本，支持自动环境检测、依赖安装和项目启动：

**Windows 用户：**
```bash
# 推荐：使用英文界面启动器（稳定无乱码）
start.bat

# 备选：中文界面启动器（可能乱码）
start-cn.bat

# 或使用 PowerShell 脚本（功能更强大）
.\start.ps1

# PowerShell 脚本支持参数
.\start.ps1 -Port 8080        # 自定义端口
.\start.ps1 -SkipBrowser     # 跳过自动打开浏览器
.\start.ps1 -Verbose         # 详细输出
```

**Linux/macOS 用户：**
```bash
# 给脚本添加执行权限（首次运行）
chmod +x start.sh

# 运行启动脚本
./start.sh
```

**脚本功能特色：**
- ✅ **自动环境检测**：检查 Node.js、npm 环境
- ✅ **智能依赖管理**：首次运行自动安装依赖
- ✅ **端口冲突检测**：检查端口占用情况
- ✅ **自动打开浏览器**：启动成功后自动访问项目
- ✅ **友好错误提示**：提供详细的错误解决方案
- ✅ **跨平台支持**：支持 Windows、Linux、macOS

### 方法二：传统安装方式

```bash
# 克隆项目
git clone https://github.com/taocrypt/wget-md3.git

# 进入项目目录
cd wget-md3

# 安装依赖
npm install

# 启动项目
npm start
# 或
node server.js

# 访问应用
# 打开浏览器访问 http://localhost:6868/
```

### 使用方法

1. 在输入框中输入要下载的网站地址（如：https://example.com）
2. 选择是否启用文件合并功能（可选）
3. 点击"开始下载"按钮
4. 等待下载完成，点击下载ZIP文件

## 🗂️ 缓存管理

项目使用统一的`cache/`目录管理所有运行时生成的文件：

- **`cache/downloads/`** - 存储下载的网站文件和目录结构
- **`cache/zips/`** - 存储生成的ZIP压缩文件
- **`cache/merged/`** - 存储合并后的HTML文件
- **`cache/temp/`** - 存储临时处理文件

### 清理缓存

如需清理缓存，只需删除`cache/`目录即可：

```bash
# Windows
rmdir /s cache

# Linux/macOS
rm -rf cache
```

缓存目录会在下次运行时自动重新创建。

## 📁 项目结构

```
wget-md3/
├── cache/                  # 🗂️ 统一缓存目录（运行时生成）
│   ├── downloads/         # 下载的网站文件
│   ├── zips/             # 生成的ZIP文件
│   ├── merged/           # 合并后的HTML文件
│   └── temp/             # 临时文件
├── config/                # ⚙️ 配置文件
│   └── paths.js          # 路径配置管理
├── bin/                   # 启动脚本
├── public/               # 静态资源
│   └── stylesheets/     # CSS和JS文件
├── views/                # 模板文件
├── routes/               # 路由
├── wget/                 # 下载逻辑
├── archiver/            # 文件打包
├── merger/              # 文件合并
├── downloader/          # 网站下载器
├── socket/              # Socket.IO通信
├── app.js               # 主应用入口
└── package.json         # 项目配置
```

## 🤝 贡献

欢迎提交 Pull Request 或 Issue！

1. Fork 本项目
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📄 许可证

本项目基于 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- 本项目基于 [Website-downloader](https://github.com/Ahmadibrahiim/Website-downloader) 进行二次开发
- 感谢 Google 提供的 Material Design 3 设计规范
- 感谢所有贡献者和使用者的支持

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- GitHub Issues: [https://github.com/taocrypt/wget-md3/issues](https://github.com/taocrypt/wget-md3/issues)
- 项目主页: [https://github.com/taocrypt/wget-md3](https://github.com/taocrypt/wget-md3)

---

⭐ 如果这个项目对你有帮助，请给它一个 Star！