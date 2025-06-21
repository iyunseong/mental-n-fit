// src/lib/types.ts
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface SurveyResponse {
  userId: string;
  physicalHealth: {
    sleepQuality: number;
    exerciseFrequency: number;
    dietQuality: number;
    stressLevel: number;
  };
  mentalHealth: {
    mood: number;
    anxiety: number;
    energy: number;
    socialSupport: number;
  };
  createdAt: Date;
}

export interface Recommendation {
  id: string;
  userId: string;
  type: 'diet' | 'exercise' | 'mental';
  title: string;
  description: string;
  content: string;
  createdAt: Date;
} 