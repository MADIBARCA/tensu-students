import { useState, useEffect, useCallback, useRef } from 'react';
import { Layout, PageContainer } from '@/components/Layout';
import { useI18n } from '@/i18n/i18n';
import { Calendar, Loader2, CalendarRange, TrendingUp, BarChart3 } from 'lucide-react';
import { attendanceApi } from '@/functions/axios/axiosFunctions';
import type { AttendanceRecordResponse } from '@/functions/axios/responses';

type PeriodTab = 'week' | 'month' | 'custom';

const PAGE_SIZE = 20;

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

export default function AttendancePage() {
  const { t, locale } = useI18n();

  const [activeTab, setActiveTab] = useState<PeriodTab>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);

  const [stats, setStats] = useState<AttendanceStats | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);

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
      }
    };
    loadStats();
  }, []);

  const fetchRecords = useCallback(async (pageNum: number, append: boolean) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const tg = window.Telegram?.WebApp;
      const token = tg?.initData || null;
      const { dateFrom, dateTo } = getDateRange(activeTab, customFrom, customTo);
      const res = await attendanceApi.getHistory(token, pageNum, PAGE_SIZE, dateFrom, dateTo);

      const mapped: AttendanceRecord[] = res.data.records.map((r: AttendanceRecordResponse) => ({
        id: r.id,
        checkin_date: r.checkin_date + (r.checkin_time ? `T${r.checkin_time}` : ''),
        club_name: r.club_name,
        section_name: r.section_name,
      }));

      setRecords((prev) => (append ? [...prev, ...mapped] : mapped));
      setTotal(res.data.total);
      setHasMore(pageNum < res.data.pages);
    } catch {
      if (!append) {
        setRecords([]);
        setTotal(0);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab, customFrom, customTo]);

  const resetAndFetch = useCallback(() => {
    setPage(1);
    setRecords([]);
    setHasMore(true);
    fetchRecords(1, false);
  }, [fetchRecords]);

  useEffect(() => {
    if (activeTab !== 'custom') {
      resetAndFetch();
    }
  }, [activeTab, resetAndFetch]);

  const handleCustomApply = () => {
    if (customFrom && customTo) resetAndFetch();
  };

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchRecords(nextPage, true);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, fetchRecords]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime()) || !dateString.includes('T')) return '';
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  };

  const tabLabels: Record<PeriodTab, string> = {
    week: t('profile.attendance.week'),
    month: t('profile.attendance.month'),
    custom: t('profile.attendance.custom'),
  };

  return (
    <Layout title={t('profile.attendance.visits')} showBackButton>
      <PageContainer>
        {/* Compact Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-white rounded-xl p-2.5 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <TrendingUp size={16} className="text-[#1E3A8A] mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900">{stats.visits_this_month}</p>
              <p className="text-[10px] text-gray-500 font-medium leading-tight">{t('profile.attendance.visitsMonth')}</p>
            </div>
            <div className="bg-white rounded-xl p-2.5 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <BarChart3 size={16} className="text-[#DC2626] mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900">{stats.missed_this_month}</p>
              <p className="text-[10px] text-gray-500 font-medium leading-tight">{t('profile.attendance.missedMonth')}</p>
            </div>
            <div className="bg-white rounded-xl p-2.5 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <BarChart3 size={16} className="text-gray-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900">{stats.average_attendance}%</p>
              <p className="text-[10px] text-gray-500 font-medium leading-tight">{t('profile.attendance.average')}</p>
            </div>
          </div>
        )}

        {/* Period Tabs */}
        <div className="flex gap-2 mb-4">
          {(['week', 'month', 'custom'] as PeriodTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                  isActive
                    ? 'bg-[#1E3A8A] text-white shadow-sm'
                    : 'bg-white text-gray-600 active:bg-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                }`}
              >
                {tabLabels[tab]}
              </button>
            );
          })}
        </div>

        {/* Custom Date Range */}
        {activeTab === 'custom' && (
          <div className="mb-4 p-3 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">
                  {t('profile.attendance.dateFrom')}
                </label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
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
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
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

        {/* Results Count */}
        {!loading && records.length > 0 && (
          <p className="text-[12px] font-medium text-gray-400 mb-3 px-1">
            {t('profile.attendance.total', { count: total })}
          </p>
        )}

        {/* Records List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-gray-400" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CalendarRange size={24} className="text-gray-400" />
            </div>
            <p className="text-[15px] text-gray-400 font-medium">{t('profile.attendance.empty')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3.5 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <Calendar size={18} className="text-[#1E3A8A]" />
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

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-1" />

            {loadingMore && (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={20} className="animate-spin text-gray-400" />
              </div>
            )}

            {!hasMore && records.length > 0 && (
              <p className="text-center text-[12px] text-gray-300 py-3 font-medium">
                {t('profile.attendance.endOfList')}
              </p>
            )}
          </div>
        )}
      </PageContainer>
    </Layout>
  );
}
