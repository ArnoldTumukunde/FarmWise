import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchApi } from '@/lib/api';
import { formatUGX } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Trash2,
  ShoppingCart,
  Lock,
  Shield,
  Tag,
  Loader2,
  Sprout,
} from 'lucide-react';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  title: string;
  price: string;
  thumbnailUrl: string | null;
  instructorName: string;
}

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [discount, setDiscount] = useState<{ amount: number; code: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('farmwise-cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        localStorage.removeItem('farmwise-cart');
      }
    }
  }, []);

  const saveCart = (newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem('farmwise-cart', JSON.stringify(newItems));
  };

  const removeFromCart = (id: string) => {
    const item = items.find(i => i.id === id);
    saveCart(items.filter(item => item.id !== id));
    if (item) {
      toast.success(`"${item.title}" removed from cart`);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + Number(item.price), 0);
  const total = discount ? Math.max(0, subtotal - discount.amount) : subtotal;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode) return;
    setCouponLoading(true);
    try {
      const res = await fetchApi('/cart/coupon', {
        method: 'POST',
        body: JSON.stringify({ code: couponCode, cartSubtotal: subtotal }),
      });
      setDiscount({ amount: res.discountAmount, code: couponCode });
      toast.success(`Coupon "${couponCode}" applied! You save ${formatUGX(res.discountAmount)}`);
    } catch (err: any) {
      toast.error(err.message || 'Invalid coupon code. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setLoading(true);

    try {
      // Process one course at a time. Create checkout for the first item,
      // remaining items stay in cart for subsequent checkouts.
      const firstItem = items[0];
      const res = await fetchApi('/payments/checkout', {
        method: 'POST',
        body: JSON.stringify({
          courseId: firstItem.id,
          ...(discount ? { couponCode: discount.code } : {}),
        }),
      });

      if (res.enrolled) {
        // Free course - confirmed immediately, safe to remove from cart
        toast.success('Enrollment successful!');
        const remaining = items.filter(i => i.id !== firstItem.id);
        saveCart(remaining);
        if (remaining.length > 0) {
          toast.info(`${remaining.length} item${remaining.length !== 1 ? 's' : ''} still in your cart.`);
        }
        navigate(`/learn/${res.courseSlug}`);
      } else if (res.url) {
        // Paid course - keep item in cart until CheckoutSuccess confirms payment
        window.location.href = res.url;
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Empty Cart State
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAFAF5] flex flex-col items-center justify-center p-8 font-[Inter]">
        <div className="w-24 h-24 bg-[#2E7D32]/10 rounded-full flex items-center justify-center mb-6">
          <ShoppingCart size={40} className="text-[#2E7D32]" />
        </div>
        <h1 className="text-2xl font-bold text-[#1B2B1B] mb-2">Your cart is empty</h1>
        <p className="text-[#5A6E5A] mb-8 text-center max-w-sm">
          Explore our catalog and find courses to grow your farming knowledge.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-[#2E7D32] hover:bg-[#2E7D32]/90 text-white focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
        >
          <Link to="/courses">Browse Courses</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-[#FAFAF5] min-h-screen p-4 md:p-8 font-[Inter]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <ShoppingCart size={24} className="text-[#2E7D32]" />
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1B2B1B]">Shopping Cart</h1>
          <span className="text-sm text-[#5A6E5A] bg-gray-200 px-2.5 py-0.5 rounded-full font-medium">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <Card key={item.id} className="overflow-hidden border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-0 flex flex-col sm:flex-row">
                  {/* Thumbnail */}
                  <div className="w-full sm:w-44 bg-gray-200 aspect-video sm:aspect-auto sm:h-auto flex-shrink-0">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full min-h-[120px] flex items-center justify-center bg-gradient-to-br from-[#2E7D32]/20 to-[#4CAF50]/10">
                        <Sprout size={32} className="text-[#2E7D32]/30" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4 flex-grow flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base text-[#1B2B1B] line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-[#5A6E5A] mt-0.5">
                        By {item.instructorName}
                      </p>
                      <div className="font-bold text-lg text-[#1B2B1B] mt-2 sm:mt-1">
                        {formatUGX(item.price)}
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors self-end sm:self-center focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                      aria-label={`Remove ${item.title} from cart`}
                    >
                      <Trash2 size={16} />
                      <span className="sm:hidden">Remove</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <Card className="shadow-md border-[#2E7D32]/20 sticky top-8">
              <CardContent className="p-6 space-y-5">
                <h2 className="text-lg font-bold text-[#1B2B1B] border-b border-gray-200 pb-4">
                  Order Summary
                </h2>

                {/* Pricing */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#5A6E5A]">Subtotal</span>
                    <span className="text-[#1B2B1B] font-medium">{formatUGX(subtotal)}</span>
                  </div>
                  {discount && (
                    <div className="flex justify-between text-[#2E7D32] font-medium">
                      <span className="flex items-center gap-1">
                        <Tag size={14} />
                        Discount ({discount.code})
                      </span>
                      <span>-{formatUGX(discount.amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                    <span className="text-[#1B2B1B]">Total</span>
                    <span className="text-[#1B2B1B]">{formatUGX(total)}</span>
                  </div>
                </div>

                {/* Coupon */}
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <Input
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    className="text-sm focus-visible:ring-[#2E7D32]"
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={!couponCode || couponLoading}
                    className="shrink-0 focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                  >
                    {couponLoading ? <Loader2 size={16} className="animate-spin" /> : 'Apply'}
                  </Button>
                </form>

                {/* Checkout info */}
                {items.length > 1 && (
                  <p className="text-xs text-[#5A6E5A] text-center bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Checkout processes one course at a time. You will be checking out "{items[0].title}" first.
                  </p>
                )}

                {/* Checkout Button */}
                <Button
                  className="w-full h-12 text-base font-bold bg-[#2E7D32] hover:bg-[#2E7D32]/90 shadow-lg hover:shadow-xl transition-all focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Lock size={16} />
                      Secure Checkout
                    </span>
                  )}
                </Button>

                {/* Guarantee */}
                <div className="flex items-start gap-2.5 pt-2 text-xs text-[#5A6E5A]">
                  <Shield size={16} className="shrink-0 text-[#2E7D32] mt-0.5" />
                  <div>
                    <p className="font-medium text-[#1B2B1B]">30-Day Money-Back Guarantee</p>
                    <p className="mt-0.5">Full refund if you're not satisfied. No questions asked.</p>
                  </div>
                </div>

                <p className="text-xs text-center text-[#5A6E5A] pt-1">Powered by Stripe</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
