import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';

/// STEP 1: Put your Folio URL here.
/// While testing you can use the sandbox preview link; before publishing the
/// app, deploy Folio (see the root README) and paste the permanent URL.
const String folioUrl = 'https://3000-itotc1172tp3cq0jjjclk.e2b.app';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark, // Android
    statusBarBrightness: Brightness.light, // iOS
  ));
  runApp(const FolioApp());
}

class FolioApp extends StatelessWidget {
  const FolioApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Folio',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: const Color(0xFF397B60),
        scaffoldBackgroundColor: Colors.white,
      ),
      home: const FolioScreen(),
    );
  }
}

class FolioScreen extends StatefulWidget {
  const FolioScreen({super.key});

  @override
  State<FolioScreen> createState() => _FolioScreenState();
}

class _FolioScreenState extends State<FolioScreen> {
  late final WebViewController _controller;
  bool _loading = true;
  bool _failed = false;

  void _set(VoidCallback fn) {
    if (mounted) setState(fn);
  }

  @override
  void initState() {
    super.initState();
    final appHost = Uri.parse(folioUrl).host;

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) => _set(() {
            _loading = true;
            _failed = false;
          }),
          onPageFinished: (_) => _set(() => _loading = false),
          onWebResourceError: (error) {
            // Only show the offline screen when the main page itself fails.
            if (error.isForMainFrame ?? true) {
              _set(() {
                _loading = false;
                _failed = true;
              });
            }
          },
          onNavigationRequest: (request) {
            // Keep the user inside Folio. If you later add external links,
            // open them with the url_launcher package here instead.
            final host = Uri.parse(request.url).host;
            return host == appHost
                ? NavigationDecision.navigate
                : NavigationDecision.prevent;
          },
        ),
      )
      ..loadRequest(Uri.parse(folioUrl));
  }

  Future<void> _handleBack() async {
    if (await _controller.canGoBack()) {
      await _controller.goBack();
    } else {
      await SystemNavigator.pop();
    }
  }

  void _retry() {
    _set(() {
      _failed = false;
      _loading = true;
    });
    _controller.reload();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _handleBack();
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Stack(
            children: [
              WebViewWidget(controller: _controller),
              if (_loading)
                const Align(
                  alignment: Alignment.topCenter,
                  child: LinearProgressIndicator(
                    minHeight: 2,
                    backgroundColor: Colors.transparent,
                  ),
                ),
              if (_failed) _OfflineView(onRetry: _retry),
            ],
          ),
        ),
      ),
    );
  }
}

class _OfflineView extends StatelessWidget {
  const _OfflineView({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      alignment: Alignment.center,
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.wifi_off_rounded, size: 48, color: Color(0xFF8DAF99)),
          const SizedBox(height: 16),
          const Text(
            'A little pause. Not the end.',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: Color(0xFF2B3530),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            "We couldn't reach Folio. Check your connection and try again.",
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFF7C877E)),
          ),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Try again'),
          ),
        ],
      ),
    );
  }
}
