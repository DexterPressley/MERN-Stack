import 'package:flutter/material.dart';

class MealCard extends StatelessWidget {
  final String mealType;
  final List<Map<String, dynamic>> items;
  final IconData icon;
  final VoidCallback onAdd;
  final Function(int) onDelete;

  const MealCard({
    super.key,
    required this.mealType,
    required this.items,
    required this.icon,
    required this.onAdd,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final totalCalories = items.fold<int>(
      0,
      (sum, item) => sum + (item['calories'] as int),
    );

    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Column(
        children: [
          // Header section
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.green[50],
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: Colors.green[700], size: 24),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        mealType,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        items.isEmpty
                            ? 'Not logged yet'
                            : '${items.length} item(s) – $totalCalories kcal',
                        style: TextStyle(
                          fontSize: 13,
                          color: items.isEmpty ? Colors.grey[400] : Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                TextButton.icon(
                  onPressed: onAdd,
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Add'),
                ),
              ],
            ),
          ),
          // List of items
          if (items.isNotEmpty)
            ...items.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              return Dismissible(
                key: Key('${mealType}_${item['name']}_$index'),
                direction: DismissDirection.endToStart,
                background: Container(
                  color: Colors.red[400],
                  alignment: Alignment.centerRight,
                  padding: const EdgeInsets.only(right: 20),
                  child: const Icon(Icons.delete, color: Colors.white),
                ),
                confirmDismiss: (direction) async {
                  return await showDialog(
                    context: context,
                    builder: (BuildContext context) {
                      return AlertDialog(
                        title: const Text('Delete Item'),
                        content: Text('Remove ${item['name']} from $mealType?'),
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
                  onDelete(index);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('${item['name']} removed'),
                      action: SnackBarAction(
                        label: 'Undo',
                        onPressed: () {
                          // In a real app, you'd implement undo functionality here
                        },
                      ),
                    ),
                  );
                },
                child: Container(
                  decoration: BoxDecoration(
                    border: Border(
                      top: BorderSide(color: Colors.grey[200]!),
                    ),
                  ),
                  child: ListTile(
                    dense: true,
                    leading: Icon(
                      Icons.drag_handle,
                      color: Colors.grey[400],
                      size: 20,
                    ),
                    title: Text(
                      item['name'],
                      style: const TextStyle(fontSize: 14),
                    ),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${item['calories']} kcal',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Icon(
                          Icons.chevron_left,
                          color: Colors.grey[300],
                          size: 20,
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }
}