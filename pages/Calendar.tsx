import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CalendarEvent, QuickNote, Intervention } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { ChevronLeft, ChevronRight, Plus, StickyNote, AlertCircle, X, GripHorizontal, Trash2, CalendarClock, Check, Undo2, Clock, Edit2, AlertTriangle } from 'lucide-react';

export const Calendar: React.FC = () => {
  const { t, language } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
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

  // Calendar Logic helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    // 0 is Sunday, 1 is Mon. We want Mon=0, Sun=6
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
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
    // We only allow dragging if NOT editing
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

  const handleDropOnDay = async (e: React.DragEvent, day: number) => {
    e.preventDefault();
    
    // Check if we are dropping a note (not an event)
    const noteData = e.dataTransfer.getData('note');
    if (!noteData) return; // If it's an event being dragged, ignore drop on day

    const note = JSON.parse(noteData) as QuickNote;
    
    // Optimistic Update: Remove note from sidebar immediately
    if (note.id) {
      setNotes(prev => prev.filter(n => n.id !== note.id));
    }

    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    // Default time for drops: 09:00
    targetDate.setHours(9, 0, 0, 0);
    
    // Create Event from Note
    await api.addItem<CalendarEvent>('events', {
      title: note.content,
      date: targetDate.getTime(),
      type: 'general',
      linkedNoteId: note.id
    });

    // Archive the note in backend
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
    
    const timeVal = formData.get('time') as string; // "14:30"
    const [hours, mins] = timeVal.split(':').map(Number);
    
    // Create new date object based on selected day but with specific time
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

  // DELETE LOGIC
  const requestDelete = (id: string) => {
    setDeleteConfirmation({ isOpen: true, eventId: id });
  };

  const confirmDelete = async () => {
    const { eventId } = deleteConfirmation;
    if (!eventId) return;

    // Optimistic update: Remove from UI immediately
    setEvents(prev => prev.filter(ev => ev.id !== eventId));
    
    // Close confirmation modal
    setDeleteConfirmation({ isOpen: false, eventId: null });

    try {
      await api.deleteItem('events', eventId);
      await refreshData();
    } catch (err) {
      console.error("Delete failed", err);
      // Revert if error (simplest way is refresh)
      refreshData(); 
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, eventId: null });
  };

  const startEditing = (event: CalendarEvent) => {
    setEditingEventId(event.id || null);
    
    const d = new Date(event.date);
    // Date part YYYY-MM-DD
    const dateString = d.getFullYear() + '-' + 
      (d.getMonth() + 1).toString().padStart(2, '0') + '-' + 
      d.getDate().toString().padStart(2, '0');
    
    // Time part HH:mm
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
    
    // Optimistic Update
    setEvents(prev => prev.map(ev => 
      ev.id === id ? { ...ev, date: newTimestamp } : ev
    ));
    setEditingEventId(null);

    await api.updateItem('events', id, { date: newTimestamp });
    refreshData();
  };

  // Rendering
  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const slots = [];
    
    // Empty slots
    for (let i = 0; i < firstDay; i++) {
      slots.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-slate-50/50 border-r border-b border-slate-100" />);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateTimestampStart = new Date(year, month, day).setHours(0,0,0,0);
      const dateTimestampEnd = new Date(year, month, day).setHours(23,59,59,999);

      // Filter events within this day range
      let dayEvents = events.filter(e => e.date >= dateTimestampStart && e.date <= dateTimestampEnd);
      // Sort by time
      dayEvents.sort((a, b) => a.date - b.date);

      // Interventions
      const dayInterventions = interventions.filter(i => {
          const iDate = new Date(i.date).setHours(0,0,0,0);
          return iDate === dateTimestampStart;
      });
      
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
      
      // Heatmap color
      const intensity = dayEvents.length + dayInterventions.length;
      const bgClass = intensity === 0 ? 'bg-white' : intensity < 3 ? 'bg-indigo-50/30' : 'bg-indigo-50';

      slots.push(
        <div 
          key={day}
          onDrop={(e) => handleDropOnDay(e, day)}
          onDragOver={handleDragOverDay}
          onClick={() => { setSelectedDay(new Date(year, month, day)); setIsEventModalOpen(true); }}
          className={`h-24 md:h-32 border-r border-b border-slate-100 p-2 relative transition hover:bg-slate-50 cursor-pointer ${bgClass}`}
        >
          <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'}`}>
            {day}
          </span>
          
          <div className="mt-2 space-y-1 overflow-y-auto max-h-[calc(100%-2rem)]">
             {/* Dots for interventions */}
             {dayInterventions.length > 0 && (
               <div className="flex flex-wrap gap-1 mb-1">
                 {dayInterventions.map((int, i) => (
                   <div key={i} title={int.type} className={`w-2 h-2 rounded-full ${
                     int.type === 'Conducta' ? 'bg-red-400' : 'bg-green-400'
                   }`} />
                 ))}
               </div>
             )}

             {/* Events with Time */}
             {dayEvents.slice(0, 3).map(ev => (
               <div 
                  key={ev.id} 
                  draggable={!!ev.id}
                  onDragStart={(e) => ev.id && handleDragStartEvent(e, ev.id)}
                  onDragEnd={handleDragEndEvent}
                  className="text-xs p-1 bg-white border border-slate-200 rounded shadow-sm truncate flex items-center cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-colors"
               >
                 <span className="text-[10px] text-slate-400 font-mono mr-1">{getTimeString(ev.date)}</span>
                 <span className="truncate">{ev.title}</span>
               </div>
             ))}
             {dayEvents.length > 3 && <div className="text-xs text-slate-400 text-center">+{dayEvents.length - 3}</div>}
          </div>
        </div>
      );
    }
    return slots;
  };

  const getDayName = (dayIndex: number) => {
    const euDays = ['Al', 'Ar', 'Az', 'Og', 'Or', 'Lr', 'Ig'];
    const esDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return language === 'eu' ? euDays[dayIndex] : esDays[dayIndex];
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 relative">
      {/* Calendar Grid */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-slate-800 capitalize">
              {currentDate.toLocaleString(language === 'eu' ? 'eu' : 'es', { month: 'long', year: 'numeric' })}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft size={20}/></button>
            <button onClick={() => setCurrentDate(new Date())} className="text-sm px-3 py-1 bg-slate-100 rounded-md font-medium text-slate-600">
               {language === 'eu' ? 'Gaur' : 'Hoy'}
            </button>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight size={20}/></button>
          </div>
        </div>

        {/* Header Days */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
          {[0,1,2,3,4,5,6].map(i => (
            <div key={i} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase">
              {getDayName(i)}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Side Panel: Draggable Notes */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
           <h3 className="font-bold text-indigo-900 mb-2 text-sm flex items-center">
             <StickyNote size={16} className="mr-2" />
             {t.calendar.unscheduledNotes}
           </h3>
           <p className="text-xs text-indigo-700 mb-4 opacity-80">
             {t.calendar.dragInstruction}
           </p>
           
           <div className="space-y-3 max-h-[500px] overflow-y-auto">
             {notes.map(note => (
               <div 
                 key={note.id}
                 draggable
                 onDragStart={(e) => handleDragStartNote(e, note)}
                 className="bg-white p-3 rounded-lg border border-indigo-200 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition group"
                 style={{ borderLeftColor: note.color, borderLeftWidth: '4px' }}
               >
                 <div className="flex justify-between items-start">
                   <p className="text-sm text-slate-700 line-clamp-3">{note.content}</p>
                   <GripHorizontal size={16} className="text-slate-300 group-hover:text-indigo-400" />
                 </div>
               </div>
             ))}
           </div>
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
          w-16 h-16 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 border-4
          ${isTrashActive ? 'bg-red-600 border-red-400 scale-110' : 'bg-red-500 border-white'}
        `}>
          <Trash2 className="text-white" size={32} />
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl scale-100 transform transition-all">
             <div className="flex flex-col items-center text-center">
               <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                 <AlertTriangle size={24} className="text-red-600" />
               </div>
               <h3 className="text-lg font-bold text-slate-900 mb-2">
                 {language === 'eu' ? 'Ekitaldia ezabatu?' : '¿Eliminar evento?'}
               </h3>
               <p className="text-sm text-slate-500 mb-6">
                 {language === 'eu' 
                   ? 'Ekintza hau ezin da desegin. Ekitaldia behin betiko ezabatuko da.' 
                   : 'Esta acción no se puede deshacer. El evento se eliminará permanentemente.'}
               </p>
               <div className="flex gap-3 w-full">
                 <button 
                   onClick={cancelDelete}
                   className="flex-1 py-2 px-4 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition"
                 >
                   {t.calendar.actions.cancel}
                 </button>
                 <button 
                   onClick={confirmDelete}
                   className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setIsEventModalOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-lg font-bold mb-1">{t.calendar.todayEvents}</h3>
            <p className="text-sm text-slate-500 mb-6 capitalize">
              {selectedDay.toLocaleDateString(language === 'eu' ? 'eu' : 'es', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>

            {/* Existing List */}
            <div className="space-y-3 mb-6">
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
                <p className="text-slate-400 text-sm italic">{t.calendar.noEvents}</p>
              ) : (
                <>
                 {/* Interventions list (Read only in calendar) */}
                 {interventions
                    .filter(i => new Date(i.date).setHours(0,0,0,0) === selectedDay.getTime())
                    .map(int => (
                      <div key={int.id} className="flex items-center p-3 mb-2 bg-amber-50 border border-amber-100 rounded-lg text-sm opacity-90">
                        <AlertCircle size={16} className="text-amber-500 mr-3 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-amber-900">{int.studentName}</span>
                          <span className="text-amber-700 mx-1">-</span>
                          <span className="text-amber-700">{int.type}</span>
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
                        className={`group flex items-center justify-between p-3 mb-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all
                          ${editingEventId ? 'border-indigo-200 ring-1 ring-indigo-200' : 'cursor-grab active:cursor-grabbing'}
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
                                  className="w-2/3 p-2 border rounded bg-slate-50 text-xs"
                                />
                                <input 
                                  type="time" 
                                  value={newTimeForEvent}
                                  onChange={(e) => setNewTimeForEvent(e.target.value)}
                                  className="w-1/3 p-2 border rounded bg-slate-50 text-xs"
                                />
                             </div>
                             <button type="button" onClick={() => ev.id && saveMoveEvent(ev.id)} className="p-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200" title={t.calendar.actions.save}>
                               <Check size={16} />
                             </button>
                             <button type="button" onClick={() => setEditingEventId(null)} className="p-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200" title={t.calendar.actions.cancel}>
                               <Undo2 size={16} />
                             </button>
                          </div>
                        ) : (
                          /* VIEW MODE */
                          <>
                            <div className="flex items-center flex-1 min-w-0 mr-3">
                              <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md mr-3 flex-shrink-0">
                                {getTimeString(ev.date)}
                              </span>
                              <div className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${ev.type === 'exam' ? 'bg-red-500' : 'bg-blue-500'}`} />
                              <span className="text-slate-700 font-medium truncate text-base">{ev.title}</span>
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
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                                title={t.calendar.actions.move}
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                type="button"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (ev.id) requestDelete(ev.id);
                                }}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                                title={t.calendar.actions.delete}
                              >
                                <Trash2 size={18} />
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
            <form onSubmit={handleAddEvent} className="border-t border-slate-100 pt-4 mt-6">
              <h4 className="font-semibold text-sm mb-3 text-slate-700">{t.calendar.newEvent}</h4>
              <div className="space-y-3">
                <input required name="title" placeholder={t.resources.forms.title} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                <div className="flex gap-2">
                   <select name="type" className="flex-1 p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="general">{t.calendar.types.general}</option>
                    <option value="exam">{t.calendar.types.exam}</option>
                    <option value="meeting">{t.calendar.types.meeting}</option>
                  </select>
                  <div className="flex items-center border rounded px-2 bg-white focus-within:ring-2 focus-within:ring-indigo-500">
                    <Clock size={14} className="text-slate-400 mr-2" />
                    <input type="time" name="time" defaultValue="09:00" className="p-1 text-sm outline-none" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded text-sm font-medium hover:bg-indigo-700 flex items-center justify-center transition-colors">
                  <Plus size={16} className="mr-2" /> {t.calendar.add}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};