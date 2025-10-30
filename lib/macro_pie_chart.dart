import 'package:flutter/material.dart';
import 'dart:math' as math;

class MacroPieChart extends StatelessWidget {
  final int protein;
  final int carbs;
  final int fat;

  const MacroPieChart({
    super.key,
    required this.protein,
    required this.carbs,
    required this.fat,
  });

  @override
  Widget build(BuildContext context) {
    // Calculate calories from each macro (protein=4cal/g, carbs=4cal/g, fat=9cal/g)
    final proteinCal = protein * 4;
    final carbsCal = carbs * 4;
    final fatCal = fat * 9;
    final total = proteinCal + carbsCal + fatCal;

    final proteinPercent = total > 0 ? (proteinCal / total * 100).round() : 0;
    final carbsPercent = total > 0 ? (carbsCal / total * 100).round() : 0;
    final fatPercent = total > 0 ? (fatCal / total * 100).round() : 0;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Macro Breakdown',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                SizedBox(
                  width: 120,
                  height: 120,
                  child: CustomPaint(
                    painter: PieChartPainter(
                      proteinPercent: proteinPercent / 100,
                      carbsPercent: carbsPercent / 100,
                      fatPercent: fatPercent / 100,
                    ),
                  ),
                ),
                const SizedBox(width: 32),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      MacroLegendItem(
                        color: Colors.blue[400]!,
                        label: 'Protein',
                        percentage: proteinPercent,
                        grams: protein,
                      ),
                      const SizedBox(height: 12),
                      MacroLegendItem(
                        color: Colors.orange[400]!,
                        label: 'Carbs',
                        percentage: carbsPercent,
                        grams: carbs,
                      ),
                      const SizedBox(height: 12),
                      MacroLegendItem(
                        color: Colors.purple[400]!,
                        label: 'Fat',
                        percentage: fatPercent,
                        grams: fat,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class MacroLegendItem extends StatelessWidget {
  final Color color;
  final String label;
  final int percentage;
  final int grams;

  const MacroLegendItem({
    super.key,
    required this.color,
    required this.label,
    required this.percentage,
    required this.grams,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            '$label: $percentage%',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Text(
          '${grams}g',
          style: TextStyle(
            fontSize: 13,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }
}

class PieChartPainter extends CustomPainter {
  final double proteinPercent;
  final double carbsPercent;
  final double fatPercent;

  PieChartPainter({
    required this.proteinPercent,
    required this.carbsPercent,
    required this.fatPercent,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = math.min(size.width, size.height) / 2;

    double startAngle = -math.pi / 2;

    // Draw Protein slice
    if (proteinPercent > 0) {
      final proteinPaint = Paint()
        ..color = Colors.blue[400]!
        ..style = PaintingStyle.fill;
      final proteinSweep = 2 * math.pi * proteinPercent;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        proteinSweep,
        true,
        proteinPaint,
      );
      startAngle += proteinSweep;
    }

    // Draw Carbs slice
    if (carbsPercent > 0) {
      final carbsPaint = Paint()
        ..color = Colors.orange[400]!
        ..style = PaintingStyle.fill;
      final carbsSweep = 2 * math.pi * carbsPercent;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        carbsSweep,
        true,
        carbsPaint,
      );
      startAngle += carbsSweep;
    }

    // Draw Fat slice
    if (fatPercent > 0) {
      final fatPaint = Paint()
        ..color = Colors.purple[400]!
        ..style = PaintingStyle.fill;
      final fatSweep = 2 * math.pi * fatPercent;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        fatSweep,
        true,
        fatPaint,
      );
    }

    // Draw white border around the pie
    final borderPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    canvas.drawCircle(center, radius, borderPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}