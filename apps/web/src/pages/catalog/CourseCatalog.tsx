import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  price: string;
  thumbnailPublicId: string | null;
  category: { id: string; name: string; iconName: string };
  instructor: { profile: { displayName: string } };
  _count: { enrollments: number; reviews: number; sections: number };
}

export default function CourseCatalog() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => {
    fetchApi("/courses/categories").then(res => setCategories(res.categories)).catch(console.error);
    loadCourses();
  }, [selectedCategory]);

  const loadCourses = async (searchQuery = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory) params.append("categoryId", selectedCategory);
      const res = await fetchApi(`/courses?${params.toString()}`);
      setCourses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCourses(search);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold">Agricultural Courses</h1>
            <p className="text-slate-600">Learn from experts and grow your harvest.</p>
          </div>
          
          <form onSubmit={handleSearch} className="flex w-full md:w-auto gap-2">
            <Input 
              type="search" 
              placeholder="Search courses..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-64 bg-white"
            />
            <Button type="submit">Search</Button>
          </form>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button 
            variant={selectedCategory === "" ? "default" : "outline"} 
            onClick={() => setSelectedCategory("")}
            className="whitespace-nowrap"
          >
            All Categories
          </Button>
          {categories.map(cat => (
            <Button 
              key={cat.id} 
              variant={selectedCategory === cat.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat.id)}
              className="whitespace-nowrap"
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-slate-200 rounded-t-lg" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No courses found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <Link to={`/course/${course.slug}`} key={course.id}>
                <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden group">
                  <div className="aspect-video bg-slate-200 relative">
                    {course.thumbnailPublicId ? (
                      <img 
                        src={`https://res.cloudinary.com/dqewyo0kw/image/upload/w_600,h_338,c_fill,q_auto,f_auto/${course.thumbnailPublicId}`} 
                        alt={course.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        {course.category.name}
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                      {course.category.name}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-slate-600 truncate mt-1">
                      {course.instructor.profile.displayName}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                      <span>{course._count.sections} sections</span>
                      <span>{course._count.enrollments} students</span>
                    </div>
                  </CardContent>
                  <CardFooter className="px-4 py-3 border-t bg-slate-50/50 flex justify-between items-center">
                    <div className="font-bold text-lg">
                      {Number(course.price) === 0 ? "Free" : `$${course.price}`}
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
