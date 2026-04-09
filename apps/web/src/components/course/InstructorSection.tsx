import { useState } from 'react';
import { Star, Users, BookOpen, MessageSquare } from 'lucide-react';

interface InstructorData {
  id?: string;
  name: string;
  title?: string;
  avatarUrl?: string;
  bio?: string;
  averageRating?: number;
  reviewCount?: number;
  studentCount?: number;
  courseCount?: number;
}

export function InstructorSection({
  instructor,
}: {
  instructor: InstructorData;
}) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const bioIsLong = (instructor.bio?.length ?? 0) > 400;

  return (
    <section className="py-10 border-b border-gray-100">
      <h2 className="text-xl lg:text-2xl font-bold text-text-base mb-6">
        Your instructor
      </h2>

      <a
        href={instructor.id ? `/instructors/${instructor.id}` : '#'}
        className="text-lg font-semibold text-primary hover:underline underline-offset-2 block mb-1"
      >
        {instructor.name}
      </a>
      <p className="text-sm text-text-muted mb-4">
        {instructor.title ?? 'Agricultural Expert'}
      </p>

      <div className="flex items-start gap-5">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 bg-primary/10 border-2 border-primary/20">
          {instructor.avatarUrl ? (
            <img
              src={instructor.avatarUrl}
              alt={instructor.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl text-primary font-bold">
              {instructor.name[0]}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Star size={14} className="text-accent" fill="#F57F17" />
            <span>
              <strong className="text-text-base">
                {instructor.averageRating?.toFixed(1) ?? '—'}
              </strong>{' '}
              Instructor rating
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <MessageSquare size={14} className="text-text-muted" />
            <span>
              <strong className="text-text-base">
                {instructor.reviewCount?.toLocaleString() ?? '0'}
              </strong>{' '}
              Reviews
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Users size={14} className="text-text-muted" />
            <span>
              <strong className="text-text-base">
                {instructor.studentCount?.toLocaleString() ?? '0'}
              </strong>{' '}
              Students
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <BookOpen size={14} className="text-text-muted" />
            <span>
              <strong className="text-text-base">
                {instructor.courseCount ?? '0'}
              </strong>{' '}
              Courses
            </span>
          </div>
        </div>
      </div>

      {/* Bio */}
      {instructor.bio && (
        <div className="mt-5 relative">
          <div
            className={`prose prose-sm max-w-none text-text-base
                         ${!bioExpanded && bioIsLong ? 'max-h-32 overflow-hidden' : ''}`}
            dangerouslySetInnerHTML={{ __html: instructor.bio! }}
          />
          {!bioExpanded && bioIsLong && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          )}
          {bioIsLong && (
            <button
              onClick={() => setBioExpanded((p) => !p)}
              className="mt-2 text-primary text-sm font-semibold hover:underline underline-offset-2"
            >
              {bioExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
