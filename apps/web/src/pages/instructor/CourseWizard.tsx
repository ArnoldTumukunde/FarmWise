import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  Plus,
  Loader2,
  Image as ImageIcon,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  'Crop Farming',
  'Livestock',
  'Soil Science',
  'Irrigation',
  'Pest Management',
  'Post-Harvest',
  'Agribusiness',
  'Organic Farming',
  'Aquaculture',
  'Forestry',
];

const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS'];

const LANGUAGES = ['English', 'Luganda', 'Swahili', 'Runyankole', 'Luo', 'Ateso'];

const PRICE_TIERS = [0, 5000, 10000, 15000, 25000, 50000];

const STEPS = [
  { num: 1, label: 'Course Basics' },
  { num: 2, label: 'Target & Goals' },
  { num: 3, label: 'Course Media' },
  { num: 4, label: 'Pricing' },
];

function ListInput({
  items,
  setItems,
  max,
  placeholder,
  label,
}: {
  items: string[];
  setItems: (v: string[]) => void;
  max: number;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[#1B2B1B] font-medium">{label}</Label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              setItems(next);
            }}
            placeholder={placeholder}
            className="border-[#2E7D32]/10"
          />
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => setItems(items.filter((_, idx) => idx !== i))}
              className="p-2 text-red-500 hover:bg-red-50 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      {items.length < max && (
        <button
          type="button"
          onClick={() => setItems([...items, ''])}
          className="flex items-center gap-1 text-sm text-[#2E7D32] hover:text-[#256329] font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          Add another
        </button>
      )}
    </div>
  );
}

export default function CourseWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [language, setLanguage] = useState('English');

  // Step 2
  const [targetAudience, setTargetAudience] = useState<string[]>(['', '', '']);
  const [outcomes, setOutcomes] = useState<string[]>(['', '', '', '']);
  const [prerequisites, setPrerequisites] = useState<string[]>(['', '']);

  // Step 3
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [promoVideoFile, setPromoVideoFile] = useState<File | null>(null);
  const [promoVideoName, setPromoVideoName] = useState('');
  const thumbnailRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  // Step 4
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState(0);
  const [customPrice, setCustomPrice] = useState('');

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!title.trim()) { toast.error('Course title is required'); return false; }
        if (!category) { toast.error('Please select a category'); return false; }
        if (!level) { toast.error('Please select a level'); return false; }
        return true;
      case 2: {
        const filledAudience = targetAudience.filter((s) => s.trim());
        if (filledAudience.length === 0) { toast.error('Add at least one target audience'); return false; }
        const filledOutcomes = outcomes.filter((s) => s.trim());
        if (filledOutcomes.length < 2) { toast.error('Add at least 2 learning outcomes'); return false; }
        return true;
      }
      case 3:
        return true;
      case 4:
        if (!isFree && price <= 0 && !customPrice) {
          toast.error('Please set a price for the course');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(s + 1, 4));
    }
  };

  const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Thumbnail must be under 5MB');
      return;
    }
    const img = new Image();
    img.onload = () => {
      if (img.width < 750 || img.height < 422) {
        toast.error('Minimum dimensions: 750x422px');
        return;
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    };
    img.src = URL.createObjectURL(file);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPromoVideoFile(file);
    setPromoVideoName(file.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const input = thumbnailRef.current;
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        handleThumbnailChange({ target: input } as any);
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    setSubmitting(true);

    const finalPrice = isFree ? 0 : (customPrice ? Number(customPrice) : price);
    const body = {
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      category,
      level,
      language,
      targetAudience: targetAudience.filter((s) => s.trim()),
      outcomes: outcomes.filter((s) => s.trim()),
      prerequisites: prerequisites.filter((s) => s.trim()),
      price: finalPrice,
    };

    try {
      const res = await fetchApi('/instructor/courses', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const courseId = res.course?.id || res.id;

      // Upload thumbnail if provided
      if (thumbnailFile && courseId) {
        try {
          const sigRes = await fetchApi(`/instructor/courses/${courseId}/media-signature?type=thumbnail`);
          const formData = new FormData();
          formData.append('file', thumbnailFile);
          formData.append('api_key', sigRes.apiKey);
          formData.append('timestamp', sigRes.timestamp.toString());
          formData.append('signature', sigRes.signature);
          formData.append('folder', sigRes.folder || 'farmwise');
          if (sigRes.publicId) formData.append('public_id', sigRes.publicId);

          await fetch(`https://api.cloudinary.com/v1_1/${sigRes.cloudName}/image/upload`, {
            method: 'POST',
            body: formData,
          });
        } catch {
          toast.error('Course created but thumbnail upload failed');
        }
      }

      toast.success('Course created successfully!');
      navigate(`/instructor/courses/${courseId}/manage`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAFAF5] min-h-screen p-4 md:p-8 font-[Inter]">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Progress Indicator */}
        <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, i) => (
              <div key={step.num} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      currentStep > step.num
                        ? 'bg-[#2E7D32] text-white'
                        : currentStep === step.num
                        ? 'bg-[#2E7D32] text-white ring-4 ring-[#2E7D32]/20'
                        : 'bg-gray-100 text-[#5A6E5A]'
                    }`}
                  >
                    {currentStep > step.num ? <Check className="w-5 h-5" /> : step.num}
                  </div>
                  <span
                    className={`text-xs mt-2 hidden sm:block ${
                      currentStep >= step.num ? 'text-[#1B2B1B] font-medium' : 'text-[#5A6E5A]'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 ${
                      currentStep > step.num ? 'bg-[#2E7D32]' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 md:p-8">
          {/* Step 1 - Course Basics */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#1B2B1B]">Course Basics</h2>

              <div className="space-y-2">
                <Label className="text-[#1B2B1B] font-medium">Course Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 120))}
                  placeholder="e.g. Modern Drip Irrigation for Smallholder Farms"
                  className="border-[#2E7D32]/10"
                />
                <p className="text-xs text-[#5A6E5A] text-right">{title.length}/120</p>
              </div>

              <div className="space-y-2">
                <Label className="text-[#1B2B1B] font-medium">Subtitle</Label>
                <Input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value.slice(0, 200))}
                  placeholder="A brief description of your course"
                  className="border-[#2E7D32]/10"
                />
                <p className="text-xs text-[#5A6E5A] text-right">{subtitle.length}/200</p>
              </div>

              <div className="space-y-2">
                <Label className="text-[#1B2B1B] font-medium">Category</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-md border border-[#2E7D32]/10 px-3 py-2 text-sm bg-white text-[#1B2B1B] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/20"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#1B2B1B] font-medium">Level</Label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full rounded-md border border-[#2E7D32]/10 px-3 py-2 text-sm bg-white text-[#1B2B1B] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/20"
                  >
                    <option value="">Select level</option>
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#1B2B1B] font-medium">Primary Language</Label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-md border border-[#2E7D32]/10 px-3 py-2 text-sm bg-white text-[#1B2B1B] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/20"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 - Target & Goals */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#1B2B1B]">Target & Goals</h2>

              <ListInput
                items={targetAudience}
                setItems={setTargetAudience}
                max={5}
                label="Who is this course for?"
                placeholder="e.g. Smallholder farmers in East Africa"
              />

              <ListInput
                items={outcomes}
                setItems={setOutcomes}
                max={8}
                label="What will students learn?"
                placeholder="e.g. Set up a drip irrigation system on a budget"
              />

              <ListInput
                items={prerequisites}
                setItems={setPrerequisites}
                max={6}
                label="Prerequisites"
                placeholder="e.g. Basic farming knowledge"
              />
            </div>
          )}

          {/* Step 3 - Course Media */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#1B2B1B]">Course Media</h2>

              <div className="space-y-2">
                <Label className="text-[#1B2B1B] font-medium">Course Thumbnail</Label>
                <p className="text-xs text-[#5A6E5A]">Min 750x422px, max 5MB. JPG, PNG or WebP.</p>
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => thumbnailRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    thumbnailPreview
                      ? 'border-[#2E7D32]/30 bg-[#2E7D32]/5'
                      : 'border-gray-300 hover:border-[#2E7D32]/30 bg-gray-50'
                  }`}
                >
                  {thumbnailPreview ? (
                    <div className="space-y-3">
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <p className="text-sm text-[#2E7D32] font-medium">Click to change</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <ImageIcon className="w-10 h-10 mx-auto text-[#5A6E5A]" />
                      <p className="text-sm text-[#5A6E5A]">
                        Drag and drop your thumbnail here, or click to browse
                      </p>
                    </div>
                  )}
                  <input
                    ref={thumbnailRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#1B2B1B] font-medium">
                  Promotional Video <span className="text-[#5A6E5A] font-normal">(optional)</span>
                </Label>
                <div
                  onClick={() => videoRef.current?.click()}
                  className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer border-gray-300 hover:border-[#2E7D32]/30 bg-gray-50 transition-colors"
                >
                  {promoVideoName ? (
                    <div className="space-y-2">
                      <Video className="w-10 h-10 mx-auto text-[#2E7D32]" />
                      <p className="text-sm text-[#1B2B1B] font-medium">{promoVideoName}</p>
                      <p className="text-xs text-[#2E7D32]">Click to change</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="w-10 h-10 mx-auto text-[#5A6E5A]" />
                      <p className="text-sm text-[#5A6E5A]">Upload a promotional video</p>
                    </div>
                  )}
                  <input
                    ref={videoRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4 - Pricing */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#1B2B1B]">Pricing</h2>

              <div className="flex gap-4">
                <button
                  onClick={() => { setIsFree(true); setPrice(0); setCustomPrice(''); }}
                  className={`flex-1 p-4 rounded-xl border-2 text-center transition-colors ${
                    isFree
                      ? 'border-[#2E7D32] bg-[#2E7D32]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-lg font-bold text-[#1B2B1B]">Free</p>
                  <p className="text-sm text-[#5A6E5A]">Open access for all</p>
                </button>
                <button
                  onClick={() => setIsFree(false)}
                  className={`flex-1 p-4 rounded-xl border-2 text-center transition-colors ${
                    !isFree
                      ? 'border-[#2E7D32] bg-[#2E7D32]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-lg font-bold text-[#1B2B1B]">Paid</p>
                  <p className="text-sm text-[#5A6E5A]">Set your price</p>
                </button>
              </div>

              {!isFree && (
                <div className="space-y-4">
                  <Label className="text-[#1B2B1B] font-medium">Select a price tier (UGX)</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {PRICE_TIERS.filter((t) => t > 0).map((tier) => (
                      <button
                        key={tier}
                        onClick={() => { setPrice(tier); setCustomPrice(''); }}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          price === tier && !customPrice
                            ? 'border-[#2E7D32] bg-[#2E7D32]/10 text-[#2E7D32]'
                            : 'border-gray-200 text-[#1B2B1B] hover:border-gray-300'
                        }`}
                      >
                        {new Intl.NumberFormat('en-UG').format(tier)}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#5A6E5A] text-sm">Or enter a custom price (UGX)</Label>
                    <Input
                      type="number"
                      value={customPrice}
                      onChange={(e) => { setCustomPrice(e.target.value); setPrice(0); }}
                      placeholder="e.g. 35000"
                      min={1000}
                      className="border-[#2E7D32]/10"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="border-[#2E7D32]/20 text-[#1B2B1B]"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              className="bg-[#2E7D32] hover:bg-[#256329] text-white"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-[#2E7D32] hover:bg-[#256329] text-white"
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Course
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
