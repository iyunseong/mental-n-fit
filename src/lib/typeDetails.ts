// MetaType 결과 데이터 타입 정의
export interface TypeDetail {
  title: string;
  icon: string;
  summaryTitle: string;
  description: string;
  analysis: {
    [key: string]: string;
  };
  strategies: Strategy[];
  summaryTable: SummaryItem[];
  closingMessage: string;
}

export interface Strategy {
  category: string;
  categoryIcon: string;
  title: string;
  content: string;
  synergy?: string;
  details?: StrategyDetail[];
}

export interface StrategyDetail {
  subtitle: string;
  text: string;
}

export interface SummaryItem {
  category: string;
  strategy: string;
}

// JSON 파일들 import
import ECBA from './datas/ECBA.json';
import ECBP from './datas/ECBP.json';
import ECFA from './datas/ECFA.json';
import ECFP from './datas/ECFP.json';
import EIBA from './datas/EIBA.json';
import EIBP from './datas/EIBP.json';
import EIFA from './datas/EIFA.json';
import EIFP from './datas/EIFP.json';
import OCBA from './datas/OCBA.json';
import OCBP from './datas/OCBP.json';
import OCFA from './datas/OCFA.json';
import OCFP from './datas/OCFP.json';
import OIBA from './datas/OIBA.json';
import OIBP from './datas/OIBP.json';
import OIFA from './datas/OIFA.json';
import OIFP from './datas/OIFP.json';

// MetaType별 상세 정보 - JSON 파일들을 결합
export const TYPE_DETAILS: Record<string, TypeDetail> = {
  ECBA: ECBA.ECBA,
  ECBP: ECBP.ECBP,
  ECFA: ECFA.ECFA,
  ECFP: ECFP.ECFP,
  EIBA: EIBA.EIBA,
  EIBP: EIBP.EIBP,
  EIFA: EIFA.EIFA,
  EIFP: EIFP.EIFP,
  OCBA: OCBA.OCBA,
  OCBP: OCBP.OCBP,
  OCFA: OCFA.OCFA,
  OCFP: OCFP.OCFP,
  OIBA: OIBA.OIBA,
  OIBP: OIBP.OIBP,
  OIFA: OIFA.OIFA,
  OIFP: OIFP.OIFP,
}; 