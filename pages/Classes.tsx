
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ClassGroup, Student } from '../types';
import { Plus, Users, BookOpen, X, UserPlus, GraduationCap, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

export const Classes: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassGroup | null>(null);
  
  // Modals
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

  const refreshData = async () => {
    const [cls, sts] = await Promise.all([
      api.getItems<ClassGroup>('classes'),
      api.getItems<Student>('students')
    ]);
    setClasses(cls);
    setStudents(sts);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    await api.addItem<ClassGroup>('classes', {
      name: formData.get('name') as string,
      subject: formData.get('subject') as string,
      createdAt: Date.now()
    });
    
    setIsAddClassOpen(false);
    refreshData();
  };

  const handleAddStudentToClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    await api.addItem<Student>('students', {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      groups: [selectedClass.id!],
      contactInfo: formData.get('contactInfo') as string,
      specialNeeds: (formData.get('specialNeeds') as string).split(',').map(s => s.trim()).filter(Boolean),
      createdAt: Date.now()
    });

    setIsAddStudentOpen(false);
    refreshData();
  };

  const navigateToStudent = (studentId: string) => {
    // Navigate to students page and pass the ID to select it automatically
    navigate('/students', { state: { studentId } });
  };

  const filteredStudents = selectedClass 
    ? students.filter(s => (s.groups || []).includes(selectedClass.id!)) 
    : [];

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] gap-6">
      {/* List of Classes */}
      <div className={`w-full md:w-1/3 glass-panel rounded-3xl flex flex-col overflow-hidden transition-all duration-300 ${selectedClass ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-slate-100/50 dark:border-slate-700/50 space-y-3 bg-white/40 dark:bg-slate-800/40">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-xl font-sans tracking-tight">{t.classes.title}</h2>
            <button onClick={() => setIsAddClassOpen(true)} className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 shadow-sm transition-all hover:scale-105">
              <Plus size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {classes.length === 0 && (
            <div className="text-center text-slate-400 py-10">
              <BookOpen size={48} className="mx-auto mb-2 opacity-50" />
              <p className="font-hand text-lg">{t.classes.noClasses}</p>
            </div>
          )}
          {classes.map(cls => (
            <div 
              key={cls.id}
              onClick={() => setSelectedClass(cls)}
              className={`p-5 rounded-2xl cursor-pointer transition-all duration-200 
                ${selectedClass?.id === cls.id 
                    ? 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/40 dark:to-blue-900/40 shadow-sm border border-purple-100 dark:border-purple-800' 
                    : 'hover:bg-white/40 dark:hover:bg-slate-700/40 hover:pl-6 border border-transparent'}
              `}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={`font-bold text-lg ${selectedClass?.id === cls.id ? 'text-slate-800 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>{cls.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center mt-1 font-medium">
                    <BookOpen size={14} className="mr-1 opacity-70" /> {cls.subject}
                  </p>
                </div>
                <div className="bg-white/60 dark:bg-slate-800/60 px-3 py-1 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center shadow-sm">
                  <Users size={12} className="mr-1.5 text-purple-400" />
                  {students.filter(s => (s.groups || []).includes(cls.id!)).length}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Class Details & Students */}
      <div className={`flex-1 glass-panel rounded-3xl flex flex-col overflow-hidden relative ${!selectedClass ? 'hidden md:flex' : 'flex'}`}>
        {selectedClass ? (
          <>
             {/* Header Background Decoration */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 dark:bg-indigo-900/30 rounded-bl-full pointer-events-none opacity-50"></div>

            <div className="p-6 md:p-8 border-b border-slate-100/50 dark:border-slate-700/50 relative z-10">
              <div className="flex justify-between items-start">
                  <div>
                    <button onClick={() => setSelectedClass(null)} className="md:hidden text-slate-500 dark:text-slate-400 mb-2 text-sm flex items-center font-medium bg-white/50 dark:bg-slate-700/50 px-2 py-1 rounded-lg">
                    ← {t.students.back}
                    </button>
                    <h2 className="text-3xl font-bold text-indigo-900 dark:text-indigo-200 font-sans tracking-tight">{selectedClass.name}</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium font-body text-lg">{selectedClass.subject}</p>
                  </div>
                  <button 
                    onClick={() => setIsAddStudentOpen(true)}
                    className="bg-slate-800 dark:bg-slate-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-700 dark:hover:bg-slate-600 flex items-center shadow-lg shadow-slate-200 dark:shadow-none transition-transform hover:-translate-y-1"
                >
                    <UserPlus size={18} className="mr-2" /> {t.classes.addStudentToClass}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase mb-6 flex items-center tracking-wider">
                <GraduationCap size={16} className="mr-2" /> {t.classes.studentsInClass} ({filteredStudents.length})
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                 {filteredStudents.length === 0 && <p className="text-slate-400 italic text-sm col-span-2 font-hand text-lg text-center mt-10">{t.students.noRecords}</p>}
                 
                 {filteredStudents.map(student => (
                   <div 
                      key={student.id} 
                      onClick={() => student.id && navigateToStudent(student.id)}
                      className="group p-4 bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm border border-white dark:border-slate-700 rounded-2xl flex items-center shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                   >
                      <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold mr-4 text-lg shadow-inner">
                        {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800 dark:text-slate-100 text-lg">{student.firstName} {student.lastName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{student.contactInfo}</p>
                      </div>
                      <ArrowRight size={18} className="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                   </div>
                 ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 relative">
             <div className="w-32 h-32 bg-white/40 dark:bg-slate-800/40 rounded-full flex items-center justify-center mb-6 shadow-sm backdrop-blur-sm">
                <BookOpen size={64} className="text-slate-300/80 dark:text-slate-600" />
             </div>
            <p className="font-hand text-xl opacity-70">{t.classes.noClasses}</p>
          </div>
        )}
      </div>

      {/* Add Class Modal */}
      {isAddClassOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 dark:bg-slate-900/95 rounded-3xl max-w-md w-full p-8 shadow-2xl relative border border-white dark:border-slate-800">
            <button onClick={() => setIsAddClassOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"><X /></button>
            <h3 className="text-xl font-bold mb-6 text-slate-800 dark:text-slate-100 font-sans">{t.classes.addClass}</h3>
            <form onSubmit={handleAddClass} className="space-y-5">
              <input required name="name" placeholder={t.classes.forms.name} className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-300 outline-none transition-shadow text-slate-800 dark:text-slate-200" />
              <input required name="subject" placeholder={t.classes.forms.subject} className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-300 outline-none transition-shadow text-slate-800 dark:text-slate-200" />
              <button type="submit" className="w-full bg-slate-800 dark:bg-slate-700 text-white py-3 rounded-xl font-bold hover:bg-slate-700 dark:hover:bg-slate-600 shadow-lg">{t.classes.forms.save}</button>
            </form>
          </div>
        </div>
      )}

      {/* Add Student to THIS Class Modal */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 dark:bg-slate-900/95 rounded-3xl max-w-md w-full p-8 shadow-2xl relative border border-white dark:border-slate-800">
            <button onClick={() => setIsAddStudentOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"><X /></button>
            <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-100 font-sans">{t.classes.addStudentToClass}</h3>
            <p className="text-xs text-slate-500 mb-6 font-medium bg-indigo-50 dark:bg-indigo-900/30 inline-block px-3 py-1 rounded-lg">
                {t.classes.forms.name}: <span className="font-bold text-indigo-700 dark:text-indigo-300">{selectedClass?.name}</span>
            </p>
            <form onSubmit={handleAddStudentToClass} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <input required name="firstName" placeholder={t.students.forms.firstName} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-full focus:ring-2 focus:ring-purple-300 outline-none text-slate-800 dark:text-slate-200" />
                <input required name="lastName" placeholder={t.students.forms.lastName} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-full focus:ring-2 focus:ring-purple-300 outline-none text-slate-800 dark:text-slate-200" />
              </div>
              <input name="contactInfo" placeholder={t.students.forms.contact} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-full focus:ring-2 focus:ring-purple-300 outline-none text-slate-800 dark:text-slate-200" />
              <input name="specialNeeds" placeholder={t.students.forms.tags} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-full focus:ring-2 focus:ring-purple-300 outline-none text-slate-800 dark:text-slate-200" />
              <button type="submit" className="w-full bg-slate-800 dark:bg-slate-700 text-white py-3 rounded-xl font-bold hover:bg-slate-700 dark:hover:bg-slate-600 shadow-lg">{t.students.forms.saveStudent}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
