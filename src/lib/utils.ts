// src/lib/utils.ts
import { SurveyResponse, Recommendation } from './types';
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

const MAX_SCORE = 10;
const PHYSICAL_HEALTH_FACTORS = 4;
const MENTAL_HEALTH_FACTORS = 4;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const calculateHealthScore = (
  physicalHealth: SurveyResponse['physicalHealth'],
  mentalHealth: SurveyResponse['mentalHealth']
): number => {
  if (!physicalHealth || !mentalHealth) {
    return 0;
  }

  const physicalScore =
    (physicalHealth.sleepQuality +
      physicalHealth.exerciseFrequency +
      physicalHealth.dietQuality +
      (MAX_SCORE - physicalHealth.stressLevel)) /
    PHYSICAL_HEALTH_FACTORS;

  const mentalScore =
    (mentalHealth.mood +
      (MAX_SCORE - mentalHealth.anxiety) +
      mentalHealth.energy +
      mentalHealth.socialSupport) /
    MENTAL_HEALTH_FACTORS;

  const finalScore = (physicalScore + mentalScore) / 2;
  
  // 0~10 범위로 제한
  return Math.max(0, Math.min(MAX_SCORE, finalScore));
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export const getRecommendationType = (type: Recommendation['type']): string => {
  const types = {
    diet: '식단',
    exercise: '운동',
    mental: '멘탈케어',
  };
  return types[type] || '알 수 없음';
};