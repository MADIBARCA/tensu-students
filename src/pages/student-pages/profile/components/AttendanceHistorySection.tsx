import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui';
import { useI18n } from '@/i18n/i18n';
import { Calendar, TrendingUp, BarChart3, Loader2, ChevronRight } from 'lucide-react';
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
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [recent, setRecent] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVisits, setTotalVisits] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const tg = window.Telegram?.WebApp;
        const token = tg?.initData || null;

        const [statsRes, recordsRes] = await Promise.all([
          attendanceApi.getStats(token),
          attendanceApi.getHistory(token, 1, 3),
        ]);

        setStats({
          visits_this_month: statsRes.data.visits_this_month,
          missed_this_month: statsRes.data.missed_this_month,
          average_attendance: statsRes.data.average_attendance,
        });

        setRecent(
          recordsRes.data.records.map((r: AttendanceRecordResponse) => ({
            id: r.id,
            checkin_date: r.checkin_date + (r.checkin_time ? `T${r.checkin_time}` : ''),
            club_name: r.club_name,
            section_name: r.section_name,
          }))
        );
        setTotalVisits(recordsRes.data.total);
      } catch {
        setStats(null);
        setRecent([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="mb-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (totalVisits === 0) {
    return (
      <div className="mb-4">
        <Card className="text-center py-10 px-6 bg-linear-to-br from-blue-50/50 to-white border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-8 text-[#1E3A8A]/5">
            <TrendingUp size={120} />
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Calendar size={28} className="text-[#1E3A8A]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('profile.attendance.emptyTitle')}</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-[240px] mx-auto leading-relaxed">
              {t('profile.attendance.emptyDesc')}
            </p>
            <button
              onClick={() => navigate('/student/schedule')}
              className="bg-[#1E3A8A] text-white px-6 py-2.5 rounded-xl font-medium shadow-sm hover:bg-[#1E3A8A]/90 transition-colors"
            >
              {t('profile.attendance.emptyAction')}
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('profile.attendance')}</h2>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-blue-50 rounded-xl p-2.5 text-center">
              <TrendingUp size={16} className="text-[#1E3A8A] mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900">{stats.visits_this_month}</p>
              <p className="text-[10px] text-gray-500 font-medium leading-tight">{t('profile.attendance.visitsMonth')}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-2.5 text-center">
              <BarChart3 size={16} className="text-[#DC2626] mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900">{stats.missed_this_month}</p>
              <p className="text-[10px] text-gray-500 font-medium leading-tight">{t('profile.attendance.missedMonth')}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-2.5 text-center">
              <BarChart3 size={16} className="text-gray-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900">{stats.average_attendance}%</p>
              <p className="text-[10px] text-gray-500 font-medium leading-tight">{t('profile.attendance.average')}</p>
            </div>
          </div>
        )}

        {/* Recent Visits Preview */}
        <div className="space-y-2 mb-3">
          {recent.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Calendar size={14} className="text-[#1E3A8A]" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-[13px]">{record.club_name || 'Клуб'}</p>
                  {record.section_name && (
                    <p className="text-gray-500 text-[11px] mt-0.5">{record.section_name}</p>
                  )}
                </div>
              </div>
              <span className="text-[#1E3A8A] font-semibold text-[11px] shrink-0 ml-2">
                {formatDate(record.checkin_date)}
              </span>
            </div>
          ))}
        </div>

        {/* "View All" Button */}
        <button
          onClick={() => navigate('/student/attendance')}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl text-[14px] font-semibold text-[#1E3A8A] transition-colors border border-gray-100"
        >
          {t('profile.attendance.viewAll')}
          <ChevronRight size={16} />
        </button>
      </Card>
    </div>
  );
};
