import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const slug = searchParams.get("slug");
  const courseId = searchParams.get("courseId");

  // Clear the purchased course from the cart
  useEffect(() => {
    if (!courseId) return;
    try {
      const saved = localStorage.getItem('farmwise-cart');
      if (saved) {
        const items = JSON.parse(saved);
        const remaining = items.filter((item: any) => item.id !== courseId);
        localStorage.setItem('farmwise-cart', JSON.stringify(remaining));
      }
    } catch {
      // Ignore malformed cart data
    }
  }, [courseId]);

  // Use slug if available, fall back to courseId for the learn link
  const learnPath = slug ? `/learn/${slug}` : courseId ? `/learn/${courseId}` : '/my-library';
  const coursePath = slug ? `/course/${slug}` : '/courses';

  return (
    <div className="min-h-screen bg-[#FAFAF5] flex items-center justify-center p-4 font-[Inter]">
      <Card className="max-w-md w-full shadow-lg border-gray-200">
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-[#2E7D32]/10 text-[#2E7D32] rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
            &#10003;
          </div>
          <h2 className="text-2xl font-bold text-[#1B2B1B]">Payment Successful!</h2>
          <p className="text-[#5A6E5A]">
            Thank you for your purchase. Your receipt has been sent to your email.
          </p>

          <div className="pt-4 space-y-3">
            <Button
              className="w-full h-12 text-lg bg-[#2E7D32] hover:bg-[#2E7D32]/90 focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
              asChild
            >
              <Link to={learnPath}>Start Learning Now</Link>
            </Button>
            <Button
              variant="outline"
              className="w-full focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
              asChild
            >
              <Link to="/courses">Browse More Courses</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
