import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface PayoutRecord {
  id: string;
  month: string;
  grossRevenue: number;
  platformFee: number;
  earnings: number;
  status: string;
  reference?: string;
}

type ConnectStatus = 'NOT_STARTED' | 'PENDING' | 'ACTIVE';

const formatUGX = (amount: number) =>
  new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(amount);

function SkeletonPage() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6">
        <div className="h-6 w-40 bg-gray-200 rounded" />
        <div className="h-4 w-60 bg-gray-100 rounded mt-3" />
        <div className="h-10 w-32 bg-gray-200 rounded mt-4" />
      </div>
      <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="w-20 h-4 bg-gray-200 rounded" />
            <div className="flex-1 h-4 bg-gray-200 rounded" />
            <div className="w-20 h-4 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PayoutSettings() {
  const [connectStatus, setConnectStatus] = useState<ConnectStatus>('NOT_STARTED');
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingUp, setSettingUp] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchApi('/instructor/payout-status').catch(() => ({ status: 'NOT_STARTED' })),
      fetchApi('/instructor/payouts').catch(() => ({ payouts: [] })),
    ])
      .then(([statusRes, payoutsRes]) => {
        setConnectStatus(statusRes.status || 'NOT_STARTED');
        setPayouts(payoutsRes.payouts || payoutsRes.data || payoutsRes || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSetup = async () => {
    setSettingUp(true);
    try {
      const res = await fetchApi('/instructor/setup-payouts', { method: 'POST' });
      if (res.url) {
        window.location.href = res.url;
      } else {
        setConnectStatus('PENDING');
        toast.success('Payout setup initiated');
      }
    } catch {
      toast.error('Failed to set up payouts');
    } finally {
      setSettingUp(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#FAFAF5] min-h-screen p-4 md:p-8 font-[Inter]">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-[#1B2B1B]">Payout Settings</h1>
          <SkeletonPage />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAFAF5] min-h-screen p-4 md:p-8 font-[Inter]">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B1B]">Payout Settings</h1>
          <p className="text-[#5A6E5A] text-sm mt-1">
            Manage your payout method and view earnings history
          </p>
        </div>

        {/* Connect Status */}
        <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6">
          <h2 className="text-lg font-semibold text-[#1B2B1B] mb-4">Payout Status</h2>

          {connectStatus === 'NOT_STARTED' && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-[#5A6E5A]" />
                </div>
                <div>
                  <p className="font-medium text-[#1B2B1B]">Payouts not set up</p>
                  <p className="text-sm text-[#5A6E5A]">
                    Connect your account to start receiving earnings.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSetup}
                disabled={settingUp}
                className="bg-[#2E7D32] hover:bg-[#256329] text-white sm:ml-auto"
              >
                {settingUp ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                Set up payouts
              </Button>
            </div>
          )}

          {connectStatus === 'PENDING' && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="font-medium text-[#1B2B1B]">Verification in progress</p>
                <p className="text-sm text-[#5A6E5A]">
                  Your account is being verified. This usually takes 1-2 business days.
                </p>
              </div>
            </div>
          )}

          {connectStatus === 'ACTIVE' && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2E7D32]/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#2E7D32]" />
              </div>
              <div>
                <p className="font-medium text-[#1B2B1B]">Payouts enabled</p>
                <p className="text-sm text-[#5A6E5A]">
                  Your account is verified and ready to receive payouts.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Payout History */}
        <div>
          <h2 className="text-lg font-semibold text-[#1B2B1B] mb-4">Payout History</h2>

          {payouts.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-12 text-center">
              <Wallet className="w-12 h-12 text-[#5A6E5A] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#1B2B1B] mb-2">No payouts yet</h3>
              <p className="text-[#5A6E5A]">
                Your payout history will appear here once you start earning.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#2E7D32]/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-[#5A6E5A]">
                      <th className="text-left px-4 py-3 font-medium">Month</th>
                      <th className="text-right px-4 py-3 font-medium">Gross Revenue</th>
                      <th className="text-right px-4 py-3 font-medium hidden md:table-cell">
                        Platform Fee (30%)
                      </th>
                      <th className="text-right px-4 py-3 font-medium">Your Earnings (70%)</th>
                      <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Status</th>
                      <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-gray-50 hover:bg-[#FAFAF5] transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-[#1B2B1B]">{p.month}</td>
                        <td className="px-4 py-3 text-right text-[#1B2B1B]">
                          {formatUGX(p.grossRevenue)}
                        </td>
                        <td className="px-4 py-3 text-right text-[#5A6E5A] hidden md:table-cell">
                          {formatUGX(p.platformFee)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-[#2E7D32]">
                          {formatUGX(p.earnings)}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                              p.status === 'PAID'
                                ? 'bg-[#2E7D32]/10 text-[#2E7D32]'
                                : p.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {p.status === 'PAID' && <CheckCircle2 className="w-3 h-3" />}
                            {p.status === 'PENDING' && <Clock className="w-3 h-3" />}
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#5A6E5A] text-xs hidden lg:table-cell">
                          {p.reference || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
