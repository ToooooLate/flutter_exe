import 'dart:io';

/// Select the app-local runtime before the plugin creates its first WebView.
/// The callbacks isolate Windows APIs so bundle validation can run on any OS.
Future<void> configureBundledWebView2({
  required String executable,
  required String userDataDirectory,
  required bool required,
  required void Function(String, String) setEnvironment,
  required Future<void> Function(String) grantAccess,
}) async {
  final runtime = Directory(
    '${File(executable).absolute.parent.path}${Platform.pathSeparator}WebView2',
  );
  if (!runtime.existsSync() && !required) return;
  for (final name in [
    'msedgewebview2.exe',
    'msedge.dll',
    'icudtl.dat',
    'resources.pak',
    'locales${Platform.pathSeparator}en-US.pak',
  ]) {
    if (!File('${runtime.path}${Platform.pathSeparator}$name').existsSync()) {
      throw FileSystemException(
        '程序文件不完整，请重新解压完整安装包（包括 WebView2 文件夹）后启动。',
        runtime.path,
      );
    }
  }
  // Fixed Runtime 120+ requires AppContainer read/execute ACLs on Windows 10.
  await grantAccess(runtime.path);
  final profile = await Directory(userDataDirectory).create(recursive: true);
  setEnvironment('WEBVIEW2_BROWSER_EXECUTABLE_FOLDER', runtime.path);
  setEnvironment('WEBVIEW2_USER_DATA_FOLDER', profile.absolute.path);
}
