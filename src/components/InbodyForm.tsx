// src/components/inbodyForm.jsx
import React, { useState } from 'react';
import { supabase, auth } from '@/lib/supabase';

interface InbodyFormProps {
  onDataSaved?: () => void;
}

const InbodyForm: React.FC<InbodyFormProps> = ({ onDataSaved }) => {
  const [formData, setFormData] = useState({
    log_date: '',
    weight_kg: '',
    skeletal_muscle_mass_kg: '',
    body_fat_percentage: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 폼 입력 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      // 현재 로그인된 사용자 확인
      const currentUser = await auth.getCurrentUser();
      if (!currentUser) {
        throw new Error('로그인이 필요합니다.');
      }

      // user_id를 포함한 데이터 준비
      const dataToInsert = {
        ...formData,
        user_id: currentUser.id,
        // 빈 문자열을 null로 변환
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        skeletal_muscle_mass_kg: formData.skeletal_muscle_mass_kg ? parseFloat(formData.skeletal_muscle_mass_kg) : null,
        body_fat_percentage: formData.body_fat_percentage ? parseFloat(formData.body_fat_percentage) : null
      };

      // Supabase에 InBody 데이터 저장 (중복 날짜는 업데이트)
      const { error } = await supabase
        .from('inbody_logs')
        .upsert(dataToInsert, { onConflict: 'user_id, log_date' });

      // Supabase 에러 확인
      if (error) {
        console.error('Supabase 에러 상세:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      // 성공 메시지
      setMessage('InBody 기록이 성공적으로 저장되었습니다!');
      
      // 부모 컴포넌트에 데이터 저장 완료 알림
      if (onDataSaved) {
        onDataSaved();
      }
      
      // 폼 초기화
      setFormData({
        log_date: '',
        weight_kg: '',
        skeletal_muscle_mass_kg: '',
        body_fat_percentage: ''
      });
    } catch (err) {
      setError('기록 저장 중 오류가 발생했습니다.');
      console.error('InBody 저장 오류:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        InBody 기록 입력
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 측정 날짜 */}
        <div>
          <label htmlFor="log_date" className="block text-sm font-medium text-gray-700 mb-1">
            측정 날짜
          </label>
          <input
            type="date"
            id="log_date"
            name="log_date"
            value={formData.log_date}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 체중 */}
        <div>
          <label htmlFor="weight_kg" className="block text-sm font-medium text-gray-700 mb-1">
            체중 (kg)
          </label>
          <input
            type="number"
            id="weight_kg"
            name="weight_kg"
            value={formData.weight_kg}
            onChange={handleChange}
            step="0.1"
            min="0"
            placeholder="예: 70.5"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 골격근량 */}
        <div>
          <label htmlFor="skeletal_muscle_mass_kg" className="block text-sm font-medium text-gray-700 mb-1">
            골격근량 (kg)
          </label>
          <input
            type="number"
            id="skeletal_muscle_mass_kg"
            name="skeletal_muscle_mass_kg"
            value={formData.skeletal_muscle_mass_kg}
            onChange={handleChange}
            step="0.1"
            min="0"
            placeholder="예: 32.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 체지방률 */}
        <div>
          <label htmlFor="body_fat_percentage" className="block text-sm font-medium text-gray-700 mb-1">
            체지방률 (%)
          </label>
          <input
            type="number"
            id="body_fat_percentage"
            name="body_fat_percentage"
            value={formData.body_fat_percentage}
            onChange={handleChange}
            step="0.1"
            min="0"
            max="100"
            placeholder="예: 15.3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {/* 성공 메시지 */}
        {message && (
          <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-md">
            {message}
          </div>
        )}

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? '저장 중...' : 'Save Record'}
        </button>
      </form>

      {/* 도움말 텍스트 */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>InBody 측정기의 결과를 정확히 입력해주세요.</p>
        <p>모든 값은 선택사항이며, 측정된 항목만 입력하셔도 됩니다.</p>
      </div>
    </div>
  );
};

export default InbodyForm; 