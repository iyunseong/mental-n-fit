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
  const axes = ['chronotype', 'stress', 'enterotype', 'exercise'] as const;
  let startIndex = 1;
  
  for (const currentAxis of axes) {
    if (currentAxis === axis) {
      return { start: startIndex, count: QUESTION_COUNTS[axis] };
    }
    startIndex += QUESTION_COUNTS[currentAxis];
  }
  
  throw new Error(`Invalid axis: ${axis}`);
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
    text: "자연스러운 취침 시간은?",
    options: [
      { text: "오후 9-10시", score: 3 },
      { text: "오후 10-11시", score: 1 },
      { text: "오후 11시-자정", score: 0 },
      { text: "자정-새벽 1시", score: -1 },
      { text: "새벽 1시 이후", score: -3 },
    ],
    axis: 'chronotype',
  },
  {
    id: 2,
    text: "자연스러운 기상 시간은?",
    options: [
      { text: "오전 5-6시", score: 3 },
      { text: "오전 6-7시", score: 1 },
      { text: "오전 7-8시", score: 0 },
      { text: "오전 8-9시", score: -1 },
      { text: "오전 9시 이후", score: -3 },
    ],
    axis: 'chronotype',
  },
  {
    id: 3,
    text: "가장 집중이 잘 되는 시간대는?",
    options: [
      { text: "오전 6-9시", score: 2 },
      { text: "오전 9-12시", score: 1 },
      { text: "오후 12-15시", score: 0 },
      { text: "오후 15-18시", score: -1 },
      { text: "오후 18시 이후", score: -2 },
    ],
    axis: 'chronotype',
  },
  {
    id: 4,
    text: "운동하기 가장 좋은 시간대는?",
    options: [
      { text: "새벽/이른 아침", score: 2 },
      { text: "오전 중", score: 1 },
      { text: "점심시간", score: 0 },
      { text: "오후/저녁", score: -1 },
      { text: "밤 늦게", score: -2 },
    ],
    axis: 'chronotype',
  },
  {
    id: 5,
    text: "휴가 때 자연스러운 수면 패턴은?",
    options: [
      { text: "오후 9시 취침, 오전 5-6시 기상", score: 2 },
      { text: "오후 10시 취침, 오전 6-7시 기상", score: 1 },
      { text: "오후 11시 취침, 오전 7-8시 기상", score: 0 },
      { text: "자정 취침, 오전 8-9시 기상", score: -1 },
      { text: "새벽 1시 이후 취침, 오전 9시 이후 기상", score: -2 },
    ],
    axis: 'chronotype',
  },
  {
    id: 6,
    text: "가장 창의적인 아이디어가 떠오르는 시간은?",
    options: [
      { text: "새벽/이른 아침", score: 2 },
      { text: "오전 중", score: 1 },
      { text: "오후 초반", score: 0 },
      { text: "저녁 시간", score: -1 },
      { text: "밤 늦은 시간", score: -2 },
    ],
    axis: 'chronotype',
  },
  {
    id: 7,
    text: "수면 시간이 바뀌어야 하는 상황에서 적응은?",
    options: [
      { text: "일찍 자야 하는 상황이 더 편함", score: 1 },
      { text: "둘 다 비슷하게 어려움", score: 0 },
      { text: "늦게 자야 하는 상황이 더 편함", score: -1 },
      { text: "경험해본 적 없어서 모르겠음", score: 0 },
    ],
    axis: 'chronotype',
  },
  {
    id: 8,
    text: "주말에 아무 계획 없을 때 자연스러운 패턴은?",
    options: [
      { text: "일찍 자고 일찍 일어나는 게 편함", score: 2 },
      { text: "평소보다 조금 늦게 자고 일어남", score: 1 },
      { text: "평일과 비슷한 패턴 유지", score: 0 },
      { text: "평소보다 많이 늦게 자고 일어남", score: -1 },
      { text: "밤늦게 자고 늦게 일어나는 게 편함", score: -2 },
    ],
    axis: 'chronotype',
  },

  // 스트레스 반응성 (C/I) - 13문항
  {
    id: 9,
    text: "카페인을 마시면?",
    options: [
      { text: "거의 변화 없음", score: 2 },
      { text: "약간 각성됨", score: 1 },
      { text: "적당히 깨어남", score: 0 },
      { text: "매우 각성됨", score: -1 },
      { text: "심장이 뛰고 불안함", score: -2 },
    ],
    axis: 'stress',
  },
  {
    id: 10,
    text: "갑작스러운 큰 소리에 반응은?",
    options: [
      { text: "별로 놀라지 않음", score: 2 },
      { text: "약간 놀람", score: 1 },
      { text: "보통 정도로 놀람", score: 0 },
      { text: "많이 놀라고 심장이 뜀", score: -1 },
      { text: "극도로 예민하게 반응함", score: -2 },
    ],
    axis: 'stress',
  },
  {
    id: 11,
    text: "중요한 약속에 10분 정도 늦을 것 같을 때의 심정은?",
    options: [
      { text: "침착하게 연락하고 해결책을 생각함", score: 2 },
      { text: "약간 서두르지만 당황하지 않음", score: 1 },
      { text: "보통 수준으로 조급해짐", score: 0 },
      { text: "상당히 초조하고 불안함", score: -1 },
      { text: "극도로 불안하고 안절부절못함", score: -2 },
    ],
    axis: 'stress',
  },
  {
    id: 12,
    text: "회의나 수업 중 예상치 못하게 내 이름이 불렸을 때?",
    options: [
      { text: "자연스럽게 대답함", score: 2 },
      { text: "약간 놀라지만 침착하게 반응함", score: 1 },
      { text: "보통 정도로 놀람", score: 0 },
      { text: "심장이 뛰고 순간 당황함", score: -1 },
      { text: "극도로 놀라고 얼굴이 빨개짐", score: -2 },
    ],
    axis: 'stress',
  },
  {
    id: 13,
    text: "중요한 시험이나 발표를 앞두고 있을 때, 어떤 편에 가까운가요?",
    options: [
      { text: "평소와 같이 차분하게 준비함", score: 2 },
      { text: "약간의 건강한 긴장감을 느낌", score: 1 },
      { text: "어느 정도 긴장되고 스트레스를 받음", score: 0 },
      { text: "꽤 불안하고 잠을 설치기도 함", score: -1 },
      { text: "극도로 불안해서 일상생활에 지장을 줌", score: -2 },
    ],
    axis: 'stress',
  },
  {
    id: 14,
    text: "중요한 계획이 갑자기 변경되었다는 통보를 받으면?",
    options: [
      { text: "괜찮음, 유연하게 대처할 수 있음", score: 2 },
      { text: "약간 아쉽지만 금방 적응함", score: 1 },
      { text: "보통 정도로 당황함", score: 0 },
      { text: "상당히 스트레스받고 머리가 복잡해짐", score: -1 },
      { text: "극도로 불안하고 하루 종일 신경 쓰임", score: -2 },
    ],
    axis: 'stress',
  },
  {
    id: 15,
    text: "마감 시간이 임박한 여러 업무가 동시에 주어졌을 때?",
    options: [
      { text: "침착하게 우선순위를 정해 하나씩 처리", score: 2 },
      { text: "약간의 압박감을 느끼지만 잘 해결해 나감", score: 1 },
      { text: "상당한 압박감을 느낌", score: 0 },
      { text: "허둥대고 무엇부터 해야 할지 막막함", score: -1 },
      { text: "압도되어 아무것도 손에 잡히지 않음", score: -2 },
    ],
    axis: 'stress',
  },
  {
    id: 16,
    text: "다른 사람과 의견 충돌이나 언쟁이 있었을 때, 그 기분이 얼마나 지속되나요?",
    options: [
      { text: "금방 털어버리고 잊는 편", score: 2 },
      { text: "잠시 기분이 안 좋지만 금방 괜찮아짐", score: 1 },
      { text: "반나절 정도 신경 쓰임", score: 0 },
      { text: "하루 이상 기분이 계속 상함", score: -1 },
      { text: "며칠 동안 계속 생각나고 스트레스받음", score: -2 },
    ],
    axis: 'stress',
  },
  {
    id: 17,
    text: "일단 화가 나거나 스트레스를 받으면, 다시 평온한 상태로 돌아오는 데 얼마나 걸리나요?",
    options: [
      { text: "매우 빨리 (몇 분 내로)", score: 2 },
      { text: "비교적 빨리 (30분 내외)", score: 1 },
      { text: "보통 (한두 시간)", score: 0 },
      { text: "꽤 오래 걸림 (반나절 이상)", score: -1 },
      { text: "하루 종일 또는 그 이상 지속됨", score: -2 },
    ],
    axis: 'stress',
  },
  {
    id: 18,
    text: "사소한 실수나 미래에 일어날지 모르는 일에 대해 곱씹으며 걱정하는 편인가요?",
    options: [
      { text: "거의 그렇지 않음", score: 2 },
      { text: "가끔 그렇지만 금방 잊음", score: 1 },
      { text: "종종 그런 편", score: 0 },
      { text: "자주 곱씹으며 걱정함", score: -1 },
      { text: "늘 불안하고 최악의 상황을 상상함", score: -2 },
    ],
    axis: 'stress',
  },
  {
    id: 19,
    text: "스트레스를 받을 때, 두통, 소화불량, 수면 문제 같은 신체적 증상을 겪는 편인가요?",
    options: [
      { text: "거의 겪지 않음", score: 2 },
      { text: "아주 가끔 겪음", score: 1 },
      { text: "가끔 겪는 편", score: 0 },
      { text: "자주 겪는 편", score: -1 },
      { text: "스트레스를 받으면 거의 항상 겪음", score: -2 },
    ],
    axis: 'stress',
  },
  {
    id: 20,
    text: "자신의 작업물에 대해 예상치 못한 부정적인 피드백을 받았을 때?",
    options: [
      { text: "객관적으로 수용하고 개선점을 찾음", score: 2 },
      { text: "기분은 상하지만 업무로 받아들임", score: 1 },
      { text: "상처받지만 겉으로 티 내지 않으려 노력함", score: 0 },
      { text: "크게 상처받고 자존심이 상함", score: -1 },
      { text: "하루 종일 기분이 안 좋고 자책하게 됨", score: -2 },
    ],
    axis: 'stress',
  },
  {
    id: 21,
    text: "엘리베이터가 갑자기 멈췄을 때?",
    options: [
      { text: "침착하게 비상 버튼을 누름", score: 2 },
      { text: "약간 당황하지만 차분히 대처함", score: 1 },
      { text: "보통 정도로 불안함", score: 0 },
      { text: "상당히 불안하고 초조해짐", score: -1 },
      { text: "극도로 불안하고 공황 상태에 빠짐", score: -2 },
    ],
    axis: 'stress',
  },

  // 엔테로타입 (B/F) - 7문항
  {
    id: 22,
    text: "고기를 먹은 후 소화감은?",
    options: [
      { text: "매우 편안하고 포만감 좋음", score: 2 },
      { text: "소화 잘됨", score: 1 },
      { text: "보통", score: 0 },
      { text: "약간 무거운 느낌", score: -1 },
      { text: "소화 불편함", score: -2 },
    ],
    axis: 'enterotype',
  },
  {
    id: 23,
    text: "콩류/견과류를 먹으면?",
    options: [
      { text: "소화 불편함", score: 2 },
      { text: "별로 좋아하지 않음", score: 1 },
      { text: "보통", score: 0 },
      { text: "소화 잘됨", score: -1 },
      { text: "매우 편안함", score: -2 },
    ],
    axis: 'enterotype',
  },
  {
    id: 24,
    text: "자연스럽게 끌리는 음식은?",
    options: [
      { text: "육류, 생선, 계란 위주", score: 2 },
      { text: "단백질 위주 + 일부 탄수화물", score: 1 },
      { text: "균형잡힌 식단", score: 0 },
      { text: "채소, 과일, 곡물 위주", score: -1 },
      { text: "완전 식물성 식단 선호", score: -2 },
    ],
    axis: 'enterotype',
  },
  {
    id: 25,
    text: "유제품 섭취 후 느낌은?",
    options: [
      { text: "매우 좋음", score: 2 },
      { text: "괜찮음", score: 1 },
      { text: "보통", score: 0 },
      { text: "약간 불편함", score: -1 },
      { text: "소화 문제 있음", score: -2 },
    ],
    axis: 'enterotype',
  },
  {
    id: 26,
    text: "식후 에너지 수준 변화는?",
    options: [
      { text: "고기/생선 먹으면 에너지 충전됨", score: 2 },
      { text: "단백질 위주로 먹으면 활력 있음", score: 1 },
      { text: "골고루 먹으면 좋음", score: 0 },
      { text: "채소/곡물 위주로 먹으면 가벼움", score: -1 },
      { text: "식물성 식단에서 가장 컨디션 좋음", score: -2 },
    ],
    axis: 'enterotype',
  },
  {
    id: 27,
    text: "배가 고플 때 자연스럽게 끌리는 음식은?",
    options: [
      { text: "고기, 생선, 계란 요리", score: 2 },
      { text: "단백질이 풍부한 음식", score: 1 },
      { text: "특별한 선호 없음", score: 0 },
      { text: "빵, 밥, 과일", score: -1 },
      { text: "샐러드, 채소 요리", score: -2 },
    ],
    axis: 'enterotype',
  },
  {
    id: 28,
    text: "공복감을 느끼는 패턴은?",
    options: [
      { text: "고기/생선 먹어야 배부름", score: 2 },
      { text: "단백질 없으면 금세 배고파짐", score: 1 },
      { text: "보통", score: 0 },
      { text: "탄수화물/섬유질로도 포만감 오래감", score: -1 },
      { text: "식물성 식품만으로도 충분히 포만함", score: -2 },
    ],
    axis: 'enterotype',
  },

  // 운동 반응성 (P/A) - 10문항
  {
    id: 29,
    text: "더 재미있고 자연스러운 운동은?",
    options: [
      { text: "웨이트 트레이닝", score: 2 },
      { text: "스프린트, 점프 운동", score: 1 },
      { text: "둘 다 좋아함", score: 0 },
      { text: "조깅, 사이클링", score: -1 },
      { text: "장거리 유산소 운동", score: -2 },
    ],
    axis: 'exercise',
  },
  {
    id: 30,
    text: "격렬한 운동 후, 당신의 몸은 주로 어떻게 반응하나요?",
    options: [
      { text: "특정 근육에 며칠간 뻐근한 통증(근육통)이 남지만, 휴식 후 다시 강한 힘을 낼 수 있음", score: 2 },
      { text: "근육통은 있지만, 전반적인 피로감은 크지 않음", score: 1 },
      { text: "근육통과 전신 피로감이 비슷하게 나타남", score: 0 },
      { text: "근육통보다는 숨이 차고 지치는 전신 피로감이 더 큼", score: -1 },
      { text: "전반적으로 지치고 피곤하지만, 근육통 자체는 심하지 않으며 금방 회복됨", score: -2 },
    ],
    axis: 'exercise',
  },
  {
    id: 31,
    text: "일상에서 느끼는 자신의 신체 특성은?",
    options: [
      { text: "순간적인 힘은 강하지만 오래 못 버팀", score: 2 },
      { text: "무거운 것은 잘 들지만 금세 지침", score: 1 },
      { text: "둘 다 보통", score: 0 },
      { text: "가벼운 활동을 오래 할 수 있음", score: -1 },
      { text: "지치지 않고 계속 움직일 수 있음", score: -2 },
    ],
    axis: 'exercise',
  },
  {
    id: 32,
    text: "다음 중 어떤 상황에서 더 빨리 지치나요?",
    options: [
      { text: "가벼운 조깅을 20-30분 지속하기", score: 1 },
      { text: "무거운 짐 옮기기, 계단 몇 층 뛰어오르기", score: 0 },
      { text: "둘 다 비슷하게 힘듦", score: 0 },
      { text: "순간적으로 힘을 많이 써야 하는 일", score: -1 },
      { text: "잘 모르겠음", score: 0 },
    ],
    axis: 'exercise',
  },
  {
    id: 33,
    text: "어린 시절부터 자연스럽게 잘했던 활동은?",
    options: [
      { text: "씨름, 팔씨름, 단거리 달리기", score: 2 },
      { text: "순간적인 힘을 쓰는 운동", score: 1 },
      { text: "둘 다 잘함", score: 0 },
      { text: "오래 뛰기, 자전거 타기", score: -1 },
      { text: "마라톤, 등산 등 지구력 운동", score: -2 },
    ],
    axis: 'exercise',
  },
  {
    id: 34,
    text: "체육 시간이나 놀이에서 자연스럽게 좋아했던 것은?",
    options: [
      { text: "팔씨름, 단거리 달리기, 높이뛰기", score: 2 },
      { text: "순간적인 힘을 쓰는 활동", score: 1 },
      { text: "둘 다 좋아함", score: 0 },
      { text: "오래 달리기, 자전거 타기", score: -1 },
      { text: "지구력이 필요한 활동", score: -2 },
    ],
    axis: 'exercise',
  },
  {
    id: 35,
    text: "일상생활에서 어떤 활동이 더 자연스러운가요?",
    options: [
      { text: "계단 몇 층 빠르게 뛰어오르기", score: 1 },
      { text: "무거운 물건 잠깐 들기", score: 1 },
      { text: "둘 다 비슷함", score: 0 },
      { text: "천천히 오래 걸어다니기", score: -1 },
      { text: "가벼운 활동을 계속 지속하기", score: -2 },
    ],
    axis: 'exercise',
  },
  {
    id: 36,
    text: "학창시절 체력장에서 어떤 종목을 더 잘했나요?",
    options: [
      { text: "50m 달리기, 팔굽혀펴기", score: 2 },
      { text: "높이뛰기, 제자리멀리뛰기", score: 1 },
      { text: "기억이 안 남", score: 0 },
      { text: "오래달리기, 턱걸이", score: -1 },
      { text: "지구력 종목 전반", score: -2 },
    ],
    axis: 'exercise',
  },
  {
    id: 37,
    text: "같은 운동을 해도 다른 사람과 비교한 발달 속도는?",
    options: [
      { text: "근력/근육량이 빠르게 늘어남", score: 2 },
      { text: "무거운 걸 드는 능력이 빨리 향상됨", score: 1 },
      { text: "보통", score: 0 },
      { text: "지구력이 빠르게 향상됨", score: -1 },
      { text: "오래 버티는 능력이 남들보다 뛰어남", score: -2 },
    ],
    axis: 'exercise',
  },
  {
    id: 38,
    text: "운동 중 가장 자연스럽게 나오는 움직임은?",
    options: [
      { text: "폭발적이고 강한 동작", score: 2 },
      { text: "순간적인 파워를 내는 동작", score: 1 },
      { text: "둘 다", score: 0 },
      { text: "일정한 리듬의 지속적 동작", score: -1 },
      { text: "오랫동안 같은 강도를 유지하는 동작", score: -2 },
    ],
    axis: 'exercise',
  },
];

export const META_TYPE_DESCRIPTIONS: Record<MetaType, string> = {
  'ECBA': '창공의 독수리',
  'ECBP': '태양의 대장장이',
  'ECFA': '성실한 농부',
  'ECFP': '초원의 바위',
  'EIBA': '협곡의 급류',
  'EIBP': '일출의 돌격대장',
  'EIFA': '새벽의 탐험가',
  'EIFP': '정원의 개척자',
  'OCBA': '황혼의 추적자',
  'OCBP': '야행성 헌터',
  'OCFA': '달빛 아래의 순례자',
  'OCFP': '밤의 숲의 수호자',
  'OIBA': '지치지 않는 추격자',
  'OIBP': '미드나잇 워리어',
  'OIFA': '밤샘하는 크리에이터',
  'OIFP': '밤의 코뿔소'
};

// 유효성 검사 함수 (점수 범위 확장)
const validateAnswers = (answers: number[]): void => {
  const totalQuestions = Object.values(QUESTION_COUNTS).reduce((sum, count) => sum + count, 0);
  
  if (answers.length !== totalQuestions) {
    throw new Error(`Expected ${totalQuestions} answers, got ${answers.length}`);
  }
  
  for (let i = 0; i < answers.length; i++) {
    if (answers[i] < -3 || answers[i] > 3) {
      throw new Error(`Answer ${i + 1} is out of range: ${answers[i]}`);
    }
  }
};

// 축별 점수 계산
const calculateAxisScore = (answers: number[], axis: MetaTypeAxis): number => {
  const { start, count } = getQuestionRange(axis);
  const axisAnswers = answers.slice(start - 1, start - 1 + count);
  return axisAnswers.reduce((sum, score) => sum + score, 0);
};

// 축 값 결정
const determineAxisValue = (score: number, positive: string, negative: string): string => {
  return score >= 0 ? positive : negative;
};

// MetaType 유효성 검사
export const isValidMetaType = (type: string): type is MetaType => {
  const validPattern = /^[EO][CI][BF][PA]$/;
  return validPattern.test(type) && META_TYPE_DESCRIPTIONS[type as MetaType] !== undefined;
};

// 메인 계산 함수
export const calculateMetaType = (answers: number[]): MetaType => {
  validateAnswers(answers);
  
  // 각 축별 점수 계산 
  const chronotypeScore = calculateAxisScore(answers, 'chronotype');
  const stressScore = calculateAxisScore(answers, 'stress');
  const enterotypeScore = calculateAxisScore(answers, 'enterotype');
  const exerciseScore = calculateAxisScore(answers, 'exercise');
  
  // 각 축별 값 결정
  const chronotypeValue = determineAxisValue(chronotypeScore, 'E', 'O') as ChronotypeValue;
  const stressValue = determineAxisValue(stressScore, 'C', 'I') as StressValue;
  const enterotypeValue = determineAxisValue(enterotypeScore, 'B', 'F') as EnterotypeValue;
  const exerciseValue = determineAxisValue(exerciseScore, 'P', 'A') as ExerciseValue;
  
  // MetaType 조합
  const metaType = `${chronotypeValue}${stressValue}${enterotypeValue}${exerciseValue}` as MetaType;
  
  // 유효성 검사
  if (!isValidMetaType(metaType)) {
    throw new Error(`Invalid MetaType generated: ${metaType}`);
  }
  
  return metaType;
}; 
