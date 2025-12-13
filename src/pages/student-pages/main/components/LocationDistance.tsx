import React, { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/i18n';
import { MapPin } from 'lucide-react';
import { clubsApi } from '@/functions/axios/axiosFunctions';

export const LocationDistance: React.FC = () => {
  const { t } = useI18n();
  const [distance, setDistance] = useState<number | null>(null);
  const [clubName, setClubName] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLocationPermission = async () => {
      try {
        // Check if geolocation is available
        if (!navigator.geolocation) {
          setHasPermission(false);
          setLoading(false);
          return;
        }

        // Check permission status
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        setHasPermission(permissionStatus.state !== 'denied');

        if (permissionStatus.state === 'granted' || permissionStatus.state === 'prompt') {
          calculateDistance();
        } else {
          setHasPermission(false);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking location permission:', error);
        setHasPermission(false);
        setLoading(false);
      }
    };

    checkLocationPermission();
  }, []);

  const calculateDistance = () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;

          const tg = window.Telegram?.WebApp;
          const token = tg?.initData || null;
          
          try {
            const response = await clubsApi.getNearest(userLat, userLon, token);
            
            if (response.data.club && response.data.distance_meters !== null) {
              setDistance(Math.round(response.data.distance_meters));
              setClubName(response.data.club.name);
            } else {
              setDistance(null);
            }
          } catch (error) {
            console.warn('Clubs API not available:', error);
            setDistance(null);
          }
        } catch (error) {
          console.error('Error calculating distance:', error);
          setDistance(null);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setHasPermission(false);
        }
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  if (loading) {
    return null;
  }

  if (!hasPermission || distance === null) {
    return null;
  }

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${meters} ${t('home.location.meters')}`;
    }
    const km = (meters / 1000).toFixed(1);
    return `${km} ${t('home.location.km')}`;
  };

  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <MapPin size={16} className="text-blue-600" />
        <span>
          {clubName 
            ? t('home.location.distance').replace('{distance}', formatDistance(distance))
            : formatDistance(distance)
          }
        </span>
      </div>
      {clubName && (
        <div className="text-xs text-gray-500 mt-1 ml-6">
          {clubName}
        </div>
      )}
    </div>
  );
};
