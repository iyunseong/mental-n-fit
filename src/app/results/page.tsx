'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { calculateMetaType } from '@/lib/metaType';
import { TYPE_DETAILS, TypeDetail, Strategy, StrategyDetail, SummaryItem } from '@/lib/typeDetails';
import { 
  Home, 
  RefreshCw, 
  Share2, 
  Clock, 
  Zap, 
  Heart, 
  Activity,
  ArrowRight,
  Check,
  Star
} from 'lucide-react';

const MetaTypeResultPage = () => {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [metaType, setMetaType] = useState<string | null>(null);
  const [result, setResult] = useState<TypeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const axisInfo: Record<string, {
    name: string;
    color: string;
    bgColor: string;
    icon: React.ReactNode;
  }> = {
    E: { name: '아침형', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: <Clock className="w-4 h-4" /> },
    O: { name: '저녁형', color: 'text-purple-600', bgColor: 'bg-purple-50', icon: <Clock className="w-4 h-4" /> },
    C: { name: '차분형', color: 'text-green-600', bgColor: 'bg-green-50', icon: <Zap className="w-4 h-4" /> },
    I: { name: '민감형', color: 'text-red-600', bgColor: 'bg-red-50', icon: <Zap className="w-4 h-4" /> },
    B: { name: '단백질형', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: <Heart className="w-4 h-4" /> },
    F: { name: '섬유질형', color: 'text-teal-600', bgColor: 'bg-teal-50', icon: <Heart className="w-4 h-4" /> },
    P: { name: '파워형', color: 'text-indigo-600', bgColor: 'bg-indigo-50', icon: <Activity className="w-4 h-4" /> },
    A: { name: '지구력형', color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: <Activity className="w-4 h-4" /> }
  };

  // 답변 디코딩 함수
  const decodeAnswers = (encoded: string) => {
    try {
      // URL에서 encodeURIComponent로 인코딩된 JSON을 디코딩
      return JSON.parse(decodeURIComponent(encoded));
    } catch {
      try {
        // 혹시 base64로 인코딩된 경우를 위한 fallback
        return JSON.parse(atob(encoded));
      } catch {
        return null;
      }
    }
  };

  useEffect(() => {
    const answers = searchParams.get('answers');
    
    if (!answers) {
      setError('설문조사 결과를 찾을 수 없습니다. 설문을 다시 진행해주세요.');
      setLoading(false);
      return;
    }

    try {
      const decodedAnswers = decodeAnswers(answers);
      
      if (!decodedAnswers || !Array.isArray(decodedAnswers)) {
        setError('설문조사 데이터가 올바르지 않습니다. 설문을 다시 진행해주세요.');
        setLoading(false);
        return;
      }

      // MetaType 계산
      const calculatedMetaType = calculateMetaType(decodedAnswers);
      setMetaType(calculatedMetaType);
      
      // 계산된 MetaType의 데이터를 가져옴
      const typeData = TYPE_DETAILS[calculatedMetaType];
      
      if (!typeData) {
        setError(`${calculatedMetaType} 타입의 데이터를 찾을 수 없습니다.`);
        setLoading(false);
        return;
      }
      
      setResult(typeData);
      setLoading(false);
      
    } catch (err) {
      console.error('MetaType 계산 중 오류:', err);
      setError('결과를 계산하는 중 오류가 발생했습니다. 설문을 다시 진행해주세요.');
      setLoading(false);
    }
  }, [searchParams]);

  const handleShare = () => {
    if (!result) return;
    
    if (navigator.share) {
      navigator.share({
        title: `나는 ${result.title}!`,
        text: `mental-n-fit에서 나의 MetaType을 발견했어요: ${metaType} - ${result.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(`나는 ${result.title}! mental-n-fit에서 나의 MetaType ${metaType}을 확인해보세요!`);
      alert('링크가 복사되었습니다!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">결과를 분석중입니다...</p>
        </div>
      </div>
    );
  }

  if (error || !result || !metaType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md mx-4">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">결과를 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
            <Home className="w-5 h-5" />
            <span>홈으로</span>
          </Link>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex items-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>공유하기</span>
            </Button>
            <Link href="/survey">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>다시 테스트</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="text-8xl mb-4">{result.icon}</div>
          <div className="text-6xl font-bold text-gray-900 mb-2">{metaType}</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{result.title}</h1>
          <p className="text-lg text-gray-600 mb-6">{result.summaryTitle}</p>
          <p className="text-gray-700 leading-relaxed max-w-3xl mx-auto">
            {result.description}
          </p>
        </div>

        {/* MetaType 분석 */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            당신의 MetaType 분석
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(result.analysis).map(([axis, description]: [string, string]) => {
              const info = axisInfo[axis];
              return (
                <div key={axis} className={`${info.bgColor} rounded-xl p-4`}>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`${info.color} p-2 bg-white rounded-lg`}>
                      {info.icon}
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-gray-900">{axis}</span>
                      <span className={`ml-2 text-sm font-medium ${info.color}`}>
                        {info.name}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            전체 개요
          </button>
          <button
            onClick={() => setActiveTab('strategies')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'strategies'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            맞춤 전략
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'summary'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            핵심 요약
          </button>
        </div>

        {/* 탭 콘텐츠 */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {result.strategies?.map((strategy: Strategy, index: number) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="text-3xl">{strategy.categoryIcon}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{strategy.title}</h3>
                    <p className="text-gray-600">{strategy.category}</p>
                  </div>
                </div>
                
                <p className="text-gray-700 leading-relaxed mb-6">
                  {strategy.content}
                </p>

                {strategy.synergy && (
                  <div className="bg-blue-50 rounded-xl p-6 mb-6">
                    <h4 className="font-bold text-blue-900 mb-3 flex items-center">
                      <Star className="w-5 h-5 mr-2" />
                      시너지 효과
                    </h4>
                    <p className="text-blue-800 leading-relaxed">
                      {strategy.synergy}
                    </p>
                  </div>
                )}

                {strategy.details && (
                  <div className="space-y-4">
                    {strategy.details.map((detail: StrategyDetail, detailIndex: number) => (
                      <div key={detailIndex} className="border-l-4 border-gray-200 pl-6">
                        <h5 className="font-bold text-gray-900 mb-2">{detail.subtitle}</h5>
                        <p className="text-gray-700 leading-relaxed">{detail.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'strategies' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">상세 실행 전략</h3>
            <div className="space-y-6">
              {result.strategies?.map((strategy: Strategy, index: number) => (
                <div key={index}>
                  <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="text-2xl mr-3">{strategy.categoryIcon}</span>
                    {strategy.category} 전략
                  </h4>
                  <div className="grid gap-4">
                    {strategy.details?.map((detail: StrategyDetail, detailIndex: number) => (
                      <div key={detailIndex} className="bg-gray-50 rounded-xl p-6">
                        <div className="flex items-start space-x-3">
                          <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                            {detailIndex + 1}
                          </div>
                          <div>
                            <h5 className="font-bold text-gray-900 mb-2">{detail.subtitle}</h5>
                            <p className="text-gray-700 leading-relaxed">{detail.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">핵심 실행 가이드</h3>
              <div className="space-y-4">
                {result.summaryTable?.map((item: SummaryItem, index: number) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">{item.category}</h4>
                      <p className="text-gray-700 leading-relaxed">{item.strategy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
              <h3 className="text-2xl font-bold mb-4">당신을 위한 메시지</h3>
              <p className="text-lg leading-relaxed opacity-95">
                {result.closingMessage}
              </p>
            </div>
          </div>
        )}

        {/* 다음 단계 CTA */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              이제 실천해볼까요?
            </h3>
            <p className="text-gray-600 mb-6">
              당신만의 맞춤 식단과 운동 프로그램을 받아보세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="primary" 
                size="lg"
                className="group"
              >
                맞춤 프로그램 받기
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={handleShare}
              >
                친구에게 공유하기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetaTypeResultPage; 