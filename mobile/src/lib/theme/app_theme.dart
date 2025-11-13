import 'package:flutter/material.dart';

class AppTheme {
  static const Color bg = Color(0xFF050816);
  static const Color bgCard = Color(0xFF0A1020);
  static const Color cyan = Color(0xFF00F5FF);
  static const Color cyanSoft = Color(0xFF00D1E8);
  static const Color textPrimary = Colors.white;
  static const Color textMuted = Color(0xFF9EA8C6);

  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF00F5FF), Color(0xFF00B3FF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static ThemeData get theme {
    final base = ThemeData.dark();
    return base.copyWith(
      scaffoldBackgroundColor: bg,
      primaryColor: cyan,
      colorScheme: base.colorScheme.copyWith(
        primary: cyan,
        secondary: cyanSoft,
      ),
      textTheme: _textTheme(base.textTheme),
      inputDecorationTheme: _inputDecorationTheme,
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(999),
          ),
          foregroundColor: Colors.white,
          textStyle: const TextStyle(
            fontWeight: FontWeight.w600,
            letterSpacing: 1.5,
          ),
        ).merge(
          ButtonStyle(
            backgroundColor: MaterialStateProperty.resolveWith(
              (states) => null, // we use Ink + gradient manually
            ),
          ),
        ),
      ),
    );
  }

  static TextTheme _textTheme(TextTheme base) {
    const titleFont = TextStyle(
      fontWeight: FontWeight.w700,
      letterSpacing: 2.5,
    );

    const bodyFont = TextStyle(
      fontWeight: FontWeight.w400,
      letterSpacing: 0.5,
    );

    return base
        .apply(
          displayColor: textPrimary,
          bodyColor: textPrimary,
        )
        .copyWith(
          headlineLarge: titleFont.copyWith(fontSize: 32),
          headlineMedium: titleFont.copyWith(fontSize: 24),
          headlineSmall: titleFont.copyWith(fontSize: 20),
          bodyMedium: bodyFont.copyWith(fontSize: 14),
          bodySmall: bodyFont.copyWith(fontSize: 12, color: textMuted),
        );
  }

  static const InputDecorationTheme _inputDecorationTheme =
      InputDecorationTheme(
    filled: true,
    fillColor: Color(0xFF050B18),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.all(Radius.circular(16)),
      borderSide: BorderSide(color: Color(0xFF1C2840), width: 1),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.all(Radius.circular(16)),
      borderSide: BorderSide(color: Color(0xFF1C2840), width: 1),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.all(Radius.circular(16)),
      borderSide: BorderSide(color: cyan, width: 1.4),
    ),
    hintStyle: TextStyle(color: textMuted, fontSize: 13),
    labelStyle: TextStyle(color: textMuted),
    contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
  );

  static BoxDecoration neonCardDecoration = BoxDecoration(
    color: bgCard,
    borderRadius: BorderRadius.circular(24),
    border: Border.all(color: cyan.withOpacity(0.7), width: 1.2),
    boxShadow: [
      BoxShadow(
        color: cyan.withOpacity(0.18),
        blurRadius: 18,
        offset: const Offset(0, 12),
      )
    ],
  );

  static Widget neonButton({required String label, required VoidCallback? onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Ink(
        decoration: BoxDecoration(
          gradient: primaryGradient,
          borderRadius: BorderRadius.circular(999),
        ),
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 32),
        child: Center(
          child: Text(
            label.toUpperCase(),
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              letterSpacing: 2,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }
}
