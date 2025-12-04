import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ClassGroup, Student } from '../types';
import { Plus, Users, BookOpen, X, UserPlus, GraduationCap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Classes: React.FC = () => {
  const { t } = useLanguage();
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

  const filteredStudents = selectedClass 
    ? students.filter(s => s.groups.includes(selectedClass.id!)) 
    : [];

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      {/* List of Classes */}
      <div className={`w-full md:w-1/3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col ${selectedClass ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-slate-800">{t.classes.title}</h2>
            <button onClick={() => setIsAddClassOpen(true)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
              <Plus size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {classes.length === 0 && (
            <div className="text-center text-slate-400 py-10">
              <BookOpen size={48} className="mx-auto mb-2 opacity-50" />
              <p>{t.classes.noClasses}</p>
            </div>
          )}
          {classes.map(cls => (
            <div 
              key={cls.id}
              onClick={() => setSelectedClass(cls)}
              className={`p-4 border rounded-xl cursor-pointer hover:shadow-md transition-all 
                ${selectedClass?.id === cls.id ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-200'}
              `}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{cls.name}</h3>
                  <p className="text-sm text-slate-500 flex items-center mt-1">
                    <BookOpen size={14} className="mr-1" /> {cls.subject}
                  </p>
                </div>
                <div className="bg-slate-100 px-2 py-1 rounded-md text-xs font-medium text-slate-600 flex items-center">
                  <Users size={12} className="mr-1" />
                  {students.filter(s => s.groups.includes(cls.id!)).length}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Class Details & Students */}
      <div className={`flex-1 md:ml-6 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col ${!selectedClass ? 'hidden md:flex' : 'flex'}`}>
        {selectedClass ? (
          <>
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
              <div>
                <button onClick={() => setSelectedClass(null)} className="md:hidden text-slate-500 mb-2 text-sm flex items-center">
                   ← {t.students.back}
                </button>
                <h2 className="text-2xl font-bold text-indigo-900">{selectedClass.name}</h2>
                <p className="text-slate-500 font-medium">{selectedClass.subject}</p>
              </div>
              <button 
                onClick={() => setIsAddStudentOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center shadow-lg shadow-indigo-200"
              >
                <UserPlus size={16} className="mr-2" /> {t.classes.addStudentToClass}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center">
                <GraduationCap size={16} className="mr-2" /> {t.classes.studentsInClass} ({filteredStudents.length})
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                 {filteredStudents.length === 0 && <p className="text-slate-400 italic text-sm col-span-2">{t.students.noRecords}</p>}
                 
                 {filteredStudents.map(student => (
                   <div key={student.id} className="p-4 border border-slate-200 rounded-lg flex items-center bg-white">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mr-3">
                        {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{student.firstName} {student.lastName}</p>
                        <p className="text-xs text-slate-500">{student.contactInfo}</p>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <BookOpen size={64} className="mb-4 text-slate-200" />
            <p>{t.classes.noClasses}</p>
          </div>
        )}
      </div>

      {/* Add Class Modal */}
      {isAddClassOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsAddClassOpen(false)} className="absolute top-4 right-4 text-slate-400"><X /></button>
            <h3 className="text-lg font-bold mb-4">{t.classes.addClass}</h3>
            <form onSubmit={handleAddClass} className="space-y-4">
              <input required name="name" placeholder={t.classes.forms.name} className="w-full p-2 border rounded" />
              <input required name="subject" placeholder={t.classes.forms.subject} className="w-full p-2 border rounded" />
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded font-medium">{t.classes.forms.save}</button>
            </form>
          </div>
        </div>
      )}

      {/* Add Student to THIS Class Modal */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsAddStudentOpen(false)} className="absolute top-4 right-4 text-slate-400"><X /></button>
            <h3 className="text-lg font-bold mb-4">{t.classes.addStudentToClass}</h3>
            <p className="text-xs text-slate-500 mb-4">{t.classes.forms.name}: <span className="font-bold">{selectedClass?.name}</span></p>
            <form onSubmit={handleAddStudentToClass} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input required name="firstName" placeholder={t.students.forms.firstName} className="p-2 border rounded w-full" />
                <input required name="lastName" placeholder={t.students.forms.lastName} className="p-2 border rounded w-full" />
              </div>
              <input name="contactInfo" placeholder={t.students.forms.contact} className="p-2 border rounded w-full" />
              <input name="specialNeeds" placeholder={t.students.forms.tags} className="p-2 border rounded w-full" />
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded font-medium">{t.students.forms.saveStudent}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
