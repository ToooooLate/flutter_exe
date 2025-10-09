# Flutter Windows 桌面应用构建指南

## 问题说明

在 macOS 开发环境下，Flutter 无法直接构建 Windows 平台的可执行文件（.exe）。Flutter 的跨平台构建有平台限制：
- macOS 可以构建：macOS、iOS、Web、Android
- Windows 可以构建：Windows、Web、Android
- Linux 可以构建：Linux、Web、Android

## 解决方案

### 方案一：使用 GitHub Actions（推荐）

我们已经为项目配置了 GitHub Actions 工作流，可以自动在 Windows 环境下构建应用。

#### 使用步骤：
1. 将代码推送到 GitHub 仓库
2. GitHub Actions 会自动触发构建
3. 构建完成后，在 Actions 页面下载构建产物

#### 手动触发构建：
1. 进入 GitHub 仓库的 Actions 页面
2. 选择 "Build Windows Desktop App" 工作流
3. 点击 "Run workflow" 按钮
4. 等待构建完成，下载 `qingzhi-desktop-windows.zip`

### 方案二：使用 Windows 虚拟机

#### 在 macOS 上运行 Windows 虚拟机：

**使用 Parallels Desktop（推荐）：**
1. 安装 Parallels Desktop
2. 创建 Windows 11 虚拟机
3. 在虚拟机中安装开发环境

**使用 VMware Fusion：**
1. 安装 VMware Fusion
2. 创建 Windows 虚拟机
3. 配置开发环境

#### Windows 虚拟机环境配置：
```bash
# 1. 安装 Flutter
# 下载 Flutter SDK for Windows
# 解压到 C:\flutter
# 添加到 PATH 环境变量

# 2. 安装 Visual Studio
# 下载 Visual Studio Community
# 安装时选择 "Desktop development with C++" 工作负载

# 3. 安装 Git
# 下载并安装 Git for Windows

# 4. 克隆项目
git clone <your-repo-url>
cd qingzhi/desktop

# 5. 启用 Windows 桌面支持
flutter config --enable-windows-desktop

# 6. 安装依赖
flutter pub get

# 7. 构建应用
flutter build windows --release
```

### 方案三：使用云端 Windows 环境

#### GitHub Codespaces：
1. 在 GitHub 仓库中创建 Codespace
2. 选择 Windows 环境
3. 按照上述步骤配置和构建

#### Azure Virtual Machines：
1. 创建 Windows 虚拟机
2. 远程连接配置开发环境
3. 构建应用

### 方案四：寻找 Windows 设备

如果有 Windows 电脑或朋友的 Windows 设备：
1. 安装必要的开发工具
2. 克隆项目代码
3. 本地构建

## 构建产物说明

构建成功后，Windows 可执行文件位于：
```
desktop/build/windows/runner/Release/
```

该目录包含：
- `desktop.exe` - 主程序
- 各种 `.dll` 文件 - 运行时依赖
- `data/` 目录 - 应用资源

## 分发注意事项

1. **完整目录分发**：需要分发整个 `Release` 目录，不能只分发 `.exe` 文件
2. **WebView2 运行时**：目标机器需要安装 Microsoft Edge WebView2 Runtime
3. **Visual C++ 运行时**：可能需要 Visual C++ Redistributable

## 自动化构建配置

项目已配置 GitHub Actions，每次推送代码到 main 或 develop 分支时会自动构建。

构建产物会保存 30 天，可以在 Actions 页面下载。

## 本地测试

在 macOS 上可以继续进行开发和测试：
```bash
# 运行 macOS 桌面版本进行开发测试
flutter run -d macos

# 运行 Web 版本测试 WebView 功能
flutter run -d chrome
```

## 故障排除

### 常见问题：
1. **Flutter 版本**：确保使用 Flutter 3.0+ 版本
2. **Windows SDK**：确保安装了 Windows 10/11 SDK
3. **Visual Studio**：必须安装 C++ 桌面开发工作负载
4. **WebView2**：确保系统安装了 Edge WebView2 Runtime

### 构建失败处理：
```bash
# 清理构建缓存
flutter clean
flutter pub get

# 检查 Windows 桌面支持
flutter config --enable-windows-desktop
flutter doctor

# 重新构建
flutter build windows --release --verbose
```