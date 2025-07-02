// src/app/survey/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Home } from 'lucide-react';
import { QUESTIONS } from '@/lib/metaType';

export default function SurveyPage() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('surveyAnswers');
      return saved ? JSON.parse(saved) : Array(QUESTIONS.length).fill(0);
    }
    return Array(QUESTIONS.length).fill(0);
  });
  const [isCalculating, setIsCalculating] = useState(false);

  // 답변 저장
  useEffect(() => {
    localStorage.setItem('surveyAnswers', JSON.stringify(answers));
  }, [answers]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const num = parseInt(e.key);
      if (num >= 1 && num <= QUESTIONS[currentQuestion].options.length) {
        handleAnswer(QUESTIONS[currentQuestion].options[num - 1].score);
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentQuestion]);

  const handleAnswer = async (score: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = score;
    setAnswers(newAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setIsCalculating(true);
      // 계산이 복잡할 수 있으니 약간의 지연
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 결과 페이지로 이동
      const answersParam = encodeURIComponent(JSON.stringify(newAnswers));
      router.push(`/results?answers=${answersParam}`);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const getProgress = () => {
    return Math.round(((currentQuestion + 1) / QUESTIONS.length) * 100);
  };

  const question = QUESTIONS[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Navigation */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              {currentQuestion > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  className="text-gray-600 hover:text-blue-600"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  이전
                </Button>
              )}
            </div>
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="text-gray-600 hover:text-blue-600"
              >
                <Home className="w-4 h-4 mr-2" />
                홈으로
              </Button>
            </Link>
          </div>

          {/* 진행률 표시 */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>진행률</span>
              <span>{getProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
          </div>

          {/* 질문 */}
          <div className="transition-all duration-300 transform">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8">
              {question.text}
            </h2>

            {/* 답변 옵션 */}
            <div className="space-y-4">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option.score)}
                  className="w-full p-4 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-colors"
                >
                  <span className="text-gray-500 mr-2">[{index + 1}]</span>
                  {option.text}
                </button>
              ))}
            </div>

            {/* 이전 버튼 */}
            {currentQuestion > 0 && (
              <div className="mt-8">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                >
                  이전
                </Button>
              </div>
            )}
          </div>

          {/* 로딩 상태 */}
          {isCalculating && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <div className="flex items-center space-x-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-lg">결과를 계산중입니다...</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 