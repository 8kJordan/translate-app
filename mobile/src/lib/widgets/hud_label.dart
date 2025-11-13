import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class HudLabel extends StatelessWidget {
  final String text;
  final VoidCallback? onTap;
  const HudLabel({super.key, required this.text, this.onTap});

  @override
  Widget build(BuildContext context) {
    final chip = Container(
      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 10),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.25),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.cyan, width: 0.8),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              text.toUpperCase(),
              style: const TextStyle(
                color: AppTheme.cyan,
                fontSize: 11,
                letterSpacing: 1.6,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const Icon(Icons.keyboard_arrow_down,
              size: 16, color: AppTheme.cyan),
        ],
      ),
    );
    if (onTap == null) return chip;
    return GestureDetector(onTap: onTap, child: chip);
  }
}
