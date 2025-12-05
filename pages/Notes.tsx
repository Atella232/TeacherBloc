
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { QuickNote } from '../types';
import { Plus, X, Trash2, Pin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const COLORS = [
  { bg: 'bg-yellow-100', hex: '#fef9c3', rotate: 'rotate-1' },
  { bg: 'bg-blue-100', hex: '#dbeafe', rotate: '-rotate-1' },
  { bg: 'bg-green-100', hex: '#dcfce7', rotate: 'rotate-2' },
  { bg: 'bg-rose-100', hex: '#ffe4e6', rotate: '-rotate-2' },
];

export const Notes: React.FC = () => {
  const { t } = useLanguage();
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0].hex);

  const loadNotes = async () => {
    const data = await api.getItems<QuickNote>('quick_notes');
    setNotes(data.filter(n => !n.isArchived).sort((a, b) => b.createdAt - a.createdAt));
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleCreate = async () => {
    if (!newNoteContent.trim()) return;
    await api.addItem<QuickNote>('quick_notes', {
      content: newNoteContent,
      color: selectedColor,
      isArchived: false,
      createdAt: Date.now()
    });
    setNewNoteContent("");
    setIsAdding(false);
    loadNotes();
  };

  const handleArchive = async (id: string) => {
    await api.updateItem('quick_notes', id, { isArchived: true });
    loadNotes();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-10">
        <div>
           <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">{t.notes.title}</h2>
           <p className="text-slate-500 dark:text-slate-400 font-hand text-lg mt-1">Capture your thoughts instantly</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-slate-800 dark:bg-slate-700 text-white px-5 py-2.5 rounded-2xl flex items-center shadow-lg shadow-slate-300 dark:shadow-none hover:bg-slate-700 dark:hover:bg-slate-600 transition-all hover:scale-105 font-bold"
        >
          <Plus size={20} className="mr-2" /> {t.notes.newNote}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {/* Create Note Card (Inline) */}
        {isAdding && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-sm shadow-xl flex flex-col h-72 transform rotate-1 transition-all duration-300 relative animate-in fade-in zoom-in-95 dark:border dark:border-slate-700" style={{boxShadow: '5px 5px 15px rgba(0,0,0,0.1)'}}>
            {/* Washi Tape */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-purple-200/60 dark:bg-purple-900/60 rotate-2 backdrop-blur-sm z-10"></div>
            
            <textarea 
              autoFocus
              className="flex-1 w-full resize-none outline-none text-slate-700 dark:text-slate-200 bg-transparent placeholder:text-slate-400 font-hand text-xl leading-relaxed"
              placeholder={t.notes.placeholder}
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
            />
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 border-dashed">
              <div className="flex space-x-2">
                {COLORS.map(c => (
                  <button 
                    key={c.hex}
                    onClick={() => setSelectedColor(c.hex)}
                    className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${selectedColor === c.hex ? 'ring-2 ring-slate-300 scale-110' : ''}`}
                    style={{backgroundColor: c.hex}}
                  />
                ))}
              </div>
              <div className="flex space-x-2">
                <button onClick={() => setIsAdding(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><X size={18}/></button>
                <button onClick={handleCreate} className="px-4 py-1.5 bg-slate-800 dark:bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 font-bold shadow-sm">{t.notes.save}</button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Notes */}
        {notes.map((note, idx) => {
          // Find color style
          // Notes keep their color in dark mode but might need slight adjustment? 
          // For now keeping them as colored post-its
          const rotation = idx % 2 === 0 ? 'rotate-1' : '-rotate-1';
          
          return (
            <div 
              key={note.id} 
              className={`p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col min-h-[280px] relative group transform hover:scale-105 hover:z-10 hover:rotate-0 ${rotation}`}
              style={{
                backgroundColor: note.color,
                boxShadow: '4px 4px 12px rgba(0,0,0,0.05)'
              }}
            >
              {/* Pin or Tape visual */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-white/40 backdrop-blur-sm shadow-sm rotate-1 z-10 opacity-70"></div>

              <p className="text-slate-800 whitespace-pre-wrap flex-1 font-hand text-xl leading-relaxed mt-2">{note.content}</p>
              
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => note.id && handleArchive(note.id)}
                  className="p-2 bg-white/50 hover:bg-white rounded-full text-slate-600 hover:text-red-500 shadow-sm"
                  title="Archivar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="mt-4 pt-2 border-t border-slate-900/5 text-xs text-slate-600/70 font-mono flex justify-between items-center">
                <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                <Pin size={12} className="opacity-20" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
