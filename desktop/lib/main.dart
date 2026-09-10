import 'dart:ffi';
import 'dart:io';
import 'package:ffi/ffi.dart';
import 'dart:convert';
import 'package:file_selector/file_selector.dart';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:path_provider/path_provider.dart';
import 'bundled_webview2.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

// Simple in-memory log manager
class LogManager {
  static final List<String> _logs = [];
  static final ValueNotifier<int> notifier = ValueNotifier(0);
  static File? _logFile;

  static Future<void> init() async {
    try {
      final dir = await getApplicationDocumentsDirectory();
      _logFile = File('${dir.path}/app.log');
      // Append a session start marker
      final timestamp = DateTime.now().toIso8601String();
      await _logFile?.writeAsString('\n=== Session Start: $timestamp ===\n',
          mode: FileMode.append);
    } catch (e) {
      debugPrint('Failed to init log file: $e');
    }
  }

  static void add(String message) {
    final timestamp = DateTime.now().toIso8601String().split('T').last;
    final logMsg = '[$timestamp] $message';
    _logs.add(logMsg);
    if (_logs.length > 1000) _logs.removeAt(0); // Keep last 1000 logs
    notifier.value++;

    // Write to file
    _logFile?.writeAsString('$logMsg\n', mode: FileMode.append).ignore();
  }

  static List<String> get logs => List.unmodifiable(_logs);

  static void clear() {
    _logs.clear();
    notifier.value++;
  }
}

// Global log function
void appLog(String message) {
  debugPrint(message);
  LogManager.add(message);
}

class LogViewer extends StatelessWidget {
  const LogViewer({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('应用日志'),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete),
            onPressed: LogManager.clear,
          ),
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
      body: ValueListenableBuilder<int>(
        valueListenable: LogManager.notifier,
        builder: (context, _, __) {
          final logs = LogManager.logs.reversed.toList();
          return ListView.builder(
            itemCount: logs.length,
            itemBuilder: (context, index) {
              return Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8.0, vertical: 2.0),
                child: SelectableText(
                  logs[index],
                  style: const TextStyle(fontFamily: 'monospace', fontSize: 12),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

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
      navigatorKey: navigatorKey,
      title: 'Engine Metrics Viewer',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
      ),
      builder: (context, child) {
        return CallbackShortcuts(
          bindings: {
            const SingleActivator(LogicalKeyboardKey.f12): () {
              navigatorKey.currentState?.push(
                MaterialPageRoute(builder: (_) => const LogViewer()),
              );
            },
          },
          child: Focus(
            autofocus: true,
            child: child ?? const SizedBox(),
          ),
        );
      },
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
      await LogManager.init(); // Initialize log file

      if (Platform.isWindows) {
        final support = await getApplicationSupportDirectory();
        await configureBundledWebView2(
          executable: Platform.resolvedExecutable,
          userDataDirectory: '${support.path}\\WebView2UserData',
          required: !kDebugMode,
          setEnvironment: _setEnv,
          grantAccess: _grantWebView2Access,
        );
      }

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
        message = '启动失败：$e';
      });
    }
  }

  Future<void> _requestPermissions() async {
    // 请求麦克风和摄像头权限
    Map<Permission, PermissionStatus> statuses = await [
      Permission.camera,
      Permission.microphone,
    ].request();

    appLog('Permissions status: $statuses');
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
                Text('正在初始化并检测服务可达性...'),
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
                const Icon(Icons.error_outline, size: 48, color: Colors.redAccent),
                const SizedBox(height: 12),
                Text(message ?? '网络不可用或服务不可达'),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () async {
                    setState(() => status = GateStatus.loading);
                    await _init();
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
  final Map<String, _Base64ChunkSession> _base64ChunkSessions = {};
  static const String _downloadHookJs = r"""
    (function(){
      // Map blob object URLs to original Blob objects
      const __blobUrlMap = new Map();
      const __chunkStates = new Map();
      const __chunkThreshold = 8 * 1024 * 1024;
      const __chunkSize = 512 * 1024;
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

      function __sendBase64ChunkStart(transferId, fileName, total){
        try {
          const payload = { type: 'base64_chunk_start', transferId, fileName: fileName || ('download-' + Date.now()), total: total || 0 };
          if (typeof DownloadBridge !== 'undefined') {
            DownloadBridge.postMessage(JSON.stringify(payload));
          }
        } catch(err) {}
      }

      function __sendBase64Chunk(transferId, index, total, base64){
        try {
          const payload = { type: 'base64_chunk', transferId, index: index || 0, total: total || 0, data: base64 || '' };
          if (typeof DownloadBridge !== 'undefined') {
            DownloadBridge.postMessage(JSON.stringify(payload));
          }
        } catch(err) {}
      }

      function __sendBase64ChunkError(transferId, message){
        try {
          const payload = { type: 'base64_chunk_error', transferId, message: String(message || '') };
          if (typeof DownloadBridge !== 'undefined') {
            DownloadBridge.postMessage(JSON.stringify(payload));
          }
        } catch(err) {}
      }

      function __readBlobAsDataURL(blob){
        return new Promise((resolve, reject) => {
          try {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(reader.error || new Error('FileReader error'));
            reader.readAsDataURL(blob);
          } catch (e) {
            reject(e);
          }
        });
      }

      window.__downloadChunkResume = function(transferId){
        try {
          const state = __chunkStates.get(transferId);
          if (!state) return;
          if (state.index >= state.total) {
            __chunkStates.delete(transferId);
            return;
          }
          const start = state.index * state.chunkSize;
          const end = Math.min(state.size, (state.index + 1) * state.chunkSize);
          const slice = state.blob.slice(start, end);
          __readBlobAsDataURL(slice).then((dataUrl) => {
            const base64 = String(dataUrl || '').includes(',') ? String(dataUrl).split(',')[1] : '';
            __sendBase64Chunk(transferId, state.index, state.total, base64);
            state.index++;
          }).catch((e) => {
            __chunkStates.delete(transferId);
            __sendBase64ChunkError(transferId, e && e.message ? e.message : e);
          });
        } catch(_) {}
      };

      window.__downloadChunkCancel = function(transferId){
        try {
          __chunkStates.delete(transferId);
        } catch(_) {}
      };

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
                try {
                  const size = Number(blob.size || 0);
                  if (size > __chunkThreshold) {
                    const total = Math.max(1, Math.ceil(size / __chunkSize));
                    const transferId = 't' + Date.now() + '_' + Math.random().toString(16).slice(2);
                    __chunkStates.set(transferId, { blob: blob, index: 0, total: total, size: size, chunkSize: __chunkSize });
                    __sendBase64ChunkStart(transferId, name, total);
                    return;
                  }
                } catch (_) {}

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
                try {
                  const size = Number(blob.size || 0);
                  if (size > __chunkThreshold) {
                    const total = Math.max(1, Math.ceil(size / __chunkSize));
                    const transferId = 't' + Date.now() + '_' + Math.random().toString(16).slice(2);
                    __chunkStates.set(transferId, { blob: blob, index: 0, total: total, size: size, chunkSize: __chunkSize });
                    __sendBase64ChunkStart(transferId, name, total);
                    return null;
                  }
                } catch (_) {}

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
        appLog('WebView permission requested for: ${request.types}');
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
            appLog('DownloadBridge message: $type');
            if (type == 'base64') {
              final String fileName = (data['fileName'] ??
                      'download-${DateTime.now().millisecondsSinceEpoch}.bin')
                  as String;
              final String base64 = data['data'] as String? ?? '';
              await _saveBase64WithDialog(base64, fileName);
            } else if (type == 'base64_chunk_start') {
              final String transferId = (data['transferId'] ?? '') as String;
              final String fileName = (data['fileName'] ??
                      'download-${DateTime.now().millisecondsSinceEpoch}.bin')
                  as String;
              final int total = (data['total'] is int)
                  ? data['total'] as int
                  : int.tryParse('${data['total'] ?? ''}') ?? 0;
              await _startBase64ChunkDownload(
                  transferId: transferId, fileName: fileName, totalChunks: total);
            } else if (type == 'base64_chunk') {
              final String transferId = (data['transferId'] ?? '') as String;
              final int index = (data['index'] is int)
                  ? data['index'] as int
                  : int.tryParse('${data['index'] ?? ''}') ?? 0;
              final int total = (data['total'] is int)
                  ? data['total'] as int
                  : int.tryParse('${data['total'] ?? ''}') ?? 0;
              final String base64 = data['data'] as String? ?? '';
              await _handleBase64Chunk(
                  transferId: transferId,
                  index: index,
                  totalChunks: total,
                  base64Chunk: base64);
            } else if (type == 'base64_chunk_error') {
              final String transferId = (data['transferId'] ?? '') as String;
              final String errorMessage = (data['message'] ?? '') as String;
              await _failBase64ChunkDownload(
                  transferId: transferId, errorMessage: errorMessage);
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
      if (bytes.isEmpty) {
        throw Exception('下载内容为空');
      }
      final xfile = XFile.fromData(bytes, name: fileName);
      await xfile.saveTo(result.path);
      appLog('Saved file (base64) to: ${result.path}');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('已保存到: ${result.path}')),
        );
      }
    } catch (e) {
      appLog('Save As (base64) failed: $e');
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
        appLog(
            'blob: URL received in native. Expect front-end hook to send base64 instead.');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('无法直接下载 blob:，请重试导出')),
          );
        }
        return;
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

      appLog('Starting download from: $url');

      // 使用原生 HttpClient 替代 http package，以更好控制流和超时
      final client = HttpClient();
      // 设置超时时间为无限制 (实际上设置为365天，确保大文件下载不中断)
      client.connectionTimeout = const Duration(days: 365);
      client.idleTimeout = const Duration(days: 365);

      try {
        final request = await client.getUrl(Uri.parse(url));

        // 设置 Headers
        request.headers.set(HttpHeaders.userAgentHeader,
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // 禁用压缩，避免大文件内存解压问题
        request.headers.set(HttpHeaders.acceptEncodingHeader, 'identity');

        // 设置 Cookie
        try {
          String cookieHeader = '';
          try {
            final Object res = await _controller
                .runJavaScriptReturningResult('document.cookie');
            final String jsCookies = res.toString();
            if (jsCookies.isNotEmpty &&
                jsCookies != '""' &&
                jsCookies != 'null') {
              cookieHeader = jsCookies.replaceAll(RegExp(r'^"|"$'), '');
            }
          } catch (_) {}

          if (cookieHeader.isNotEmpty) {
            request.headers.set(HttpHeaders.cookieHeader, cookieHeader);
          }
        } catch (_) {}

        if (headers != null) {
          headers.forEach((k, v) => request.headers.add(k, v));
        }

        final response = await request.close();
        appLog('Response status: ${response.statusCode}');
        appLog('Response content-length: ${response.contentLength}');

        if (response.statusCode < 200 || response.statusCode >= 300) {
          throw Exception('HTTP ${response.statusCode}');
        }

        final file = File(result.path);
        // 使用 pipe 直接将响应流传输到文件流，性能更好且不易内存溢出
        await response.pipe(file.openWrite());

        // 校验文件大小
        final fileSize = await file.length();
        appLog('Download complete. File size: $fileSize');

        if (fileSize == 0) {
          await file.delete();
          throw Exception('Downloaded file is empty (0 bytes).');
        }

        appLog('Saved file (url) to: ${result.path}');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('已保存到: ${result.path}')),
          );
        }
      } catch (e) {
        appLog('Download error: $e');
        // 尝试清理残余文件
        try {
          final file = File(result.path);
          if (await file.exists()) {
            await file.delete();
          }
        } catch (_) {}

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('下载失败: $e')),
          );
        }
      } finally {
        client.close();
      }
    } catch (e) {
      appLog('URL download failed: $e');
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

  Future<void> _startBase64ChunkDownload(
      {required String transferId,
      required String fileName,
      required int totalChunks}) async {
    if (transferId.isEmpty) return;

    if (_base64ChunkSessions.containsKey(transferId)) {
      await _failBase64ChunkDownload(
          transferId: transferId, errorMessage: '重复的下载任务');
      return;
    }

    final result = await getSaveLocation(suggestedName: fileName);
    if (result == null) {
      await _controller.runJavaScript(
          'window.__downloadChunkCancel && window.__downloadChunkCancel(${jsonEncode(transferId)});');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('已取消保存')),
        );
      }
      return;
    }

    final file = File(result.path);
    final sink = file.openWrite(mode: FileMode.write);
    _base64ChunkSessions[transferId] = _Base64ChunkSession(
        path: result.path, sink: sink, totalChunks: totalChunks);

    await _controller.runJavaScript(
        'window.__downloadChunkResume && window.__downloadChunkResume(${jsonEncode(transferId)});');
  }

  Future<void> _handleBase64Chunk(
      {required String transferId,
      required int index,
      required int totalChunks,
      required String base64Chunk}) async {
    final session = _base64ChunkSessions[transferId];
    if (session == null) return;

    if (totalChunks > 0 && session.totalChunks != totalChunks) {
      await _failBase64ChunkDownload(
          transferId: transferId, errorMessage: '分片总数不一致');
      return;
    }

    if (index != session.receivedChunks) {
      await _failBase64ChunkDownload(
          transferId: transferId, errorMessage: '分片顺序错误');
      return;
    }

    final bytes = base64Decode(base64Chunk);
    if (bytes.isEmpty) {
      await _failBase64ChunkDownload(
          transferId: transferId, errorMessage: '收到空分片');
      return;
    }

    session.sink.add(bytes);
    session.bytesWritten += bytes.length;
    session.receivedChunks++;

    final int lastIndex = (session.totalChunks <= 0)
        ? totalChunks - 1
        : session.totalChunks - 1;

    if (session.receivedChunks - 1 == lastIndex) {
      await session.sink.flush();
      await session.sink.close();
      _base64ChunkSessions.remove(transferId);

      final file = File(session.path);
      final fileSize = await file.length();
      if (fileSize == 0) {
        try {
          await file.delete();
        } catch (_) {}
        throw Exception('Downloaded file is empty (0 bytes).');
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('已保存到: ${session.path}')),
        );
      }
    } else {
      await _controller.runJavaScript(
          'window.__downloadChunkResume && window.__downloadChunkResume(${jsonEncode(transferId)});');
    }
  }

  Future<void> _failBase64ChunkDownload(
      {required String transferId, required String errorMessage}) async {
    final session = _base64ChunkSessions.remove(transferId);
    if (session != null) {
      try {
        await session.sink.flush();
        await session.sink.close();
      } catch (_) {}
      try {
        final file = File(session.path);
        if (await file.exists()) {
          await file.delete();
        }
      } catch (_) {}
    }

    await _controller.runJavaScript(
        'window.__downloadChunkCancel && window.__downloadChunkCancel(${jsonEncode(transferId)});');

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('下载失败: $errorMessage')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(child: WebViewWidget(controller: _controller)),
      floatingActionButton: FloatingActionButton(
        mini: true,
        backgroundColor: Colors.blue.withValues(alpha: 0.5),
        onPressed: () {
          navigatorKey.currentState?.push(
            MaterialPageRoute(builder: (_) => const LogViewer()),
          );
        },
        child: const Icon(Icons.bug_report),
      ),
    );
  }
}

class _Base64ChunkSession {
  final String path;
  final IOSink sink;
  final int totalChunks;
  int receivedChunks = 0;
  int bytesWritten = 0;

  _Base64ChunkSession(
      {required this.path, required this.sink, required this.totalChunks});
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
    appLog('Error parsing URL for env setup: $e');
  }
}

Future<void> _grantWebView2Access(String runtime) async {
  final windows = Platform.environment['SystemRoot'];
  if (windows == null) throw StateError('无法定位 Windows 系统目录');
  final result = await Process.run(
    '$windows\\System32\\icacls.exe',
    [
      runtime,
      '/grant',
      '*S-1-15-2-1:(OI)(CI)(RX)',
      '*S-1-15-2-2:(OI)(CI)(RX)',
    ],
  );
  if (result.exitCode != 0) {
    throw FileSystemException(
      '无法设置浏览器目录权限，请将完整程序解压到当前用户可写的本地目录后重试。',
      runtime,
    );
  }
}

void _setEnv(String key, String value) {
  final kernel32 = DynamicLibrary.open('kernel32.dll');
  final setEnv = kernel32.lookupFunction<SetEnvironmentVariableC,
      SetEnvironmentVariableDart>('SetEnvironmentVariableW');
  final keyPtr = key.toNativeUtf16();
  final valPtr = value.toNativeUtf16();
  try {
    if (setEnv(keyPtr, valPtr) == 0) {
      throw StateError('无法设置浏览器运行环境：$key');
    }
    appLog('Set env $key = $value');
  } finally {
    calloc.free(keyPtr);
    calloc.free(valPtr);
  }
}
