import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InstructorCourse {
  id: string;
  title: string;
  status: string;
  price: string;
  category: { name: string };
  _count: { enrollments: number; reviews: number };
}

export default function InstructorDashboard() {
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    Promise.all([
      fetchApi("/instructor/courses"),
      fetchApi("/courses/categories")
    ]).then(([courseRes, catRes]) => {
      setCourses(courseRes.courses);
      setCategories(catRes.categories);
      if (catRes.categories.length > 0) setNewCategory(catRes.categories[0].id);
    }).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi("/instructor/courses", {
        method: "POST",
        body: JSON.stringify({ title: newTitle, categoryId: newCategory })
      });
      setCourses([res.course, ...courses]);
      setShowCreate(false);
      setNewTitle("");
    } catch (err) {
      console.error(err);
      alert("Failed to create course");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;

  return (
    <div className="bg-slate-50 min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
          <div>
            <h1 className="text-2xl font-bold">Instructor Dashboard</h1>
            <p className="text-slate-600 mt-1">Manage your courses and student analytics.</p>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? "Cancel" : "Create New Course"}
          </Button>
        </div>

        {showCreate && (
          <Card className="bg-white border-blue-200 shadow-md">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-blue-900">Create a New Course</h2>
              <form onSubmit={handleCreate} className="space-y-4 max-w-lg">
                <div className="space-y-2">
                  <Label>Course Title</Label>
                  <Input 
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)} 
                    placeholder="e.g. Modern Drip Irrigation Setup" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={newCategory} 
                    onChange={e => setNewCategory(e.target.value)}
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <Button type="submit">Create Course Draft</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          <h2 className="text-xl font-bold text-slate-800">Your Courses</h2>
          {courses.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-lg border border-dashed border-slate-300 text-slate-500">
              You haven't created any courses yet.
            </div>
          ) : (
            courses.map(course => (
              <div key={course.id} className="bg-white p-6 rounded-lg shadow-sm border flex flex-col md:flex-row gap-6 md:items-center justify-between hover:shadow-md transition-shadow">
                <div className="space-y-2 flex-grow">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{course.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      course.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 
                      course.status === 'DRAFT' ? 'bg-slate-100 text-slate-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {course.status}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 flex items-center gap-4">
                    <span>{course.category.name}</span>
                    <span>•</span>
                    <span>{course._count.enrollments} Students</span>
                    <span>•</span>
                    <span>{course._count.reviews} Reviews</span>
                    <span>•</span>
                    <span className="font-medium text-slate-700">${course.price}</span>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button variant="outline" className="flex-1 md:w-auto" asChild>
                    <Link to={`/instructor/course/${course.id}`}>Edit Content</Link>
                  </Button>
                  <Button variant="default" className="flex-1 md:w-auto">
                    Analytics
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
