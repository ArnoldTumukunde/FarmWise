import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Leaf, CheckCircle, Clock, XCircle, Loader2, Send } from 'lucide-react';

const EXPERTISE_OPTIONS = [
  'Crop Farming',
  'Livestock',
  'Soil Health',
  'Pest Control',
  'Irrigation',
  'Agribusiness',
  'Post-Harvest',
  'Farm Technology',
  'Climate',
  'Organic Farming',
];

const BENEFITS = [
  'Free tools to create and manage courses',
  'Reach farmers across East Africa',
  'Keep 70% of every sale',
  'We handle payments and delivery',
];

type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface Application {
  id: string;
  status: ApplicationStatus;
  motivation: string;
  expertise: string[];
  reviewNote?: string | null;
  createdAt: string;
}

export default function BecomeInstructor() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);
  const [error, setError] = useState('');

  // Form state
  const [motivation, setMotivation] = useState('');
  const [expertise, setExpertise] = useState<string[]>([]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/instructor/application-status');
      setApplication(data.application);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const toggleExpertise = (item: string) => {
    setExpertise((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivation.trim()) {
      setError('Please share your motivation.');
      return;
    }
    if (expertise.length === 0) {
      setError('Please select at least one area of expertise.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const data = await fetchApi('/instructor/apply', {
        method: 'POST',
        body: JSON.stringify({ motivation, expertise }),
      });
      setApplication(data.application);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyAgain = () => {
    setApplication(null);
    setMotivation('');
    setExpertise([]);
    setError('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#2E7D32]" />
      </div>
    );
  }

  // APPROVED — redirect to instructor dashboard
  if (application?.status === 'APPROVED') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card className="bg-white border-[#2E7D32]/20">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <CheckCircle className="h-16 w-16 text-[#2E7D32]" />
            <h2 className="text-2xl font-bold text-[#1B2B1B]">Congratulations!</h2>
            <p className="text-[#5A6E5A] text-center max-w-md">
              Your instructor application has been approved. You can now create courses and start teaching on AAN Academy.
            </p>
            <Button
              onClick={() => navigate('/instructor')}
              className="bg-[#2E7D32] hover:bg-[#4CAF50] text-white mt-2"
            >
              Go to Instructor Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // PENDING
  if (application?.status === 'PENDING') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card className="bg-white border-[#F57F17]/20">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <Clock className="h-16 w-16 text-[#F57F17]" />
            <h2 className="text-2xl font-bold text-[#1B2B1B]">Application Under Review</h2>
            <p className="text-[#5A6E5A] text-center max-w-md">
              Your application was submitted on{' '}
              {new Date(application.createdAt).toLocaleDateString()}. Our team is reviewing it and
              you'll be notified once a decision is made.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // REJECTED
  if (application?.status === 'REJECTED') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card className="bg-white border-red-200">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <XCircle className="h-16 w-16 text-red-500" />
            <h2 className="text-2xl font-bold text-[#1B2B1B]">Application Not Approved</h2>
            {application.reviewNote && (
              <p className="text-[#5A6E5A] text-center max-w-md bg-red-50 rounded-lg p-4">
                <span className="font-medium text-[#1B2B1B]">Feedback:</span>{' '}
                {application.reviewNote}
              </p>
            )}
            <p className="text-[#5A6E5A] text-center max-w-md">
              You can update your application and try again.
            </p>
            <Button
              onClick={handleApplyAgain}
              className="bg-[#2E7D32] hover:bg-[#4CAF50] text-white mt-2"
            >
              Apply Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No application — show form
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Card className="bg-white">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="h-14 w-14 rounded-full bg-[#2E7D32]/10 flex items-center justify-center">
              <Leaf className="h-7 w-7 text-[#2E7D32]" />
            </div>
          </div>
          <CardTitle className="text-[#1B2B1B]">Become an Instructor</CardTitle>
          <CardDescription className="text-[#5A6E5A] mt-2">
            Share your agricultural expertise with thousands of farmers across East Africa. Keep 70%
            of every sale.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Benefits */}
          <ul className="mb-8 space-y-2">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3 text-sm text-[#1B2B1B]">
                <CheckCircle className="h-4 w-4 text-[#2E7D32] flex-shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Motivation */}
            <div className="space-y-2">
              <Label htmlFor="motivation" className="text-[#1B2B1B]">
                Why do you want to teach on AAN Academy?
              </Label>
              <textarea
                id="motivation"
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                rows={5}
                placeholder="Tell us about your farming experience, what you'd like to teach, and why..."
                className="w-full rounded-lg border border-gray-200 bg-[#FAFAF5] px-4 py-3 text-sm text-[#1B2B1B] placeholder:text-[#5A6E5A]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 resize-vertical"
              />
            </div>

            {/* Expertise */}
            <div className="space-y-3">
              <Label className="text-[#1B2B1B]">Areas of Expertise</Label>
              <p className="text-xs text-[#5A6E5A]">Select all that apply.</p>
              <div className="grid grid-cols-2 gap-2">
                {EXPERTISE_OPTIONS.map((item) => {
                  const selected = expertise.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleExpertise(item)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors text-left ${
                        selected
                          ? 'border-[#2E7D32] bg-[#2E7D32]/10 text-[#2E7D32]'
                          : 'border-gray-200 bg-white text-[#1B2B1B] hover:border-[#2E7D32]/40'
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          selected
                            ? 'border-[#2E7D32] bg-[#2E7D32]'
                            : 'border-gray-300'
                        }`}
                      >
                        {selected && <CheckCircle className="h-3 w-3 text-white" />}
                      </div>
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#2E7D32] hover:bg-[#4CAF50] text-white h-12 text-base font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Submit Application
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
