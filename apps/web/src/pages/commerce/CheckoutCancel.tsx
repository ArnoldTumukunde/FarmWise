import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { XCircle, ArrowLeft, BookOpen } from 'lucide-react';

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen bg-[#FAFAF5] flex items-center justify-center p-4 font-[Inter]">
      <Card className="max-w-md w-full shadow-lg border-gray-200">
        <CardContent className="p-8 text-center space-y-6">
          {/* Red X Circle Icon */}
          <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
            <XCircle size={44} className="text-red-500" />
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-2xl font-bold text-[#1B2B1B]">Checkout Canceled</h2>
            <p className="text-[#5A6E5A] mt-2 text-sm leading-relaxed">
              Don't worry — you have not been charged. Your cart items are still saved and ready when you are.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-3">
            <Button
              className="w-full h-12 text-base font-semibold bg-[#2E7D32] hover:bg-[#2E7D32]/90 focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
              asChild
            >
              <Link to="/cart" className="flex items-center justify-center gap-2">
                <ArrowLeft size={18} />
                Return to Cart
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full h-11 border-[#2E7D32] text-[#2E7D32] hover:bg-[#2E7D32]/5 focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
              asChild
            >
              <Link to="/courses" className="flex items-center justify-center gap-2">
                <BookOpen size={16} />
                Browse Courses
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
