import { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';
import { Star } from 'lucide-react';

export function ReviewModal({ courseId, onClose, onReviewed }: { courseId: string, onClose: () => void, onReviewed?: () => void }) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [content, setContent] = useState('');
    const [existingId, setExistingId] = useState<string | null>(null);

    useEffect(() => {
        // Check if user already reviewed
        fetchApi(`/reviews/courses/${courseId}/me`).then(res => {
            if (res.review) {
                setRating(res.review.rating);
                setContent(res.review.content || '');
                setExistingId(res.review.id);
            }
        }).catch(e => console.error(e));
    }, [courseId]);

    const handleSubmit = async () => {
        if (rating < 1 || rating > 5) return alert('Please provide a rating from 1 to 5 stars.');
        try {
            if (existingId) {
                await fetchApi(`/reviews/${existingId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ rating, content })
                });
            } else {
                await fetchApi(`/reviews/courses/${courseId}`, {
                    method: 'POST',
                    body: JSON.stringify({ rating, content })
                });
            }
            if (onReviewed) onReviewed();
            onClose();
        } catch (e: any) {
             alert(e.message || 'Failed to submit review');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-text-base">{existingId ? 'Edit Review' : 'Leave a Review'}</h2>
                
                <div className="flex gap-2 mb-6 justify-center">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button 
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                            className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                        >
                            <Star 
                                size={40} 
                                className={`transition-colors ${(hoverRating || rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                            />
                        </button>
                    ))}
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-text-base mb-2">Review Summary (Optional)</label>
                    <textarea 
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder="Tell others what you thought about this course..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none min-h-[120px] resize-y"
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 font-medium text-text-base hover:bg-gray-100 rounded-md transition-colors">Cancel</button>
                    <button onClick={handleSubmit} className="px-6 py-2 font-medium bg-primary text-white hover:bg-primary/90 rounded-md disabled:opacity-50 transition-colors shadow-sm" disabled={rating === 0}>
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
}
