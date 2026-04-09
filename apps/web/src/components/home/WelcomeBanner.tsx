import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchApi } from '@/lib/api';
import { cloudinaryImageUrl } from '@/lib/utils';

export function WelcomeBanner() {
  const { user, token } = useAuthStore();
  const [profile, setProfile] = useState<{ displayName?: string; avatarPublicId?: string | null } | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchApi('/profile')
      .then((res) => setProfile(res.profile || res))
      .catch(() => {});
  }, [token]);

  if (!user) return null;

  const displayName = profile?.displayName && profile.displayName !== 'User'
    ? profile.displayName.split(' ')[0]
    : 'Farmer';

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="px-4 md:px-6 lg:px-10 pt-6 pb-4 flex items-center gap-4">
      {profile?.avatarPublicId ? (
        <img
          src={cloudinaryImageUrl(profile.avatarPublicId, 96)}
          alt=""
          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
          {initial}
        </div>
      )}
      <div>
        <h1 className="text-xl font-bold text-text-base leading-tight">
          Welcome back, {displayName}
        </h1>
        <Link
          to="/profile"
          className="text-sm text-primary hover:underline underline-offset-2 mt-0.5 block"
        >
          Add your farming interests &rarr;
        </Link>
      </div>
    </div>
  );
}
