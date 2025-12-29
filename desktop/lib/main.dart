import 'dart:ffi';
import 'dart:io';
import 'package:ffi/ffi.dart';
import 'dart:convert';
import 'package:file_selector/file_selector.dart';
import 'package:cross_file/cross_file.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:permission_handler/permission_handler.dart';

void main() {
  runApp(const MyApp());
}

class AppConfig {
  final String webBaseUrl;
  final String healthCheckPath;
  final int timeoutMs;

  AppConfig({
    required this.webBaseUrl,
    required this.healthCheckPath,
    required this.timeoutMs,
  });

  factory AppConfig.fromJson(Map<String, dynamic> json) {
    return AppConfig(
      webBaseUrl: json['webBaseUrl'] as String,
      healthCheckPath: json['healthCheckPath'] as String? ?? 'health',
      timeoutMs: json['timeoutMs'] as int? ?? 3000,
    );
  }
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Engine Metrics Viewer',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
      ),
      home: const StartupGate(),
    );
  }
}

enum GateStatus { loading, ok, error }

class StartupGate extends StatefulWidget {
  const StartupGate({super.key});

  @override
  State<StartupGate> createState() => _StartupGateState();
}

class _StartupGateState extends State<StartupGate> {
  GateStatus status = GateStatus.loading;
  String? message;
  AppConfig? config;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    try {
      final cfgStr = await rootBundle.loadString('assets/config/app.json');
      final cfgJson = jsonDecode(cfgStr) as Map<String, dynamic>;
      config = AppConfig.fromJson(cfgJson);

      // 设置 WebView2 环境变量以支持 HTTP 媒体权限
      _setWebView2Env(config!.webBaseUrl);

      // 请求系统权限（尤其是 Windows 平台）
      await _requestPermissions();

      await _checkReachable();
    } catch (e) {
      setState(() {
        status = GateStatus.error;
        message = '加载配置失败：$e';
      });
    }
  }

  Future<void> _requestPermissions() async {
    // 请求麦克风和摄像头权限
    Map<Permission, PermissionStatus> statuses = await [
      Permission.camera,
      Permission.microphone,
    ].request();

    debugPrint('Permissions status: $statuses');
  }

  Future<void> _checkReachable() async {
    final healthUrl = Uri.parse(
      '${config!.webBaseUrl}${config!.healthCheckPath}',
    );
    try {
      final resp = await http
          .get(healthUrl)
          .timeout(Duration(milliseconds: config!.timeoutMs));
      if (resp.statusCode == 200) {
        setState(() => status = GateStatus.ok);
        return;
      }
      throw Exception('状态码 ${resp.statusCode}');
    } catch (e) {
      // fallback to basic connectivity
      final conn = await Connectivity().checkConnectivity();
      if (conn.contains(ConnectivityResult.none)) {
        setState(() {
          status = GateStatus.error;
          message = '网络不可用，请检查网络后重试。';
        });
      } else {
        setState(() {
          status = GateStatus.error;
          message = '服务不可达或超时，请稍后重试。';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    switch (status) {
      case GateStatus.loading:
        return const Scaffold(
          body: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 12),
                Text('正在检测网络与服务可达性...'),
              ],
            ),
          ),
        );
      case GateStatus.error:
        return Scaffold(
          body: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.wifi_off, size: 48, color: Colors.redAccent),
                const SizedBox(height: 12),
                Text(message ?? '网络不可用或服务不可达'),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () async {
                    setState(() => status = GateStatus.loading);
                    await _checkReachable();
                  },
                  child: const Text('重试'),
                ),
              ],
            ),
          ),
        );
      case GateStatus.ok:
        return WebShell(url: config!.webBaseUrl);
    }
  }
}

class WebShell extends StatefulWidget {
  final String url;
  const WebShell({super.key, required this.url});

  @override
  State<WebShell> createState() => _WebShellState();
}

class _WebShellState extends State<WebShell> {
  late final WebViewController _controller;
  static const String _downloadHookJs = r"""
    (function(){
      // Map blob object URLs to original Blob objects
      const __blobUrlMap = new Map();
      const __origCreateObjectURL = URL.createObjectURL;
      URL.createObjectURL = function(obj){
        try {
          const url = __origCreateObjectURL.call(URL, obj);
          __blobUrlMap.set(url, obj);
          return url;
        } catch(e) {
          return __origCreateObjectURL.call(URL, obj);
        }
      };

      const __origRevokeObjectURL = URL.revokeObjectURL;
      URL.revokeObjectURL = function(url){
        try { __blobUrlMap.delete(url); } catch(e) {}
        return __origRevokeObjectURL.call(URL, url);
      };

      // Helper to send base64 payload
      function __sendBase64(base64, fileName){
        try {
          const payload = { type: 'base64', fileName: fileName || ('download-' + Date.now()), data: base64 };
          if (typeof DownloadBridge !== 'undefined') {
            DownloadBridge.postMessage(JSON.stringify(payload));
          }
        } catch(err) {}
      }

      // Try to infer filename from data URI mime type
      function __inferNameFromDataUri(dataUri){
        try {
          const m = String(dataUri).match(/^data:([^;]+)(;base64)?,/);
          if (!m) return null;
          const mime = m[1] || 'application/octet-stream';
          const ext = (mime.split('/')[1] || 'bin').split(';')[0];
          return 'download-' + Date.now() + '.' + ext;
        } catch(_) { return null; }
      }

      // Intercept anchor.click for downloads of blob or data URLs
      const __origClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function(){
        try {
          const href = this.href || '';
          const isBlob = href.startsWith('blob:');
          const isData = href.startsWith('data:');
          const isHttp = href.startsWith('http:') || href.startsWith('https:');
          if ((isBlob || isData) && typeof DownloadBridge !== 'undefined') {
            const name = this.download || (isData ? (__inferNameFromDataUri(href) || ('download-' + Date.now() + '.bin')) : ('download-' + Date.now()));
            if (isBlob) {
              const blob = __blobUrlMap.get(href);
              if (blob) {
                const reader = new FileReader();
                reader.onload = () => {
                  try {
                    const dataUrl = String(reader.result || '');
                    const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
                    __sendBase64(base64, name);
                  } catch(err) {}
                };
                reader.readAsDataURL(blob);
                return; // prevent default
              }
            } else if (isData) {
              try {
                const base64 = href.includes(',') ? href.split(',')[1] : href;
                __sendBase64(base64, name);
                return; // prevent default
              } catch(err) {}
            }
          } else if (isHttp && this.download && typeof DownloadBridge !== 'undefined') {
            try {
              const name = this.download || ('download-' + Date.now());
              const payload = { type: 'url', url: href, fileName: name };
              DownloadBridge.postMessage(JSON.stringify(payload));
              return; // prevent default navigation
            } catch(err) {}
          }
        } catch(e) {}
        return __origClick.call(this);
      };

      // Intercept window.open for blob or data URLs
      const __origOpen = window.open;
      window.open = function(url, target, features){
        try {
          const href = String(url || '');
          const isBlob = href.startsWith('blob:');
          const isData = href.startsWith('data:');
          if ((isBlob || isData) && typeof DownloadBridge !== 'undefined') {
            const name = isData ? (__inferNameFromDataUri(href) || ('download-' + Date.now() + '.bin')) : ('download-' + Date.now());
            if (isBlob) {
              const blob = __blobUrlMap.get(href);
              if (blob) {
                const reader = new FileReader();
                reader.onload = () => {
                  try {
                    const dataUrl = String(reader.result || '');
                    const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
                    __sendBase64(base64, name);
                  } catch(err) {}
                };
                reader.readAsDataURL(blob);
                return null; // prevent default popup
              }
            } else if (isData) {
              try {
                const base64 = href.includes(',') ? href.split(',')[1] : href;
                __sendBase64(base64, name);
                return null; // prevent default popup
              } catch(err) {}
            }
          }
        } catch(e) {}
        return __origOpen.apply(window, arguments);
      };
    })();
  """;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController(
      onPermissionRequest: (WebViewPermissionRequest request) {
        debugPrint('WebView permission requested for: ${request.types}');
        // 授予所有请求的权限
        request.grant();
      },
    )
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..addJavaScriptChannel(
        'DownloadBridge',
        onMessageReceived: (JavaScriptMessage message) async {
          try {
            final Map<String, dynamic> data = jsonDecode(message.message);
            final String type = (data['type'] ?? '') as String;
            debugPrint('DownloadBridge message: $type');
            if (type == 'base64') {
              final String fileName = (data['fileName'] ??
                      'download-${DateTime.now().millisecondsSinceEpoch}.bin')
                  as String;
              final String base64 = data['data'] as String? ?? '';
              await _saveBase64WithDialog(base64, fileName);
            } else if (type == 'url') {
              final String url = (data['url'] ?? '') as String;
              final String fileName = (data['fileName'] ??
                      'download-${DateTime.now().millisecondsSinceEpoch}.bin')
                  as String;
              await _downloadUrlWithDialog(url, fileName,
                  headers: (data['headers'] as Map?)?.cast<String, String>());
            }
          } catch (e) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('下载处理失败: $e')),
              );
            }
          }
        },
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (NavigationRequest request) {
            // 仅允许在同一域名下导航
            final dest = Uri.parse(request.url);
            final base = Uri.parse(widget.url);
            // 允许系统/初始页面（about:blank、edge:、data:、file:）
            const allowedSchemes = {'about', 'edge', 'data', 'file'};
            if (allowedSchemes.contains(dest.scheme)) {
              return NavigationDecision.navigate;
            }
            if (dest.host == base.host) {
              return NavigationDecision.navigate;
            }
            return NavigationDecision.prevent;
          },
          onPageFinished: (String url) async {
            // 注入下载拦截脚本
            try {
              await _controller.runJavaScript(_downloadHookJs);
            } catch (_) {}
          },
        ),
      )
      // 禁用缓存，确保每次都获取最新内容
      ..clearCache()
      ..clearLocalStorage()
      // 启用开发者工具（调试模式下）
      ..enableZoom(false);

    // 加载页面
    _loadPage();
  }

  void _loadPage() {
    _controller.loadRequest(
      Uri.parse(widget.url),
      // 添加 no-cache 头部，强制刷新
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    );
  }

  void _refreshPage() {
    _controller.reload();
  }

  Future<void> _saveBase64WithDialog(String base64, String fileName) async {
    try {
      final result = await getSaveLocation(suggestedName: fileName);
      if (result == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('已取消保存')),
          );
        }
        return;
      }
      final String pureBase64 = base64.startsWith('data:')
          ? _extractBase64FromDataUrl(base64)
          : base64;
      final bytes = base64Decode(pureBase64);
      final xfile = XFile.fromData(bytes, name: fileName);
      await xfile.saveTo(result.path);
      debugPrint('Saved file (base64) to: ${result.path}');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('已保存到: ${result.path}')),
        );
      }
    } catch (e) {
      debugPrint('Save As (base64) failed: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('下载处理失败: $e')),
        );
      }
    }
  }

  Future<void> _downloadUrlWithDialog(String url, String fileName,
      {Map<String, String>? headers}) async {
    try {
      // 支持 data:URL 直接保存
      if (url.startsWith('data:')) {
        final String base64 = _extractBase64FromDataUrl(url);
        await _saveBase64WithDialog(base64, fileName);
        return;
      }
      if (url.startsWith('blob:')) {
        // blob: 无法在原生侧直接拉取，需要前端钩子转为 base64。此处提示并退出。
        debugPrint(
            'blob: URL received in native. Expect front-end hook to send base64 instead.');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('无法直接下载 blob:，请重试导出')),
          );
        }
        return;
      }
      // create a request
      final request = http.Request('GET', Uri.parse(url));
      if (headers != null) {
        request.headers.addAll(headers);
      }

      final client = http.Client();
      final http.StreamedResponse response = await client.send(request);

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw Exception('HTTP ${response.statusCode}');
      }

      final result = await getSaveLocation(suggestedName: fileName);
      if (result == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('已取消保存')),
          );
        }
        return;
      }

      final file = File(result.path);
      final sink = file.openWrite();
      try {
        await response.stream.pipe(sink);
      } finally {
        await sink.close();
        client.close();
      }

      debugPrint('Saved file (url) to: ${result.path}');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('已保存到: ${result.path}')),
        );
      }
    } catch (e) {
      debugPrint('URL download failed: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('URL 下载失败: $e')),
        );
      }
    }
  }

  String _extractBase64FromDataUrl(String dataUrl) {
    // e.g. data:application/vnd.ms-excel;base64,AAA...
    final int comma = dataUrl.indexOf(',');
    if (comma >= 0) {
      return dataUrl.substring(comma + 1);
    }
    return dataUrl; // already pure base64
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(child: WebViewWidget(controller: _controller)),
    );
  }
}

// Windows Environment Helpers
typedef SetEnvironmentVariableC = Int32 Function(
    Pointer<Utf16> lpName, Pointer<Utf16> lpValue);
typedef SetEnvironmentVariableDart = int Function(
    Pointer<Utf16> lpName, Pointer<Utf16> lpValue);

void _setWebView2Env(String url) {
  if (!Platform.isWindows) return;

  try {
    final uri = Uri.parse(url);
    // 如果是 HTTP，设置不安全来源白名单
    if (uri.scheme == 'http') {
      final origin = '${uri.scheme}://${uri.host}:${uri.port}';
      // 允许不安全来源并自动播放
      final args =
          '--unsafely-treat-insecure-origin-as-secure=$origin --autoplay-policy=no-user-gesture-required';

      _setEnv("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", args);
    }
  } catch (e) {
    debugPrint('Error parsing URL for env setup: $e');
  }
}

void _setEnv(String key, String value) {
  try {
    final kernel32 = DynamicLibrary.open('kernel32.dll');
    final SetEnvironmentVariableDart setEnv = kernel32.lookupFunction<
        SetEnvironmentVariableC,
        SetEnvironmentVariableDart>('SetEnvironmentVariableW');

    final keyPtr = key.toNativeUtf16();
    final valPtr = value.toNativeUtf16();

    setEnv(keyPtr, valPtr);

    calloc.free(keyPtr);
    calloc.free(valPtr);
    debugPrint('Set env $key = $value');
  } catch (e) {
    debugPrint('Failed to set env: $e');
  }
}
