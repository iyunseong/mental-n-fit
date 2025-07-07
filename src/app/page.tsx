// src/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Brain, Heart, Target, Users, Clock, Activity, Zap, CheckCircle, Menu, X } from 'lucide-react';
import { auth } from '@/lib/supabase';
import { UserProfile } from '@/lib/authTypes';

const LandingPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // 사용자 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await auth.getCurrentUser();
        setUser(currentUser);
        
        // 사용자가 있으면 프로필 정보도 가져오기
        if (currentUser) {
          const userProfile = await auth.getUserProfile(currentUser.id);
          setProfile(userProfile);
        }
      } catch (error) {
        console.error('인증 상태 확인 실패:', error);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                mental-n-fit
              </h1>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('features')} className="text-gray-600 hover:text-blue-600 transition-colors">
                특징
              </button>
              <Link href="/survey" className="text-gray-600 hover:text-blue-600 transition-colors">
                MetaType 16
              </Link>
              <button onClick={() => scrollToSection('how-it-works')} className="text-gray-600 hover:text-blue-600 transition-colors">
                작동원리
              </button>
              
              {/* 인증 관련 버튼들 */}
              {authLoading ? (
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">안녕하세요, {profile?.nickname || user.email?.split('@')[0]}님!</span>
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm">
                      대시보드
                    </Button>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-gray-900 text-sm"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link href="/login">
                    <Button variant="outline" size="sm">
                      로그인
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="primary" size="sm">
                      회원가입
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 space-y-4">
              <button 
                onClick={() => {
                  scrollToSection('features');
                  setIsMobileMenuOpen(false);
                }} 
                className="block w-full text-left px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                특징
              </button>
              <Link 
                href="/survey"
                className="block w-full text-left px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                MetaType 16
              </Link>
              <button 
                onClick={() => {
                  scrollToSection('how-it-works');
                  setIsMobileMenuOpen(false);
                }} 
                className="block w-full text-left px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                작동원리
              </button>
              
              {/* 모바일 인증 버튼들 */}
              {authLoading ? (
                <div className="flex justify-center px-4 py-2">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : user ? (
                <div className="px-4 py-2 space-y-4">
                  <div className="text-sm text-gray-700 text-center">
                    안녕하세요, {profile?.nickname || user.email?.split('@')[0]}님!
                  </div>
                  <Link 
                    href="/dashboard"
                    className="block w-full"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      대시보드
                    </Button>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-center py-2 text-gray-600 hover:text-gray-900"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <div className="px-4 py-2 space-y-4">
                  <Link 
                    href="/login"
                    className="block w-full"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      로그인
                    </Button>
                  </Link>
                  <Link 
                    href="/register"
                    className="block w-full"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button variant="primary" size="sm" className="w-full">
                      회원가입
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  <Zap className="w-4 h-4 mr-2" />
                  과학적 개인 맞춤 분석
                </div>
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                  당신의 
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {" "}MetaType 16
                  </span>을<br />
                  발견하세요
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  생체리듬, 스트레스 반응, 장내 미생물, 운동 특성을 분석하여<br />
                  <strong className="text-gray-900">완전히 개인화된</strong> 건강 솔루션을 제공합니다
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/survey">
                  <Button 
                    variant="primary" 
                    size="lg"
                    className="group"
                  >
                    무료 MetaType 진단 시작
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <button 
                  onClick={() => scrollToSection('features')}
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  5분 미리보기
                </button>
              </div>

              <div className="flex items-center space-x-8 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>100% 무료</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>과학적 근거</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>개인정보 보호</span>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* 시각적 요소 */}
              <div className="relative w-full max-w-lg mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl transform rotate-6 opacity-20"></div>
                <div className="relative bg-white rounded-3xl shadow-2xl p-8">
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl mx-auto flex items-center justify-center">
                      <Brain className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">16가지 고유 타입</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {['ECBP', 'EIBP', 'ECFP', 'EIFP', 'ECBA', 'EIBA', 'ECFA', 'EIFA', 
                        'OCBP', 'OIBP', 'OCFP', 'OIFP', 'OCBA', 'OIBA', 'OCFA', 'OIFA'].map((type) => (
                        <div key={type} className="bg-gray-100 rounded-lg py-2 px-1 text-xs font-mono text-gray-700">
                          {type}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">
                      당신만의 고유한 건강 프로필을 찾아보세요
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MetaType 4 Axes Section */}
      <section id="metatype" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-gray-900">
              4가지 핵심 축으로 분석하는 MetaType 16
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              각각의 축이 당신의 건강에 미치는 영향을 과학적으로 분석합니다
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">크로노타입</h3>
              <p className="text-gray-600 mb-4">생체리듬과 최적의 활동 시간대</p>
              <div className="space-y-2 text-sm text-gray-500">
                <div>• E: 아침형 (Early)</div>
                <div>• O: 저녁형 (Overnight)</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">스트레스 반응성</h3>
              <p className="text-gray-600 mb-4">스트레스 상황에 대한 민감도</p>
              <div className="space-y-2 text-sm text-gray-500">
                <div>• C: 차분형 (Calm)</div>
                <div>• I: 민감형 (Intense)</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">엔테로타입</h3>
              <p className="text-gray-600 mb-4">장내 미생물과 소화 특성</p>
              <div className="space-y-2 text-sm text-gray-500">
                <div>• B: 단백질형 (Bacteroides)</div>
                <div>• F: 섬유질형 (Fiber)</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">운동 반응성</h3>
              <p className="text-gray-600 mb-4">근섬유 타입과 운동 특성</p>
              <div className="space-y-2 text-sm text-gray-500">
                <div>• P: 파워형 (Power)</div>
                <div>• A: 지구력형 (Aerobic)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-gray-900">
              왜 mental-n-fit인가요?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              단순한 건강 앱이 아닌, 당신만을 위한 완전한 건강 파트너입니다
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">개인 맞춤 추천</h3>
              <p className="text-gray-600 leading-relaxed">
                당신의 MetaType에 기반한 완전히 개인화된 식단과 운동을 추천합니다. 
                더 이상 남의 성공 사례를 따라하지 마세요.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mx-auto flex items-center justify-center">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">과학적 근거</h3>
              <p className="text-gray-600 leading-relaxed">
                생체리듬 연구, 장내 미생물학, 운동생리학 등 최신 과학 연구를 
                바탕으로 한 검증된 방법론을 사용합니다.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">지속 가능한 관리</h3>
              <p className="text-gray-600 leading-relaxed">
                단기간 다이어트가 아닌 평생 건강한 라이프스타일을 만들어갑니다. 
                진행도 추적과 커뮤니티로 동기부여를 유지하세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-gray-900">
              3단계로 시작하는 건강한 변화
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold">
                  1
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">MetaType 진단</h3>
                <p className="text-gray-600">
                  38개 질문으로 당신의 고유한 특성을 분석합니다 (약 5분 소요)
                </p>
              </div>
            </div>

            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold">
                  2
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">맞춤 계획 수립</h3>
                <p className="text-gray-600">
                  당신의 MetaType에 최적화된 식단과 운동 계획을 받아보세요
                </p>
              </div>
            </div>

            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-green-500 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold">
                  3
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">실행 & 성장</h3>
                <p className="text-gray-600">
                  일일 추적과 레벨링 시스템으로 꾸준한 성장을 경험하세요
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              당신만의 건강 여정을<br />
              지금 시작하세요
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              5분의 투자로 평생 건강의 답을 찾으세요.<br />
              무료로 시작할 수 있습니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/survey">
                <Button 
                  variant="secondary"
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-50 group"
                >
                  무료 MetaType 진단 시작
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <button 
                onClick={() => scrollToSection('features')}
                className="inline-flex items-center justify-center px-6 py-3 border border-white rounded-lg text-base font-medium text-white hover:bg-white hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
              >
                더 자세히 알아보기
              </button>
            </div>
            <p className="text-sm text-blue-200">
              이미 <strong>1,000+</strong>명이 자신의 MetaType을 발견했습니다
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">mental-n-fit</h3>
              </div>
              <p className="text-gray-400">
                마음과 몸의 균형잡힌 건강을 위한 개인 맞춤 솔루션
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">서비스</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">MetaType 진단</a></li>
                <li><a href="#" className="hover:text-white transition-colors">맞춤 추천</a></li>
                <li><a href="#" className="hover:text-white transition-colors">진행도 추적</a></li>
                <li><a href="#" className="hover:text-white transition-colors">커뮤니티</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">지원</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">도움말</a></li>
                <li><a href="#" className="hover:text-white transition-colors">문의하기</a></li>
                <li><a href="#" className="hover:text-white transition-colors">개인정보처리방침</a></li>
                <li><a href="#" className="hover:text-white transition-colors">이용약관</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">연락처</h4>
              <div className="space-y-2 text-gray-400">
                <p>이메일: hello@mental-n-fit.com</p>
                <p>전화: 02-1234-5678</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 mental-n-fit. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
