import {
  Drumstick, Beef, Ham, Fish, Shrimp,
  Soup, Salad, Pizza, Sandwich, Hamburger,
  Egg, EggFried, Milk, Carrot, LeafyGreen,
  Apple, Cherry, Grape, Wheat, Cookie,
  Cake, IceCreamCone, Coffee, Beer, Wine,
  GlassWater, CupSoda, Leaf, Nut,
  UtensilsCrossed,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function getFoodIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (/chicken|poultry|hen|drumstick/.test(n)) return Drumstick;
  if (/beef|steak|mince|meatball/.test(n)) return Beef;
  if (/pork|bacon|ham|sausage/.test(n)) return Ham;
  if (/lamb|mutton/.test(n)) return Beef;
  if (/prawn|shrimp|seafood/.test(n)) return Shrimp;
  if (/fish|salmon|tuna|cod/.test(n)) return Fish;
  if (/soup|stew|broth|stock/.test(n)) return Soup;
  if (/salad/.test(n)) return Salad;
  if (/pizza/.test(n)) return Pizza;
  if (/sandwich|wrap|sub/.test(n)) return Sandwich;
  if (/burger/.test(n)) return Hamburger;
  if (/fried egg/.test(n)) return EggFried;
  if (/egg/.test(n)) return Egg;
  if (/milk|cream|yogurt|yoghurt|dairy/.test(n)) return Milk;
  if (/carrot|veggie|vegetable|broccoli|spinach|pea|peas/.test(n)) return Carrot;
  if (/lettuce|kale|leafy|greens/.test(n)) return LeafyGreen;
  if (/herb|basil|mint|parsley|coriander/.test(n)) return Leaf;
  if (/apple|fruit|orange|banana|berry|mango/.test(n)) return Apple;
  if (/cherry/.test(n)) return Cherry;
  if (/grape|raisin/.test(n)) return Grape;
  if (/pasta|bread|rice|wheat|grain|flour|noodle|cereal/.test(n)) return Wheat;
  if (/nut|almond|cashew|walnut|peanut/.test(n)) return Nut;
  if (/cookie|biscuit/.test(n)) return Cookie;
  if (/cake|dessert|pudding|donut/.test(n)) return Cake;
  if (/ice cream/.test(n)) return IceCreamCone;
  if (/coffee|tea|espresso|latte/.test(n)) return Coffee;
  if (/beer|ale|lager/.test(n)) return Beer;
  if (/wine|champagne|prosecco/.test(n)) return Wine;
  if (/water/.test(n)) return GlassWater;
  if (/juice|soda|drink|squash/.test(n)) return CupSoda;
  return UtensilsCrossed;
}

// kept for QrItemScreen large display
export function foodEmoji(name: string): string {
  const n = name.toLowerCase();
  if (/chicken|poultry|hen/.test(n)) return '🍗';
  if (/beef|steak|mince|meatball/.test(n)) return '🥩';
  if (/pork|bacon|ham|sausage/.test(n)) return '🥓';
  if (/lamb|mutton/.test(n)) return '🍖';
  if (/fish|salmon|tuna|cod|prawn|shrimp|seafood/.test(n)) return '🐟';
  if (/pasta|spaghetti|noodle|macaroni|lasagne|lasagna/.test(n)) return '🍝';
  if (/rice|fried rice|pilaf/.test(n)) return '🍚';
  if (/soup|stew|broth/.test(n)) return '🍲';
  if (/salad/.test(n)) return '🥗';
  if (/pizza/.test(n)) return '🍕';
  if (/burger|sandwich|wrap/.test(n)) return '🍔';
  if (/curry/.test(n)) return '🍛';
  if (/taco|burrito|mexican/.test(n)) return '🌮';
  if (/cake|dessert|pudding|cookie|biscuit/.test(n)) return '🍰';
  if (/bread|toast|roll|bun/.test(n)) return '🍞';
  if (/egg/.test(n)) return '🥚';
  if (/cheese/.test(n)) return '🧀';
  if (/milk|cream|yogurt|yoghurt/.test(n)) return '🥛';
  if (/butter/.test(n)) return '🧈';
  if (/veggie|vegetable|veg|carrot|broccoli|spinach|pea/.test(n)) return '🥦';
  if (/fruit|apple|orange|banana|berry/.test(n)) return '🍎';
  if (/lime|lemon/.test(n)) return '🍋';
  if (/potato|chips|fries/.test(n)) return '🥔';
  if (/mushroom/.test(n)) return '🍄';
  if (/corn/.test(n)) return '🌽';
  if (/stock|broth/.test(n)) return '🫙';
  if (/juice|drink|water|soda/.test(n)) return '🥤';
  if (/wine|beer|alcohol/.test(n)) return '🍷';
  return '🥡';
}
