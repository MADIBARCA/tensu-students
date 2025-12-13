import { useState, useEffect, useMemo } from 'react';
import { Layout, PageContainer } from '@/components/Layout';
import { useI18n } from '@/i18n/i18n';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { ClubCard } from './components/ClubCard';
import { ClubDetailsModal } from './components/ClubDetailsModal';
import { clubsApi } from '@/functions/axios/axiosFunctions';
import type { ClubResponse } from '@/functions/axios/responses';

export interface Club {
  id: number;
  name: string;
  address: string | null;
  sections_count: number;
  students_count: number;
  tags: string[];
  logo_url?: string | null;
  phone?: string | null;
  telegram_url?: string | null;
  whatsapp_url?: string | null;
  working_hours?: string | null;
  description?: string | null;
}

export default function ClubsPage() {
  const { t } = useI18n();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [myClubIds, setMyClubIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'my'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  useEffect(() => {
    const loadClubs = async () => {
      try {
        const tg = window.Telegram?.WebApp;
        const token = tg?.initData || null;
        
        // Load clubs and my club IDs in parallel
        const [clubsResponse, myClubsResponse] = await Promise.all([
          clubsApi.getAll(token, 1, 100),
          clubsApi.getMyClubIds(token),
        ]);
        
        // Map API response to component format
        const mappedClubs: Club[] = clubsResponse.data.clubs.map((c: ClubResponse) => ({
          id: c.id,
          name: c.name,
          address: c.address,
          sections_count: c.sections_count,
          students_count: c.students_count,
          tags: c.tags || [],
          logo_url: c.logo_url,
          phone: c.phone,
          telegram_url: c.telegram_url,
          whatsapp_url: c.whatsapp_url,
          working_hours: c.working_hours,
          description: c.description,
        }));
        
        setClubs(mappedClubs);
        setMyClubIds(myClubsResponse.data || []);
      } catch (error) {
        console.error('Failed to load clubs:', error);
        setClubs([]);
      } finally {
        setLoading(false);
      }
    };

    loadClubs();
  }, []);

  // Filter and search logic
  const filteredClubs = useMemo(() => {
    let result = clubs;

    // Apply filter
    if (filterType === 'my') {
      result = result.filter(club => myClubIds.includes(club.id));
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(club => 
        club.name.toLowerCase().includes(query) ||
        club.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return result;
  }, [clubs, filterType, searchQuery, myClubIds]);

  const handleClubClick = (club: Club) => {
    setSelectedClub(club);
  };

  if (loading) {
    return (
      <Layout title={t('clubs.title')}>
        <PageContainer>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-600">{t('common.loading')}</div>
          </div>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout title={t('clubs.title')}>
      <PageContainer>
        {/* Search and Filter */}
        <div className="flex gap-2 mb-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('clubs.search.placeholder')}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
            >
              <Filter size={18} className="text-gray-600" />
              <span className="text-sm text-gray-700">
                {filterType === 'all' ? t('clubs.filter.all') : t('clubs.filter.my')}
              </span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setFilterType('all');
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    filterType === 'all' ? 'text-blue-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  {t('clubs.filter.all')}
                </button>
                <button
                  onClick={() => {
                    setFilterType('my');
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    filterType === 'my' ? 'text-blue-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  {t('clubs.filter.my')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Clubs List */}
        {filteredClubs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">
              {filterType === 'my' 
                ? t('clubs.empty.my') 
                : searchQuery 
                  ? t('clubs.empty.search') 
                  : t('clubs.empty.all')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClubs.map((club) => (
              <ClubCard
                key={club.id}
                club={club}
                isMember={myClubIds.includes(club.id)}
                onClick={() => handleClubClick(club)}
              />
            ))}
          </div>
        )}

        {/* Club Details Modal */}
        {selectedClub && (
          <ClubDetailsModal
            club={selectedClub}
            isMember={myClubIds.includes(selectedClub.id)}
            onClose={() => setSelectedClub(null)}
          />
        )}
      </PageContainer>
    </Layout>
  );
}
