// Auto-translation dictionary and helper for categories and products

export const categoryTranslations: Record<string, Record<string, string>> = {
  en: {
    "Starters": "Starters",
    "Main Courses": "Main Courses",
    "Pizzas": "Pizzas",
    "Desserts": "Desserts",
    "Drinks": "Drinks",
    "Beverages": "Beverages",
    "Salads": "Salads",
    "Burgers": "Burgers",
    "Pasta": "Pasta",
    "Sides": "Sides",
    "Coffee & Tea": "Coffee & Tea",
    "Appetizers": "Appetizers"
  },
  fr: {
    "Starters": "Entrées",
    "Main Courses": "Plats Principaux",
    "Pizzas": "Pizzas",
    "Desserts": "Desserts",
    "Drinks": "Boissons",
    "Beverages": "Boissons",
    "Salads": "Salades",
    "Burgers": "Burgers",
    "Pasta": "Pâtes",
    "Sides": "Accompagnements",
    "Coffee & Tea": "Café & Thé",
    "Appetizers": "Entrées"
  },
  ar: {
    "Starters": "المقبلات",
    "Main Courses": "الأطباق الرئيسية",
    "Pizzas": "البيتزا",
    "Desserts": "الحلويات",
    "Drinks": "المشروبات",
    "Beverages": "المشروبات",
    "Salads": "السلطات",
    "Burgers": "البرجر",
    "Pasta": "المكرونة",
    "Sides": "الأطباق الجانبية",
    "Coffee & Tea": "القهوة والشاي",
    "Appetizers": "المقبلات"
  }
};

export const productTranslations: Record<string, Record<string, { name: string; description: string }>> = {
  en: {
    "prod-1": { name: "Bruschetta Classica", description: "Toasted bread with tomatoes, garlic, basil, and extra virgin olive oil." },
    "prod-2": { name: "Calamari Fritti", description: "Crispy fried squid served with a side of spicy marinara sauce." },
    "prod-3": { name: "Lasagna alla Bolognese", description: "Layered pasta with slow-cooked beef ragu, béchamel sauce, and parmesan." },
    "prod-4": { name: "Margherita Pizza", description: "The classic with tomato sauce, fresh mozzarella, basil, and olive oil." },
    "prod-5": { name: "Quattro Formaggi", description: "Mozzarella, gorgonzola, parmesan, and fontina cheeses." },
    "prod-6": { name: "Tiramisu", description: "Classic Italian dessert with ladyfingers, espresso, and mascarpone cream." },
    "prod-7": { name: "Chianti Classico", description: "Bottle of fine Tuscan red wine." }
  },
  fr: {
    "prod-1": { name: "Bruschetta Classica", description: "Pain grillé aux tomates, ail, basilic et huile d'olive extra vierge." },
    "prod-2": { name: "Calamars Frits", description: "Calamars frits croustillants servis avec une sauce marinara épicée." },
    "prod-3": { name: "Lasagnes à la Bolognaise", description: "Pâtes en couches avec ragoût de bœuf mijoté, sauce béchamel et parmesan." },
    "prod-4": { name: "Pizza Margherita", description: "Le classique avec sauce tomate, mozzarella fraîche, basilic et huile d'olive." },
    "prod-5": { name: "Quattro Formaggi", description: "Fromages mozzarella, gorgonzola, parmesan et fontina." },
    "prod-6": { name: "Tiramisu", description: "Dessert italien classique avec biscuits à la cuillère, espresso et crème mascarpone." },
    "prod-7": { name: "Chianti Classico", description: "Bouteille de vin rouge fin de Toscane." }
  },
  ar: {
    "prod-1": { name: "بروشيتا كلاسيكا", description: "خبز محمص مع الطماطم والثوم والريحان وزيت الزيتون البكر الممتاز." },
    "prod-2": { name: "كالاماري مقلي", description: "حبار مقرمش مقلي يقدم مع صلصة مارينارا حارة." },
    "prod-3": { name: "لازانيا بولونيز", description: "مكرونة طبقات مع صوص لحم بقرى مطهو ببطء وصوص البشاميل والجبن البارميزان." },
    "prod-4": { name: "بيتزا مارغريتا", description: "الكلاسيكية مع صلصة الطماطم وجبن الموزاريلا الطازج والريحان وزيت الزيتون." },
    "prod-5": { name: "أربع أجبان", description: "أجبان الموزاريلا، غورغونزولا، بارميزان وفونتينا." },
    "prod-6": { name: "تيراميسو", description: "حلوى إيطالية كلاسيكية مع أصابع الستير، إسبريسو وكرات الكريم ماسكاربوني." },
    "prod-7": { name: "كيانتي كلاسيكو", description: "زجاجة نبيذ أحمر توسكاني فاخر." }
  }
};

export function translateCategoryName(category: any, lang: string): string {
  if (!category) return '';
  if (typeof category === 'string') {
    const langMap = categoryTranslations[lang] || categoryTranslations['en'];
    return langMap[category] || category;
  }
  
  let catName = '';
  // Prioritize the requested language field
  if (lang === 'fr') {
    catName = category.name_fr;
  } else if (lang === 'ar') {
    catName = category.name_ar;
  } else {
    catName = category.name_en || category.name;
  }

  // If the specific field is missing, try the dictionary lookup on the base name
  if (!catName && category.name) {
    const langMap = categoryTranslations[lang];
    if (langMap) {
      catName = langMap[category.name];
    }
  }

  // Final fallback to the base name if no translation was found
  return catName || category.name || '';
}

export function translateRestaurantDescription(restaurant: any, lang: string): string {
  if (!restaurant) return '';
  if (lang === 'fr') {
    return restaurant.description_fr || restaurant.description || '';
  } else if (lang === 'ar') {
    return restaurant.description_ar || restaurant.description || '';
  }
  return restaurant.description_en || restaurant.description || '';
}

export function translateProduct(product: any, lang: string): { name: string; description: string } {
  if (!product) return { name: '', description: '' };
  
  let name = '';
  let description = '';

  // Prioritize specific language fields
  if (lang === 'fr') {
    name = product.name_fr;
    description = product.description_fr;
  } else if (lang === 'ar') {
    name = product.name_ar;
    description = product.description_ar;
  } else {
    name = product.name_en;
    description = product.description_en;
  }

  // If name is still missing, try dictionary lookup for the product ID
  if (!name && product.id) {
    const prodMap = productTranslations[lang];
    if (prodMap && prodMap[product.id]) {
      name = prodMap[product.id].name;
      description = prodMap[product.id].description;
    }
  }

  // Fallback to base fields only if we have nothing else
  if (!name) name = product.name || '';
  if (!description) description = product.description || '';

  return { name, description };
}
