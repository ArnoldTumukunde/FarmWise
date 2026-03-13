import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Leaf, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const [token, setToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const t = searchParams.get("token");
        if (t) setToken(t);
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        setLoading(true);
        try {
            await fetchApi("/auth/reset-password", {
                method: "POST",
                body: JSON.stringify({ token, newPassword }),
            });
            setSuccess(true);
            toast.success("Password reset successfully!");
        } catch (err: any) {
            setError(err.message || "Something went wrong");
            toast.error(err.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="flex-1 flex items-center justify-center p-4 py-12">
                <Card className="w-full max-w-md shadow-lg border-gray-200">
                    <CardHeader className="text-center pb-2 pt-8">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Leaf className="h-8 w-8 text-[#2E7D32]" />
                            <span className="text-2xl font-bold text-[#2E7D32]">FarmWise</span>
                        </div>
                        <h1 className="text-2xl font-bold text-[#1B2B1B]">Invalid reset link</h1>
                        <p className="text-sm text-[#5A6E5A] mt-1">
                            This password reset link is invalid or has expired.
                        </p>
                    </CardHeader>
                    <CardFooter className="justify-center pb-8 pt-4">
                        <Link
                            to="/forgot-password"
                            className="flex items-center gap-1.5 text-sm text-[#2E7D32] font-medium hover:text-[#256829] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 rounded"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Request a new reset link
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex-1 flex items-center justify-center p-4 py-12">
            <Card className="w-full max-w-md shadow-lg border-gray-200">
                <CardHeader className="text-center pb-2 pt-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Leaf className="h-8 w-8 text-[#2E7D32]" />
                        <span className="text-2xl font-bold text-[#2E7D32]">FarmWise</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#1B2B1B]">Set new password</h1>
                    <p className="text-sm text-[#5A6E5A] mt-1">
                        Enter your new password below.
                    </p>
                </CardHeader>
                <CardContent className="px-6 pb-2">
                    {success ? (
                        <div className="text-center space-y-4 py-4">
                            <div className="mx-auto w-14 h-14 rounded-full bg-[#2E7D32]/10 flex items-center justify-center">
                                <CheckCircle2 className="h-7 w-7 text-[#2E7D32]" />
                            </div>
                            <div>
                                <p className="text-[#1B2B1B] font-medium">Password reset successful</p>
                                <p className="text-sm text-[#5A6E5A] mt-1">
                                    Your password has been updated. You can now sign in with your new password.
                                </p>
                            </div>
                            <Link to="/login">
                                <Button
                                    className="mt-2 bg-[#2E7D32] hover:bg-[#256829] text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                                >
                                    Go to Sign In
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="newPassword" className="text-[#1B2B1B] font-medium">New password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    className="h-11 bg-white border-gray-200 text-[#1B2B1B] placeholder:text-[#5A6E5A]/60 focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-[#1B2B1B] font-medium">Confirm password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                                        Resetting...
                                    </span>
                                ) : (
                                    "Reset Password"
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
