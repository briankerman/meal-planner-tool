/**
 * Test script to validate meal prep generation
 * Run with: node test-meal-prep-generation.js
 *
 * This tests that:
 * 1. Breakfast/lunch generate correct number of unique recipes
 * 2. Recipes are distributed across all 7 days
 * 3. Meal prep recipes have appropriate tags and storage instructions
 */

// Sample preferences for testing
const testPreferences = {
  num_adults: 2,
  num_children: 2,
  child_age_ranges: ['Kid (4-12)'],
  dinner_days_per_week: 5,
  breakfast_enabled: true,
  lunch_enabled: true,
  breakfast_days_per_week: 3,
  lunch_days_per_week: 3,
  shopping_day: 'Sunday',
  plans_leftovers: true,
  cuisine_preferences: ['Italian', 'Mexican', 'American'],
  meal_style_preferences: ['Quick (30 min)', 'One-pan'],
  allergies: ['Nuts'],
  staple_meals: ['Spaghetti', 'Tacos'],
  weekly_context: 'Need quick meals on Wednesday and Thursday'
};

async function testMealPrepGeneration() {
  console.log('🧪 Testing Meal Prep Generation\n');
  console.log('Test Preferences:', JSON.stringify(testPreferences, null, 2));
  console.log('\n---\n');

  try {
    const response = await fetch('http://localhost:3000/api/generate-meal-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPreferences),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ API Error:', error);
      return;
    }

    const data = await response.json();
    console.log('✅ Received meal plan with', data.meals.length, 'meals\n');

    // Analyze the results
    const mealsByType = {
      breakfast: [],
      lunch: [],
      dinner: []
    };

    data.meals.forEach(meal => {
      const type = meal.mealType || 'dinner';
      mealsByType[type].push(meal);
    });

    console.log('📊 Meal Breakdown:');
    console.log('  Breakfasts:', mealsByType.breakfast.length, '(expected:', testPreferences.breakfast_days_per_week, 'unique recipes across 7 days)');
    console.log('  Lunches:', mealsByType.lunch.length, '(expected:', testPreferences.lunch_days_per_week, 'unique recipes across 7 days)');
    console.log('  Dinners:', mealsByType.dinner.length, '(expected:', testPreferences.dinner_days_per_week, ')');
    console.log('\n---\n');

    // Check breakfast recipes
    if (mealsByType.breakfast.length > 0) {
      console.log('🍳 Breakfast Recipes:');
      const uniqueBreakfasts = new Set(mealsByType.breakfast.map(m => m.name));
      console.log('  Unique recipes:', uniqueBreakfasts.size);

      mealsByType.breakfast.forEach((meal, idx) => {
        console.log('\n  ' + (idx + 1) + '. ' + meal.name + ' (' + meal.day + ')');
        console.log('     Tags:', meal.tags ? meal.tags.join(', ') : 'none');
        const hasMealPrepTag = meal.tags && meal.tags.includes('meal-prep');
        const hasStorageInstructions = meal.instructions && meal.instructions.some(i =>
          i.toLowerCase().includes('store') ||
          i.toLowerCase().includes('refrigerate') ||
          i.toLowerCase().includes('freeze')
        );
        console.log('     ✓ Meal prep tag:', hasMealPrepTag ? '✅' : '❌');
        console.log('     ✓ Storage instructions:', hasStorageInstructions ? '✅' : '❌');
      });

      var uniqueBreakfastsCount = uniqueBreakfasts.size;
    }

    // Check lunch recipes
    if (mealsByType.lunch.length > 0) {
      console.log('\n\n🥗 Lunch Recipes:');
      const uniqueLunches = new Set(mealsByType.lunch.map(m => m.name));
      console.log('  Unique recipes:', uniqueLunches.size);

      mealsByType.lunch.forEach((meal, idx) => {
        console.log('\n  ' + (idx + 1) + '. ' + meal.name + ' (' + meal.day + ')');
        console.log('     Tags:', meal.tags ? meal.tags.join(', ') : 'none');
        const hasMealPrepTag = meal.tags && meal.tags.includes('meal-prep');
        console.log('     ✓ Meal prep tag:', hasMealPrepTag ? '✅' : '❌');
      });

      var uniqueLunchesCount = uniqueLunches.size;
    }

    // Check dinner recipes
    if (mealsByType.dinner.length > 0) {
      console.log('\n\n🍽️  Dinner Recipes:');
      mealsByType.dinner.forEach((meal, idx) => {
        console.log('  ' + (idx + 1) + '. ' + meal.name + ' (' + meal.day + ')');
      });
    }

    console.log('\n---\n');
    console.log('✅ Test Complete!');
    console.log('\nValidation Checklist:');
    console.log('  ✓ Breakfast unique recipes match requested:', uniqueBreakfastsCount === testPreferences.breakfast_days_per_week ? '✅ PASS' : '❌ FAIL');
    console.log('  ✓ Lunch unique recipes match requested:', uniqueLunchesCount === testPreferences.lunch_days_per_week ? '✅ PASS' : '❌ FAIL');
    console.log('  ✓ Breakfasts assigned to all 7 days:', mealsByType.breakfast.length === 7 ? '✅ PASS' : '❌ FAIL');
    console.log('  ✓ Lunches assigned to all 7 days:', mealsByType.lunch.length === 7 ? '✅ PASS' : '❌ FAIL');
    console.log('  ✓ Dinners match requested days:', mealsByType.dinner.length === testPreferences.dinner_days_per_week ? '✅ PASS' : '❌ FAIL');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testMealPrepGeneration();
