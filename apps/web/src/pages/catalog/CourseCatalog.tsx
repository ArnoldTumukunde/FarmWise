import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { cloudinaryImageUrl } from "@/lib/utils";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Star, Users, Wifi, Award, Sprout } from "lucide-react";

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
  averageRating?: number;
  isFeatured?: boolean;
  isOfflineEnabled?: boolean;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i <= Math.round(rating)
              ? "fill-[#F57F17] text-[#F57F17]"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <Card className="overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-200" />
      <CardContent className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-3/5" />
        <div className="h-3 bg-gray-200 rounded w-2/5" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-5 bg-gray-200 rounded w-16" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

function formatPrice(price: string): string {
  const num = Number(price);
  if (num === 0) return "Free";
  return `UGX ${num.toLocaleString()}`;
}

// Using cloudinaryImageUrl from @/lib/utils

export default function CourseCatalog() {
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [totalCourses, setTotalCourses] = useState<number>(0);

  useEffect(() => {
    fetchApi("/courses/categories")
      .then((res) => setCategories(res.categories))
      .catch(console.error);
  }, []);

  useEffect(() => {
    loadCourses(search);
  }, [selectedCategory]);

  useEffect(() => {
    const q = searchParams.get("search");
    if (q) {
      setSearch(q);
      loadCourses(q);
    }
  }, [searchParams]);

  const loadCourses = async (searchQuery = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory) params.append("categoryId", selectedCategory);
      const res = await fetchApi(`/courses?${params.toString()}`);
      setCourses(res.data);
      setTotalCourses(res.total ?? res.data.length);
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
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#2E7D32] to-[#1A2E1A] text-white py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sprout className="h-8 w-8 text-[#4CAF50]" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Learn to Farm Smarter
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
            Practical courses from expert farmers. Grow your skills, grow your harvest.
          </p>
          <form
            onSubmit={handleSearch}
            className="max-w-xl mx-auto mt-6"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#5A6E5A]" />
              <input
                type="search"
                placeholder="Search farming courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 sm:h-14 pl-12 pr-28 rounded-xl border-0 bg-white text-[#1B2B1B] text-base placeholder:text-[#5A6E5A] shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB300] focus-visible:ring-offset-2"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 sm:h-10 px-5 rounded-lg bg-[#F57F17] text-white text-sm font-medium hover:bg-[#E65100] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Category filter pills */}
      <div className="max-w-7xl mx-auto px-4 mt-6 mb-2">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          <button
            onClick={() => { setSelectedCategory(""); setSearch(""); }}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 ${
              selectedCategory === ""
                ? "bg-[#2E7D32] text-white"
                : "bg-white text-[#1B2B1B] border border-gray-200 hover:border-[#2E7D32] hover:text-[#2E7D32]"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); setSearch(""); }}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 ${
                selectedCategory === cat.id
                  ? "bg-[#2E7D32] text-white"
                  : "bg-white text-[#1B2B1B] border border-gray-200 hover:border-[#2E7D32] hover:text-[#2E7D32]"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Course grid */}
      <section className="max-w-7xl mx-auto px-4 py-6 pb-12">
        {!loading && courses.length > 0 && (
          <p className="text-sm text-[#5A6E5A] mb-4">
            {totalCourses} course{totalCourses !== 1 ? "s" : ""} found
          </p>
        )}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Sprout className="h-12 w-12 text-[#5A6E5A]/40 mx-auto" />
            <p className="text-lg text-[#1B2B1B] font-medium">No courses found</p>
            <p className="text-sm text-[#5A6E5A] max-w-md mx-auto">
              No courses found for your search. Try a crop name or farming topic.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map((course) => (
              <Link
                to={`/course/${course.slug}`}
                key={course.id}
                className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 rounded-xl"
              >
                <Card className="h-full overflow-hidden border-gray-200 hover:shadow-lg transition-shadow duration-200 rounded-xl">
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gray-100 relative overflow-hidden">
                    {course.thumbnailPublicId ? (
                      <img
                        src={cloudinaryImageUrl(course.thumbnailPublicId)}
                        alt={course.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#5A6E5A]/50 text-sm">
                        {course.category.name}
                      </div>
                    )}
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      {course.isFeatured && (
                        <span className="inline-flex items-center gap-1 bg-[#F57F17] text-white text-xs font-medium px-2 py-0.5 rounded-md">
                          <Award className="h-3 w-3" />
                          Featured
                        </span>
                      )}
                      {course.isOfflineEnabled && (
                        <span className="inline-flex items-center gap-1 bg-[#2E7D32] text-white text-xs font-medium px-2 py-0.5 rounded-md">
                          <Wifi className="h-3 w-3" />
                          Offline
                        </span>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-md backdrop-blur-sm">
                      {course.category.name}
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold text-[#1B2B1B] line-clamp-2 leading-snug group-hover:text-[#2E7D32] transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-[#5A6E5A] truncate">
                      {course.instructor.profile.displayName}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#1B2B1B]">
                        {course.averageRating ? Number(course.averageRating).toFixed(1) : "New"}
                      </span>
                      {course.averageRating ? (
                        <StarRating rating={course.averageRating} />
                      ) : null}
                      <span className="text-xs text-[#5A6E5A]">
                        ({course._count.enrollments.toLocaleString()})
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span
                        className={`text-lg font-bold ${
                          Number(course.price) === 0 ? "text-[#2E7D32]" : "text-[#1B2B1B]"
                        }`}
                      >
                        {formatPrice(course.price)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
