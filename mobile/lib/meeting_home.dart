import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'dart:io' show Platform;
import 'package:jitsi_meet_flutter_sdk/jitsi_meet_flutter_sdk.dart';
import 'package:permission_handler/permission_handler.dart';

class MeetingHome extends StatefulWidget {
  const MeetingHome({super.key});

  @override
  State<MeetingHome> createState() => _MeetingHomeState();
}

class _MeetingHomeState extends State<MeetingHome> {
  final jitsi = JitsiMeet();
  bool loading = true;
  String? activeRoom;
  String? error;
  final roomController = TextEditingController(text: 'jitsiIsAwesome');

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkAndJoin();
    });
  }

  Future<void> _checkAndJoin() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final room = await MeetingService.checkActiveMeeting();
      if (room != null && room.isNotEmpty) {
        setState(() {
          activeRoom = room;
          loading = false;
        });
      } else {
        setState(() {
          activeRoom = null;
          loading = false;
        });
      }
    } catch (e) {
      setState(() {
        error = e.toString();
        loading = false;
      });
    }
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
                    if (activeRoom == null) ...[
                      const Text('暂无正在召开的会议'),
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
                            onPressed: _checkAndJoin,
                            child: const Text('重新检查'),
                          ),
                          const SizedBox(width: 12),
                          ElevatedButton(
                            onPressed: () => _join(roomController.text),
                            child: const Text('手动加入'),
                          ),
                        ],
                      ),
                    ] else ...[
                      Text('检测到会议：$activeRoom'),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: () => _join(activeRoom!),
                        child: const Text('进入会议'),
                      ),
                    ],
                  ],
                ),
      ),
    );
  }
}

class MeetingService {
  static Future<String?> checkActiveMeeting() async {
    await Future.delayed(const Duration(seconds: 1));
    final now = DateTime.now().second;
    if (now % 2 == 0) {
      return 'jitsiIsAwesomeWithFlutter';
    }
    return null;
  }
}
