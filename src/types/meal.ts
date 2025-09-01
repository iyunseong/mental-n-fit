// src/types/meal.ts

/** 식사 분류(스키마 CHECK와 일치) */
export type MealType = '아침' | '점심' | '저녁' | '간식';

/** 폼에서 넘어오는 한 개 음식 항목 */
export type MealItemInput = {
  /** food_db.id (DB 검색으로 추가한 경우에만 존재) */
  id?: number;

  /** 사용자에게 보여줄 이름(커스텀 명 또는 DB 이름) */
  name: string;

  /** 섭취량(g). 자동계산/수동입력 모두에서 서버가 필요로 함 */
  quantity_g?: number;

  /** 최종 저장할 영양성분(g) — 폼에서 이미 계산했으면 채워서 보냄 */
  carb_g?: number;
  protein_g?: number;
  fat_g?: number;
  fiber_g?: number;
};

/** 식사 폼 전체 페이로드 */
export type MealForm = {
  /** YYYY-MM-DD */
  date: string;

  /** HH:mm (선택). 없으면 00:00으로 간주 */
  time?: string;

  /** 식사 분류(선택). 스키마에 컬럼이 있으면 저장됨 */
  meal_type?: MealType;

  /** 항목 배열 */
  items: MealItemInput[];

  /** 선택 메타 */
  notes?: string;
  hunger_level?: 'low' | 'medium' | 'high' | 'not_hungry';
  mood_before?: 'fresh' | 'calm' | 'tired' | 'anxious';
};
