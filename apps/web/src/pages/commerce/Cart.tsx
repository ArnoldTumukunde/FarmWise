import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchApi } from '@/lib/api';
import { cloudinaryImageUrl, formatUGX } from '@/lib/utils';
import { StarRating } from '@/components/ui/StarRating';
import { toast } from 'sonner';
import {
  ShoppingCart,
  Trash2,
  Heart,
  ShieldCheck,
  Loader2,
  Sprout,
  Tag,
} from 'lucide-react';

export default function Cart() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const cart = useCartStore();
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [discount, setDiscount] = useState<{ amount: number; code: string } | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  useEffect(() => {
    if (token && !cart.fetched) cart.fetchCart();
  }, [token]);

  useEffect(() => {
    if (!token) navigate('/login?redirect=/cart');
  }, [token]);

  const subtotal = cart.items.reduce((s, i) => s + (i.course.price || 0), 0);
  const total = discount ? Math.max(0, subtotal - discount.amount) : subtotal;

  const handleApplyCoupon = async () => {
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
      toast.error(err.message || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.items.length === 0) return;
    setCheckoutLoading(true);
    try {
      const firstItem = cart.items[0];
      const res = await fetchApi('/payments/checkout', {
        method: 'POST',
        body: JSON.stringify({
          courseId: firstItem.courseId,
          ...(discount ? { couponCode: discount.code } : {}),
        }),
      });
      if (res.enrolled) {
        toast.success('Enrolled successfully!');
        cart.removeItem(firstItem.id);
        navigate(`/learn/${res.courseSlug || firstItem.course.slug}`);
      } else if (res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      toast.error(err.message || 'Checkout failed. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleRemove = (itemId: string) => {
    cart.removeItem(itemId);
    setConfirmRemove(null);
    toast.success('Removed from cart');
  };

  // Empty cart
  if (cart.fetched && cart.items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <ShoppingCart size={48} className="text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-text-base mb-2">Your cart is empty</h1>
        <p className="text-text-muted mb-6 text-center max-w-sm">
          Discover courses to start learning
        </p>
        <Link
          to="/courses"
          className="bg-primary hover:bg-primary-light text-white font-semibold px-8 py-3 rounded-lg transition-colors"
        >
          Browse courses &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text-base mb-6">
        Shopping Cart ({cart.items.length} item{cart.items.length !== 1 ? 's' : ''})
      </h1>

      <div className="lg:grid lg:grid-cols-[1fr_360px] gap-8">
        {/* Cart items */}
        <div className="space-y-0">
          {cart.items.map((item) => (
            <div key={item.id} className="border-b border-gray-100 py-4 first:pt-0">
              <div className="flex gap-4">
                {/* Thumbnail */}
                <Link to={`/course/${item.course.slug}`} className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                  {item.course.thumbnailPublicId ? (
                    <img
                      src={cloudinaryImageUrl(item.course.thumbnailPublicId, 160, 112)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sprout size={20} className="text-primary/30" />
                    </div>
                  )}
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link to={`/course/${item.course.slug}`} className="text-sm font-semibold text-text-base hover:text-primary line-clamp-2 leading-tight">
                    {item.course.title}
                  </Link>
                  <p className="text-xs text-text-muted mt-0.5">
                    {item.course.instructor?.name || item.course.instructor?.profile?.displayName || 'Instructor'}
                  </p>
                </div>

                {/* Price + remove */}
                <div className="flex flex-col items-end flex-shrink-0 gap-1">
                  <span className="text-base font-bold text-text-base">
                    {item.course.price === 0 ? 'Free' : formatUGX(item.course.price)}
                  </span>

                  {confirmRemove === item.id ? (
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-red-500 font-medium hover:text-red-700"
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => setConfirmRemove(null)}
                        className="text-text-muted hover:text-text-base"
                      >
                        Keep
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 mt-1">
                      <button
                        onClick={() => setConfirmRemove(item.id)}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={12} />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="mt-6 lg:mt-0">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-text-base border-b border-gray-200 pb-4 mb-4">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Original price</span>
                <span className="text-text-base font-medium">{formatUGX(subtotal)}</span>
              </div>
              {discount && (
                <div className="flex justify-between text-primary font-medium">
                  <span className="flex items-center gap-1">
                    <Tag size={14} />
                    Discount ({discount.code})
                  </span>
                  <span>-{formatUGX(discount.amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold pt-3 border-t border-gray-200">
                <span>Total</span>
                <span>{formatUGX(total)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkoutLoading || cart.items.length === 0}
              className="w-full mt-5 bg-primary hover:bg-primary-light text-white font-bold py-3.5 rounded-lg text-base transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {checkoutLoading ? (
                <><Loader2 size={18} className="animate-spin" /> Processing…</>
              ) : (
                'Checkout'
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-text-muted mt-3">
              <ShieldCheck size={13} className="text-primary" />
              30-Day Money-Back Guarantee
            </div>

            {/* Coupon */}
            <details className="mt-4">
              <summary className="text-sm font-medium text-primary cursor-pointer hover:underline">
                Have a coupon code?
              </summary>
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  placeholder="Coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={!couponCode || couponLoading}
                  className="px-4 py-2 border border-primary text-primary text-sm font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
            </details>

            <p className="text-xs text-center text-text-muted mt-4">Secure payment via Stripe</p>
          </div>
        </div>
      </div>
    </div>
  );
}
