import { useState } from "react";
import { fetchApi } from "@/lib/api";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Leaf, Loader2, Mail, Phone, Eye, EyeOff } from "lucide-react";

export default function Register() {
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [useEmail, setUseEmail] = useState(true);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const passwordStrength = password.length === 0
        ? null
        : password.length < 6
            ? "weak"
            : password.length < 10
                ? "fair"
                : "strong";

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const payload = useEmail ? { email, password } : { phone };
            await fetchApi("/auth/register", {
                method: "POST",
                body: JSON.stringify(payload),
            });
            toast.success(
                "Account created! Check your " + (useEmail ? "email" : "phone") + " for verification."
            );
            setTimeout(() => navigate("/login"), 2000);
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message || "Registration failed");
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
                    <h1 className="text-2xl font-bold text-[#1B2B1B]">Create your account</h1>
                    <p className="text-sm text-[#5A6E5A] mt-1">Join FarmWise to access agricultural courses.</p>
                </CardHeader>
                <CardContent className="px-6 pb-2">
                    {/* Tab switch */}
                    <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
                        <button
                            type="button"
                            onClick={() => { setUseEmail(true); setError(""); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 ${
                                useEmail
                                    ? "bg-white text-[#2E7D32] shadow-sm"
                                    : "text-[#5A6E5A] hover:text-[#1B2B1B]"
                            }`}
                        >
                            <Mail className="h-4 w-4" />
                            Email
                        </button>
                        <button
                            type="button"
                            onClick={() => { setUseEmail(false); setError(""); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 ${
                                !useEmail
                                    ? "bg-white text-[#2E7D32] shadow-sm"
                                    : "text-[#5A6E5A] hover:text-[#1B2B1B]"
                            }`}
                        >
                            <Phone className="h-4 w-4" />
                            Phone
                        </button>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {useEmail ? (
                            <>
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
                                    <Label htmlFor="password" className="text-[#1B2B1B] font-medium">Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Minimum 6 characters"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
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
                                    {passwordStrength && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex gap-1 flex-1">
                                                <div className={`h-1.5 flex-1 rounded-full ${
                                                    passwordStrength === "weak" ? "bg-red-400" :
                                                    passwordStrength === "fair" ? "bg-[#F57F17]" : "bg-[#2E7D32]"
                                                }`} />
                                                <div className={`h-1.5 flex-1 rounded-full ${
                                                    passwordStrength === "fair" ? "bg-[#F57F17]" :
                                                    passwordStrength === "strong" ? "bg-[#2E7D32]" : "bg-gray-200"
                                                }`} />
                                                <div className={`h-1.5 flex-1 rounded-full ${
                                                    passwordStrength === "strong" ? "bg-[#2E7D32]" : "bg-gray-200"
                                                }`} />
                                            </div>
                                            <span className={`text-xs font-medium ${
                                                passwordStrength === "weak" ? "text-red-500" :
                                                passwordStrength === "fair" ? "text-[#F57F17]" : "text-[#2E7D32]"
                                            }`}>
                                                {passwordStrength === "weak" ? "Weak" :
                                                 passwordStrength === "fair" ? "Fair" : "Strong"}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-[#1B2B1B] font-medium">Phone Number</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="+256700000000"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    className="h-11 bg-white border-gray-200 text-[#1B2B1B] placeholder:text-[#5A6E5A]/60 focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                                />
                                <p className="text-xs text-[#5A6E5A]">Include your country code (e.g., +256 for Uganda).</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11 bg-[#2E7D32] hover:bg-[#256829] text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating account...
                                </span>
                            ) : (
                                "Create Account"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center pb-8 pt-4">
                    <p className="text-sm text-[#5A6E5A]">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="text-[#2E7D32] font-medium hover:text-[#256829] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 rounded"
                        >
                            Sign in
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
