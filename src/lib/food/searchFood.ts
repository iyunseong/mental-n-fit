// /lib/food/searchFood.ts
import { supabase } from '@/lib/supabase';

export type FoodSearchResult = {
  id: number;
  name: string;
  carb_g: number | null;
  protein_g: number | null;
  fat_g: number | null;
  calories_per_100g?: number | null;
  brand?: string | null;
  category?: string | null;
};

export async function searchFood(q: string): Promise<FoodSearchResult[]> {
  const { data, error } = await supabase
    .from('food_search')
    .select(`
      id,
      name,
      carb_g,
      protein_g,
      fat_g,
      calories_per_100g,
      brand,
      category
    `)
    .ilike('name', `%${q}%`)
    .limit(50);

  if (error) {
    console.error('searchFood error:', error);
    return [];
  }
  // real 타입은 JS number로 오므로 추가 변환 불필요
  return (data ?? []) as FoodSearchResult[];
}
