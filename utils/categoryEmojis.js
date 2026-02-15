// Central mapping for profile vibe categories (used in the Category picker + Discover browsing)

const DEFAULT_CATEGORY_EMOJI_MAP = {
  Gym: "💪",
  "Rock Climber": "🧗",
  Artist: "🎨",
  Biker: "🚴",
  Traveler: "✈️",
  Foodie: "🍜",
  Reader: "📚",
  Gamer: "🎮",
  Runner: "🏃",
  Yoga: "🧘",
  Skier: "⛷️",
  Surfer: "🏄",
  Musician: "🎸",
  "Dog Mom": "🐶",
  Coffee: "☕️",
};

let runtimeEmojiMap = { ...DEFAULT_CATEGORY_EMOJI_MAP };

export function setCategoryEmojiMapFromList(list) {
  // list: [{ name, emoji }]
  try {
    if (!Array.isArray(list)) {
      runtimeEmojiMap = { ...DEFAULT_CATEGORY_EMOJI_MAP };
      return;
    }

    const next = { ...DEFAULT_CATEGORY_EMOJI_MAP };

    for (const item of list) {
      const name = String(item?.name || "").trim();
      const emoji = String(item?.emoji || "").trim();
      if (!name) continue;
      if (!emoji) continue;
      next[name] = emoji;
    }

    runtimeEmojiMap = next;
  } catch (e) {
    console.error(e);
    runtimeEmojiMap = { ...DEFAULT_CATEGORY_EMOJI_MAP };
  }
}

export function getCategoryEmoji(category) {
  const key = String(category || "").trim();
  if (!key) return "";
  return runtimeEmojiMap[key] || "";
}

export function formatCategoryWithEmoji(category) {
  const label = String(category || "").trim();
  if (!label) return "";
  const emoji = getCategoryEmoji(label);
  return emoji ? `${emoji} ${label}` : label;
}
