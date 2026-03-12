import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

interface CartItem {
  id: string; // The course ID
  title: string;
  price: string;
  thumbnailUrl: string | null;
  instructorName: string;
}

export default function Cart() {
  // In a full implementation, cart state would live in Zustand so the navbar icon updates instantly.
  // For this prototype, we'll keep it local to the component, simulating DB or local storage.
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState<{ amount: number, code: string } | null>(null);
  const navigate = useNavigate();

  // Mock initial load (would normally fetch from /api/v1/cart/items)
  useEffect(() => {
    const saved = localStorage.getItem("farmwise-cart");
    if (saved) {
      setItems(JSON.parse(saved));
    }
  }, []);

  const saveCart = (newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem("farmwise-cart", JSON.stringify(newItems));
  };

  const removeFromCart = (id: string) => {
    saveCart(items.filter(item => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + Number(item.price), 0);
  const total = discount ? Math.max(0, subtotal - discount.amount) : subtotal;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode) return;
    try {
      // Mock coupon validation
      const res = await fetchApi("/cart/coupon", { 
        method: "POST", 
        body: JSON.stringify({ code: couponCode, cartSubtotal: subtotal }) 
      });
      setDiscount({ amount: res.discountAmount, code: couponCode });
    } catch (err: any) {
      alert(err.message || "Invalid coupon.");
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setLoading(true);
    
    try {
      // Create session for the first item (FarmWise MVP assumes 1 course per purchase based on rules, 
      // but in reality we would pass all cart items to a unified checkout endpoint)
      const res = await fetchApi("/payments/checkout", {
        method: "POST",
        body: JSON.stringify({ courseId: items[0].id })
      });

      if (res.enrolled) {
        // Was a free fast-track
        saveCart([]); // Clear cart
        navigate(`/learn/${res.courseSlug}`);
      } else if (res.url) {
        // Redirect to Stripe
        window.location.href = res.url;
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
        <div className="text-slate-400 mb-4 text-6xl">🛒</div>
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-slate-600 mb-6">Keep exploring to find a course!</p>
        <Button asChild size="lg">
          <Link to="/courses">Browse Courses</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2 space-y-4">
            {items.map(item => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-0 flex flex-col sm:flex-row shadow-sm">
                  <div className="w-full sm:w-48 bg-slate-200 aspect-video sm:aspect-auto sm:h-32 flex-shrink-0">
                    {item.thumbnailUrl && <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />}
                  </div>
                  <div className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-1">{item.title}</h3>
                      <p className="text-sm text-slate-500">By {item.instructorName}</p>
                    </div>
                    <div className="font-bold text-lg mt-2">
                       {Number(item.price) === 0 ? "Free" : `$${item.price}`}
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-end sm:border-l border-slate-100">
                    <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeFromCart(item.id)}>
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <Card className="shadow-md border-blue-100 sticky top-8">
              <CardContent className="p-6 space-y-6">
                <h2 className="text-xl font-bold border-b pb-4">Order Summary</h2>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Original Price:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {discount && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Discount ({discount.code}):</span>
                      <span>-${discount.amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-4 border-t">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <Input 
                    placeholder="Coupon Code" 
                    value={couponCode} 
                    onChange={e => setCouponCode(e.target.value)}
                  />
                  <Button type="submit" variant="secondary" disabled={!couponCode}>Apply</Button>
                </form>

                <Button 
                  className="w-full h-12 text-lg font-bold shadow-lg hover:shadow-xl transition-shadow" 
                  onClick={handleCheckout} 
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Secure Checkout"}
                </Button>
                
                <div className="text-xs text-center text-slate-400">
                  <p>30-Day Money-Back Guarantee</p>
                  <p className="mt-1">Powered by Stripe</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
