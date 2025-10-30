import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'meal_logger.dart';
import 'macro_pie_chart.dart';
import 'meal_card.dart';
import 'food_log.dart';
import 'meal_scanner.dart';
import 'profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  int _calorieGoal = 2000;
  int _proteinGoal = 120;
  int _carbsGoal = 250;
  int _fatGoal = 65;

  int _caloriesConsumed = 0;
  int _proteinConsumed = 0;
  int _carbsConsumed = 0;
  int _fatConsumed = 0;

  List<Map<String, dynamic>> _breakfastItems = [];
  List<Map<String, dynamic>> _lunchItems = [];
  List<Map<String, dynamic>> _dinnerItems = [];
  List<Map<String, dynamic>> _snackItems = [];

  String _userName = "USER's NAME";

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final prefs = await SharedPreferences.getInstance();

    // Load goals and user name
    _userName = prefs.getString('userName') ?? "USER's NAME";
    _calorieGoal = prefs.getInt('calorieGoal') ?? 2000;
    _proteinGoal = prefs.getInt('proteinGoal') ?? 120;
    _carbsGoal = prefs.getInt('carbsGoal') ?? 250;
    _fatGoal = prefs.getInt('fatGoal') ?? 65;

    // Load from food log for today's date
    final mealsJson = prefs.getString('allMealEntries');
    if (mealsJson != null) {
      final List<dynamic> allMeals = json.decode(mealsJson);
      final today = DateTime.now();

      // Filter meals for today
      final todaysMeals = allMeals.where((meal) {
        final mealDate = DateTime.parse(meal['dateLogged']);
        return mealDate.year == today.year &&
            mealDate.month == today.month &&
            mealDate.day == today.day;
      }).toList();

      // Separate by meal type
      List<Map<String, dynamic>> breakfast = [];
      List<Map<String, dynamic>> lunch = [];
      List<Map<String, dynamic>> dinner = [];
      List<Map<String, dynamic>> snacks = [];

      int totalCalories = 0;
      int totalProtein = 0;
      int totalCarbs = 0;
      int totalFat = 0;

      for (var meal in todaysMeals) {
        final mealItem = {
          'name': meal['name'],
          'calories': meal['calories'],
          'protein': meal['protein'] ?? 0,
          'carbs': meal['carbs'] ?? 0,
          'fat': meal['fat'] ?? 0,
        };

        totalCalories += meal['calories'] as int;
        totalProtein += (meal['protein'] as int? ?? 0);
        totalCarbs += (meal['carbs'] as int? ?? 0);
        totalFat += (meal['fat'] as int? ?? 0);

        switch (meal['type']) {
          case 'Breakfast':
            breakfast.add(mealItem);
            break;
          case 'Lunch':
            lunch.add(mealItem);
            break;
          case 'Dinner':
            dinner.add(mealItem);
            break;
          case 'Snack':
            snacks.add(mealItem);
            break;
        }
      }

      setState(() {
        _breakfastItems = breakfast;
        _lunchItems = lunch;
        _dinnerItems = dinner;
        _snackItems = snacks;
        _caloriesConsumed = totalCalories;
        _proteinConsumed = totalProtein;
        _carbsConsumed = totalCarbs;
        _fatConsumed = totalFat;
      });
    } else {
      setState(() {
        _breakfastItems = [];
        _lunchItems = [];
        _dinnerItems = [];
        _snackItems = [];
        _caloriesConsumed = 0;
        _proteinConsumed = 0;
        _carbsConsumed = 0;
        _fatConsumed = 0;
      });
    }
  }

  Future<void> _saveData() async {
    // Data is now saved in food log format, this method kept for compatibility
    // Goals are saved separately in _updateGoals
  }

  void _onItemTapped(int index) {
    if (index == 1) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const FoodLogScreen()),
      ).then((_) => _loadData()); // Reload data when returning from food log
    } else if (index == 2) {
      // Camera tab - open camera scanner
      MealScanner.showScanMealDialog(context, DateTime.now(), _loadData);
    } else if (index == 3) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const ProfileScreen()),
      );
    } else {
      setState(() {
        _selectedIndex = index;
      });
    }
  }

  void _addMealItem(
    List<Map<String, dynamic>> mealList,
    String name,
    int calories,
    int protein,
    int carbs,
    int fat,
  ) async {
    // Determine meal type based on which list was passed
    String mealType = 'Snack';
    if (identical(mealList, _breakfastItems)) {
      mealType = 'Breakfast';
    } else if (identical(mealList, _lunchItems)) {
      mealType = 'Lunch';
    } else if (identical(mealList, _dinnerItems)) {
      mealType = 'Dinner';
    }

    setState(() {
      mealList.add({
        'name': name,
        'calories': calories,
        'protein': protein,
        'carbs': carbs,
        'fat': fat,
      });
      _caloriesConsumed += calories;
      _proteinConsumed += protein;
      _carbsConsumed += carbs;
      _fatConsumed += fat;
    });
    await _saveData();

    // Also save to food log
    await _saveToFoodLog(name, mealType, calories, protein, carbs, fat);
  }

  Future<void> _saveToFoodLog(
    String name,
    String type,
    int calories,
    int protein,
    int carbs,
    int fat,
  ) async {
    final prefs = await SharedPreferences.getInstance();
    final mealsJson = prefs.getString('allMealEntries');
    List<Map<String, dynamic>> allMeals = [];

    if (mealsJson != null) {
      allMeals = List<Map<String, dynamic>>.from(json.decode(mealsJson));
    }

    allMeals.add({
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'name': name,
      'type': type,
      'calories': calories,
      'protein': protein,
      'carbs': carbs,
      'fat': fat,
      'dateLogged': DateTime.now().toIso8601String(),
    });

    await prefs.setString('allMealEntries', json.encode(allMeals));
  }

  void _deleteMealItem(List<Map<String, dynamic>> mealList, int index) async {
    setState(() {
      final item = mealList[index];
      _caloriesConsumed -= item['calories'] as int;
      _proteinConsumed -= (item['protein'] as int? ?? 0);
      _carbsConsumed -= (item['carbs'] as int? ?? 0);
      _fatConsumed -= (item['fat'] as int? ?? 0);

      _caloriesConsumed = _caloriesConsumed.clamp(0, 100000);
      _proteinConsumed = _proteinConsumed.clamp(0, 10000);
      _carbsConsumed = _carbsConsumed.clamp(0, 10000);
      _fatConsumed = _fatConsumed.clamp(0, 10000);

      mealList.removeAt(index);
    });
    await _saveData();
  }

  void _updateGoals(int calories, int protein, int carbs, int fat) async {
    setState(() {
      _calorieGoal = calories;
      _proteinGoal = protein;
      _carbsGoal = carbs;
      _fatGoal = fat;
    });
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('calorieGoal', calories);
    await prefs.setInt('proteinGoal', protein);
    await prefs.setInt('carbsGoal', carbs);
    await prefs.setInt('fatGoal', fat);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _GreetingSection(userName: _userName),
              const SizedBox(height: 24),
              _CalorieOverviewSection(
                caloriesConsumed: _caloriesConsumed,
                caloriesGoal: _calorieGoal,
                proteinConsumed: _proteinConsumed,
                proteinGoal: _proteinGoal,
                carbsConsumed: _carbsConsumed,
                carbsGoal: _carbsGoal,
                fatConsumed: _fatConsumed,
                fatGoal: _fatGoal,
                onEditGoals: () {
                  MealLogger.showEditGoalsDialog(
                    context,
                    currentCalorieGoal: _calorieGoal,
                    currentProteinGoal: _proteinGoal,
                    currentCarbsGoal: _carbsGoal,
                    currentFatGoal: _fatGoal,
                    onSave: _updateGoals,
                  );
                },
              ),
              const SizedBox(height: 24),
              MacroPieChart(
                protein: _proteinConsumed,
                carbs: _carbsConsumed,
                fat: _fatConsumed,
              ),
              const SizedBox(height: 24),
              _DailyMealsSummarySection(
                breakfastItems: _breakfastItems,
                lunchItems: _lunchItems,
                dinnerItems: _dinnerItems,
                snackItems: _snackItems,
                onAddMeal: (mealType, mealList) {
                  MealLogger.showLogMealDialogEnhanced(context, mealType, (
                    name,
                    calories,
                    protein,
                    carbs,
                    fat,
                  ) {
                    _addMealItem(mealList, name, calories, protein, carbs, fat);
                  });
                },
                onDeleteItem: _deleteMealItem,
              ),
              const SizedBox(height: 24),
              const _TipsSection(),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Colors.green[700],
        unselectedItemColor: Colors.grey[600],
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(
            icon: Icon(Icons.restaurant_menu),
            label: 'Food Log',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.camera_alt),
            label: 'Scan Meal',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}

class _GreetingSection extends StatelessWidget {
  final String userName;

  const _GreetingSection({required this.userName});

  @override
  Widget build(BuildContext context) {
    final hour = DateTime.now().hour;
    String greeting = 'Good morning';
    if (hour >= 12 && hour < 17) {
      greeting = 'Good afternoon';
    } else if (hour >= 17) {
      greeting = 'Good evening';
    }

    return Row(
      children: [
        CircleAvatar(
          radius: 28,
          backgroundColor: Colors.green[100],
          child: Icon(Icons.person, size: 32, color: Colors.green[700]),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$greeting, $userName 👋',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                "Here's your nutrition summary for today.",
                style: TextStyle(fontSize: 14, color: Colors.grey[600]),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _CalorieOverviewSection extends StatelessWidget {
  final int caloriesConsumed;
  final int caloriesGoal;
  final int proteinConsumed;
  final int proteinGoal;
  final int carbsConsumed;
  final int carbsGoal;
  final int fatConsumed;
  final int fatGoal;
  final VoidCallback onEditGoals;

  const _CalorieOverviewSection({
    required this.caloriesConsumed,
    required this.caloriesGoal,
    required this.proteinConsumed,
    required this.proteinGoal,
    required this.carbsConsumed,
    required this.carbsGoal,
    required this.fatConsumed,
    required this.fatGoal,
    required this.onEditGoals,
  });

  @override
  Widget build(BuildContext context) {
    final progress = caloriesConsumed / caloriesGoal;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Daily Overview',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  icon: const Icon(Icons.settings, size: 20),
                  onPressed: onEditGoals,
                  tooltip: 'Edit Goals',
                ),
              ],
            ),
            const SizedBox(height: 16),
            Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 160,
                  height: 160,
                  child: CircularProgressIndicator(
                    value: progress > 1 ? 1 : progress,
                    strokeWidth: 12,
                    backgroundColor: Colors.grey[200],
                    valueColor: AlwaysStoppedAnimation<Color>(
                      progress > 1 ? Colors.red[600]! : Colors.green[600]!,
                    ),
                  ),
                ),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '$caloriesConsumed',
                      style: TextStyle(
                        fontSize: 36,
                        fontWeight: FontWeight.bold,
                        color: Colors.green[700],
                      ),
                    ),
                    Text(
                      'of $caloriesGoal kcal',
                      style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _MacroIndicator(
                  label: 'Protein',
                  current: proteinConsumed,
                  goal: proteinGoal,
                  color: Colors.blue[400]!,
                ),
                _MacroIndicator(
                  label: 'Carbs',
                  current: carbsConsumed,
                  goal: carbsGoal,
                  color: Colors.orange[400]!,
                ),
                _MacroIndicator(
                  label: 'Fat',
                  current: fatConsumed,
                  goal: fatGoal,
                  color: Colors.purple[400]!,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MacroIndicator extends StatelessWidget {
  final String label;
  final int current;
  final int goal;
  final Color color;

  const _MacroIndicator({
    required this.label,
    required this.current,
    required this.goal,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          width: 50,
          height: 50,
          child: Stack(
            children: [
              CircularProgressIndicator(
                value: current / goal > 1 ? 1 : current / goal,
                strokeWidth: 5,
                backgroundColor: Colors.grey[200],
                valueColor: AlwaysStoppedAnimation<Color>(color),
              ),
              Center(
                child: Text(
                  '${((current / goal) * 100).toInt()}%',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[700],
            fontWeight: FontWeight.w500,
          ),
        ),
        Text(
          '$current/$goal g',
          style: TextStyle(fontSize: 11, color: Colors.grey[500]),
        ),
      ],
    );
  }
}

class _DailyMealsSummarySection extends StatelessWidget {
  final List<Map<String, dynamic>> breakfastItems;
  final List<Map<String, dynamic>> lunchItems;
  final List<Map<String, dynamic>> dinnerItems;
  final List<Map<String, dynamic>> snackItems;
  final Function(String, List<Map<String, dynamic>>) onAddMeal;
  final Function(List<Map<String, dynamic>>, int) onDeleteItem;

  const _DailyMealsSummarySection({
    required this.breakfastItems,
    required this.lunchItems,
    required this.dinnerItems,
    required this.snackItems,
    required this.onAddMeal,
    required this.onDeleteItem,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Today\'s Meals',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 12),
        MealCard(
          mealType: 'Breakfast',
          items: breakfastItems,
          icon: Icons.wb_sunny_outlined,
          onAdd: () => onAddMeal('Breakfast', breakfastItems),
          onDelete: (index) => onDeleteItem(breakfastItems, index),
        ),
        const SizedBox(height: 8),
        MealCard(
          mealType: 'Lunch',
          items: lunchItems,
          icon: Icons.wb_sunny,
          onAdd: () => onAddMeal('Lunch', lunchItems),
          onDelete: (index) => onDeleteItem(lunchItems, index),
        ),
        const SizedBox(height: 8),
        MealCard(
          mealType: 'Dinner',
          items: dinnerItems,
          icon: Icons.nightlight_outlined,
          onAdd: () => onAddMeal('Dinner', dinnerItems),
          onDelete: (index) => onDeleteItem(dinnerItems, index),
        ),
        const SizedBox(height: 8),
        MealCard(
          mealType: 'Snacks',
          items: snackItems,
          icon: Icons.cookie_outlined,
          onAdd: () => onAddMeal('Snacks', snackItems),
          onDelete: (index) => onDeleteItem(snackItems, index),
        ),
      ],
    );
  }
}

class _TipsSection extends StatelessWidget {
  const _TipsSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Tips & Recommendations',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 140,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              _TipCard(
                icon: Icons.local_fire_department,
                title: 'Stay on Track',
                description: 'Log your meals regularly to meet your goals.',
                color: Colors.red[400]!,
              ),
              _TipCard(
                icon: Icons.restaurant,
                title: 'Balanced Diet',
                description: 'Try to balance your macros throughout the day.',
                color: Colors.blue[400]!,
              ),
              _TipCard(
                icon: Icons.lightbulb_outline,
                title: 'Pro Tip',
                description:
                    'Meal prep on Sundays to save time during the week.',
                color: Colors.amber[600]!,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _TipCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final Color color;

  const _TipCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 200,
      margin: const EdgeInsets.only(right: 12),
      child: Card(
        elevation: 1,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: color, size: 28),
              const SizedBox(height: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                description,
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
