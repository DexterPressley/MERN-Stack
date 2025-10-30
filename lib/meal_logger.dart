import 'package:flutter/material.dart';

class MealLogger {
  static void showLogMealDialog(
    BuildContext context,
    String mealType,
    Function(String foodName, int calories) onAdd,
  ) {
    final foodController = TextEditingController();
    final calorieController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Log $mealType'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: foodController,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(
                labelText: 'Food Name',
                prefixIcon: Icon(Icons.restaurant),
                hintText: 'e.g., Grilled Chicken',
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: calorieController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Calories',
                prefixIcon: Icon(Icons.local_fire_department),
                hintText: 'e.g., 250',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final foodName = foodController.text.trim();
              final calories = int.tryParse(calorieController.text);

              if (foodName.isNotEmpty && calories != null && calories > 0) {
                onAdd(foodName, calories);
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('$foodName added to $mealType'),
                    backgroundColor: Colors.green,
                    duration: const Duration(seconds: 2),
                  ),
                );
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Please enter valid food name and calories'),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }

  static void showLogMealDialogEnhanced(
    BuildContext context,
    String mealType,
    Function(String foodName, int calories, int protein, int carbs, int fat) onAdd,
  ) {
    final nameController = TextEditingController();
    final caloriesController = TextEditingController();
    final proteinController = TextEditingController();
    final carbsController = TextEditingController();
    final fatController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
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
                'Log $mealType',
                style: const TextStyle(
                  fontSize: 24,
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
                          onAdd(name, calories, protein, carbs, fat);
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('$name added to $mealType'),
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
    );
  }

  static void showEditGoalsDialog(
    BuildContext context, {
    required int currentCalorieGoal,
    required int currentProteinGoal,
    required int currentCarbsGoal,
    required int currentFatGoal,
    required Function(int calories, int protein, int carbs, int fat) onSave,
  }) {
    final calorieController = TextEditingController(text: currentCalorieGoal.toString());
    final proteinController = TextEditingController(text: currentProteinGoal.toString());
    final carbsController = TextEditingController(text: currentCarbsGoal.toString());
    final fatController = TextEditingController(text: currentFatGoal.toString());

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Edit Daily Goals'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: calorieController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Calorie Goal (kcal)',
                  prefixIcon: Icon(Icons.local_fire_department),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: proteinController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Protein Goal (g)',
                  prefixIcon: Icon(Icons.egg),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: carbsController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Carbs Goal (g)',
                  prefixIcon: Icon(Icons.grain),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: fatController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Fat Goal (g)',
                  prefixIcon: Icon(Icons.water_drop),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final calories = int.tryParse(calorieController.text) ?? currentCalorieGoal;
              final protein = int.tryParse(proteinController.text) ?? currentProteinGoal;
              final carbs = int.tryParse(carbsController.text) ?? currentCarbsGoal;
              final fat = int.tryParse(fatController.text) ?? currentFatGoal;

              onSave(calories, protein, carbs, fat);
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Goals updated successfully!'),
                  backgroundColor: Colors.green,
                ),
              );
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}