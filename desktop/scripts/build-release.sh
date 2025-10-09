#!/bin/bash

# Flutter Windows 桌面应用构建脚本
# 注意：此脚本需要在 Windows 环境下运行

set -e

echo "🚀 开始构建 Flutter Windows 桌面应用..."

# 检查是否在 Windows 环境
if [[ "$OSTYPE" != "msys" && "$OSTYPE" != "win32" ]]; then
    echo "❌ 错误：此脚本需要在 Windows 环境下运行"
    echo "当前系统：$OSTYPE"
    echo "请参考 build-windows.md 文档了解如何在 macOS 下构建 Windows 应用"
    exit 1
fi

# 检查 Flutter 是否安装
if ! command -v flutter &> /dev/null; then
    echo "❌ 错误：Flutter 未安装或未添加到 PATH"
    exit 1
fi

# 检查 Flutter 版本
echo "📋 检查 Flutter 环境..."
flutter --version

# 启用 Windows 桌面支持
echo "🔧 启用 Windows 桌面支持..."
flutter config --enable-windows-desktop

# 检查环境
echo "🔍 检查开发环境..."
flutter doctor

# 清理之前的构建
echo "🧹 清理之前的构建..."
flutter clean

# 获取依赖
echo "📦 获取项目依赖..."
flutter pub get

# 构建发布版本
echo "🔨 构建 Windows 发布版本..."
flutter build windows --release --verbose

# 检查构建结果
BUILD_DIR="build/windows/runner/Release"
if [ -d "$BUILD_DIR" ]; then
    echo "✅ 构建成功！"
    echo "📁 构建产物位置：$BUILD_DIR"
    echo "📋 构建产物列表："
    ls -la "$BUILD_DIR"
    
    # 创建分发包
    echo "📦 创建分发包..."
    RELEASE_NAME="qingzhi-desktop-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "releases"
    
    # 复制构建产物
    cp -r "$BUILD_DIR" "releases/$RELEASE_NAME"
    
    # 创建 ZIP 包
    if command -v 7z &> /dev/null; then
        cd "releases"
        7z a -tzip "$RELEASE_NAME.zip" "$RELEASE_NAME/"
        cd ..
        echo "✅ 已创建分发包：releases/$RELEASE_NAME.zip"
    else
        echo "⚠️  7z 未安装，请手动打包 releases/$RELEASE_NAME 目录"
    fi
    
    echo ""
    echo "🎉 构建完成！"
    echo "📁 可执行文件：releases/$RELEASE_NAME/desktop.exe"
    echo "📋 分发说明："
    echo "   1. 分发整个 releases/$RELEASE_NAME 目录"
    echo "   2. 确保目标机器安装了 Microsoft Edge WebView2 Runtime"
    echo "   3. 可能需要 Visual C++ Redistributable"
    
else
    echo "❌ 构建失败！请检查错误信息"
    exit 1
fi