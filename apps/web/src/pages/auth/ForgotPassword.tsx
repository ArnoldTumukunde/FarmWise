import { useState } from "react";
import { fetchApi } from "@/lib/api";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);
        try {
            await fetchApi("/auth/forgot-password", {
                method: "POST",
                body: JSON.stringify({ email }),
            });
            setSuccess("If the email exists, a reset link will be sent.");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Reset Password</CardTitle>
                    <CardDescription>Enter your email to receive a password reset link.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="text-red-500 text-sm">{error}</div>}
                        {success && <div className="text-green-600 text-sm p-2 bg-green-50 rounded border border-green-200">{success}</div>}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Sending..." : "Send Reset Link"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <Link to="/login" className="text-sm underline text-blue-600 hover:text-blue-800 transition-colors">Back to Login</Link>
                </CardFooter>
            </Card>
        </div>
    );
}
