export const INTEREST_MAX_SELECTED = 12;

export const INTEREST_CATEGORIES = [
  {
    key: "creative_culture",
    title: "Creative & Culture",
    emoji: "🎨",
    options: [
      "Art",
      "Music",
      "Live music",
      "Concerts",
      "Film",
      "Movies",
      "Theater",
      "Museums",
      "Photography",
      "Writing",
      "Fashion",
      "Fandoms",
    ],
  },
  {
    key: "food_drink",
    title: "Food & Drink",
    emoji: "🍸",
    options: [
      "Coffee",
      "Brunch",
      "Cooking",
      "Baking",
      "Restaurants",
      "Foodie",
      "Wine",
      "Craft beer",
      "Cocktails",
    ],
  },
  {
    key: "health_fitness",
    title: "Health & Fitness",
    emoji: "💪",
    options: [
      "Gym",
      "Sports",
      "Running",
      "Yoga",
      "Pilates",
      "Cycling",
      "Wellness",
      "Meditation",
      "Routines",
    ],
  },
  {
    key: "social_going_out",
    title: "Social & Going Out",
    emoji: "🥂",
    options: [
      "Bars",
      "Nightlife",
      "Events",
      "Festivals",
      "Happy hour",
      "Live shows",
      "Dancing",
      "Plans",
    ],
  },
  {
    key: "home_downtime",
    title: "Home & Downtime",
    emoji: "🛋️",
    options: [
      "Cozy nights",
      "Staying in",
      "Chill time",
      "Reading",
      "Podcasts",
      "TV",
      "Cooking at home",
      "Self-care",
    ],
  },
  {
    key: "travel_adventure",
    title: "Travel & Adventure",
    emoji: "✈️",
    options: [
      "Travel",
      "Road trips",
      "Exploring",
      "Nature",
      "Hiking",
      "Beach",
      "Camping",
      "Skiing",
    ],
  },
  {
    key: "entertainment_games",
    title: "Entertainment & Games",
    emoji: "🎮",
    options: [
      "TV",
      "Movies",
      "Gaming",
      "Board games",
      "Trivia",
      "Comedy",
      "Casual fun",
    ],
  },
  {
    key: "values_lifestyle",
    title: "Values & Lifestyle",
    emoji: "🌿",
    options: [
      "Beliefs",
      "Causes",
      "Volunteering",
      "Sustainability",
      "How you live",
      "Mindfulness",
      "Entrepreneurship",
      "Personal growth",
    ],
  },
];

export function getAllInterestOptions() {
  const all = [];
  for (const cat of INTEREST_CATEGORIES) {
    for (const opt of cat.options) {
      all.push(opt);
    }
  }
  return Array.from(new Set(all));
}
