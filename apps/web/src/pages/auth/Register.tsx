import { useState } from "react";
import { fetchApi } from "@/lib/api";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function Register() {
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [useEmail, setUseEmail] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);
        try {
            const payload = useEmail ? { email, password } : { phone };
            const res = await fetchApi("/auth/register", {
                method: "POST",
                body: JSON.stringify(payload),
            });
            setSuccess("Account created successfully. Check your " + (useEmail ? "email" : "phone") + " for verification.");
            setTimeout(() => navigate("/login"), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">Join FarmWise</CardTitle>
                    <CardDescription>Create an account to access agricultural courses.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 mb-4">
                        <Button variant={useEmail ? "default" : "outline"} type="button" onClick={() => { setUseEmail(true); setError(""); }} className="flex-1">Use Email</Button>
                        <Button variant={!useEmail ? "default" : "outline"} type="button" onClick={() => { setUseEmail(false); setError(""); }} className="flex-1">Use Phone</Button>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
                        {success && <div className="p-3 bg-green-100 text-green-700 rounded-md text-sm">{success}</div>}

                        {useEmail ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number (with country code)</Label>
                                <Input id="phone" type="tel" placeholder="+256700000000" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                            </div>
                        )}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Registering..." : "Register"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <div className="text-sm">
                        Already have an account? <Link to="/login" className="underline text-blue-600 hover:text-blue-800 transition-colors">Login here</Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
