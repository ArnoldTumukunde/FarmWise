export function CourseCardSkeleton() {
  return (
    <div className="bg-white rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded w-full" />
        <div className="h-3.5 bg-gray-200 rounded w-4/5" />
        <div className="h-3 bg-gray-200 rounded w-2/5" />
        <div className="flex items-center gap-2">
          <div className="h-3 bg-gray-200 rounded w-8" />
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-2.5 w-2.5 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-3 bg-gray-200 rounded w-12" />
        </div>
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );
}
