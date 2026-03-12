import { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export function UsersLayout() {
  const [users, setUsers] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchApi('/admin/users'),
      fetchApi('/admin/applications')
    ]).then(([usersRes, appsRes]) => {
      setUsers(usersRes.users);
      setApps(appsRes.applications);
    }).finally(() => setLoading(false));
  }, []);

  const handleApproveReject = async (id: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await fetchApi(`/admin/applications/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ action, note: `Admin ${action.toLowerCase()}` })
      });
      // Refresh
      const appsRes = await fetchApi('/admin/applications');
      setApps(appsRes.applications);
      const usersRes = await fetchApi('/admin/users');
      setUsers(usersRes.users);
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">Users & Instructor Applications</h1>

      <Card>
        <CardHeader>
          <CardTitle>Instructor Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {apps.length > 0 ? apps.map(app => (
              <div key={app.id} className="py-4 flex justify-between items-start">
                <div>
                  <div className="font-semibold text-slate-900">{app.user.profile.displayName}</div>
                  <div className="text-sm text-slate-500">{app.user.email}</div>
                  <p className="mt-2 text-sm text-slate-700 bg-slate-50 p-3 rounded border">
                    <span className="font-semibold block mb-1">Motivation:</span>
                    {app.motivation}
                  </p>
                  <div className="mt-2 flex gap-2">
                    {app.expertise.map((exp: string) => (
                      <span key={exp} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">{exp}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4 min-w-[120px]">
                  <span className={`text-xs font-bold px-2 py-1 rounded text-center
                    ${app.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : ''}
                    ${app.status === 'APPROVED' ? 'bg-green-100 text-green-800' : ''}
                    ${app.status === 'REJECTED' ? 'bg-red-100 text-red-800' : ''}
                  `}>
                    {app.status}
                  </span>
                  {app.status === 'PENDING' && (
                    <>
                      <Button size="sm" onClick={() => handleApproveReject(app.id, 'APPROVE')} className="w-full bg-green-600 hover:bg-green-700">Approve</Button>
                      <Button size="sm" onClick={() => handleApproveReject(app.id, 'REJECT')} variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">Reject</Button>
                    </>
                  )}
                </div>
              </div>
            )) : <div className="text-slate-500">No applications found.</div>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 uppercase">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b">
                  <td className="px-6 py-4 font-medium text-slate-900">{u.profile?.displayName || 'Unknown'}</td>
                  <td className="px-6 py-4">{u.email || u.phone}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold
                      ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : ''}
                      ${u.role === 'INSTRUCTOR' ? 'bg-blue-100 text-blue-800' : ''}
                      ${u.role === 'FARMER' ? 'bg-emerald-100 text-emerald-800' : ''}
                    `}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
