# Windows 桌面版构建与交付

Windows 发布版保留 Flutter + webview_win_floating，随程序携带固定版 WebView2。
当前锁定 152.0.4191.62 x64，CAB 实测约 354.6 MiB，完整内核文件约 798.4 MiB
（不含 Flutter 应用与浏览器用户数据，最终 ZIP 以构建输出为准）。
目标为 Windows 10/11 x64；不依赖目标机器预装 WebView2，也不在启动时下载运行时。
网页本身仍需要连接配置的业务服务。程序需解压到本地磁盘，不支持从 UNC/网络共享运行。

## 构建

需要 Windows、Flutter 3.32.2（与 GitHub Actions 一致）、Visual Studio 的
“使用 C++ 的桌面开发”工作负载和 Windows SDK。macOS 不能直接构建 Windows EXE。

在仓库根目录执行：

```powershell
.\desktop\scripts\build-release.ps1
```

CMD 可执行 `desktop\scripts\build-release.bat`，Git Bash 可执行
`bash desktop/scripts/build-release.sh`；三个入口使用同一套打包逻辑。

脚本完成以下步骤：

1. 按 `scripts/webview2-runtime.json` 下载固定 x64 CAB 并校验 SHA256。
2. 用 Windows `expand.exe` 解压到 `desktop/.webview2/runtime/`，验证版本及必要文件。
3. 运行启动逻辑检查并构建 Flutter Windows x64 Release。
4. CMake 将**完整运行时**复制到 EXE 同级的 `WebView2/`，更新时先清除旧副本。
5. 检查产物，并调用随包 SDK 加载器核对实际识别的内核版本，生成 `desktop/releases/qingzhi-desktop-windows-x64-时间.zip`，输出体积。

GitHub Actions 和 GitLab CI 均调用上述流程。CAB 缺失、校验失败、构建失败或产物
不完整都会令构建失败，不生成新的交付 ZIP。下载缓存与运行时不提交到 Git。

GitHub Actions 使用 `actions/cache` 跨运行缓存清单指定的 CAB，缓存键包含操作系统、
版本、架构和 SHA256；命中缓存后仍校验 SHA256。每次构建重新解压运行时。
上传已生成的 ZIP 时设置 `compression-level: 0`，避免二次压缩；发布 ZIP 的生成
和上传仍会耗时，具体耗时以流水线实际运行结果为准。

### 离线准备运行时

提前保留清单指定的 CAB，在构建机器上设置：

```powershell
$env:WEBVIEW2_FIXED_CAB = 'D:\dependencies\Microsoft.WebView2.FixedVersionRuntime.152.0.4191.62.x64.cab'
.\desktop\scripts\build-release.ps1
```

这仅免去 WebView2 下载；Flutter、Pub、NuGet 和 Windows 编译工具依赖仍需事先准备。
不能用 Evergreen 安装 EXE 替代 Fixed Version CAB。

### 直接使用 Flutter 命令

```powershell
cd desktop
.\scripts\prepare-webview2.ps1
flutter pub get
flutter build windows --release --target-platform windows-x64
.\scripts\verify-windows-bundle.ps1 -BundlePath .\build\windows\x64\runner\Release
```

Release/Profile 的 CMake 安装阶段要求本地已准备运行时；Debug 未携带运行时时允许
继续使用开发机系统 WebView2。Debug 目录若已存在 WebView2，则也要求内容完整。

## 交付目录

```text
qingzhi_desktop.exe
flutter_windows.dll
WebView2Loader.dll
其他插件 DLL
data/
WebView2/
  msedgewebview2.exe
  msedge.dll
  icudtl.dat
  resources.pak
  locales/
  runtime-manifest.json
  ……其余官方运行时文件，必须全部保留
```

用户应解压**完整 ZIP**到当前用户可写的本地目录，再启动 `qingzhi_desktop.exe`。
启动时根据 EXE 位置定位内核，不依赖工作目录；设置进程级
`WEBVIEW2_BROWSER_EXECUTABLE_FOLDER`，不修改系统级环境变量。
浏览器数据保存在当前用户的应用支持目录下 `WebView2UserData/`，避免写入程序目录。

程序通过 `icacls.exe` 给运行时目录授予两个 AppContainer 组读取/执行权限，满足
Windows 10 上 Fixed Runtime 120+ 的要求。权限失败时提示重新解压到用户可写目录；
不自动提权。发布版缺少运行时会显示错误，不回退到系统浏览器；点击重试会重新检查。
VC++ 运行库等 Flutter 自身依赖仍需满足，这个方案解决的是 WebView2 分发依赖。

## 验证

跨平台逻辑检查：

```sh
cd desktop
dart test/scripts/check_bundled_webview2.dart
# 另需 Python 3 和 CMake，用于验证实际复制规则
python test/scripts/check_windows_install.py
```

Windows 交付验收（应使用没有系统 WebView2 的干净测试机）：

- 完整 ZIP 解压到带中文和空格的目录，从其他工作目录启动 EXE。
- 业务网页能打开；任务管理器确认 `msedgewebview2.exe` 路径属于此应用的 `WebView2`。
- 系统有其他 WebView2 版本时，仍使用随包版本。
- 临时移走 `WebView2` 或其中的 `msedge.dll`，应显示启动错误；重试不能跳过检查。
- 恢复文件后重试，应正常启动；测试下载、文件选择、摄像头、麦克风及重启后的登录状态。
- 分别在 Windows 10 和 Windows 11 的普通用户账户验证目录权限和浏览器子进程启动。

## 升级内核

从微软官网下载新的 Fixed Version x64 CAB，更新 `scripts/webview2-runtime.json`
中的版本、URL、SHA256，重新构建并完成上述验收。固定版不会自行更新，需要随应用维护。
微软可能下架旧版本，需在内部依赖存储中保留已验证的 CAB，可用 `WEBVIEW2_FIXED_CAB` 提供。

参考：[微软 WebView2 固定版分发文档](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution#the-fixed-version-runtime-distribution-mode)。
