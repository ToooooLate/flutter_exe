@echo off
setlocal enabledelayedexpansion

REM Flutter Windows 桌面应用构建脚本
REM 在 Windows 环境下运行

REM 检测是否在 CI 环境（GitLab 会设置 CI=true）
set IS_CI=
if /I "%CI%"=="true" set IS_CI=1

echo 🚀 开始构建 Flutter Windows 桌面应用...

REM 检查 Flutter 是否安装
where flutter >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误：Flutter 未安装或未添加到 PATH
    if not defined IS_CI pause
    exit /b 1
)

REM 检查 Flutter 版本
echo 📋 检查 Flutter 环境...
flutter --version

REM 启用 Windows 桌面支持
echo 🔧 启用 Windows 桌面支持...
flutter config --enable-windows-desktop

REM 检查环境
echo 🔍 检查开发环境...
flutter doctor

REM 清理之前的构建
echo 🧹 清理之前的构建...
flutter clean

REM 获取依赖
echo 📦 获取项目依赖...
flutter pub get

REM 构建发布版本
echo 🔨 构建 Windows 发布版本...
flutter build windows --release --verbose

REM 检查构建结果
set BUILD_DIR=build\windows\runner\Release
if exist "%BUILD_DIR%" (
    echo ✅ 构建成功！
    echo 📁 构建产物位置：%BUILD_DIR%
    echo 📋 构建产物列表：
    dir "%BUILD_DIR%"
    
    REM 创建分发包
    echo 📦 创建分发包...
    for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
    set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
    set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
    set "RELEASE_NAME=qingzhi-desktop-%YYYY%%MM%%DD%-%HH%%Min%%Sec%"
    
    if not exist "releases" mkdir "releases"
    
    REM 复制构建产物
    xcopy "%BUILD_DIR%" "releases\%RELEASE_NAME%\" /E /I /H /Y
    
    REM 创建 ZIP 包
    where 7z >nul 2>nul
    if %errorlevel% equ 0 (
        cd releases
        7z a -tzip "%RELEASE_NAME%.zip" "%RELEASE_NAME%\"
        cd ..
        echo ✅ 已创建分发包：releases\%RELEASE_NAME%.zip
    ) else (
        echo ⚠️  7z 未安装，尝试使用 PowerShell 压缩为 ZIP...
        cd releases
        powershell -NoProfile -Command "Compress-Archive -Path '%RELEASE_NAME%\*' -DestinationPath '%RELEASE_NAME%.zip' -Force"
        if exist "%RELEASE_NAME%.zip" (
            cd ..
            echo ✅ 已创建分发包：releases\%RELEASE_NAME%.zip
        ) else (
            cd ..
            echo ⚠️  ZIP 创建失败，请手动打包 releases\%RELEASE_NAME% 目录
        )
    )
    
    echo.
    echo 🎉 构建完成！
    echo 📁 可执行文件：releases\%RELEASE_NAME%\desktop.exe
    echo 📋 分发说明：
    echo    1. 分发整个 releases\%RELEASE_NAME% 目录
    echo    2. 确保目标机器安装了 Microsoft Edge WebView2 Runtime
    echo    3. 可能需要 Visual C++ Redistributable
    
) else (
    echo ❌ 构建失败！请检查错误信息
    if not defined IS_CI pause
    exit /b 1
)

echo.
echo 按任意键退出...
if not defined IS_CI pause >nul
if defined IS_CI exit /b 0