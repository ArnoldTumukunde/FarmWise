import { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

export function ReviewsLayout() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = () => {
    fetchApi('/admin/reviews/flagged')
      .then(res => setReviews(res.reviews))
      .finally(() => setLoading(false));
  };

  const moderateReview = async (id: string, isHidden: boolean) => {
    try {
      await fetchApi(`/admin/reviews/${id}/moderate`, {
        method: 'POST',
        body: JSON.stringify({ isHidden })
      });
      loadReviews();
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div>Loading flagged reviews...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">Review Moderation</h1>

      <Card>
        <CardHeader>
          <CardTitle>Flagged Reviews (1-Star Only)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {reviews.length > 0 ? reviews.map(review => (
              <div key={review.id} className="py-4 flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900">{review.user.profile.displayName}</span>
                      <span className="text-xs text-slate-500">on course</span>
                      <span className="text-sm font-medium text-blue-600">{review.course.title}</span>
                  </div>
                  <div className="text-amber-500 mb-2">{'★'.repeat(review.rating)}</div>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded border">
                    {review.content || 'No text content provided.'}
                  </p>
                  <div className="text-xs text-slate-400 mt-2">Posted: {new Date(review.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="flex flex-col gap-2 min-w-[140px]">
                   <Button onClick={() => moderateReview(review.id, true)} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 w-full hover:text-red-700">
                     Hide Review
                   </Button>
                   <Button onClick={() => moderateReview(review.id, false)} variant="outline" className="w-full">
                     Mark Safe (Keep)
                   </Button>
                </div>
              </div>
            )) : <div className="text-slate-500">No flagged reviews currently.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
