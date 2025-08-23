// @ts-nocheck
"use client"
// migrated from .jsx to .tsx
import React, { useState, useEffect } from 'react';
import { supabase, auth } from '@/lib/supabase';
import { Calendar, Heart, Battery, Moon, Save, RefreshCw, BookOpen, X } from 'lucide-react';

const DailyConditionForm = ({ 
  onDataSaved, 
  logToEdit = null, 
  selectedDate = null, 
  onSave = null, 
  onCancel = null 
}) => {
  const isEditMode = logToEdit !== null;
  const initialDate = selectedDate || logToEdit?.log_date || new Date().toISOString().split('T')[0];
  const [logDate, setLogDate] = useState(initialDate);
  const [overallMood, setOverallMood] = useState('normal');
  const [fatigueLevel, setFatigueLevel] = useState('medium');
  const [sleepQuality, setSleepQuality] = useState('normal');
  const [diaryEntry, setDiaryEntry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [existingRecord, setExistingRecord] = useState(null);

  const moodOptions = [
    { value: 'great', label: '최고', emoji: '🤩', color: 'text-green-600' },
    { value: 'good', label: '좋음', emoji: '😊', color: 'text-blue-600' },
    { value: 'normal', label: '보통', emoji: '😐', color: 'text-gray-600' },
    { value: 'bad', label: '나쁨', emoji: '😔', color: 'text-orange-600' },
    { value: 'awful', label: '최악', emoji: '😵', color: 'text-red-600' }
  ];

  const fatigueOptions = [
    { value: 'low', label: '낮음', emoji: '⚡', color: 'text-green-600' },
    { value: 'medium', label: '보통', emoji: '🔋', color: 'text-yellow-600' },
    { value: 'high', label: '높음', emoji: '🪫', color: 'text-red-600' }
  ];

  const sleepOptions = [
    { value: 'good', label: '좋음', emoji: '😴', color: 'text-green-600' },
    { value: 'normal', label: '보통', emoji: '😪', color: 'text-yellow-600' },
    { value: 'bad', label: '나쁨', emoji: '😖', color: 'text-red-600' }
  ];

  const fetchExistingData = async (date) => {
    try {
      setIsLoading(true);
      setError('');
      const currentUser = await auth.getCurrentUser();
      if (!currentUser) throw new Error('로그인이 필요합니다.');
      const { data, error: fetchError } = await supabase
        .from('daily_conditions')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('log_date', date)
        .order('created_at', { ascending: false })
        .limit(1);
      if (fetchError) throw fetchError;
      const record = Array.isArray(data) && data.length > 0 ? data[0] : null;
      if (record) {
        setExistingRecord(record);
        setOverallMood(record.overall_mood);
        setFatigueLevel(record.fatigue_level);
        setSleepQuality(record.sleep_quality);
        setDiaryEntry(record.diary_entry || '');
      } else {
        setExistingRecord(null);
        setOverallMood('normal');
        setFatigueLevel('medium');
        setSleepQuality('normal');
        setDiaryEntry('');
      }
    } catch (err) {
      console.error('데이터 가져오기 오류:', err);
      setError(err.message || '데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isEditMode && logToEdit) {
      setLogDate(logToEdit.log_date);
      setOverallMood(logToEdit.overall_mood);
      setFatigueLevel(logToEdit.fatigue_level);
      setSleepQuality(logToEdit.sleep_quality);
      setDiaryEntry(logToEdit.diary_entry || '');
      setExistingRecord(logToEdit);
    } else if (selectedDate) {
      setLogDate(selectedDate);
      fetchExistingData(selectedDate);
    } else if (logDate) {
      fetchExistingData(logDate);
    }
  }, [selectedDate, logToEdit, isEditMode]);

  useEffect(() => {
    if (!isEditMode && !selectedDate && logDate) {
      fetchExistingData(logDate);
    }
  }, [logDate, isEditMode, selectedDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError('');
      setMessage('');
      const currentUser = await auth.getCurrentUser();
      if (!currentUser) throw new Error('로그인이 필요합니다.');
      const conditionData = {
        user_id: currentUser.id,
        log_date: logDate,
        overall_mood: overallMood,
        fatigue_level: fatigueLevel,
        sleep_quality: sleepQuality,
        diary_entry: diaryEntry,
        updated_at: new Date().toISOString()
      };
      const { data, error: upsertError } = await supabase
        .from('daily_conditions')
        .upsert(conditionData, { onConflict: 'user_id, log_date' })
        .select()
        .single();
      if (upsertError) throw upsertError;
      setExistingRecord(data);
      setMessage(existingRecord ? '컨디션과 일기가 성공적으로 업데이트되었습니다!' : '컨디션과 일기가 성공적으로 저장되었습니다!');
      if (onSave) setTimeout(() => onSave(), 1000);
      if (onDataSaved) onDataSaved();
    } catch (err) {
      console.error('컨디션 저장 오류:', err);
      setError(err.message || '컨디션 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => { if (onCancel) onCancel(); };

  return (
    <div className={`${isEditMode ? '' : 'max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md'}`}>
      {!isEditMode && (
        <div className="flex items-center space-x-2 mb-6">
          <Heart className="w-6 h-6 text-pink-500" />
          <h2 className="text-2xl font-bold text-gray-800">데일리 컨디션 & 일기</h2>
        </div>
      )}
      {message && (
        <div className="p-3 mb-6 rounded-lg bg-green-100 text-green-700 border border-green-200">{message}</div>
      )}
      {error && (
        <div className="p-3 mb-6 rounded-lg bg-red-100 text-red-700 border border-red-200">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4" />
            <span>날짜 선택</span>
          </label>
          <input
            type="date"
            value={logDate}
            onChange={(e) => !isEditMode && !selectedDate && setLogDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            disabled={isLoading || isEditMode || selectedDate}
            readOnly={isEditMode || selectedDate}
          />
          {existingRecord && !isEditMode && (
            <p className="text-sm text-blue-600 mt-1">ℹ️ 이 날짜에 이미 기록이 있습니다. 수정 후 저장하면 업데이트됩니다.</p>
          )}
        </div>
        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-pink-500" />
            <p className="text-gray-600">데이터를 불러오는 중...</p>
          </div>
        ) : (
          <>
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                <Heart className="w-4 h-4" />
                <span>전반적인 기분</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {moodOptions.map((option) => (
                  <label key={option.value} className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${overallMood === option.value ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="overallMood" value={option.value} checked={overallMood === option.value} onChange={(e) => setOverallMood(e.target.value)} className="sr-only" />
                    <span className="text-2xl mb-1">{option.emoji}</span>
                    <span className={`text-sm font-medium ${option.color}`}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                <Battery className="w-4 h-4" />
                <span>피로도</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {fatigueOptions.map((option) => (
                  <label key={option.value} className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${fatigueLevel === option.value ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="fatigueLevel" value={option.value} checked={fatigueLevel === option.value} onChange={(e) => setFatigueLevel(e.target.value)} className="sr-only" />
                    <span className="text-2xl mb-1">{option.emoji}</span>
                    <span className={`text-sm font-medium ${option.color}`}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                <Moon className="w-4 h-4" />
                <span>수면의 질</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {sleepOptions.map((option) => (
                  <label key={option.value} className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${sleepQuality === option.value ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="sleepQuality" value={option.value} checked={sleepQuality === option.value} onChange={(e) => setSleepQuality(e.target.value)} className="sr-only" />
                    <span className="text-2xl mb-1">{option.emoji}</span>
                    <span className={`text-sm font-medium ${option.color}`}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                <BookOpen className="w-4 h-4" />
                <span>오늘의 일기</span>
              </label>
              <textarea value={diaryEntry} onChange={(e) => setDiaryEntry(e.target.value)} placeholder="오늘 하루는 어땠나요? 자유롭게 기록해보세요..." className="w-full min-h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-vertical" rows={4} />
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>💡 기분, 생각, 특별한 일들을 자유롭게 써보세요</span>
                <span>{diaryEntry.length} 글자</span>
              </div>
            </div>
            <div className={`flex ${isEditMode ? 'justify-between' : 'justify-end'} pt-4`}>
              {isEditMode && onCancel && (
                <button type="button" onClick={handleCancel} className="flex items-center space-x-2 px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors">
                  <X className="w-4 h-4" />
                  <span>취소</span>
                </button>
              )}
              <button type="submit" disabled={isSaving} className="flex items-center space-x-2 px-6 py-3 bg-pink-500 text-white rounded-md hover:bg-pink-600 disabled:bg-gray-400 transition-colors">
                <Save className="w-4 h-4" />
                <span>{isSaving ? '저장 중...' : existingRecord ? '컨디션 & 일기 업데이트' : '컨디션 & 일기 저장'}</span>
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default DailyConditionForm;


