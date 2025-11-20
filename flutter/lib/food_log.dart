import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:fl_chart/fl_chart.dart';
import 'dart:convert';
import 'package:intl/intl.dart';

class MealEntry {
  final String id;
  final String name;
  final String type;
  final int calories;
  final int protein;
  final int carbs;
  final int fat;
  final DateTime dateLogged;

  MealEntry({
    required this.id,
    required this.name,
    required this.type,
    required this.calories,
    required this.protein,
    required this.carbs,
    required this.fat,
    required this.dateLogged,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'type': type,
        'calories': calories,
        'protein': protein,
        'carbs': carbs,
        'fat': fat,
        'dateLogged': dateLogged.toIso8601String(),
      };

  factory MealEntry.fromJson(Map<String, dynamic> json) => MealEntry(
        id: json['id'],
        name: json['name'],
        type: json['type'],
        calories: json['calories'],
        protein: json['protein'] ?? 0,
        carbs: json['carbs'] ?? 0,
        fat: json['fat'] ?? 0,
        dateLogged: DateTime.parse(json['dateLogged']),
      );
}

class FoodLogScreen extends StatefulWidget {
  const FoodLogScreen({super.key});

  @override
  State<FoodLogScreen> createState() => _FoodLogScreenState();
}

class _FoodLogScreenState extends State<FoodLogScreen> {
  DateTime _selectedWeekStart = DateTime.now();
  DateTime _selectedDate = DateTime.now();
  List<MealEntry> _allMeals = [];

  @override
  void initState() {
    super.initState();
    _selectedWeekStart = _getWeekStart(DateTime.now());
    _selectedDate = _normalizeDate(DateTime.now());
    _loadMeals();
  }

  DateTime _normalizeDate(DateTime date) {
    return DateTime(date.year, date.month, date.day);
  }

  DateTime _getWeekStart(DateTime date) {
    final normalized = _normalizeDate(date);
    return normalized.subtract(Duration(days: normalized.weekday - 1));
  }

  Future<void> _loadMeals() async {
    final prefs = await SharedPreferences.getInstance();
    final mealsJson = prefs.getString('allMealEntries');
    if (mealsJson != null) {
      final List<dynamic> decoded = json.decode(mealsJson);
      setState(() {
        _allMeals = decoded.map((e) => MealEntry.fromJson(e)).toList();
      });
    }
  }

  Future<void> _saveMeals() async {
    final prefs = await SharedPreferences.getInstance();
    final encoded = json.encode(_allMeals.map((e) => e.toJson()).toList());
    await prefs.setString('allMealEntries', encoded);
  }

  List<MealEntry> _getMealsForDate(DateTime date) {
    final normalized = _normalizeDate(date);
    return _allMeals.where((meal) {
      final mealDate = _normalizeDate(meal.dateLogged);
      return mealDate.isAtSameMomentAs(normalized);
    }).toList();
  }

  int _getTotalCaloriesForDate(DateTime date) {
    return _getMealsForDate(date).fold(0, (sum, meal) => sum + meal.calories);
  }

  void _addMeal(MealEntry meal) {
    setState(() {
      _allMeals.add(meal);
    });
    _saveMeals();
  }

  void _deleteMeal(String id) {
    setState(() {
      _allMeals.removeWhere((meal) => meal.id == id);
    });
    _saveMeals();
  }

  void _previousWeek() {
    setState(() {
      _selectedWeekStart = _selectedWeekStart.subtract(const Duration(days: 7));
      // Keep selected date in the same position within the week
      final dayOffset = _selectedDate.difference(_selectedWeekStart).inDays;
      if (dayOffset >= 0 && dayOffset < 7) {
        _selectedDate = _selectedWeekStart.add(Duration(days: dayOffset));
      } else {
        _selectedDate = _selectedWeekStart;
      }
    });
  }

  void _nextWeek() {
    setState(() {
      _selectedWeekStart = _selectedWeekStart.add(const Duration(days: 7));
      // Keep selected date in the same position within the week
      final dayOffset = _selectedDate.difference(_selectedWeekStart.subtract(const Duration(days: 7))).inDays;
      if (dayOffset >= 0 && dayOffset < 7) {
        _selectedDate = _selectedWeekStart.add(Duration(days: dayOffset));
      } else {
        _selectedDate = _selectedWeekStart;
      }
    });
  }

  void _thisWeek() {
    setState(() {
      final now = DateTime.now();
      _selectedWeekStart = _getWeekStart(now);
      _selectedDate = _normalizeDate(now);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Food Log'),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            _WeekNavigationBar(
              selectedWeekStart: _selectedWeekStart,
              onPrevious: _previousWeek,
              onNext: _nextWeek,
              onThisWeek: _thisWeek,
            ),
            const SizedBox(height: 16),
            _WeeklyCalorieChart(
              weekStart: _selectedWeekStart,
              getTotalCalories: _getTotalCaloriesForDate,
              selectedDate: _selectedDate,
              onDayTapped: (date) {
                setState(() {
                  _selectedDate = _normalizeDate(date);
                });
              },
            ),
            const SizedBox(height: 24),
            _DailyMealsPanel(
              selectedDate: _selectedDate,
              meals: _getMealsForDate(_selectedDate),
              onAddMeal: () => _showAddMealDialog(_selectedDate),
              onDeleteMeal: _deleteMeal,
              onDateChange: (newDate) {
                setState(() {
                  _selectedDate = _normalizeDate(newDate);
                });
              },
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  void _showAddMealDialog(DateTime date) {
    final nameController = TextEditingController();
    final caloriesController = TextEditingController();
    final proteinController = TextEditingController();
    final carbsController = TextEditingController();
    final fatController = TextEditingController();
    String selectedType = 'Breakfast';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 20),
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                Text(
                  'Add Meal for ${DateFormat('MMM d, yyyy').format(date)}',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 24),
                TextField(
                  controller: nameController,
                  textCapitalization: TextCapitalization.words,
                  decoration: InputDecoration(
                    labelText: 'Food Name',
                    prefixIcon: const Icon(Icons.restaurant),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  initialValue: selectedType,
                  decoration: InputDecoration(
                    labelText: 'Meal Type',
                    prefixIcon: const Icon(Icons.category),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  items: ['Breakfast', 'Lunch', 'Dinner', 'Snack']
                      .map((type) => DropdownMenuItem(
                            value: type,
                            child: Text(type),
                          ))
                      .toList(),
                  onChanged: (value) {
                    setModalState(() {
                      selectedType = value!;
                    });
                  },
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: caloriesController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: 'Calories (required)',
                    prefixIcon: const Icon(Icons.local_fire_department),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: proteinController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Protein (g)',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: carbsController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Carbs (g)',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: fatController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Fat (g)',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(context),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text('Cancel'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          final name = nameController.text.trim();
                          final calories = int.tryParse(caloriesController.text);
                          final protein = int.tryParse(proteinController.text) ?? 0;
                          final carbs = int.tryParse(carbsController.text) ?? 0;
                          final fat = int.tryParse(fatController.text) ?? 0;

                          if (name.isNotEmpty && calories != null && calories > 0) {
                            final meal = MealEntry(
                              id: DateTime.now().millisecondsSinceEpoch.toString(),
                              name: name,
                              type: selectedType,
                              calories: calories,
                              protein: protein,
                              carbs: carbs,
                              fat: fat,
                              dateLogged: date,
                            );
                            _addMeal(meal);
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('$name added to $selectedType'),
                                backgroundColor: Colors.green,
                              ),
                            );
                          } else {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Please enter valid name and calories'),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text('Add'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _WeekNavigationBar extends StatelessWidget {
  final DateTime selectedWeekStart;
  final VoidCallback onPrevious;
  final VoidCallback onNext;
  final VoidCallback onThisWeek;

  const _WeekNavigationBar({
    required this.selectedWeekStart,
    required this.onPrevious,
    required this.onNext,
    required this.onThisWeek,
  });

  @override
  Widget build(BuildContext context) {
    final weekEnd = selectedWeekStart.add(const Duration(days: 6));
    final dateFormat = DateFormat('MMM d');

    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Column(
        children: [
          const Text(
            'Weekly Food Log Overview',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              IconButton(
                onPressed: onPrevious,
                icon: const Icon(Icons.chevron_left),
                style: IconButton.styleFrom(
                  backgroundColor: Colors.grey[100],
                ),
              ),
              Expanded(
                child: TextButton(
                  onPressed: onThisWeek,
                  child: Text(
                    '${dateFormat.format(selectedWeekStart)} - ${dateFormat.format(weekEnd)}',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
              IconButton(
                onPressed: onNext,
                icon: const Icon(Icons.chevron_right),
                style: IconButton.styleFrom(
                  backgroundColor: Colors.grey[100],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _WeeklyCalorieChart extends StatelessWidget {
  final DateTime weekStart;
  final int Function(DateTime) getTotalCalories;
  final DateTime selectedDate;
  final Function(DateTime) onDayTapped;

  const _WeeklyCalorieChart({
    required this.weekStart,
    required this.getTotalCalories,
    required this.selectedDate,
    required this.onDayTapped,
  });

  @override
  Widget build(BuildContext context) {
    final List<DateTime> weekDays = List.generate(
      7,
      (index) => weekStart.add(Duration(days: index)),
    );

    final caloriesList = weekDays.map((day) => getTotalCalories(day)).toList();
    final maxCalories = caloriesList.isEmpty || caloriesList.every((c) => c == 0)
        ? 2000.0
        : caloriesList.reduce((a, b) => a > b ? a : b).toDouble();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Calorie Tracking',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 200,
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: maxCalories * 1.2,
                barTouchData: BarTouchData(
                  enabled: true,
                  touchCallback: (event, response) {
                    if (event is FlTapUpEvent && response != null && response.spot != null) {
                      final index = response.spot!.touchedBarGroupIndex;
                      onDayTapped(weekDays[index]);
                    }
                  },
                  touchTooltipData: BarTouchTooltipData(
                    tooltipBgColor: Colors.green[700]!,
                    getTooltipItem: (group, groupIndex, rod, rodIndex) {
                      final day = weekDays[groupIndex];
                      return BarTooltipItem(
                        '${DateFormat('EEE').format(day)}\n${rod.toY.toInt()} kcal',
                        const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      );
                    },
                  ),
                ),
                titlesData: FlTitlesData(
                  show: true,
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        if (value.toInt() >= 0 && value.toInt() < weekDays.length) {
                          final day = weekDays[value.toInt()];
                          final normalizedSelected = DateTime(selectedDate.year, selectedDate.month, selectedDate.day);
                          final normalizedDay = DateTime(day.year, day.month, day.day);
                          final isSelected = normalizedSelected.isAtSameMomentAs(normalizedDay);
                          return Padding(
                            padding: const EdgeInsets.only(top: 8.0),
                            child: Text(
                              DateFormat('E').format(day).substring(0, 1),
                              style: TextStyle(
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                fontSize: isSelected ? 14 : 12,
                                color: isSelected ? Colors.green[700] : Colors.grey[600],
                              ),
                            ),
                          );
                        }
                        return const Text('');
                      },
                    ),
                  ),
                  leftTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                ),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: maxCalories > 0 ? maxCalories / 4 : 500,
                  getDrawingHorizontalLine: (value) {
                    return FlLine(
                      color: Colors.grey[200],
                      strokeWidth: 1,
                    );
                  },
                ),
                borderData: FlBorderData(show: false),
                barGroups: weekDays.asMap().entries.map((entry) {
                  final index = entry.key;
                  final day = entry.value;
                  final calories = getTotalCalories(day).toDouble();
                  final normalizedSelected = DateTime(selectedDate.year, selectedDate.month, selectedDate.day);
                  final normalizedDay = DateTime(day.year, day.month, day.day);
                  final isSelected = normalizedSelected.isAtSameMomentAs(normalizedDay);

                  return BarChartGroupData(
                    x: index,
                    barRods: [
                      BarChartRodData(
                        toY: calories,
                        color: isSelected ? Colors.green[600] : Colors.green[300],
                        width: 20,
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(6),
                        ),
                      ),
                    ],
                  );
                }).toList(),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DailyMealsPanel extends StatelessWidget {
  final DateTime selectedDate;
  final List<MealEntry> meals;
  final VoidCallback onAddMeal;
  final Function(String) onDeleteMeal;
  final Function(DateTime) onDateChange;

  const _DailyMealsPanel({
    required this.selectedDate,
    required this.meals,
    required this.onAddMeal,
    required this.onDeleteMeal,
    required this.onDateChange,
  });

  @override
  Widget build(BuildContext context) {
    final totalCalories = meals.fold(0, (sum, meal) => sum + meal.calories);
    final totalProtein = meals.fold(0, (sum, meal) => sum + meal.protein);
    final totalCarbs = meals.fold(0, (sum, meal) => sum + meal.carbs);
    final totalFat = meals.fold(0, (sum, meal) => sum + meal.fat);

    final now = DateTime.now();
    final normalizedNow = DateTime(now.year, now.month, now.day);
    final normalizedSelected = DateTime(selectedDate.year, selectedDate.month, selectedDate.day);
    final isFuture = normalizedSelected.isAfter(normalizedNow);

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => onDateChange(selectedDate.subtract(const Duration(days: 1))),
                      icon: const Icon(Icons.chevron_left),
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.grey[100],
                      ),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            DateFormat('EEEE, MMM d').format(selectedDate),
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            isFuture ? 'Meal Plan' : 'Logged Meals',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => onDateChange(selectedDate.add(const Duration(days: 1))),
                      icon: const Icon(Icons.chevron_right),
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.grey[100],
                      ),
                    ),
                  ],
                ),
              ),
              ElevatedButton.icon(
                onPressed: onAddMeal,
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Add Meal'),
                style: ElevatedButton.styleFrom(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          if (meals.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(32.0),
                child: Column(
                  children: [
                    Icon(Icons.restaurant, size: 48, color: Colors.grey[300]),
                    const SizedBox(height: 12),
                    Text(
                      isFuture ? 'No meals planned yet' : 'No meals logged yet',
                      style: TextStyle(
                        color: Colors.grey[500],
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            Column(
              children: [
                ...meals.map((meal) => _MealListItem(
                      meal: meal,
                      onDelete: () => onDeleteMeal(meal.id),
                    )),
                const Divider(height: 32),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _NutrientSummary(
                      label: 'Calories',
                      value: '$totalCalories',
                      unit: 'kcal',
                      color: Colors.orange,
                    ),
                    _NutrientSummary(
                      label: 'Protein',
                      value: '$totalProtein',
                      unit: 'g',
                      color: Colors.blue,
                    ),
                    _NutrientSummary(
                      label: 'Carbs',
                      value: '$totalCarbs',
                      unit: 'g',
                      color: Colors.green,
                    ),
                    _NutrientSummary(
                      label: 'Fat',
                      value: '$totalFat',
                      unit: 'g',
                      color: Colors.purple,
                    ),
                  ],
                ),
              ],
            ),
        ],
      ),
    );
  }
}

class _MealListItem extends StatelessWidget {
  final MealEntry meal;
  final VoidCallback onDelete;

  const _MealListItem({
    required this.meal,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: Key(meal.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: Colors.red[400],
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      confirmDismiss: (direction) async {
        return await showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: const Text('Delete Meal'),
              content: Text('Remove ${meal.name}?'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.of(context).pop(true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                  ),
                  child: const Text('Delete'),
                ),
              ],
            );
          },
        );
      },
      onDismissed: (_) {
        onDelete();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${meal.name} removed')),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.grey[50],
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey[200]!),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: _getMealTypeColor(meal.type),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                _getMealTypeIcon(meal.type),
                color: Colors.white,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    meal.name,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    meal.type,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${meal.calories} kcal',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (meal.protein > 0 || meal.carbs > 0 || meal.fat > 0)
                  Text(
                    'P:${meal.protein}g C:${meal.carbs}g F:${meal.fat}g',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[600],
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Color _getMealTypeColor(String type) {
    switch (type) {
      case 'Breakfast':
        return Colors.orange[400]!;
      case 'Lunch':
        return Colors.blue[400]!;
      case 'Dinner':
        return Colors.purple[400]!;
      case 'Snack':
        return Colors.green[400]!;
      default:
        return Colors.grey[400]!;
    }
  }

  IconData _getMealTypeIcon(String type) {
    switch (type) {
      case 'Breakfast':
        return Icons.wb_sunny_outlined;
      case 'Lunch':
        return Icons.wb_sunny;
      case 'Dinner':
        return Icons.nightlight_outlined;
      case 'Snack':
        return Icons.cookie_outlined;
      default:
        return Icons.restaurant;
    }
  }
}

class _NutrientSummary extends StatelessWidget {
  final String label;
  final String value;
  final String unit;
  final Color color;

  const _NutrientSummary({
    required this.label,
    required this.value,
    required this.unit,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
        const SizedBox(height: 4),
        RichText(
          text: TextSpan(
            children: [
              TextSpan(
                text: value,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              TextSpan(
                text: ' $unit',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}