import { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Users, BookOpen, DollarSign, DownloadCloud, Loader2 } from 'lucide-react';

export function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApi('/admin/dashboard')
            .then(data => setStats(data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;

    const statCards = [
        { title: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500' },
        { title: 'Active Courses', value: stats?.activeCourses || 0, icon: BookOpen, color: 'text-green-500' },
        { title: 'Total Revenue (UGX)', value: Number(stats?.totalRevenue || 0).toLocaleString(), icon: DollarSign, color: 'text-emerald-500' },
        { title: 'Offline Downloads', value: stats?.totalDownloads || 0, icon: DownloadCloud, color: 'text-purple-500' },
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-900">Platform Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map(stat => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title}>
                            <CardContent className="p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
                                    <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                                </div>
                                <div className={`p-4 rounded-full bg-slate-50 ${stat.color}`}>
                                    <Icon size={24} />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Instructor Applications</CardTitle>
                </CardHeader>
                <CardContent>
                    {stats?.pendingApplications?.length > 0 ? (
                        <div className="divide-y">
                            {stats.pendingApplications.map((app: any) => (
                                <div key={app.id} className="py-4 flex justify-between items-center text-sm">
                                    <div>
                                        <div className="font-semibold text-slate-900">{app.user.profile.displayName}</div>
                                        <div className="text-slate-500">{app.user.email}</div>
                                    </div>
                                    <div className="text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ring-amber-600/20">
                                        PENDING
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-slate-500 py-4 text-center">No pending instructor applications.</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
