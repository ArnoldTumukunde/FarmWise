import { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';

export function NotesSection({ lectureId }: { lectureId: string }) {
    const [notes, setNotes] = useState<any[]>([]);
    const [content, setContent] = useState('');

    useEffect(() => {
        loadNotes();
    }, [lectureId]);

    const loadNotes = async () => {
        try {
            const res = await fetchApi(`/community/lectures/${lectureId}/notes`);
            setNotes(res.notes);
        } catch(e) { console.error('Failed to load notes', e) }
    };

    const saveNote = async () => {
        if (!content.trim()) return;
        try {
            await fetchApi(`/community/lectures/${lectureId}/notes`, {
                method: 'POST', body: JSON.stringify({ content })
            });
            setContent('');
            loadNotes();
        } catch(e) { console.error('Failed to save note', e) }
    };

    const deleteNote = async (id: string) => {
        try {
            await fetchApi(`/community/notes/${id}`, { method: 'DELETE' });
            loadNotes();
        } catch(e) { console.error('Failed to delete note', e) }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <h3 className="text-xl font-bold text-text-base">Personal Notes</h3>
            <div className="flex flex-col gap-2">
                <textarea 
                    value={content} 
                    onChange={e => setContent(e.target.value)} 
                    placeholder="Take a note... (This is private to you)"
                    className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] resize-y"
                />
                <button onClick={saveNote} className="px-6 py-2 bg-primary text-white font-medium rounded self-end hover:bg-primary/90 transition">Save Note</button>
            </div>
            <div className="space-y-4">
                {notes.map(n => (
                    <div key={n.id} className="p-4 bg-amber-50 border border-amber-200 rounded flex justify-between items-start group">
                        <p className="whitespace-pre-wrap text-text-base text-sm">{n.content}</p>
                        <button onClick={() => deleteNote(n.id)} className="text-red-500 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ml-4">
                           Delete
                        </button>
                    </div>
                ))}
                {notes.length === 0 && <p className="text-text-muted text-sm text-center py-8">No notes yet. Add one above.</p>}
            </div>
        </div>
    );
}
