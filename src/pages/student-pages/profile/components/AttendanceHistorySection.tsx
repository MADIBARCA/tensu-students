import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui';
import { useI18n } from '@/i18n/i18n';
import { Calendar, TrendingUp, BarChart3, Loader2, CalendarRange } from 'lucide-react';
import { attendanceApi } from '@/functions/axios/axiosFunctions';
import type { AttendanceRecordResponse } from '@/functions/axios/responses';

type PeriodTab = 'week' | 'month' | 'custom';

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

function getDateRange(tab: PeriodTab, customFrom?: string, customTo?: string) {
  const today = new Date();
  const toStr = (d: Date) => d.toISOString().split('T')[0];

  if (tab === 'week') {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    return { dateFrom: toStr(from), dateTo: toStr(today) };
  }
  if (tab === 'month') {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return { dateFrom: toStr(from), dateTo: toStr(today) };
  }
  return {
    dateFrom: customFrom || toStr(today),
    dateTo: customTo || toStr(today),
  };
}

export const AttendanceHistorySection: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<PeriodTab>('week');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [initialEmpty, setInitialEmpty] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const tg = window.Telegram?.WebApp;
        const token = tg?.initData || null;
        const res = await attendanceApi.getStats(token);
        setStats({
          visits_this_month: res.data.visits_this_month,
          missed_this_month: res.data.missed_this_month,
          average_attendance: res.data.average_attendance,
        });
      } catch {
        setStats(null);
      } finally {
        setStatsLoading(false);
      }
    };
    loadStats();
  }, []);

  const loadRecords = useCallback(async () => {
    setRecordsLoading(true);
    try {
      const tg = window.Telegram?.WebApp;
      const token = tg?.initData || null;
      const { dateFrom, dateTo } = getDateRange(activeTab, customFrom, customTo);
      const res = await attendanceApi.getHistory(token, 1, 50, dateFrom, dateTo);

      const mapped: AttendanceRecord[] = res.data.records.map((r: AttendanceRecordResponse) => ({
        id: r.id,
        checkin_date: r.checkin_date + (r.checkin_time ? `T${r.checkin_time}` : ''),
        club_name: r.club_name,
        section_name: r.section_name,
      }));
      setRecords(mapped);
      setTotal(res.data.total);
    } catch {
      setRecords([]);
      setTotal(0);
    } finally {
      setRecordsLoading(false);
    }
  }, [activeTab, customFrom, customTo]);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const tg = window.Telegram?.WebApp;
        const token = tg?.initData || null;
        const res = await attendanceApi.getHistory(token, 1, 1);
        if (res.data.total === 0) {
          setInitialEmpty(true);
          setRecordsLoading(false);
        }
      } catch {
        /* ignore — loadRecords handles errors */
      }
    };
    loadInitial();
  }, []);

  useEffect(() => {
    if (initialEmpty) return;
    if (activeTab !== 'custom') {
      loadRecords();
    }
  }, [activeTab, loadRecords, initialEmpty]);

  const handleCustomApply = () => {
    if (customFrom && customTo) loadRecords();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime()) || !dateString.includes('T')) return '';
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  if (statsLoading) {
    return (
      <div className="mb-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (initialEmpty) {
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

  const tabLabels: Record<PeriodTab, string> = {
    week: t('profile.attendance.week'),
    month: t('profile.attendance.month'),
    custom: t('profile.attendance.custom'),
  };

  return (
    <div className="mb-4 space-y-3">
      {/* Statistics Card */}
      {stats && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('profile.attendance')}</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-blue-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-[#1E3A8A]" />
                <span className="text-[11px] text-gray-500 font-medium">{t('profile.attendance.visitsMonth')}</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{stats.visits_this_month}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 size={16} className="text-[#DC2626]" />
                <span className="text-[11px] text-gray-500 font-medium">{t('profile.attendance.missedMonth')}</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{stats.missed_this_month}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={16} className="text-gray-500" />
              <span className="text-[11px] text-gray-500 font-medium">{t('profile.attendance.average')}</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.average_attendance}%</p>
          </div>
        </Card>
      )}

      {/* Visits List Card with Period Tabs */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('profile.attendance.visits')}</h2>
          <span className="text-[13px] font-medium text-gray-400">
            {t('profile.attendance.total', { count: total })}
          </span>
        </div>

        {/* Period Tabs */}
        <div className="flex gap-2 mb-4">
          {(['week', 'month', 'custom'] as PeriodTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-xl text-[13px] font-semibold transition-all ${
                  isActive
                    ? 'bg-[#1E3A8A] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                }`}
              >
                {tabLabels[tab]}
              </button>
            );
          })}
        </div>

        {/* Custom Date Range Picker */}
        {activeTab === 'custom' && (
          <div className="mb-4 p-3 bg-gray-50 rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">
                  {t('profile.attendance.dateFrom')}
                </label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">
                  {t('profile.attendance.dateTo')}
                </label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                />
              </div>
            </div>
            <button
              onClick={handleCustomApply}
              disabled={!customFrom || !customTo}
              className="w-full py-2.5 bg-[#1E3A8A] text-white rounded-xl text-[14px] font-semibold active:scale-[0.98] transition-all disabled:opacity-40"
            >
              {t('profile.attendance.apply')}
            </button>
          </div>
        )}

        {/* Records List */}
        {recordsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={22} className="animate-spin text-gray-400" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CalendarRange size={22} className="text-gray-400" />
            </div>
            <p className="text-[14px] text-gray-400 font-medium">{t('profile.attendance.empty')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Calendar size={16} className="text-[#1E3A8A]" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-[14px]">
                      {record.club_name || 'Клуб'}
                    </p>
                    {record.section_name && (
                      <p className="text-gray-500 text-[12px] mt-0.5">{record.section_name}</p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-[#1E3A8A] font-semibold text-[12px]">
                    {formatDate(record.checkin_date)}
                  </p>
                  {formatTime(record.checkin_date) && (
                    <p className="text-gray-400 text-[11px] mt-0.5">
                      {formatTime(record.checkin_date)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
