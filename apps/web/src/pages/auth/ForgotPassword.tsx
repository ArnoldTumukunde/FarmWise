import { useState } from "react";
import { fetchApi } from "@/lib/api";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Leaf, Loader2, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await fetchApi("/auth/forgot-password", {
                method: "POST",
                body: JSON.stringify({ email }),
            });
            setSent(true);
            toast.success("Reset link sent! Check your inbox.");
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center p-4 py-12">
            <Card className="w-full max-w-md shadow-lg border-gray-200">
                <CardHeader className="text-center pb-2 pt-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Leaf className="h-8 w-8 text-[#2E7D32]" />
                        <span className="text-2xl font-bold text-[#2E7D32]">FarmWise</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#1B2B1B]">Reset your password</h1>
                    <p className="text-sm text-[#5A6E5A] mt-1">
                        Enter your email and we'll send you a reset link.
                    </p>
                </CardHeader>
                <CardContent className="px-6 pb-2">
                    {sent ? (
                        <div className="text-center space-y-4 py-4">
                            <div className="mx-auto w-14 h-14 rounded-full bg-[#2E7D32]/10 flex items-center justify-center">
                                <Mail className="h-7 w-7 text-[#2E7D32]" />
                            </div>
                            <div>
                                <p className="text-[#1B2B1B] font-medium">Check your email</p>
                                <p className="text-sm text-[#5A6E5A] mt-1">
                                    If an account exists for <span className="font-medium text-[#1B2B1B]">{email}</span>, you'll receive a password reset link shortly.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="mt-2 border-gray-200 text-[#1B2B1B] hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                                onClick={() => { setSent(false); setEmail(""); }}
                            >
                                Try a different email
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[#1B2B1B] font-medium">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-11 bg-white border-gray-200 text-[#1B2B1B] placeholder:text-[#5A6E5A]/60 focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-11 bg-[#2E7D32] hover:bg-[#256829] text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Sending...
                                    </span>
                                ) : (
                                    "Send Reset Link"
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="justify-center pb-8 pt-4">
                    <Link
                        to="/login"
                        className="flex items-center gap-1.5 text-sm text-[#2E7D32] font-medium hover:text-[#256829] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 rounded"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to sign in
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
