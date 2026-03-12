import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Lecture {
  id: string;
  title: string;
  order: number;
  type: string;
}

interface Section {
  id: string;
  title: string;
  order: number;
  lectures: Lecture[];
}

interface Course {
  id: string;
  title: string;
  status: string;
  sections: Section[];
}

const SortableLecture = ({ lecture }: { lecture: Lecture }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: lecture.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-white p-3 border rounded shadow-sm flex items-center gap-2 cursor-grab active:cursor-grabbing mb-2 hover:bg-slate-50">
      <div className="text-slate-400">☰</div>
      <div className="text-sm font-medium">{lecture.title}</div>
      <div className="text-xs text-slate-500 ml-auto bg-slate-100 px-2 py-1 rounded">{lecture.type}</div>
    </div>
  );
};

const SectionBuilder = ({ section, onAddLecture }: { section: Section, onAddLecture: (sectionId: string, title: string, type: 'VIDEO'|'ARTICLE'|'QUIZ') => void }) => {
  const [newLectureTitle, setNewLectureTitle] = useState("");
  const [newLectureType, setNewLectureType] = useState<'VIDEO'|'ARTICLE'|'QUIZ'>("VIDEO");

  return (
    <Card className="mb-6 bg-slate-50 border-slate-200">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">{section.title}</h3>
        </div>

        <SortableContext items={section.lectures.map(l => l.id)} strategy={verticalListSortingStrategy}>
          <div className="min-h-[50px]">
            {section.lectures.map(lecture => (
              <SortableLecture key={lecture.id} lecture={lecture} />
            ))}
            {section.lectures.length === 0 && <div className="text-sm text-slate-500 italic p-4 text-center border-2 border-dashed rounded">No lectures yet. Add one below.</div>}
          </div>
        </SortableContext>

        <div className="mt-4 pt-4 border-t flex gap-2">
          <Input 
            placeholder="New lecture title..." 
            value={newLectureTitle}
            onChange={e => setNewLectureTitle(e.target.value)}
            className="flex-grow bg-white"
          />
          <select 
            value={newLectureType}
            onChange={e => setNewLectureType(e.target.value as 'VIDEO'|'ARTICLE'|'QUIZ')}
            className="border rounded px-2 bg-white"
          >
            <option value="VIDEO">Video</option>
            <option value="ARTICLE">Article</option>
            <option value="QUIZ">Quiz</option>
          </select>
          <Button 
            variant="secondary"
            onClick={() => {
              if (newLectureTitle) {
                onAddLecture(section.id, newLectureTitle, newLectureType);
                setNewLectureTitle("");
              }
            }}
          >
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function CourseBuilder() {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [newSectionTitle, setNewSectionTitle] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadCourse = () => {
    fetchApi(`/instructor/courses/${id}`)
      .then(res => setCourse(res.course))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCourse(); }, [id]);

  const handleAddSection = async () => {
    if (!newSectionTitle) return;
    try {
      await fetchApi(`/instructor/courses/${id}/sections`, {
        method: "POST",
        body: JSON.stringify({ title: newSectionTitle })
      });
      setNewSectionTitle("");
      loadCourse();
    } catch (e) { console.error(e); }
  };

  const handleAddLecture = async (sectionId: string, title: string, type: 'VIDEO'|'ARTICLE'|'QUIZ') => {
    try {
      await fetchApi(`/instructor/sections/${sectionId}/lectures`, {
        method: "POST",
        body: JSON.stringify({ title, type })
      });
      loadCourse();
    } catch (e) { console.error(e); }
  };

  const handleDragEnd = (event: any) => {
    // In a full implementation, this would determine the new array order and call an API endpoint to bulk-update standard ordering.
    // For this prototype, we'll just log or locally re-order.
    console.log("Drag end", event);
  };

  if (loading) return <div className="p-8 text-center">Loading course builder...</div>;
  if (!course) return <div className="p-8 text-center text-red-500">Course not found</div>;

  return (
    <div className="bg-white min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-slate-500">Curriculum Builder</p>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {course.sections.map(section => (
            <SectionBuilder key={section.id} section={section} onAddLecture={handleAddLecture} />
          ))}
        </DndContext>

        <Card className="border-dashed border-2 bg-slate-50">
          <CardContent className="p-6 flex gap-4 items-end">
            <div className="flex-grow space-y-2">
              <label className="text-sm font-semibold text-slate-700">Add New Section</label>
              <Input 
                placeholder="e.g. Introduction to Soil Types" 
                value={newSectionTitle}
                onChange={e => setNewSectionTitle(e.target.value)}
                className="bg-white"
              />
            </div>
            <Button onClick={handleAddSection}>Add Section</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
