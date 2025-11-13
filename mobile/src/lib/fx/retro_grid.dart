import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class RetroGrid extends StatelessWidget {
  const RetroGrid({super.key});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(painter: _RetroGridPainter());
  }
}

class _RetroGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final c = size.width / 2;
    final vp = Offset(c, size.height * 0.12); // vanishing point near top
    final paint = Paint()
      ..color = AppTheme.cyan.withOpacity(0.1)
      ..strokeWidth = 1;

    // “Floor” region
    final floorTop = size.height * 0.25;

    //perspective spacing ;ines
    for (int i = 0; i < 18; i++) {
      final t = i / 18.0;
      // interpolate between top floor edge and bottom with exponential spacing
      final y = floorTop + (size.height - floorTop) * (t * t);
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }

    //draw lines from bottom to near vanishing point
    const cols = 16;
    for (int i = -cols ~/ 2; i <= cols ~/ 2; i++) {
      final xBottom = c + i * (size.width / cols);
      final p1 = Offset(xBottom, size.height);
      // Interpolate point 
      final p2 = Offset(
        vp.dx + (xBottom - vp.dx) * 0.12,
        vp.dy + (size.height - vp.dy) * 0.12,
      );
      canvas.drawLine(p1, p2, paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
