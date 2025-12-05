
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CalendarEvent, QuickNote, Intervention } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { ChevronLeft, ChevronRight, Plus, StickyNote, AlertCircle, X, GripHorizontal, Trash2, Check, Undo2, Clock, Edit2, AlertTriangle, Sparkles, LayoutGrid, Rows } from 'lucide-react';

export const Calendar: React.FC = () => {
  const { t, language } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month'); // State for View Mode
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [notes, setNotes] = useState<QuickNote[]>([]);
  
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isTrashActive, setIsTrashActive] = useState(false);

  // Delete Confirmation State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{isOpen: boolean, eventId: string | null}>({
    isOpen: false,
    eventId: null
  });

  // Edit/Move State
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [newDateForEvent, setNewDateForEvent] = useState<string>("");
  const [newTimeForEvent, setNewTimeForEvent] = useState<string>("");

  // Load Data
  const refreshData = async () => {
    const [evs, ints, nts] = await Promise.all([
      api.getItems<CalendarEvent>('events'),
      api.getItems<Intervention>('interventions'),
      api.getItems<QuickNote>('quick_notes')
    ]);
    setEvents(evs);
    setInterventions(ints);
    setNotes(nts.filter(n => !n.isArchived));
  };

  useEffect(() => {
    refreshData();
  }, []);

  // --- CALENDAR LOGIC HELPERS ---

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    // 0 is Sunday, 1 is Mon. We want Mon=0, Sun=6
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  };

  const navigateDate = (delta: number) => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + delta);
    } else {
      newDate.setDate(newDate.getDate() + (delta * 7));
    }
    setCurrentDate(newDate);
  };

  // Helper to get time string HH:mm from timestamp
  const getTimeString = (timestamp: number) => {
    const d = new Date(timestamp);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Drag and Drop Logic for NOTES (Sidebar -> Calendar)
  const handleDragStartNote = (e: React.DragEvent, note: QuickNote) => {
    e.dataTransfer.setData('note', JSON.stringify(note));
  };

  // Drag and Drop Logic for EVENTS (Calendar -> Trash)
  const handleDragStartEvent = (e: React.DragEvent, eventId: string) => {
    if (editingEventId) {
        e.preventDefault();
        return;
    }
    e.stopPropagation();
    e.dataTransfer.setData('eventId', eventId);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEndEvent = () => {
    setIsDragging(false);
    setIsTrashActive(false);
  };

  const handleDropOnDay = async (e: React.DragEvent, dateTimestamp: number) => {
    e.preventDefault();
    
    const noteData = e.dataTransfer.getData('note');
    if (!noteData) return; 

    const note = JSON.parse(noteData) as QuickNote;
    
    // Optimistic Update
    if (note.id) {
      setNotes(prev => prev.filter(n => n.id !== note.id));
    }

    const targetDate = new Date(dateTimestamp);
    targetDate.setHours(9, 0, 0, 0);
    
    await api.addItem<CalendarEvent>('events', {
      title: note.content,
      date: targetDate.getTime(),
      type: 'general',
      linkedNoteId: note.id
    });

    if (note.id) {
      await api.updateItem('quick_notes', note.id, { isArchived: true });
    }

    refreshData();
  };

  // TRASH CAN HANDLERS
  const handleDragOverTrash = (e: React.DragEvent) => {
    e.preventDefault();
    setIsTrashActive(true);
  };

  const handleDragLeaveTrash = () => {
    setIsTrashActive(false);
  };

  const handleDropTrash = (e: React.DragEvent) => {
    e.preventDefault();
    setIsTrashActive(false);
    setIsDragging(false);

    const eventId = e.dataTransfer.getData('eventId');
    if (eventId) {
      requestDelete(eventId);
    }
  };

  const handleDragOverDay = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDay) return;
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const timeVal = formData.get('time') as string;
    const [hours, mins] = timeVal.split(':').map(Number);
    
    const finalDate = new Date(selectedDay);
    finalDate.setHours(hours || 0, mins || 0);

    await api.addItem<CalendarEvent>('events', {
      title: formData.get('title') as string,
      type: formData.get('type') as any,
      date: finalDate.getTime()
    });

    refreshData();
    form.reset();
  };

  const requestDelete = (id: string) => {
    setDeleteConfirmation({ isOpen: true, eventId: id });
  };

  const confirmDelete = async () => {
    const { eventId } = deleteConfirmation;
    if (!eventId) return;

    setEvents(prev => prev.filter(ev => ev.id !== eventId));
    setDeleteConfirmation({ isOpen: false, eventId: null });

    try {
      await api.deleteItem('events', eventId);
      await refreshData();
    } catch (err) {
      console.error("Delete failed", err);
      refreshData(); 
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, eventId: null });
  };

  const startEditing = (event: CalendarEvent) => {
    setEditingEventId(event.id || null);
    
    const d = new Date(event.date);
    const dateString = d.getFullYear() + '-' + 
      (d.getMonth() + 1).toString().padStart(2, '0') + '-' + 
      d.getDate().toString().padStart(2, '0');
    
    const timeString = d.getHours().toString().padStart(2, '0') + ':' + 
      d.getMinutes().toString().padStart(2, '0');

    setNewDateForEvent(dateString);
    setNewTimeForEvent(timeString);
  };

  const saveMoveEvent = async (id: string) => {
    if (!newDateForEvent) return;
    
    const [year, month, day] = newDateForEvent.split('-').map(Number);
    const [hours, mins] = newTimeForEvent ? newTimeForEvent.split(':').map(Number) : [0, 0];
    
    const newTimestamp = new Date(year, month - 1, day, hours, mins).getTime();
    
    setEvents(prev => prev.map(ev => 
      ev.id === id ? { ...ev, date: newTimestamp } : ev
    ));
    setEditingEventId(null);

    await api.updateItem('events', id, { date: newTimestamp });
    refreshData();
  };

  const getDayName = (dayIndex: number) => {
    const euDays = ['Al', 'Ar', 'Az', 'Og', 'Or', 'Lr', 'Ig'];
    const esDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return language === 'eu' ? euDays[dayIndex] : esDays[dayIndex];
  };

  // --- RENDER COMPONENTS ---

  const renderEventPill = (ev: CalendarEvent) => (
    <div 
        key={ev.id} 
        draggable={!!ev.id}
        onDragStart={(e) => ev.id && handleDragStartEvent(e, ev.id)}
        onDragEnd={handleDragEndEvent}
        className={`text-[10px] py-1 px-1.5 rounded-lg shadow-sm truncate flex items-center cursor-grab active:cursor-grabbing border-l-4 transition-transform hover:scale-[1.02] mb-1
          ${ev.type === 'exam' 
              ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300' 
              : ev.type === 'meeting' 
                  ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300'
                  : 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'}
        `}
    >
        <span className="font-mono opacity-70 mr-1">{getTimeString(ev.date)}</span>
        <span className="truncate font-medium">{ev.title}</span>
    </div>
  );

  const renderMonthGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const slots = [];
    
    // Empty slots
    for (let i = 0; i < firstDay; i++) {
      slots.push(<div key={`empty-${i}`} className="bg-slate-50/20 dark:bg-slate-800/20 border-r border-b border-slate-100/50 dark:border-slate-700/50" />);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateTimestampStart = new Date(year, month, day).setHours(0,0,0,0);
      const dateTimestampEnd = new Date(year, month, day).setHours(23,59,59,999);

      let dayEvents = events.filter(e => e.date >= dateTimestampStart && e.date <= dateTimestampEnd);
      dayEvents.sort((a, b) => a.date - b.date);

      const dayInterventions = interventions.filter(i => {
          const iDate = new Date(i.date).setHours(0,0,0,0);
          return iDate === dateTimestampStart;
      });
      
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
      
      const intensity = dayEvents.length + dayInterventions.length;
      let bgClass = 'bg-white/40 dark:bg-slate-800/40 hover:bg-white/80 dark:hover:bg-slate-800/80';
      if (intensity >= 3) bgClass = 'bg-blue-50/40 dark:bg-blue-900/20 hover:bg-blue-50/70 dark:hover:bg-blue-900/30';
      if (isToday) bgClass = 'bg-purple-50/50 dark:bg-purple-900/30 hover:bg-purple-50/80 dark:hover:bg-purple-900/50 ring-2 ring-purple-200 dark:ring-purple-700 ring-inset z-10';

      slots.push(
        <div 
          key={day}
          onDrop={(e) => handleDropOnDay(e, dateTimestampStart)}
          onDragOver={handleDragOverDay}
          onClick={() => { setSelectedDay(new Date(year, month, day)); setIsEventModalOpen(true); }}
          className={`relative border-r border-b border-slate-100/50 dark:border-slate-700/50 p-2 transition-all duration-300 cursor-pointer overflow-hidden group ${bgClass}`}
        >
          <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors ${isToday ? 'bg-purple-500 text-white shadow-md' : 'text-slate-700 dark:text-slate-300 group-hover:bg-slate-100 dark:group-hover:bg-slate-700'}`}>
            {day}
          </span>
          
          <div className="mt-1 flex flex-col gap-0.5 overflow-hidden h-full">
             {/* Dots for interventions */}
             {dayInterventions.length > 0 && (
               <div className="flex flex-wrap gap-1 mb-1 justify-end absolute top-3 right-3">
                 {dayInterventions.map((int, i) => (
                   <div key={i} title={int.type} className={`w-1.5 h-1.5 rounded-full ring-1 ring-white dark:ring-slate-800 ${
                     int.type === 'Conducta' ? 'bg-red-400' : 'bg-green-400'
                   }`} />
                 ))}
               </div>
             )}

             {dayEvents.slice(0, 4).map(ev => renderEventPill(ev))}
             {dayEvents.length > 4 && <div className="text-[10px] text-slate-400 font-bold text-center bg-white/50 dark:bg-slate-700/50 rounded-full py-0.5">+{dayEvents.length - 4}</div>}
          </div>
        </div>
      );
    }
    return slots;
  };

  const renderWeekGrid = () => {
    const startOfWeek = getStartOfWeek(currentDate);
    const slots = [];

    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        
        const dateTimestampStart = new Date(dayDate).setHours(0,0,0,0);
        const dateTimestampEnd = new Date(dayDate).setHours(23,59,59,999);
        const isToday = new Date().toDateString() === dayDate.toDateString();

        let dayEvents = events.filter(e => e.date >= dateTimestampStart && e.date <= dateTimestampEnd);
        dayEvents.sort((a, b) => a.date - b.date);

        const dayInterventions = interventions.filter(i => {
            const iDate = new Date(i.date).setHours(0,0,0,0);
            return iDate === dateTimestampStart;
        });

        slots.push(
            <div 
                key={i} 
                onDrop={(e) => handleDropOnDay(e, dateTimestampStart)}
                onDragOver={handleDragOverDay}
                onClick={() => { setSelectedDay(dayDate); setIsEventModalOpen(true); }}
                className={`flex-1 border-r border-slate-100/50 dark:border-slate-700/50 min-h-0 flex flex-col relative group transition-colors ${isToday ? 'bg-purple-50/30 dark:bg-purple-900/20' : 'bg-white/20 dark:bg-slate-800/20 hover:bg-white/40 dark:hover:bg-slate-800/40'}`}
            >
                {/* Header of Column */}
                <div className={`text-center py-2 border-b border-slate-100/50 dark:border-slate-700/50 ${isToday ? 'bg-purple-100/50 dark:bg-purple-900/30' : 'bg-white/40 dark:bg-slate-800/40'}`}>
                    <div className="text-xs uppercase text-slate-500 dark:text-slate-400 font-bold">{getDayName(i)}</div>
                    <div className={`text-lg font-bold mx-auto w-8 h-8 flex items-center justify-center rounded-full mt-1 ${isToday ? 'bg-purple-500 text-white shadow-md' : 'text-slate-700 dark:text-slate-300'}`}>
                        {dayDate.getDate()}
                    </div>
                </div>

                {/* Body of Column */}
                <div className="flex-1 p-2 overflow-y-auto custom-scrollbar space-y-1">
                     {/* Interventions as small banner */}
                     {dayInterventions.length > 0 && (
                        <div className="flex items-center justify-center gap-1 bg-amber-50 dark:bg-amber-900/30 rounded-md py-1 mb-2 border border-amber-100 dark:border-amber-800">
                             <AlertCircle size={10} className="text-amber-500"/>
                             <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">{dayInterventions.length}</span>
                        </div>
                     )}

                     {dayEvents.map(ev => renderEventPill(ev))}
                </div>
            </div>
        );
    }
    return slots;
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-8 relative">
      {/* Calendar Grid */}
      <div className="flex-1 glass-panel rounded-3xl flex flex-col overflow-hidden shadow-xl">
        {/* Toolbar */}
        <div className="p-4 md:p-6 border-b border-white/50 dark:border-slate-700/50 flex flex-col md:flex-row items-center justify-between bg-white/40 dark:bg-slate-800/40 gap-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 capitalize font-sans tracking-tight">
              {view === 'month' 
                 ? currentDate.toLocaleString(language === 'eu' ? 'eu' : 'es', { month: 'long', year: 'numeric' })
                 : `${language === 'eu' ? 'Astea' : 'Semana'}: ${getStartOfWeek(currentDate).toLocaleDateString()} - ${(() => {const d = getStartOfWeek(currentDate); d.setDate(d.getDate()+6); return d.toLocaleDateString();})()}`
              }
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
             {/* View Toggle */}
             <div className="bg-white/60 dark:bg-slate-800/60 p-1 rounded-xl flex border border-white dark:border-slate-700 shadow-sm">
                <button 
                  onClick={() => setView('month')}
                  className={`p-2 rounded-lg transition-all ${view === 'month' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  title={language === 'eu' ? 'Hilabetea' : 'Mes'}
                >
                    <LayoutGrid size={18} />
                </button>
                <button 
                  onClick={() => setView('week')}
                  className={`p-2 rounded-lg transition-all ${view === 'week' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  title={language === 'eu' ? 'Astea' : 'Semana'}
                >
                    <Rows size={18} className="rotate-90" />
                </button>
             </div>

             <div className="flex items-center space-x-2">
                <button onClick={() => navigateDate(-1)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition shadow-sm hover:shadow"><ChevronLeft size={20} className="text-slate-600 dark:text-slate-300"/></button>
                <button onClick={() => setCurrentDate(new Date())} className="text-xs px-4 py-2 bg-white dark:bg-slate-800 rounded-xl font-bold text-purple-600 dark:text-purple-300 shadow-sm hover:shadow transition border border-purple-100 dark:border-purple-900">
                {language === 'eu' ? 'Gaur' : 'Hoy'}
                </button>
                <button onClick={() => navigateDate(1)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition shadow-sm hover:shadow"><ChevronRight size={20} className="text-slate-600 dark:text-slate-300"/></button>
             </div>
          </div>
        </div>

        {/* Content Area */}
        {view === 'month' ? (
           <div className="flex-1 flex flex-col min-h-0">
               {/* Header Days */}
                <div className="grid grid-cols-7 border-b border-white/50 dark:border-slate-700/50 bg-white/20 dark:bg-slate-800/20 flex-shrink-0">
                    {[0,1,2,3,4,5,6].map(i => (
                        <div key={i} className="py-2 md:py-3 text-center text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        {getDayName(i)}
                        </div>
                    ))}
                </div>
                {/* Days Grid - auto-rows-fr stretches rows equally */}
                <div className="grid grid-cols-7 flex-1 auto-rows-fr gap-px bg-slate-100/30 dark:bg-slate-900/50 overflow-hidden">
                    {renderMonthGrid()}
                </div>
           </div>
        ) : (
           <div className="flex-1 flex min-h-0 bg-slate-50/20 dark:bg-slate-900/20 overflow-hidden">
               {renderWeekGrid()}
           </div>
        )}
      </div>

      {/* Side Panel: Draggable Notes */}
      <div className="w-full lg:w-80 flex flex-col gap-6 hidden lg:flex">
        <div className="glass-panel rounded-3xl p-6 border border-white dark:border-slate-700">
           <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2 text-sm flex items-center uppercase tracking-wide">
             <StickyNote size={16} className="mr-2 text-yellow-500" />
             {t.calendar.unscheduledNotes}
           </h3>
           <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-body opacity-80">
             {t.calendar.dragInstruction}
           </p>
           
           <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
             {notes.map(note => (
               <div 
                 key={note.id}
                 draggable
                 onDragStart={(e) => handleDragStartNote(e, note)}
                 className="p-4 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all group hover:-translate-y-1 text-slate-800"
                 style={{ backgroundColor: note.color }} // Keeping color for notes as post-its
               >
                 <div className="flex justify-between items-start">
                   <p className="text-sm line-clamp-3 font-hand text-lg leading-tight">{note.content}</p>
                   <GripHorizontal size={16} className="text-slate-400/50 group-hover:text-slate-600" />
                 </div>
               </div>
             ))}
           </div>
        </div>
        
        {/* Decoration */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col items-center text-center">
            <Sparkles className="text-purple-300 dark:text-purple-500 mb-2" />
            <p className="font-hand text-lg text-slate-600 dark:text-slate-400">"Cada día cuenta en el aprendizaje."</p>
        </div>
      </div>

      {/* Floating Trash Bin */}
      <div 
        onDragOver={handleDragOverTrash}
        onDragLeave={handleDragLeaveTrash}
        onDrop={handleDropTrash}
        className={`fixed bottom-8 right-8 z-[60] transition-all duration-300 ease-in-out transform flex items-center justify-center pointer-events-auto
          ${isDragging ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}
        `}
      >
        <div className={`
          w-20 h-20 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 border-4 backdrop-blur-md
          ${isTrashActive ? 'bg-red-500/90 border-red-300 scale-110 rotate-12' : 'bg-white/80 dark:bg-slate-800/80 border-white dark:border-slate-600 rotate-0'}
        `}>
          <Trash2 className={`${isTrashActive ? 'text-white' : 'text-slate-400 dark:text-slate-300'}`} size={32} />
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-8 shadow-2xl scale-100 transform transition-all border border-white dark:border-slate-800">
             <div className="flex flex-col items-center text-center">
               <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse">
                 <AlertTriangle size={32} className="text-red-500" />
               </div>
               <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 font-sans">
                 {language === 'eu' ? 'Ekitaldia ezabatu?' : '¿Eliminar evento?'}
               </h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-body">
                 {language === 'eu' 
                   ? 'Ekintza hau ezin da desegin. Ekitaldia behin betiko ezabatuko da.' 
                   : 'Esta acción no se puede deshacer. El evento se eliminará permanentemente.'}
               </p>
               <div className="flex gap-4 w-full">
                 <button 
                   onClick={cancelDelete}
                   className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                 >
                   {t.calendar.actions.cancel}
                 </button>
                 <button 
                   onClick={confirmDelete}
                   className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition shadow-lg shadow-red-200 dark:shadow-none"
                 >
                   {t.calendar.actions.delete}
                 </button>
               </div>
             </div>
           </div>
        </div>
      )}

      {/* Event Details Modal */}
      {isEventModalOpen && selectedDay && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 dark:bg-slate-900/95 rounded-3xl max-w-md w-full p-8 shadow-2xl relative border border-white dark:border-slate-800">
            <button 
              onClick={() => setIsEventModalOpen(false)} 
              className="absolute top-5 right-5 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 transition"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-bold mb-1 text-slate-800 dark:text-slate-100">{t.calendar.todayEvents}</h3>
            <p className="text-sm text-purple-600 dark:text-purple-300 font-bold mb-6 capitalize bg-purple-50 dark:bg-purple-900/30 inline-block px-3 py-1 rounded-lg">
              {selectedDay.toLocaleDateString(language === 'eu' ? 'eu' : 'es', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>

            {/* Existing List */}
            <div className="space-y-3 mb-8">
              {[
                ...events.filter(e => {
                    const eStart = new Date(e.date).setHours(0,0,0,0);
                    return eStart === selectedDay.getTime();
                }).sort((a,b) => a.date - b.date),
                ...interventions.filter(i => {
                    const iStart = new Date(i.date).setHours(0,0,0,0);
                    return iStart === selectedDay.getTime();
                })
              ].length === 0 ? (
                <div className="text-center py-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                   <p className="text-slate-400 dark:text-slate-500 text-sm font-hand text-lg">{t.calendar.noEvents}</p>
                </div>
              ) : (
                <>
                 {/* Interventions list (Read only in calendar) */}
                 {interventions
                    .filter(i => new Date(i.date).setHours(0,0,0,0) === selectedDay.getTime())
                    .map(int => (
                      <div key={int.id} className="flex items-center p-4 mb-2 bg-amber-50/80 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl text-sm">
                        <AlertCircle size={20} className="text-amber-500 mr-3 flex-shrink-0" />
                        <div>
                          <span className="font-bold text-amber-900 dark:text-amber-200">{int.studentName}</span>
                          <span className="text-amber-400 mx-2">•</span>
                          <span className="text-amber-700 dark:text-amber-400 font-medium">{int.type}</span>
                        </div>
                      </div>
                    ))
                 }
                 {/* Events list (Editable) */}
                 {events
                    .filter(e => new Date(e.date).setHours(0,0,0,0) === selectedDay.getTime())
                    .sort((a,b) => a.date - b.date)
                    .map(ev => (
                      <div 
                        key={ev.id} 
                        draggable={!!ev.id && !editingEventId}
                        onDragStart={(e) => ev.id && handleDragStartEvent(e, ev.id)}
                        onDragEnd={handleDragEndEvent}
                        className={`group flex items-center justify-between p-3 mb-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-all
                          ${editingEventId ? 'border-purple-200 ring-2 ring-purple-100 dark:ring-purple-900' : 'cursor-grab active:cursor-grabbing'}
                        `}
                      >
                        
                        {/* EDIT MODE */}
                        {editingEventId === ev.id ? (
                          <div className="flex items-center w-full gap-2 p-1">
                             <div className="flex-1 flex gap-2">
                                <input 
                                  type="date" 
                                  value={newDateForEvent}
                                  onChange={(e) => setNewDateForEvent(e.target.value)}
                                  className="w-2/3 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-purple-300 dark:text-slate-200"
                                />
                                <input 
                                  type="time" 
                                  value={newTimeForEvent}
                                  onChange={(e) => setNewTimeForEvent(e.target.value)}
                                  className="w-1/3 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-purple-300 dark:text-slate-200"
                                />
                             </div>
                             <button type="button" onClick={() => ev.id && saveMoveEvent(ev.id)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200" title={t.calendar.actions.save}>
                               <Check size={16} />
                             </button>
                             <button type="button" onClick={() => setEditingEventId(null)} className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600" title={t.calendar.actions.cancel}>
                               <Undo2 size={16} />
                             </button>
                          </div>
                        ) : (
                          /* VIEW MODE */
                          <>
                            <div className="flex items-center flex-1 min-w-0 mr-3">
                              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg mr-3 flex-shrink-0">
                                {getTimeString(ev.date)}
                              </span>
                              <div className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ring-2 ring-white dark:ring-slate-600 shadow-sm ${ev.type === 'exam' ? 'bg-red-400' : 'bg-blue-400'}`} />
                              <span className="text-slate-700 dark:text-slate-200 font-bold truncate">{ev.title}</span>
                            </div>
                            
                            {/* Actions always visible and protected from drag */}
                            <div className="flex items-center gap-1">
                              <button 
                                type="button"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(ev);
                                }}
                                className="p-2 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/50 rounded-lg transition-colors" 
                                title={t.calendar.actions.move}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                type="button"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (ev.id) requestDelete(ev.id);
                                }}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors" 
                                title={t.calendar.actions.delete}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                 }
                </>
              )}
            </div>

            {/* Add New Form */}
            <form onSubmit={handleAddEvent} className="border-t border-slate-100 dark:border-slate-700 pt-6">
              <h4 className="font-bold text-sm mb-4 text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center">
                 <Plus size={14} className="mr-2" /> {t.calendar.newEvent}
              </h4>
              <div className="space-y-4">
                <input required name="title" placeholder={t.resources.forms.title} className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-300 outline-none transition-shadow text-slate-800 dark:text-slate-200" />
                <div className="flex gap-3">
                   <select name="type" className="flex-1 p-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-300 outline-none cursor-pointer">
                    <option value="general">{t.calendar.types.general}</option>
                    <option value="exam">{t.calendar.types.exam}</option>
                    <option value="meeting">{t.calendar.types.meeting}</option>
                  </select>
                  <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl px-3 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-purple-300 w-32">
                    <Clock size={16} className="text-slate-400 mr-2" />
                    <input type="time" name="time" defaultValue="09:00" className="bg-transparent p-1 text-sm outline-none w-full dark:text-slate-200" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-slate-800 dark:bg-slate-700 text-white py-3 rounded-xl text-sm font-bold hover:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center transition-all shadow-lg shadow-slate-200 dark:shadow-none mt-2">
                  {t.calendar.add}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};
