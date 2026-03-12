import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const slug = searchParams.get("slug");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // In a real app we would ping the backend to confirm the session has been
    // processed by the webhook. For this demo, we assume success or wait a moment.
    const timer = setTimeout(() => {
      setChecking(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardContent className="p-8 text-center space-y-6">
          {checking ? (
            <>
              <div className="w-16 h-16 border-4 border-slate-200 border-t-green-500 rounded-full animate-spin mx-auto" />
              <h2 className="text-xl font-bold">Verifying Payment...</h2>
              <p className="text-slate-500">Please do not close this window.</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">✓</div>
              <h2 className="text-2xl font-bold text-slate-800">Payment Successful!</h2>
              <p className="text-slate-600">
                Thank you for your purchase. Your receipt has been sent to your email.
              </p>
              
              <div className="pt-4 space-y-3">
                <Button className="w-full h-12 text-lg" asChild>
                  <Link to={`/learn/${slug || ''}`}>Start Learning Now</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/courses">Browse More Courses</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
