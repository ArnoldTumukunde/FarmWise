import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../../lib/api';
import { PlayCircle } from 'lucide-react';
import { OfflineBanner } from '../../components/OfflineBanner';

export function MyLibrary() {
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    fetchApi('/enrollments').then(res => setEnrollments(res.enrollments)).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
         <OfflineBanner />
         <div className="bg-primary pt-12 pb-24 px-4 text-center">
           <h1 className="text-3xl font-bold text-white">My Learning</h1>
         </div>
         
         <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enr: any) => (
                <div key={enr.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group">
                   {enr.course.thumbnailPublicId ? (
                     <img src={`https://res.cloudinary.com/${(import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_400,h_225,c_fill/farmwise/${enr.course.thumbnailPublicId}`} alt={enr.course.title} className="w-full aspect-video object-cover" />
                   ) : (
                     <div className="w-full aspect-video bg-gray-200" />
                   )}
                   <div className="p-4 flex-1 flex flex-col">
                     <h3 className="font-bold text-lg text-text-base line-clamp-2">{enr.course.title}</h3>
                     <p className="text-sm text-text-muted mt-1">{enr.course.instructor?.profile?.displayName}</p>
                     
                     <div className="mt-auto pt-4">
                        <Link to={`/learn/${enr.course.id}`} className="flex items-center justify-center gap-2 w-full py-2 bg-primary/10 text-primary font-medium rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                          <PlayCircle size={18} /> Resume
                        </Link>
                     </div>
                   </div>
                </div>
              ))}
              
              {enrollments.length === 0 && (
                 <div className="col-span-full py-16 text-center text-text-muted bg-white rounded-xl shadow-sm border border-gray-100">
                    You haven't enrolled in any courses yet.
                    <div className="mt-4">
                       <Link to="/courses" className="text-primary hover:underline font-medium">Explore Catalog</Link>
                    </div>
                 </div>
              )}
           </div>
         </div>
      </div>
  );
}
