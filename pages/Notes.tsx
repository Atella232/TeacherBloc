import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { QuickNote } from '../types';
import { Plus, X, Trash2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const COLORS = [
  { bg: 'bg-yellow-100', border: 'border-yellow-200', hex: '#fef9c3' },
  { bg: 'bg-blue-100', border: 'border-blue-200', hex: '#dbeafe' },
  { bg: 'bg-green-100', border: 'border-green-200', hex: '#dcfce7' },
  { bg: 'bg-rose-100', border: 'border-rose-200', hex: '#ffe4e6' },
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
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">{t.notes.title}</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center shadow-lg hover:bg-indigo-700 transition"
        >
          <Plus size={20} className="mr-2" /> {t.notes.newNote}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Create Note Card (Inline) */}
        {isAdding && (
          <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-indigo-100 flex flex-col h-64">
            <textarea 
              autoFocus
              className="flex-1 w-full resize-none outline-none text-slate-700 bg-transparent placeholder:text-slate-300"
              placeholder={t.notes.placeholder}
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
            />
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
              <div className="flex space-x-2">
                {COLORS.map(c => (
                  <button 
                    key={c.hex}
                    onClick={() => setSelectedColor(c.hex)}
                    className={`w-5 h-5 rounded-full ${c.bg} border ${c.border} ${selectedColor === c.hex ? 'ring-2 ring-indigo-400' : ''}`}
                  />
                ))}
              </div>
              <div className="flex space-x-2">
                <button onClick={() => setIsAdding(false)} className="p-2 text-slate-400 hover:text-slate-600"><X size={18}/></button>
                <button onClick={handleCreate} className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700">{t.notes.save}</button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Notes */}
        {notes.map(note => {
          // Find color style
          const colorStyle = COLORS.find(c => c.hex === note.color) || COLORS[0];
          return (
            <div 
              key={note.id} 
              className={`${colorStyle.bg} border ${colorStyle.border} p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col min-h-[160px] relative group`}
            >
              <p className="text-slate-800 whitespace-pre-wrap flex-1 font-medium">{note.content}</p>
              
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => note.id && handleArchive(note.id)}
                  className="p-1.5 bg-white/50 hover:bg-white rounded text-slate-500 hover:text-red-500"
                  title="Archivar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              
              <div className="mt-4 pt-3 border-t border-black/5 text-xs text-slate-500 flex justify-between">
                <span>{new Date(note.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};