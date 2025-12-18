import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'dart:io' show Platform;
import 'package:jitsi_meet_flutter_sdk/jitsi_meet_flutter_sdk.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class MeetingHome extends StatefulWidget {
  const MeetingHome({super.key});

  @override
  State<MeetingHome> createState() => _MeetingHomeState();
}

class _MeetingHomeState extends State<MeetingHome> {
  final jitsi = JitsiMeet();
  bool loading = false;
  String? error;
  final roomController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    final y = now.year.toString().padLeft(4, '0');
    final m = now.month.toString().padLeft(2, '0');
    final d = now.day.toString().padLeft(2, '0');
    roomController.text = 'T-$y$m$d';
  }

  Future<void> _join(String room) async {
    if (kIsWeb || !(Platform.isAndroid || Platform.isIOS)) {
      setState(() {
        loading = false;
        error = '当前平台不支持 Jitsi 会议，请在 Android 或 iOS 设备运行';
      });
      return;
    }
    final cam = await Permission.camera.request();
    final mic = await Permission.microphone.request();
    final granted = cam.isGranted && mic.isGranted;
    if (!granted) {
      setState(() {
        loading = false;
        error = '请授予摄像头与麦克风权限后再加入会议';
      });
      return;
    }
    final options = JitsiMeetConferenceOptions(
      serverURL: 'https://meet.jit.si',
      room: room,
      configOverrides: {
        'startWithAudioMuted': false,
        'startWithVideoMuted': false,
      },
      userInfo: JitsiMeetUserInfo(
        displayName: 'Flutter User',
        email: 'user@example.com',
      ),
    );
    final listener = JitsiMeetEventListener(
      conferenceJoined: (url) {
        debugPrint('conferenceJoined: $url');
      },
      conferenceTerminated: (url, error) {
        debugPrint('conferenceTerminated: $url error=$error');
        setState(() {
          this.error = (error?.toString() ?? '会议已结束或加入失败');
        });
      },
    );
    try {
      await jitsi.join(options, listener);
    } catch (e) {
      setState(() {
        error = e.toString();
      });
    }
    setState(() {
      loading = false;
    });
  }

  @override
  void dispose() {
    roomController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: const Text('会议'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child:
            loading
                ? const Center(child: CircularProgressIndicator())
                : Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (error != null)
                      Text(error!, style: const TextStyle(color: Colors.red)),
                    const SizedBox(height: 12),
                    TextField(
                      controller: roomController,
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                        labelText: '房间号',
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        ElevatedButton(
                          onPressed: () => _join(roomController.text),
                          child: const Text('手动加入'),
                        ),
                        const SizedBox(width: 12),
                        ElevatedButton(
                          onPressed: _scanAndJoin,
                          child: const Text('扫码加入'),
                        ),
                      ],
                    ),
                  ],
                ),
      ),
    );
  }

  Future<void> _scanAndJoin() async {
    if (!(Platform.isAndroid || Platform.isIOS)) {
      return;
    }
    final cam = await Permission.camera.request();
    if (!cam.isGranted) {
      setState(() {
        error = '请授予摄像头权限后再扫码加入会议';
      });
      return;
    }
    final navigator = Navigator.of(context);
    final result = await navigator.push<String?>(
      MaterialPageRoute(builder: (_) => const _QrScanPage()),
    );
    if (result == null || result.isEmpty) {
      return;
    }
    Uri? uri;
    try {
      uri = Uri.parse(result);
    } catch (_) {
      setState(() {
        error = '二维码内容无效';
      });
      return;
    }
    String room = '';
    if (uri.scheme.startsWith('http') &&
        uri.host == 'meet.jit.si' &&
        uri.pathSegments.isNotEmpty) {
      room = uri.pathSegments.first;
    } else if (uri.scheme.isEmpty && uri.host.isEmpty) {
      room = result;
    }
    if (room.isEmpty) {
      setState(() {
        error = '二维码不是有效的会议地址';
      });
      return;
    }
    setState(() {
      roomController.text = room;
    });
    await _join(room);
  }
}

class _QrScanPage extends StatefulWidget {
  const _QrScanPage();

  @override
  State<_QrScanPage> createState() => _QrScanPageState();
}

class _QrScanPageState extends State<_QrScanPage> {
  bool handled = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('扫码加入会议')),
      body: MobileScanner(
        onDetect: (capture) {
          if (handled) return;
          final barcodes = capture.barcodes;
          if (barcodes.isEmpty) return;
          final value = barcodes.first.rawValue;
          if (value == null || value.isEmpty) return;
          handled = true;
          Navigator.of(context).pop<String>(value);
        },
      ),
    );
  }
}
