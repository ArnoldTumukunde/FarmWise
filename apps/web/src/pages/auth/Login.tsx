import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { fetchApi } from "@/lib/api";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Leaf, Loader2, Eye, EyeOff } from "lucide-react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { setAuth } = useAuthStore();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetchApi("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, passwordPlain: password }),
            });
            setAuth(res.user, res.accessToken);
            toast.success("Welcome back!");
            navigate("/courses");
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message || "Login failed");
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
                    <h1 className="text-2xl font-bold text-[#1B2B1B]">Welcome back</h1>
                    <p className="text-sm text-[#5A6E5A] mt-1">Enter your email below to sign in to your account.</p>
                </CardHeader>
                <CardContent className="px-6 pb-2">
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[#1B2B1B] font-medium">Email</Label>
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
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-[#1B2B1B] font-medium">Password</Label>
                                <Link
                                    to="/forgot-password"
                                    className="text-sm text-[#2E7D32] hover:text-[#256829] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 rounded"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-11 pr-10 bg-white border-gray-200 text-[#1B2B1B] placeholder:text-[#5A6E5A]/60 focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6E5A] hover:text-[#1B2B1B]"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-11 bg-[#2E7D32] hover:bg-[#256829] text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Signing in...
                                </span>
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center pb-8 pt-4">
                    <p className="text-sm text-[#5A6E5A]">
                        Don't have an account?{" "}
                        <Link
                            to="/register"
                            className="text-[#2E7D32] font-medium hover:text-[#256829] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 rounded"
                        >
                            Sign up
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
