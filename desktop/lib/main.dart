import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:webview_flutter/webview_flutter.dart';

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
      await _checkReachable();
    } catch (e) {
      setState(() {
        status = GateStatus.error;
        message = '加载配置失败：$e';
      });
    }
  }

  Future<void> _checkReachable() async {
    if (config == null) return;
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
      if (conn == ConnectivityResult.none) {
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

  @override
  void initState() {
    super.initState();
    _controller =
        WebViewController()
          ..setJavaScriptMode(JavaScriptMode.unrestricted)
          ..setNavigationDelegate(
            NavigationDelegate(
              onNavigationRequest: (NavigationRequest request) {
                // 仅允许在同一域名下导航
                final dest = Uri.parse(request.url);
                final base = Uri.parse(widget.url);
                if (dest.host == base.host) {
                  return NavigationDecision.navigate;
                }
                return NavigationDecision.prevent;
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // appBar: AppBar(
      //   title: const Text('发动机性能参数'),
      //   backgroundColor: Colors.blue.shade600,
      //   foregroundColor: Colors.white,
      //   elevation: 0,
      //   actions: [
      //     IconButton(
      //       icon: const Icon(Icons.refresh),
      //       onPressed: _refreshPage,
      //       tooltip: '刷新页面',
      //     ),
      //   ],
      // ),
      body: SafeArea(child: WebViewWidget(controller: _controller)),
    );
  }
}
