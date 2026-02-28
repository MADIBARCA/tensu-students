import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from '@/components/Layout';
import { Card } from '@/components/ui';
import { useI18n } from '@/i18n/i18n';
import { ChevronDown, ChevronUp, Calendar, MapPin, TrendingUp, BarChart3 } from 'lucide-react';
import { attendanceApi } from '@/functions/axios/axiosFunctions';
import type { AttendanceRecordResponse } from '@/functions/axios/responses';

interface AttendanceRecord {
  id: number;
  checkin_date: string;
  club_name: string | null;
  section_name?: string | null;
}

interface AttendanceStats {
  visits_this_month: number;
  missed_this_month: number;
  average_attendance: number;
}

export const AttendanceHistorySection: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAttendance = async () => {
      try {
        const tg = window.Telegram?.WebApp;
        const token = tg?.initData || null;
        
        // Load attendance records and stats in parallel
        const [recordsResponse, statsResponse] = await Promise.all([
          attendanceApi.getHistory(token, 1, 10),
          attendanceApi.getStats(token),
        ]);
        
        // Map API response to component format
        const mappedAttendance: AttendanceRecord[] = recordsResponse.data.records.map((r: AttendanceRecordResponse) => ({
          id: r.id,
          checkin_date: r.checkin_date + (r.checkin_time ? `T${r.checkin_time}` : ''),
          club_name: r.club_name,
          section_name: r.section_name,
        }));
        
        setAttendance(mappedAttendance);
        setStats({
          visits_this_month: statsResponse.data.visits_this_month,
          missed_this_month: statsResponse.data.missed_this_month,
          average_attendance: statsResponse.data.average_attendance,
        });
      } catch (error) {
        console.error('Failed to load attendance:', error);
        setAttendance([]);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    loadAttendance();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="mb-4">
        <SectionHeader title={t('profile.attendance')} />
        <div className="text-center py-4 text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  if (attendance.length === 0) {
    return (
      <div className="mb-4">
        <SectionHeader title={t('profile.attendance')} />
        <Card className="text-center py-10 px-6 bg-gradient-to-br from-blue-50/50 to-white border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-8 text-[#1E3A8A]/5">
            <TrendingUp size={120} />
          </div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Calendar size={28} className="text-[#1E3A8A]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Начните свой путь</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-[240px] mx-auto leading-relaxed">
              У вас пока нет посещений. Запишитесь на первую тренировку и отслеживайте свой прогресс здесь.
            </p>
            <button 
              onClick={() => navigate('/student/schedule')}
              className="bg-[#1E3A8A] text-white px-6 py-2.5 rounded-xl font-medium shadow-sm hover:bg-[#1E3A8A]/90 transition-colors"
            >
              Записаться на тренировку
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const recentVisits = attendance.slice(0, 5);

  return (
    <div className="mb-4">
      <Card
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('profile.attendance')}</h2>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-200">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-[#1E3A8A]" />
                <span className="text-xs text-gray-600">Посещений за месяц</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{stats.visits_this_month}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 size={16} className="text-[#DC2626]" />
                <span className="text-xs text-gray-600">Пропусков за месяц</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{stats.missed_this_month}</p>
            </div>
            <div className="col-span-2 bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 size={16} className="text-gray-600" />
                <span className="text-xs text-gray-600">Средняя посещаемость</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{stats.average_attendance}%</p>
            </div>
          </div>
        )}

        {/* Recent Visits */}
        {!isExpanded && (
          <div className="space-y-3">
            {recentVisits.map((record) => (
              <div key={record.id} className="flex flex-col gap-1 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Calendar size={14} className="text-[#1E3A8A]" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{record.club_name || 'Клуб'}</p>
                      {record.section_name && (
                        <p className="text-gray-500 text-xs mt-0.5">{record.section_name}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[#1E3A8A] font-medium text-xs bg-white px-2 py-1 rounded-md shadow-sm border border-black/5 whitespace-nowrap">
                    {formatDate(record.checkin_date).split(',')[0]} {/* Example split depending on format */}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full List */}
        {isExpanded && (
          <div className="space-y-3 pt-4 border-t border-gray-200">
            {attendance.map((record) => (
              <div key={record.id} className="pb-3 last:pb-0 border-b border-gray-100 last:border-0">
                <div className="flex items-start gap-3">
                  <Calendar size={16} className="text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{record.club_name || 'Клуб'}</p>
                    {record.section_name && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                        <MapPin size={12} />
                        <span>{record.section_name}</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(record.checkin_date)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
