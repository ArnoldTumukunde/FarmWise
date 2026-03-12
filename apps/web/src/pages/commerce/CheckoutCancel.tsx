import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardContent className="p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">✕</div>
          <h2 className="text-2xl font-bold text-slate-800">Checkout Canceled</h2>
          <p className="text-slate-600">
            Your payment was canceled and you have not been charged.
          </p>
          
          <div className="pt-4 space-y-3">
            <Button className="w-full h-12 text-lg focus:ring" asChild>
              <Link to="/cart">Return to Cart</Link>
            </Button>
            <Button variant="ghost" className="w-full" asChild>
              <Link to="/courses">Browse Courses</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
