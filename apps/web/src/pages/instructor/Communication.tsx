import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '@/lib/api';
import { cloudinaryImageUrl } from '@/lib/utils';
import {
  MessageSquare,
  Star,
  Megaphone,
  BookOpen,
  ChevronRight,
  Sprout,
} from 'lucide-react';
import { toast } from 'sonner';

interface Course {
  id: string;
  title: string;
  thumbnailPublicId?: string;
  _count?: { enrollments: number; reviews: number };
}

export default function Communication() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/instructor/courses')
      .then((res) => setCourses(res.courses || res.data || res || []))
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false));
  }, []);

  const sections = [
    { key: 'qa', label: 'Q&A', icon: MessageSquare, path: 'qa', description: 'Answer student questions' },
    { key: 'reviews', label: 'Reviews', icon: Star, path: 'reviews', description: 'Read and respond to reviews' },
    { key: 'announcements', label: 'Announcements', icon: Megaphone, path: 'announcements', description: 'Send announcements to students' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-[1200px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B2B1B]">Communication</h1>
        <p className="text-sm text-gray-500 mt-0.5">Interact with your students across all courses</p>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 h-20" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Sprout className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Create a course to start communicating with students.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Course header */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                  {course.thumbnailPublicId ? (
                    <img
                      src={cloudinaryImageUrl(course.thumbnailPublicId, 80, 80)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-semibold text-[#1B2B1B] truncate">{course.title}</p>
              </div>

              {/* Action links */}
              <div className="divide-y divide-gray-50">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <Link
                      key={section.key}
                      to={`/instructor/courses/${course.id}/${section.path}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1B2B1B]">{section.label}</p>
                        <p className="text-xs text-gray-500">{section.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
