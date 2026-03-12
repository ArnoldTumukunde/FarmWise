import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  price: string;
  thumbnailPublicId: string | null;
  instructor: { profile: { displayName: string, headline: string, bio: string } };
  sections: {
    id: string;
    title: string;
    order: number;
    lectures: {
      id: string;
      title: string;
      order: number;
      type: string;
      duration: number | null;
      isPreview: boolean;
    }[];
  }[];
  _count: { enrollments: number; reviews: number };
  averageRating: number;
}

export default function CourseDetail() {
  const { slug } = useParams();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    fetchApi(`/courses/${slug}`)
      .then(res => {
          setCourse(res.course);
          // Fetch reviews after getting course ID
          return fetchApi(`/reviews/courses/${res.course.id}`).catch(() => ({ reviews: [] }));
      })
      .then(res => {
          if (res?.reviews) setReviews(res.reviews);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-8 text-center">Loading course...</div>;
  if (error || !course) return <div className="p-8 text-center text-red-500">{error || "Course not found"}</div>;

  const totalLectures = course.sections.reduce((acc, s) => acc + s.lectures.length, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-slate-900 text-white p-8 md:p-16">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 items-center">
          <div className="md:col-span-2 space-y-4">
            <h1 className="text-3xl md:text-5xl font-bold">{course.title}</h1>
            <p className="text-xl text-slate-300">{course.subtitle}</p>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span className="flex gap-1 text-yellow-500 font-medium">★ {Number(course.averageRating).toFixed(1)}</span>
              <span>{course._count.enrollments} enrolled students</span>
              <span>{course.instructor.profile.displayName}</span>
            </div>
          </div>
          
          <Card className="bg-white text-slate-900 overflow-hidden shadow-xl sticky top-8">
            <div className="aspect-video bg-slate-200">
              {course.thumbnailPublicId ? (
                <img 
                  src={`https://res.cloudinary.com/dqewyo0kw/image/upload/w_600,h_338,c_fill,q_auto,f_auto/${course.thumbnailPublicId}`} 
                  alt={course.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">No Image</div>
              )}
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="text-3xl font-bold">
                {Number(course.price) === 0 ? "Free" : `$${course.price}`}
              </div>
              <Button className="w-full text-lg h-12">Enroll Now</Button>
              <div className="text-xs text-center text-slate-500">
                30-Day Money-Back Guarantee
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-12">
        <section className="space-y-4 bg-white p-6 rounded-lg border">
          <h2 className="text-2xl font-bold">Description</h2>
          <div className="prose max-w-none text-slate-700 whitespace-pre-line">
            {course.description}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Curriculum</h2>
          <div className="text-slate-600 mb-4">{course.sections.length} sections • {totalLectures} lectures</div>
          
          <div className="space-y-4">
            {course.sections.map(section => (
              <div key={section.id} className="border rounded-lg bg-white overflow-hidden">
                <div className="bg-slate-50 p-4 font-semibold border-b flex justify-between">
                  {section.title}
                  <span className="text-sm font-normal text-slate-500">{section.lectures.length} lectures</span>
                </div>
                <div className="divide-y">
                  {section.lectures.map(lecture => (
                    <div key={lecture.id} className="p-4 flex justify-between items-center text-sm md:text-base hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 w-5 text-center">
                          {lecture.type === 'VIDEO' ? '▶' : lecture.type === 'ARTICLE' ? '📄' : '❓'}
                        </span>
                        <span className={lecture.isPreview ? "text-blue-600 font-medium" : "text-slate-700"}>
                          {lecture.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-slate-500 text-sm">
                        {lecture.isPreview && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Preview</span>}
                        {lecture.duration && <span>{Math.floor(lecture.duration / 60)}:{String(lecture.duration % 60).padStart(2, '0')}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Instructor</h2>
          <div className="flex gap-4 items-start">
            <div className="w-16 h-16 rounded-full bg-slate-200 flex-shrink-0" />
            <div>
              <div className="font-bold text-lg text-blue-600">{course.instructor.profile.displayName}</div>
              <div className="text-slate-600 text-sm mb-4">{course.instructor.profile.headline}</div>
              <div className="text-slate-700 text-sm">{course.instructor.profile.bio}</div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="space-y-6 pt-6 border-t border-slate-200">
          <h2 className="text-2xl font-bold">Student Reviews</h2>
          <div className="flex items-center gap-4 mb-6">
             <div className="text-4xl font-bold text-slate-900">{Number(course.averageRating).toFixed(1)}</div>
             <div className="flex flex-col">
                <div className="text-yellow-500 text-xl">{'★'.repeat(Math.round(course.averageRating || 0))}{'☆'.repeat(5 - Math.round(course.averageRating || 0))}</div>
                <div className="text-sm text-slate-500">Course Rating</div>
             </div>
          </div>
          <div className="space-y-4">
             {reviews.length > 0 ? reviews.map(review => (
                <div key={review.id} className="border rounded-lg bg-white p-6 space-y-3">
                   <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                            {review.user?.profile?.displayName?.[0] || 'U'}
                         </div>
                         <div>
                            <div className="font-semibold text-slate-900">{review.user?.profile?.displayName || 'Student'}</div>
                            <div className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</div>
                         </div>
                      </div>
                      <div className="text-amber-500">{'★'.repeat(review.rating)}</div>
                   </div>
                   {review.content && <p className="text-slate-700">{review.content}</p>}
                   {review.instructorResponse && (
                       <div className="mt-4 bg-slate-50 p-4 rounded-md border border-slate-100">
                           <div className="text-xs font-bold text-blue-600 mb-1">Instructor Response</div>
                           <p className="text-sm text-slate-700">{review.instructorResponse}</p>
                       </div>
                   )}
                </div>
             )) : (
                <div className="text-slate-500">No reviews yet.</div>
             )}
          </div>
        </section>
      </div>
    </div>
  );
}
