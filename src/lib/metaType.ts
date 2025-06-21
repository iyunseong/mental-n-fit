// src/lib/metaType.ts
// 기본 타입 정의
export type ChronotypeValue = 'E' | 'O';
export type StressValue = 'C' | 'I';
export type EnterotypeValue = 'B' | 'F';
export type ExerciseValue = 'P' | 'A';

// 메타타입 정의 (4글자 조합)
export type MetaType = `${ChronotypeValue}${StressValue}${EnterotypeValue}${ExerciseValue}`;

export type MetaTypeAxis = 'chronotype' | 'stress' | 'enterotype' | 'exercise';

// 문항 수 상수
export const QUESTION_COUNTS = {
  chronotype: 8,
  stress: 13,
  enterotype: 7,
  exercise: 10
} as const;

// 문항 범위 계산 함수
const getQuestionRange = (axis: MetaTypeAxis) => {
  const starts = {
    chronotype: 0,
    stress: QUESTION_COUNTS.chronotype,
    enterotype: QUESTION_COUNTS.chronotype + QUESTION_COUNTS.stress,
    exercise: QUESTION_COUNTS.chronotype + QUESTION_COUNTS.stress + QUESTION_COUNTS.enterotype
  };
  return {
    start: starts[axis],
    count: QUESTION_COUNTS[axis]
  };
};

export interface Question {
  id: number;
  text: string;
  options: {
    text: string;
    score: number;
  }[];
  axis: MetaTypeAxis;
}

export const QUESTIONS: Question[] = [
  // 크로노타입 (E/O) - 8문항
  {
    id: 1,
    text: '자연스러운 취침 시간은?',
    options: [
      { text: '오후 9-10시', score: 3 },
      { text: '오후 10-11시', score: 1 },
      { text: '오후 11시-자정', score: 0 },
      { text: '자정-새벽 1시', score: -1 },
      { text: '새벽 1시 이후', score: -3 },
    ],
    axis: 'chronotype',
  },
  {
    id: 2,
    text: '자연스러운 기상 시간은?',
    options: [
      { text: '오전 5-6시', score: 3 },
      { text: '오전 6-7시', score: 1 },
      { text: '오전 7-8시', score: 0 },
      { text: '오전 8-9시', score: -1 },
      { text: '오전 9시 이후', score: -3 },
    ],
    axis: 'chronotype',
  },
  {
    id: 3,
    text: '가장 집중이 잘 되는 시간대는?',
    options: [
      { text: '오전 6-9시', score: 2 },
      { text: '오전 9-12시', score: 1 },
      { text: '오후 12-15시', score: 0 },
      { text: '오후 15-18시', score: -1 },
      { text: '오후 18시 이후', score: -2 },
    ],
    axis: 'chronotype',
  },
  {
    id: 4,
    text: '운동하기 가장 좋은 시간대는?',
    options: [
      { text: '새벽/이른 아침', score: 2 },
      { text: '오전 중', score: 1 },
      { text: '점심시간', score: 0 },
      { text: '오후/저녁', score: -1 },
      { text: '밤 늦게', score: -2 },
    ],
    axis: 'chronotype',
  },
  {
    id: 5,
    text: '휴가 때 자연스러운 수면 패턴은?',
    options: [
      { text: '오후 9시 취침, 오전 5-6시 기상', score: 2 },
      { text: '오후 10시 취침, 오전 6-7시 기상', score: 1 },
      { text: '오후 11시 취침, 오전 7-8시 기상', score: 0 },
      { text: '자정 취침, 오전 8-9시 기상', score: -1 },
      { text: '새벽 1시 이후 취침, 오전 9시 이후 기상', score: -2 },
    ],
    axis: 'chronotype',
  },
  {
    id: 6,
    text: '가장 창의적인 아이디어가 떠오르는 시간은?',
    options: [
      { text: '새벽/이른 아침', score: 2 },
      { text: '오전 중', score: 1 },
      { text: '오후 초반', score: 0 },
      { text: '저녁 시간', score: -1 },
      { text: '밤 늦은 시간', score: -2 },
    ],
    axis: 'chronotype',
  },
  {
    id: 7,
    text: '수면 시간이 바뀌어야 하는 상황에서 적응은?',
    options: [
      { text: '일찍 자야 하는 상황이 더 편함', score: 1 },
      { text: '둘 다 비슷하게 어려움', score: 0 },
      { text: '늦게 자야 하는 상황이 더 편함', score: -1 },
      { text: '경험해본 적 없어서 모르겠음', score: 0 },
    ],
    axis: 'chronotype',
  },
  {
    id: 8,
    text: '주말에 아무 계획 없을 때 자연스러운 패턴은?',
    options: [
      { text: '일찍 자고 일찍 일어나는 게 편함', score: 2 },
      { text: '평소보다 조금 늦게 자고 일어남', score: 1 },
      { text: '평일과 비슷한 패턴 유지', score: 0 },
      { text: '평소보다 많이 늦게 자고 일어남', score: -1 },
      { text: '밤늦게 자고 늦게 일어나는 게 편함', score: -2 },
    ],
    axis: 'chronotype',
  },

  // 스트레스 반응성 (C/I) - 13문항
  {
    id: 9,
    text: '카페인을 마시면?',
    options: [
      { text: '거의 변화 없음', score: 2 },
      { text: '약간 각성됨', score: 1 },
      { text: '적당히 깨어남', score: 0 },
      { text: '매우 각성됨', score: -1 },
      { text: '심장이 뛰고 불안함', score: -2 },
    ],
    axis: 'stress',
  },
  {
    id: 10,
    text: '갑작스러운 큰 소리에 반응은?',
    options: [
      { text: '별로 놀라지 않음', score: 2 },
      { text: '약간 놀람', score: 1 },
      { text: '보통 정도 놀람', score: 0 },
      { text: '많이 놀라고 심장이 뜀', score: -1 },
      { text: '극도로 예민하게 반응', score: -2 },
    ],
    axis: 'stress',
  },
  {
    id: 11,
    text: '지하철/버스에서 급브레이크가 걸렸을 때 반응은?',
    options: [
      { text: '별로 놀라지 않고 균형만 잡음', score: 2 },
      { text: '약간 놀라지만 금세 괜찮아짐', score: 1 },
      { text: '보통 정도 놀람', score: 0 },
      { text: '심장이 뛰고 잠시 불안함', score: -1 },
      { text: '한참 동안 심장이 뛰고 진정이 안됨', score: -2 },
    ],
    axis: 'stress',
  },
  {
    id: 12,
    text: '중요한 약속에 10분 늦을 것 같을 때?',
    options: [
      { text: '차분하게 연락하고 해결책 생각', score: 2 },
      { text: '약간 서두르지만 침착함', score: 1 },
      { text: '보통 정도 조급함', score: 0 },
      { text: '상당히 초조하고 불안함', score: -1 },
      { text: '극도로 불안하고 손에 땀이 남', score: -2 },
    ],
    axis: 'stress',
  },
  {
    id: 13,
    text: '갑자기 이름이 불렸을 때 (수업, 회의 등)?',
    options: [
      { text: '자연스럽게 대답', score: 2 },
      { text: '약간 놀라지만 침착하게 반응', score: 1 },
      { text: '보통 정도 놀람', score: 0 },
      { text: '심장이 뛰고 당황함', score: -1 },
      { text: '극도로 놀라고 얼굴이 빨개짐', score: -2 },
    ],
    axis: 'stress',
  },
  {
    id: 14,
    text: '예상치 못한 방문자가 왔을 때?',
    options: [
      { text: '자연스럽게 맞이함', score: 2 },
      { text: '약간 당황하지만 금세 괜찮음', score: 1 },
      { text: '보통 정도 당황', score: 0 },
      { text: '상당히 당황하고 정리할 시간 필요', score: -1 },
      { text: '극도로 스트레스받고 회피하고 싶음', score: -2 },
    ],
    axis: 'stress',
  },
  {
    id: 15,
    text: '시험이나 발표 3일 전부터?',
    options: [
      { text: '평소와 별 차이 없음', score: 2 },
      { text: '약간 긴장하지만 컨트롤 가능', score: 1 },
      { text: '보통 정도 긴장', score: 0 },
      { text: '상당히 불안하고 잠이 안옴', score: -1 },
      { text: '극도로 불안해서 일상생활 지장', score: -2 },
    ],
    axis: 'stress',
  },
  {
    id: 16,
    text: '갑작스런 계획 변경 통보를 받으면?',
    options: [
      { text: '"괜찮다, 어떻게 바뀌었나?"', score: 2 },
      { text: '약간 아쉽지만 금세 적응', score: 1 },
      { text: '보통 정도 당황', score: 0 },
      { text: '상당히 스트레스받고 재계획 필요', score: -1 },
      { text: '극도로 불안하고 하루종일 신경쓰임', score: -2 },
    ],
    axis: 'stress',
  },
  {
    id: 17,
    text: '엘리베이터가 갑자기 멈췄을 때?',
    options: [
      { text: '침착하게 비상버튼을 누름', score: 2 },
      { text: '약간 당황하지만 차분히 대처', score: 1 },
      { text: '보통 정도 불안', score: 0 },
      { text: '상당히 불안하고 초조함', score: -1 },
      { text: '극도로 불안하고 공황상태', score: -2 },
    ],
    axis: 'stress',
  },
  {
    id: 18,
    text: '길을 가다가 갑자기 아는 사람과 마주쳤을 때?',
    options: [
      { text: '반갑게 먼저 인사하고 자연스럽게 대화', score: 2 },
      { text: '약간 놀라지만 웃으며 인사', score: 1 },
      { text: '보통 정도 놀라며 인사', score: 0 },
      { text: '상당히 당황하지만 억지로 웃으며 인사', score: -1 },
      { text: '극도로 당황해서 못 본 척하고 싶음', score: -2 },
    ],
    axis: 'stress',
  },
  {
    id: 19,
    text: '엘리베이터에서 아는 사람과 둘이만 있게 되면?',
    options: [
      { text: '자연스럽게 대화 시작', score: 2 },
      { text: '가벼운 인사나 날씨 얘기', score: 1 },
      { text: '적당한 침묵 유지', score: 0 },
      { text: '어색해서 핸드폰 보거나 층수 버튼 확인', score: -1 },
      { text: '극도로 불편해서 빨리 내리고 싶음', score: -2 },
    ],
    axis: 'stress',
  },
  {
    id: 20,
    text: '카페에서 주문할 때 앞사람이 아는 사람이었다면?',
    options: [
      { text: '먼저 어깨 톡톡 치며 인사', score: 2 },
      { text: '"어? 안녕!" 하며 자연스럽게 인사', score: 1 },
      { text: '주문 끝날 때까지 기다렸다가 인사', score: 0 },
      { text: '어색해서 주문만 빨리 하고 피함', score: -1 },
      { text: '못 본 척하거나 다른 카페로 가고 싶음', score: -2 },
    ],
    axis: 'stress',
  },
  {
    id: 21,
    text: '지하철에서 맞은편에 아는 사람이 앉아있는 걸 발견하면?',
    options: [
      { text: '바로 가서 인사하고 옆에 앉음', score: 2 },
      { text: '눈 마주치면 웃으며 손 흔들어 인사', score: 1 },
      { text: '눈 마주치면 가벼운 목례', score: 0 },
      { text: '일부러 눈 안 마주치려고 노력', score: -1 },
      { text: '다른 칸으로 이동하고 싶음', score: -2 },
    ],
    axis: 'stress',
  },

  // 엔테로타입 (B/F) - 7문항
  {
    id: 22,
    text: '고기를 먹은 후 소화감은?',
    options: [
      { text: '매우 편안하고 포만감 좋음', score: 2 },
      { text: '소화 잘됨', score: 1 },
      { text: '보통', score: 0 },
      { text: '약간 무거운 느낌', score: -1 },
      { text: '소화 불편함', score: -2 },
    ],
    axis: 'enterotype',
  },
  {
    id: 23,
    text: '콩류/견과류를 먹으면?',
    options: [
      { text: '소화 불편함', score: 2 },
      { text: '별로 좋아하지 않음', score: 1 },
      { text: '보통', score: 0 },
      { text: '소화 잘됨', score: -1 },
      { text: '매우 편안함', score: -2 },
    ],
    axis: 'enterotype',
  },
  {
    id: 24,
    text: '자연스럽게 끌리는 음식은?',
    options: [
      { text: '육류, 생선, 계란 위주', score: 2 },
      { text: '단백질 위주 + 일부 탄수화물', score: 1 },
      { text: '균형잡힌 식단', score: 0 },
      { text: '채소, 과일, 곡물 위주', score: -1 },
      { text: '완전 식물성 식단 선호', score: -2 },
    ],
    axis: 'enterotype',
  },
  {
    id: 25,
    text: '유제품 섭취 후 느낌은?',
    options: [
      { text: '매우 좋음', score: 2 },
      { text: '괜찮음', score: 1 },
      { text: '보통', score: 0 },
      { text: '약간 불편함', score: -1 },
      { text: '소화 문제 있음', score: -2 },
    ],
    axis: 'enterotype',
  },
  {
    id: 26,
    text: '식후 에너지 수준 변화는?',
    options: [
      { text: '고기/생선 먹으면 에너지 충전됨', score: 2 },
      { text: '단백질 위주로 먹으면 활력 있음', score: 1 },
      { text: '골고루 먹으면 좋음', score: 0 },
      { text: '채소/곡물 위주로 먹으면 가벼움', score: -1 },
      { text: '식물성 식단에서 가장 컨디션 좋음', score: -2 },
    ],
    axis: 'enterotype',
  },
  {
    id: 27,
    text: '배가 고플 때 자연스럽게 끌리는 음식은?',
    options: [
      { text: '고기, 생선, 계란 요리', score: 2 },
      { text: '단백질이 풍부한 음식', score: 1 },
      { text: '특별한 선호 없음', score: 0 },
      { text: '빵, 밥, 과일', score: -1 },
      { text: '샐러드, 채소 요리', score: -2 },
    ],
    axis: 'enterotype',
  },
  {
    id: 28,
    text: '공복감을 느끼는 패턴은?',
    options: [
      { text: '고기/생선 먹어야 배부름', score: 2 },
      { text: '단백질 없으면 금세 배고파짐', score: 1 },
      { text: '보통', score: 0 },
      { text: '탄수화물/섬유질로도 포만감 오래감', score: -1 },
      { text: '식물성 식품만으로도 충분히 포만함', score: -2 },
    ],
    axis: 'enterotype',
  },

  // 운동 반응성 (P/A) - 10문항
  {
    id: 29,
    text: '더 재미있고 자연스러운 운동은?',
    options: [
      { text: '웨이트 트레이닝', score: 2 },
      { text: '스프린트, 점프 운동', score: 1 },
      { text: '둘 다 좋아함', score: 0 },
      { text: '조깅, 사이클링', score: -1 },
      { text: '장거리 유산소 운동', score: -2 },
    ],
    axis: 'exercise',
  },
  {
    id: 30,
    text: '운동 후 회복 패턴은?',
    options: [
      { text: '고강도 짧은 운동 후 빨리 회복', score: 2 },
      { text: '무거운 것 든 후 2-3일 아픔', score: 1 },
      { text: '보통', score: 0 },
      { text: '가벼운 운동을 오래 하는 게 편함', score: -1 },
      { text: '장시간 유산소 후에도 피로감 적음', score: -2 },
    ],
    axis: 'exercise',
  },
  {
    id: 31,
    text: '일상에서 느끼는 자신의 신체 특성은?',
    options: [
      { text: '순간적인 힘은 강하지만 오래 못 버팀', score: 2 },
      { text: '무거운 것은 잘 들지만 금세 지침', score: 1 },
      { text: '둘 다 보통', score: 0 },
      { text: '가벼운 활동을 오래 할 수 있음', score: -1 },
      { text: '지치지 않고 계속 움직일 수 있음', score: -2 },
    ],
    axis: 'exercise',
  },
  {
    id: 32,
    text: '다음 중 어떤 상황에서 더 빨리 지치나요?',
    options: [
      { text: '무거운 짐 옮기기, 계단 몇 층 뛰어오르기', score: 0 },
      { text: '가벼운 조깅을 20-30분 지속하기', score: 1 },
      { text: '둘 다 비슷하게 힘듦', score: 0 },
      { text: '순간적으로 힘을 많이 써야 하는 일', score: -1 },
      { text: '잘 모르겠음', score: 0 },
    ],
    axis: 'exercise',
  },
  {
    id: 33,
    text: '어린 시절부터 자연스럽게 잘했던 활동은?',
    options: [
      { text: '씨름, 팔씨름, 단거리 달리기', score: 2 },
      { text: '순간적인 힘을 쓰는 운동', score: 1 },
      { text: '둘 다 잘함', score: 0 },
      { text: '오래 뛰기, 자전거 타기', score: -1 },
      { text: '마라톤, 등산 등 지구력 운동', score: -2 },
    ],
    axis: 'exercise',
  },
  {
    id: 34,
    text: '체육 시간이나 놀이에서 자연스럽게 좋아했던 것은?',
    options: [
      { text: '팔씨름, 단거리 달리기, 높이뛰기', score: 2 },
      { text: '순간적인 힘을 쓰는 활동', score: 1 },
      { text: '둘 다 좋아함', score: 0 },
      { text: '오래 달리기, 자전거 타기', score: -1 },
      { text: '지구력이 필요한 활동', score: -2 },
    ],
    axis: 'exercise',
  },
  {
    id: 35,
    text: '일상생활에서 어떤 활동이 더 자연스러운가요?',
    options: [
      { text: '계단 몇 층 빠르게 뛰어오르기', score: 1 },
      { text: '무거운 물건 잠깐 들기', score: 1 },
      { text: '둘 다 비슷함', score: 0 },
      { text: '천천히 오래 걸어다니기', score: -1 },
      { text: '가벼운 활동을 계속 지속하기', score: -2 },
    ],
    axis: 'exercise',
  },
  {
    id: 36,
    text: '학창시절 체력장에서 어떤 종목을 더 잘했나요?',
    options: [
      { text: '50m 달리기, 팔굽혀펴기', score: 2 },
      { text: '높이뛰기, 서전뛰기', score: 1 },
      { text: '기억이 안 남', score: 0 },
      { text: '오래달리기, 턱걸이', score: -1 },
      { text: '지구력 종목 전반', score: -2 },
    ],
    axis: 'exercise',
  },
  {
    id: 37,
    text: '같은 운동을 해도 다른 사람과 비교한 발달 속도는?',
    options: [
      { text: '근력/근육량이 빠르게 늘어남', score: 2 },
      { text: '무거운 걸 드는 능력이 빨리 향상', score: 1 },
      { text: '보통', score: 0 },
      { text: '지구력이 빠르게 향상됨', score: -1 },
      { text: '오래 버티는 능력이 뛰어남', score: -2 },
    ],
    axis: 'exercise',
  },
  {
    id: 38,
    text: '운동 중 가장 자연스럽게 나오는 움직임은?',
    options: [
      { text: '폭발적이고 강한 동작', score: 2 },
      { text: '순간적인 파워를 내는 동작', score: 1 },
      { text: '둘 다', score: 0 },
      { text: '일정한 리듬의 지속적 동작', score: -1 },
      { text: '오랫동안 같은 강도 유지하는 동작', score: -2 },
    ],
    axis: 'exercise',
  },
];

export const META_TYPE_DESCRIPTIONS: Record<MetaType, string> = {
  'ECBP': '스토익 파워 (아침형 + 낮은스트레스 + Bacteroides + 파워형)',
  'EIBP': '인텐스 파워 (아침형 + 높은스트레스 + Bacteroides + 파워형)',
  'ECFP': '젠틀 파워 (아침형 + 낮은스트레스 + Fiber + 파워형)',
  'EIFP': '파이어 파워 (아침형 + 높은스트레스 + Fiber + 파워형)',
  'ECBA': '스테디 러너 (아침형 + 낮은스트레스 + Bacteroides + 지구력형)',
  'EIBA': '컴페티티브 러너 (아침형 + 높은스트레스 + Bacteroides + 지구력형)',
  'ECFA': '네이처 러너 (아침형 + 낮은스트레스 + Fiber + 지구력형)',
  'EIFA': '울트라 러너 (아침형 + 높은스트레스 + Fiber + 지구력형)',
  'OCBP': '나이트 워리어 (저녁형 + 낮은스트레스 + Bacteroides + 파워형)',
  'OIBP': '미드나잇 비스트 (저녁형 + 높은스트레스 + Bacteroides + 파워형)',
  'OCFP': '문라이트 파워 (저녁형 + 낮은스트레스 + Fiber + 파워형)',
  'OIFP': '베테랑 나이터 (저녁형 + 높은스트레스 + Fiber + 파워형)',
  'OCBA': '나이트 크루저 (저녁형 + 낮은스트레스 + Bacteroides + 지구력형)',
  'OIBA': '미드나잇 마라토너 (저녁형 + 높은스트레스 + Bacteroides + 지구력형)',
  'OCFA': '이브닝 플로우 (저녁형 + 낮은스트레스 + Fiber + 지구력형)',
  'OIFA': '다크 엔듀런스 (저녁형 + 높은스트레스 + Fiber + 지구력형)',
};

// 유효성 검사 함수
const validateAnswers = (answers: number[]): void => {
  const totalQuestions = Object.values(QUESTION_COUNTS).reduce((a, b) => a + b, 0);
  
  if (!answers || answers.length !== totalQuestions) {
    throw new Error(`${totalQuestions}개 답변 필요. 현재: ${answers?.length || 0}개`);
  }

  const invalidAnswers = answers.filter(score => 
    typeof score !== 'number' || score < -3 || score > 3
  );
  
  if (invalidAnswers.length > 0) {
    throw new Error(`잘못된 점수: ${invalidAnswers.join(', ')}`);
  }
};

// 축별 점수 계산 함수
const calculateAxisScore = (answers: number[], axis: MetaTypeAxis): number => {
  const { start, count } = getQuestionRange(axis);
  const axisAnswers = answers.slice(start, start + count);
  return axisAnswers.reduce((a, b) => a + b, 0) / count;
};

// 축별 값 결정 함수
const determineAxisValue = (score: number, positive: string, negative: string): string => {
  return score > 0 ? positive : negative;
};

// 메타타입 유효성 검사
export const isValidMetaType = (type: string): type is MetaType => {
  return /^[EO][CI][BF][PA]$/.test(type) && 
         META_TYPE_DESCRIPTIONS.hasOwnProperty(type);
};

// 메인 계산 함수
export const calculateMetaType = (answers: number[]): MetaType => {
  validateAnswers(answers);
  
  const scores = {
    chronotype: calculateAxisScore(answers, 'chronotype'),
    stress: calculateAxisScore(answers, 'stress'),
    enterotype: calculateAxisScore(answers, 'enterotype'),
    exercise: calculateAxisScore(answers, 'exercise')
  };

  const result = [
    determineAxisValue(scores.chronotype, 'E', 'O'),
    determineAxisValue(scores.stress, 'C', 'I'),
    determineAxisValue(scores.enterotype, 'B', 'F'),
    determineAxisValue(scores.exercise, 'P', 'A')
  ].join('') as MetaType;
  
  if (!isValidMetaType(result)) {
    throw new Error(`계산 오류: 유효하지 않은 메타타입 ${result}`);
  }
  
  return result;
}; 