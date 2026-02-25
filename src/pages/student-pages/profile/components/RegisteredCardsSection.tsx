import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/i18n/i18n';
import { CreditCard, Plus, Trash2, Loader2, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { paymentsApi } from '@/functions/axios/axiosFunctions';
import type { RegisteredCard } from '@/functions/axios/responses';

/**
 * RegisteredCardsSection
 * 
 * Displays and manages registered payment cards for OneClick payments.
 * Users can add new cards (redirects to CNP gateway) or delete existing ones.
 */
export const RegisteredCardsSection: React.FC = () => {
  const { t } = useI18n();
  const [cards, setCards] = useState<RegisteredCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const loadCards = useCallback(async () => {
    try {
      const tg = window.Telegram?.WebApp;
      const token = tg?.initData || null;
      const response = await paymentsApi.cards.getAll(token);
      setCards(response.data.cards);
    } catch (error) {
      console.error('Failed to load cards:', error);
      setError(t('profile.cards.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // Check if we're returning from card registration
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // CNP returns userId and cardId (without cnp_ prefix)
    // Also check legacy format cnp_user_id/cnp_card_id for backwards compatibility
    const cnpUserId = urlParams.get('userId') || urlParams.get('cnp_user_id');
    const cnpCardId = urlParams.get('cardId') || urlParams.get('cnp_card_id');
    
    // Check if we're returning from card registration (flag set before redirect)
    const wasRegistering = sessionStorage.getItem('card_registration_pending');
    
    console.log('Card registration callback - userId:', cnpUserId, 'cardId:', cnpCardId, 'wasRegistering:', wasRegistering, 'URL:', window.location.href);
    
    // Clean up registration flag
    if (wasRegistering) {
      sessionStorage.removeItem('card_registration_pending');
    }
    
    if (cnpUserId && cnpCardId) {
      // Card registration successful - sync the card
      const syncCard = async () => {
        try {
          const tg = window.Telegram?.WebApp;
          const token = tg?.initData || null;
          await paymentsApi.cards.sync(parseInt(cnpUserId), parseInt(cnpCardId), token);
          await loadCards();
          setExpanded(true);
          
          // Clean up URL - remove all possible parameter names
          const url = new URL(window.location.href);
          url.searchParams.delete('userId');
          url.searchParams.delete('cardId');
          url.searchParams.delete('cnp_user_id');
          url.searchParams.delete('cnp_card_id');
          window.history.replaceState({}, '', url.toString());
        } catch (error) {
          console.error('Failed to sync card:', error);
        }
      };
      syncCard();
    } else if (wasRegistering && !cnpCardId) {
      // We were registering but didn't get cardId back = registration failed
      // This happens when the card is declined/invalid
      setError('Не удалось привязать карту. Карта была отклонена или недействительна.');
      setExpanded(true);
      
      // Clean up URL if there are any parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('userId');
      url.searchParams.delete('cnp_user_id');
      window.history.replaceState({}, '', url.toString());
    }
  }, [loadCards]);

  const handleRegisterCard = async () => {
    setRegistering(true);
    setError(null);
    
    try {
      const tg = window.Telegram?.WebApp;
      const token = tg?.initData || null;
      
      // Return URL will include parameters for card sync
      const returnUrl = `${window.location.origin}/student/profile`;
      
      const response = await paymentsApi.cards.register(token, returnUrl);
      
      if (response.data.success && response.data.redirect_url) {
        // Set flag to detect failed registration on return
        sessionStorage.setItem('card_registration_pending', 'true');
        // Redirect to CNP card registration page
        window.location.href = response.data.redirect_url;
      } else {
        setError(response.data.error_message || t('profile.cards.registerError'));
      }
    } catch (error) {
      console.error('Card registration error:', error);
      setError(t('profile.cards.registerError'));
    } finally {
      setRegistering(false);
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    // Confirm deletion
    const tg = window.Telegram?.WebApp;
    if (tg?.showConfirm) {
      tg.showConfirm(
        t('profile.cards.deleteConfirm'),
        async (confirmed: boolean) => {
          if (confirmed) {
            await deleteCard(cardId);
          }
        }
      );
    } else {
      // Fallback for non-Telegram environment
      if (window.confirm(t('profile.cards.deleteConfirm'))) {
        await deleteCard(cardId);
      }
    }
  };

  const deleteCard = async (cardId: number) => {
    setDeletingCardId(cardId);
    try {
      const tg = window.Telegram?.WebApp;
      const token = tg?.initData || null;
      const response = await paymentsApi.cards.delete(cardId, token);
      
      if (response.data.success) {
        setCards(cards.filter(c => c.card_id !== cardId));
      } else {
        setError(t('profile.cards.deleteError'));
      }
    } catch (error) {
      console.error('Delete card error:', error);
      setError(t('profile.cards.deleteError') || 'Failed to delete card');
    } finally {
      setDeletingCardId(null);
    }
  };

  // Format masked PAN for display
  const formatPan = (pan: string | null) => {
    if (!pan) return '•••• •••• •••• ••••';
    // Format like: 4111 **** **** 1111
    return pan.replace(/(.{4})/g, '$1 ').trim();
  };

  // Detect card type from PAN
  const getCardType = (pan: string | null): 'visa' | 'mastercard' | 'other' => {
    if (!pan) return 'other';
    const firstDigit = pan[0];
    if (firstDigit === '4') return 'visa';
    if (firstDigit === '5' || firstDigit === '2') return 'mastercard';
    return 'other';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <CreditCard className="text-gray-400" size={20} />
          </div>
          <span className="font-semibold text-gray-900">
            {t('profile.cards.title')}
          </span>
        </div>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="animate-spin text-gray-400" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
      {/* Header */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
            <CreditCard className="text-[#1E3A8A]" size={20} />
          </div>
          <div>
            <span className="font-semibold text-gray-900">
              {t('profile.cards.title') || 'Payment Cards'}
            </span>
            {cards.length > 0 && (
              <p className="text-sm text-gray-500">
                {t('profile.cards.savedCount', { count: cards.length })}
              </p>
            )}
          </div>
        </div>
        <ChevronRight 
          className={`text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} 
          size={20} 
        />
      </div>

      {/* Content (when expanded or has cards) */}
      {(expanded || cards.length > 0) && (
        <div className="mt-4 space-y-3">
          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Cards list */}
          {cards.map(card => (
            <div 
              key={card.card_id}
              className="flex items-center justify-between p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {/* Card type icon */}
                <div className={`w-10 h-6 rounded flex items-center justify-center text-xs font-bold
                  ${getCardType(card.pan_masked) === 'visa' ? 'bg-[#1E3A8A] text-white' : 
                    getCardType(card.pan_masked) === 'mastercard' ? 'bg-orange-500 text-white' : 
                    'bg-gray-400 text-white'}`}
                >
                  {getCardType(card.pan_masked) === 'visa' ? 'VISA' : 
                   getCardType(card.pan_masked) === 'mastercard' ? 'MC' : 'CARD'}
                </div>
                <div>
                  <p className="font-mono text-sm text-gray-900">
                    {formatPan(card.pan_masked)}
                  </p>
                  {card.card_holder && (
                    <p className="text-xs text-gray-500">{card.card_holder}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {card.is_active && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <Check size={12} />
                    {t('profile.cards.active')}
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCard(card.card_id);
                  }}
                  disabled={deletingCardId === card.card_id}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deletingCardId === card.card_id ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            </div>
          ))}

          {/* Add card button */}
          <button
            onClick={handleRegisterCard}
            disabled={registering}
            className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 
                       rounded-lg text-gray-500 hover:border-[#1E3A8A] hover:text-[#1E3A8A] hover:bg-blue-50 
                       transition-colors disabled:opacity-50"
          >
            {registering ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>{t('profile.cards.registering')}</span>
              </>
            ) : (
              <>
                <Plus size={18} />
                <span>{t('profile.cards.addCard')}</span>
              </>
            )}
          </button>

          {/* Info text */}
          <p className="text-xs text-gray-400 text-center">
            {t('profile.cards.info')}
          </p>
        </div>
      )}
    </div>
  );
};

export default RegisteredCardsSection;
