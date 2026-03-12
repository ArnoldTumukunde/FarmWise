import { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export function CoursesLayout() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = () => {
    fetchApi('/admin/courses/review')
      .then(res => setCourses(res.courses))
      .finally(() => setLoading(false));
  };

  const moderateCourse = async (id: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await fetchApi(`/admin/courses/${id}/moderate`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      loadCourses();
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div>Loading courses...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">Course Moderation</h1>

      <Card>
        <CardHeader>
          <CardTitle>Courses Pending Review ({courses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {courses.length > 0 ? courses.map(course => (
              <div key={course.id} className="py-4 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-slate-900 text-lg">{course.title}</div>
                  <div className="text-sm text-slate-500 mb-2">By {course.instructor.profile.displayName}</div>
                  <div className="flex gap-4 text-xs text-slate-600">
                     <span>Price: {Number(course.price) === 0 ? 'Free' : `UGX ${course.price}`}</span>
                     <span>Level: {course.level}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                   <Button onClick={() => moderateCourse(course.id, 'APPROVE')} className="bg-green-600 hover:bg-green-700">Approve & Publish</Button>
                   <Button onClick={() => moderateCourse(course.id, 'REJECT')} variant="outline" className="text-red-600 border-red-200">Reject to Draft</Button>
                </div>
              </div>
            )) : <div className="text-slate-500">No courses currently under review.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
