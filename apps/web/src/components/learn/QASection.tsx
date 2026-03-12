import { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';

export function QASection({ lectureId }: { lectureId: string }) {
    const [questions, setQuestions] = useState<any[]>([]);
    const [newQuestion, setNewQuestion] = useState('');

    useEffect(() => {
        loadQuestions();
    }, [lectureId]);

    const loadQuestions = async () => {
        try {
            const res = await fetchApi(`/community/lectures/${lectureId}/questions`);
            setQuestions(res.questions);
        } catch(e) { console.error('Failed to load QA', e) }
    };

    const askQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newQuestion.trim()) return;
        try {
            await fetchApi(`/community/lectures/${lectureId}/questions`, {
                method: 'POST', body: JSON.stringify({ content: newQuestion })
            });
            setNewQuestion('');
            loadQuestions();
        } catch(e) { console.error('Failed to ask question', e) }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <h3 className="text-xl font-bold text-text-base">Questions & Answers</h3>
            <form onSubmit={askQuestion} className="flex gap-2">
                <input 
                    type="text" 
                    value={newQuestion} 
                    onChange={e => setNewQuestion(e.target.value)} 
                    placeholder="Ask a question..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button type="submit" className="px-6 py-2 bg-primary text-white font-medium rounded hover:bg-primary/90 transition">Ask</button>
            </form>
            <div className="space-y-4">
                {questions.map(q => (
                    <div key={q.id} className="p-4 bg-gray-50 border border-gray-100 rounded">
                        <div className="font-semibold text-sm text-text-base">{q.user?.profile?.displayName || 'Student'}</div>
                        <p className="mt-1 text-text-muted text-sm">{q.content}</p>
                    </div>
                ))}
                {questions.length === 0 && <p className="text-text-muted text-sm text-center py-8">No questions yet. Be the first to ask!</p>}
            </div>
        </div>
    );
}
