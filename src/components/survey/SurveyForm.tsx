// src/components/survey/SurveyForm.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SurveyResponse } from '@/lib/types';

const MAX_SCORE = 10;
const DEFAULT_SCORE = 5;

type PhysicalHealth = NonNullable<SurveyResponse['physicalHealth']>;
type MentalHealth = NonNullable<SurveyResponse['mentalHealth']>;

const PHYSICAL_HEALTH_FIELDS = [
  { key: 'sleepQuality' as const, label: '수면의 질' },
  { key: 'exerciseFrequency' as const, label: '운동 빈도' },
  { key: 'dietQuality' as const, label: '식단 품질' },
  { key: 'stressLevel' as const, label: '스트레스 수준' },
] as const;

const MENTAL_HEALTH_FIELDS = [
  { key: 'mood' as const, label: '기분 상태' },
  { key: 'anxiety' as const, label: '불안 수준' },
  { key: 'energy' as const, label: '에너지 수준' },
  { key: 'socialSupport' as const, label: '사회적 지지' },
] as const;

export const SurveyForm = () => {
  const [step, setStep] = useState<'physical' | 'mental'>('physical');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<SurveyResponse>>({
    physicalHealth: {
      sleepQuality: DEFAULT_SCORE,
      exerciseFrequency: DEFAULT_SCORE,
      dietQuality: DEFAULT_SCORE,
      stressLevel: DEFAULT_SCORE,
    },
    mentalHealth: {
      mood: DEFAULT_SCORE,
      anxiety: DEFAULT_SCORE,
      energy: DEFAULT_SCORE,
      socialSupport: DEFAULT_SCORE,
    },
  });

  // 안전한 접근자 함수들
  const getPhysicalValue = (field: keyof PhysicalHealth): number => {
    return formData.physicalHealth?.[field] ?? DEFAULT_SCORE;
  };

  const getMentalValue = (field: keyof MentalHealth): number => {
    return formData.mentalHealth?.[field] ?? DEFAULT_SCORE;
  };

  const handlePhysicalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('mental');
  };

  /**
   * 정신 건강 폼 제출 처리
   * @param e - 폼 이벤트
   */
  const handleMentalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // TODO: API 호출하여 데이터 저장
      console.log('Form submitted:', formData);
      // 성공 시 처리 (예: 다음 페이지로 이동)
    } catch (error) {
      console.error('폼 제출 중 오류 발생:', error);
      // TODO: 에러 처리 (예: 에러 메시지 표시)
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 점수 변경을 처리하는 함수
   * @param category - 'physicalHealth' 또는 'mentalHealth'
   * @param field - 해당 카테고리의 필드명
   * @param value - 새로운 점수 값
   * @returns void
   */
  const handleScoreChange = (
    category: 'physicalHealth' | 'mentalHealth',
    field: keyof PhysicalHealth | keyof MentalHealth,
    value: number
  ) => {
    // NaN 체크: 숫자가 아닌 값이 입력된 경우
    if (isNaN(value)) {
      console.warn('유효하지 않은 점수: 숫자가 아님');
      return;
    }

    // 범위 체크: 0-10 사이의 값인지 확인
    if (value < 0 || value > MAX_SCORE) {
      console.warn(`유효하지 않은 점수: ${value} (0-${MAX_SCORE} 사이여야 함)`);
      return;
    }

    // 상태 업데이트
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  /**
   * 점수 입력 UI를 렌더링하는 함수
   * @param label - 입력 필드의 레이블
   * @param category - 'physicalHealth' 또는 'mentalHealth'
   * @param field - 해당 카테고리의 필드명
   * @param value - 현재 점수 값
   * @returns JSX.Element
   */
  const renderScoreInput = (
    label: string,
    category: 'physicalHealth' | 'mentalHealth',
    field: keyof PhysicalHealth | keyof MentalHealth,
    value: number
  ) => {
    // 점수에 따른 색상 결정
    const getScoreColor = (score: number) => {
      if (score >= 8) return 'text-green-600';
      if (score >= 5) return 'text-blue-600';
      if (score >= 3) return 'text-yellow-600';
      return 'text-red-600';
    };

    return (
      // 각 점수 입력 필드를 감싸는 컨테이너
      <div className="space-y-2">
        {/* 입력 필드의 레이블 */}
        <label className="block text-sm font-medium text-gray-700">
          {label} (0-10)
        </label>
        {/* 슬라이더와 점수를 나란히 배치하는 컨테이너 */}
        <div className="flex items-center space-x-4">
          {/* 점수 입력을 위한 슬라이더 */}
          <input
            type="range"
            min="0"
            max={MAX_SCORE}
            value={value}
            onChange={(e) =>
              handleScoreChange(category, field, parseInt(e.target.value))
            }
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          {/* 현재 점수를 표시하는 숫자 (색상이 변함) */}
          <span className={`text-lg font-semibold ${getScoreColor(value)}`}>
            {value}
          </span>
        </div>
        {/* 점수 범위를 표시하는 레이블 */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>낮음</span>
          <span>보통</span>
          <span>높음</span>
        </div>
      </div>
    );
  };

  const renderPhysicalHealthForm = () => (
    // 신체 건강 폼 컨테이너
    <form onSubmit={handlePhysicalSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* 폼 제목 */}
        <h2 className="text-xl font-semibold text-blue-800">신체 건강</h2>
        {/* 점수 입력 필드들을 감싸는 컨테이너 */}
        <div className="space-y-4">
          {PHYSICAL_HEALTH_FIELDS.map((field) =>
            renderScoreInput(
              field.label,
              'physicalHealth',
              field.key,
              getPhysicalValue(field.key)
            )
          )}
        </div>
      </div>
      {/* 다음 단계로 이동하는 버튼 */}
      <Button type="submit" variant="primary">
        다음
      </Button>
    </form>
  );

  const renderMentalHealthForm = () => (
    // 정신 건강 폼 컨테이너
    <form onSubmit={handleMentalSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* 폼 제목 */}
        <h2 className="text-xl font-semibold text-blue-800">정신 건강</h2>
        {/* 점수 입력 필드들을 감싸는 컨테이너 */}
        <div className="space-y-4">
          {MENTAL_HEALTH_FIELDS.map((field) =>
            renderScoreInput(
              field.label,
              'mentalHealth',
              field.key,
              getMentalValue(field.key)
            )
          )}
        </div>
      </div>
      <div className="flex gap-4">
        {/* 이전 단계로 이동하는 버튼 */}
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep('physical')}
          disabled={isSubmitting}
        >
          이전
        </Button>
        {/* 제출 버튼 */}
        <Button 
          type="submit" 
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? '제출 중...' : '제출하기'}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {step === 'physical' ? renderPhysicalHealthForm() : renderMentalHealthForm()}
    </div>
  );
}; 