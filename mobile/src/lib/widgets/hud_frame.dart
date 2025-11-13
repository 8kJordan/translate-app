import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class HudFrame extends StatelessWidget {
  final Widget child;
  final String? title;
  final EdgeInsets padding;
  final double radius;

  const HudFrame({
    super.key,
    required this.child,
    this.title,
    this.padding = const EdgeInsets.all(12),
    this.radius = 14,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.22),
        border: Border.all(color: AppTheme.cyan, width: 1),
        borderRadius: BorderRadius.circular(radius),
        boxShadow: [
          BoxShadow(
            color: AppTheme.cyan.withOpacity(0.12),
            blurRadius: 14,
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(radius),
        child: Stack(
          children: [
            // corner notches
            Positioned.fill(child: CustomPaint(painter: _CornerNotches())),
            Padding(
              padding: padding,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (title != null) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(
                          vertical: 4, horizontal: 8),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.3),
                        border: Border.all(color: AppTheme.cyan, width: 0.6),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        title!.toUpperCase(),
                        style: const TextStyle(
                          color: AppTheme.cyan,
                          fontSize: 11,
                          letterSpacing: 2,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],
                  Flexible(fit: FlexFit.loose, child: child),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CornerNotches extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = AppTheme.cyan
      ..strokeWidth = 1;
    const notch = 12.0;

    // four cornersor  draw short L-shapes 
    // TL
    canvas.drawLine(const Offset(1, notch), const Offset(1, 1), p);
    canvas.drawLine(const Offset(1, 1), const Offset(notch, 1), p);
    // TR
    canvas.drawLine(Offset(size.width - 1, notch),
        Offset(size.width - 1, 1), p);
    canvas.drawLine(Offset(size.width - notch, 1),
        Offset(size.width - 1, 1), p);
    // BL
    canvas.drawLine(Offset(1, size.height - notch),
        Offset(1, size.height - 1), p);
    canvas.drawLine(Offset(1, size.height - 1),
        Offset(notch, size.height - 1), p);
    // BR
    canvas.drawLine(
        Offset(size.width - 1, size.height - notch),
        Offset(size.width - 1, size.height - 1),
        p);
    canvas.drawLine(
        Offset(size.width - notch, size.height - 1),
        Offset(size.width - 1, size.height - 1),
        p);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
