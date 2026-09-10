// Standalone check intentionally avoids Flutter/package resolution.
// ignore_for_file: avoid_relative_lib_imports, avoid_print
import 'dart:io';
import '../../lib/bundled_webview2.dart';

// Run with `dart test/scripts/check_bundled_webview2.dart` (no Flutter engine).
Future<void> main() async {
  final root = Directory.systemTemp.createTempSync('qingzhi runtime 测试 ');
  final runtime = Directory('${root.path}/WebView2');
  final env = <String, String>{};
  var grants = 0;
  Future<void> configure({bool required = true}) => configureBundledWebView2(
        executable: '${root.path}/qingzhi_desktop.exe',
        userDataDirectory: '${root.path}/profile',
        required: required,
        setEnvironment: (key, value) => env[key] = value,
        grantAccess: (path) async {
          grants++;
        },
      );
  Future<void> rejects(Future<void> Function() action) async {
    try {
      await action();
    } on FileSystemException {
      return;
    }
    throw StateError('Expected missing/incomplete runtime to be rejected');
  }

  void check(bool condition, String message) {
    if (!condition) throw StateError(message);
  }

  try {
    await rejects(() => configure());
    check(env.isEmpty, 'Missing release runtime must not select a browser');
    await configure(required: false);
    check(env.isEmpty, 'Debug without a bundle must preserve system runtime');
    runtime.createSync();
    File('${runtime.path}/msedgewebview2.exe').writeAsStringSync('fixture');
    await rejects(() => configure());
    await rejects(() => configure(required: false));
    for (final name in ['msedge.dll', 'icudtl.dat', 'resources.pak']) {
      File('${runtime.path}/$name').writeAsStringSync('fixture');
    }
    Directory('${runtime.path}/locales').createSync();
    File('${runtime.path}/locales/en-US.pak').writeAsStringSync('fixture');
    await configure();
    check(env['WEBVIEW2_BROWSER_EXECUTABLE_FOLDER'] == runtime.absolute.path,
        'Runtime must resolve against exe, including spaces/Unicode, not cwd');
    check(env['WEBVIEW2_USER_DATA_FOLDER'] == '${root.path}/profile',
        'Browser profile must be outside the runtime');
    check(Directory('${root.path}/profile').existsSync(), 'Profile must exist');
    check(grants == 1, 'Incomplete bundles must not trigger ACL changes');
    env.clear();
    try {
      await configureBundledWebView2(
        executable: '${root.path}/qingzhi_desktop.exe',
        userDataDirectory: '${root.path}/profile',
        required: true,
        setEnvironment: (key, value) => env[key] = value,
        grantAccess: (_) async => throw FileSystemException('access denied'),
      );
      throw StateError('ACL error must stop startup');
    } on FileSystemException {/* expected */}
    check(env.isEmpty, 'ACL failure must not proceed to browser creation');
    print(
        'PASS: missing, debug fallback, partial bundle, executable-relative path, profile, ACL failure');
  } finally {
    root.deleteSync(recursive: true);
  }
}
