import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class CRTEffect extends StatefulWidget {
  final Widget child;
  const CRTEffect({super.key, required this.child});

  @override
  State<CRTEffect> createState() => _CRTEffectState();
}

class _CRTEffectState extends State<CRTEffect>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(seconds: 6))
      ..repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, __) {
        final t = _ctrl.value * 2 * math.pi;
        final flicker = (math.sin(t) + math.sin(2.3 * t)) * 0.02; // -0.04..0.04
        return Stack(
          children: [
            widget.child,
            // scanlines
            IgnorePointer(
              child: CustomPaint(
                painter: _ScanlinePainter(opacity: 0.055 + flicker),
                size: Size.infinite,
              ),
            ),
            // vignette
            IgnorePointer(
              child: Container(
                decoration: const BoxDecoration(
                  gradient: RadialGradient(
                    colors: [Colors.transparent, Color(0xAA000000)],
                    radius: 1.1,
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _ScanlinePainter extends CustomPainter {
  final double opacity;
  _ScanlinePainter({required this.opacity});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppTheme.cyan.withOpacity(opacity)
      ..strokeWidth = 1;
    for (double y = 0; y < size.height; y += 3) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant _ScanlinePainter oldDelegate) =>
      oldDelegate.opacity != opacity;
}
