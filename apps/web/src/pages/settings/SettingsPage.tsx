import { useState, useEffect, useRef } from 'react';
import { fetchApi } from '@/lib/api';
import { uploadToCloudinary, type UploadProgress } from '@/lib/upload';
import { UploadProgressBar } from '@/components/ui/UploadProgress';
import { cloudinaryImageUrl } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Camera, Save, Loader2, MapPin, Wheat } from 'lucide-react';
import { toast } from 'sonner';

const CROP_OPTIONS = [
  'Maize', 'Beans', 'Rice', 'Cassava', 'Coffee',
  'Tea', 'Cotton', 'Vegetables', 'Fruits', 'Other',
];

const CLOUD_NAME = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME;

export default function SettingsPage() {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState<UploadProgress | null>(null);

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPublicId, setAvatarPublicId] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [primaryCrops, setPrimaryCrops] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState<number | ''>('');

  useEffect(() => {
    fetchApi('/profile')
      .then((data: any) => {
        const p = data.profile || data;
        setDisplayName(p.displayName || '');
        setHeadline(p.headline || '');
        setBio(p.bio || '');
        setAvatarPublicId(p.avatarPublicId || '');
        setFarmLocation(p.farmLocation || '');
        setFarmSize(p.farmSize || '');
        setPrimaryCrops(p.primaryCrops || []);
        setYearsExperience(p.yearsExperience ?? '');
      })
      .catch(() => {
        // Profile may not exist yet - that's fine
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCropToggle = (crop: string) => {
    setPrimaryCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setAvatarProgress({ loaded: 0, total: file.size, percent: 0, etaSeconds: null, bytesPerSec: 0 });
    try {
      const signRes = await fetchApi('/media/sign?folder=avatars&type=image');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signRes.apiKey);
      formData.append('timestamp', String(signRes.timestamp));
      formData.append('signature', signRes.signature);
      formData.append('folder', signRes.folder);
      if (signRes.eager) formData.append('eager', signRes.eager);

      const cloudName = signRes.cloudName || CLOUD_NAME;
      const uploadData = await uploadToCloudinary({
        cloudName,
        resourceType: 'image',
        formData,
        onProgress: setAvatarProgress,
      });
      if (!uploadData?.public_id) throw new Error('Upload failed - no public ID returned');

      // 3. Extract publicId (strip the "farmwise/" prefix if present)
      let publicId: string = uploadData.public_id;
      if (publicId.startsWith('farmwise/')) {
        publicId = publicId.slice('farmwise/'.length);
      }

      // 4. Save to profile
      await fetchApi('/profile', {
        method: 'PUT',
        body: JSON.stringify({ avatarPublicId: publicId }),
      });

      setAvatarPublicId(publicId);
      toast.success('Avatar updated');
    } catch (err: any) {
      toast.error(err.message || 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
      setAvatarProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchApi('/profile', {
        method: 'PUT',
        body: JSON.stringify({
          displayName: displayName || null,
          headline: headline || null,
          bio: bio || null,
          farmLocation: farmLocation || null,
          farmSize: farmSize || null,
          primaryCrops,
          yearsExperience: yearsExperience === '' ? null : Number(yearsExperience),
        }),
      });
      toast.success('Profile saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#2E7D32]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#1B2B1B] mb-8">Profile Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg text-[#1B2B1B] flex items-center gap-2">
              <Camera className="h-5 w-5 text-[#2E7D32]" />
              Avatar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              {avatarPublicId ? (
                <img
                  src={cloudinaryImageUrl(avatarPublicId, 128, 128)}
                  alt="Avatar"
                  className="h-20 w-20 rounded-full object-cover border-2 border-[#2E7D32]"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                  <User className="h-8 w-8 text-[#5A6E5A]" />
                </div>
              )}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4" />
                      Change Avatar
                    </>
                  )}
                </Button>
                {uploadingAvatar && avatarProgress && (
                  <div className="mt-3">
                    <UploadProgressBar progress={avatarProgress} label="Uploading avatar" compact />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info Section */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg text-[#1B2B1B] flex items-center gap-2">
              <User className="h-5 w-5 text-[#2E7D32]" />
              Basic Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-[#1B2B1B]">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                className="bg-[#FAFAF5] border-gray-200 text-[#1B2B1B] focus-visible:ring-[#2E7D32]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="headline" className="text-[#1B2B1B]">Headline</Label>
              <Input
                id="headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g., Maize Farmer in Northern Uganda"
                className="bg-[#FAFAF5] border-gray-200 text-[#1B2B1B] focus-visible:ring-[#2E7D32]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-[#1B2B1B]">Bio</Label>
              <textarea
                id="bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself..."
                className="flex w-full rounded-md border border-gray-200 bg-[#FAFAF5] px-3 py-2 text-sm text-[#1B2B1B] placeholder:text-[#5A6E5A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Farm Details Section (FARMER only) */}
        {user?.role === 'FARMER' && (
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-[#1B2B1B] flex items-center gap-2">
                <Wheat className="h-5 w-5 text-[#F57F17]" />
                Farm Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="farmLocation" className="text-[#1B2B1B] flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-[#5A6E5A]" />
                  Farm Location
                </Label>
                <Input
                  id="farmLocation"
                  value={farmLocation}
                  onChange={(e) => setFarmLocation(e.target.value)}
                  placeholder="e.g., Lira District, Uganda"
                  className="bg-[#FAFAF5] border-gray-200 text-[#1B2B1B] focus-visible:ring-[#2E7D32]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="farmSize" className="text-[#1B2B1B]">Farm Size</Label>
                <Input
                  id="farmSize"
                  value={farmSize}
                  onChange={(e) => setFarmSize(e.target.value)}
                  placeholder="e.g., 5 acres"
                  className="bg-[#FAFAF5] border-gray-200 text-[#1B2B1B] focus-visible:ring-[#2E7D32]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#1B2B1B]">Primary Crops</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CROP_OPTIONS.map((crop) => (
                    <label
                      key={crop}
                      className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 bg-[#FAFAF5] cursor-pointer hover:border-[#2E7D32] transition-colors has-[:checked]:border-[#2E7D32] has-[:checked]:bg-[#2E7D32]/5"
                    >
                      <input
                        type="checkbox"
                        checked={primaryCrops.includes(crop)}
                        onChange={() => handleCropToggle(crop)}
                        className="h-4 w-4 rounded border-gray-300 text-[#2E7D32] focus:ring-[#2E7D32]"
                      />
                      <span className="text-sm text-[#1B2B1B]">{crop}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsExperience" className="text-[#1B2B1B]">Years of Experience</Label>
                <Input
                  id="yearsExperience"
                  type="number"
                  min={0}
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="bg-[#FAFAF5] border-gray-200 text-[#1B2B1B] focus-visible:ring-[#2E7D32] max-w-[200px]"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={saving}
          className="w-full bg-[#2E7D32] hover:bg-[#4CAF50] text-white h-12 text-base font-semibold"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Save Profile
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
