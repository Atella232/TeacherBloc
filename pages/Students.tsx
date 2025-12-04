import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Student, Intervention, InterventionType, ClassGroup, Grade, FollowUpNote } from '../types';
import { Search, Plus, User, Phone, BrainCircuit, X, History, Save, GraduationCap, School, Edit2, Check, BookOpen, FileText, Calendar } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Students: React.FC = () => {
  const { t } = useLanguage();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Detail Data
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [followUpNotes, setFollowUpNotes] = useState<FollowUpNote[]>([]);
  
  // UI States
  const [activeTab, setActiveTab] = useState<'interventions' | 'grades' | 'followup'>('interventions');
  
  // Modal states
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isAddInterventionOpen, setIsAddInterventionOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isAddFollowUpOpen, setIsAddFollowUpOpen] = useState(false);

  // Editing States
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);

  // Form states for multi-select (Used for both Create and Edit)
  const [formSelectedGroups, setFormSelectedGroups] = useState<string[]>([]);
  const [formSpecialNeeds, setFormSpecialNeeds] = useState<string[]>([]);
  const [customNeedInput, setCustomNeedInput] = useState("");

  const COMMON_NEEDS = [
    { key: 'adhd', label: t.students.specialNeedsOptions.adhd },
    { key: 'dyslexia', label: t.students.specialNeedsOptions.dyslexia },
    { key: 'asd', label: t.students.specialNeedsOptions.asd },
    { key: 'highAbilities', label: t.students.specialNeedsOptions.highAbilities },
    { key: 'reinforcement', label: t.students.specialNeedsOptions.reinforcement },
  ];

  // Load data
  const refreshData = async () => {
    const [sts, cls] = await Promise.all([
      api.getItems<Student>('students'),
      api.getItems<ClassGroup>('classes')
    ]);
    setStudents(sts);
    setClasses(cls);
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (selectedStudent && selectedStudent.id) {
      loadDetails(selectedStudent.id);
    }
  }, [selectedStudent]);

  const loadDetails = async (studentId: string) => {
    const [allInts, allGrades, allNotes] = await Promise.all([
      api.getItems<Intervention>('interventions'),
      api.getItems<Grade>('grades'),
      api.getItems<FollowUpNote>('follow_up_notes')
    ]);
    setInterventions(allInts.filter(i => i.studentId === studentId).sort((a, b) => b.date - a.date));
    setGrades(allGrades.filter(g => g.studentId === studentId).sort((a, b) => b.date - a.date));
    setFollowUpNotes(allNotes.filter(n => n.studentId === studentId).sort((a, b) => b.date - a.date));
  };

  // --- Handlers for Student Modal (Create & Edit) ---

  const openStudentModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormSelectedGroups(student.groups || []);
      setFormSpecialNeeds(student.specialNeeds || []);
    } else {
      setEditingStudent(null);
      setFormSelectedGroups([]);
      setFormSpecialNeeds([]);
    }
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const studentData: any = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      groups: formSelectedGroups,
      contactInfo: formData.get('contactInfo') as string,
      specialNeeds: formSpecialNeeds,
    };

    if (editingStudent && editingStudent.id) {
      // UPDATE
      await api.updateItem('students', editingStudent.id, studentData);
      // Update local state if selected
      if (selectedStudent && selectedStudent.id === editingStudent.id) {
        setSelectedStudent({ ...selectedStudent, ...studentData });
      }
    } else {
      // CREATE
      studentData.createdAt = Date.now();
      await api.addItem<Student>('students', studentData);
    }
    
    setIsStudentModalOpen(false);
    refreshData();
  };

  // --- Handlers for Grade Modal (Create & Edit) ---

  const openGradeModal = (grade?: Grade) => {
    if (grade) {
      setEditingGrade(grade);
    } else {
      setEditingGrade(null);
    }
    setIsGradeModalOpen(true);
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedStudent.id) return;
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const gradeData: any = {
      studentId: selectedStudent.id,
      classGroupId: formData.get('classGroupId') as string,
      title: formData.get('title') as string,
      grade: parseFloat(formData.get('grade') as string),
      type: formData.get('type') as any,
      date: editingGrade ? editingGrade.date : Date.now()
    };

    if (editingGrade && editingGrade.id) {
        await api.updateItem('grades', editingGrade.id, gradeData);
    } else {
        await api.addItem<Grade>('grades', gradeData);
    }

    setIsGradeModalOpen(false);
    loadDetails(selectedStudent.id);
  };

  // --- Handlers for Interventions ---

  const handleAddIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedStudent.id) return;
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    await api.addItem<Intervention>('interventions', {
      studentId: selectedStudent.id,
      studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
      type: formData.get('type') as InterventionType,
      description: formData.get('description') as string,
      status: 'pendiente',
      date: Date.now()
    });

    setIsAddInterventionOpen(false);
    loadDetails(selectedStudent.id);
  };

  const toggleStatus = async (intervention: Intervention) => {
    if (!intervention.id) return;
    const newStatus = intervention.status === 'pendiente' ? 'resuelto' : 'pendiente';
    await api.updateItem('interventions', intervention.id, { status: newStatus });
    if (selectedStudent?.id) loadDetails(selectedStudent.id);
  };

  // --- Handlers for Follow Up ---

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedStudent.id) return;
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    await api.addItem<FollowUpNote>('follow_up_notes', {
      studentId: selectedStudent.id,
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      date: Date.now()
    });

    setIsAddFollowUpOpen(false);
    loadDetails(selectedStudent.id);
  };

  // --- Helpers for Form Logic ---

  const toggleGroupSelection = (id: string) => {
    setFormSelectedGroups(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const toggleSpecialNeed = (need: string) => {
    setFormSpecialNeeds(prev => 
      prev.includes(need) ? prev.filter(n => n !== need) : [...prev, need]
    );
  };

  const addCustomNeed = () => {
    if (customNeedInput.trim() && !formSpecialNeeds.includes(customNeedInput.trim())) {
      setFormSpecialNeeds(prev => [...prev, customNeedInput.trim()]);
      setCustomNeedInput("");
    }
  };

  // Helper to get group names string
  const getStudentGroupNames = (s: Student) => {
    if (!s.groups || s.groups.length === 0) return "Sin grupo";
    return s.groups.map(gid => classes.find(c => c.id === gid)?.name).filter(Boolean).join(", ");
  };

  const filteredStudents = students.filter(s => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const groupNames = s.groups.map(gid => classes.find(c => c.id === gid)?.name || '').join(' ').toLowerCase();
    const query = search.toLowerCase();
    return fullName.includes(query) || groupNames.includes(query);
  });

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      {/* List Section */}
      <div className={`w-full md:w-1/3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col ${selectedStudent ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-slate-800">{t.students.title}</h2>
            <button onClick={() => openStudentModal()} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
              <Plus size={20} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder={t.students.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredStudents.map(student => (
            <div 
              key={student.id}
              onClick={() => setSelectedStudent(student)}
              className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition ${selectedStudent?.id === student.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-slate-800">{student.firstName} {student.lastName}</h3>
                  <p className="text-xs text-slate-500 truncate max-w-[200px]">{getStudentGroupNames(student)}</p>
                </div>
                {student.specialNeeds.length > 0 && (
                  <BrainCircuit size={16} className="text-amber-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Section */}
      <div className={`flex-1 md:ml-6 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col ${!selectedStudent ? 'hidden md:flex' : 'flex'}`}>
        {selectedStudent ? (
          <>
            <div className="p-6 border-b border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <button onClick={() => setSelectedStudent(null)} className="md:hidden text-slate-500 mb-2 text-sm flex items-center">
                     ← {t.students.back}
                  </button>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-slate-900">{selectedStudent.firstName} {selectedStudent.lastName}</h2>
                    <button 
                      onClick={() => openStudentModal(selectedStudent)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title={t.students.editStudent}
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center flex-wrap gap-2 mt-2 text-sm text-slate-500">
                    <span className="flex items-center"><School size={14} className="mr-1"/> {getStudentGroupNames(selectedStudent)}</span>
                    <span className="text-slate-300">|</span>
                    <span className="flex items-center"><Phone size={14} className="mr-1" /> {selectedStudent.contactInfo}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedStudent.specialNeeds.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full border border-amber-200">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-6 border-b border-slate-100 overflow-x-auto">
                <button 
                  onClick={() => setActiveTab('interventions')}
                  className={`pb-2 text-sm font-medium transition relative whitespace-nowrap ${activeTab === 'interventions' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {t.students.tabs.interventions}
                  {activeTab === 'interventions' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 -mb-px" />}
                </button>
                <button 
                  onClick={() => setActiveTab('grades')}
                  className={`pb-2 text-sm font-medium transition relative whitespace-nowrap ${activeTab === 'grades' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {t.students.tabs.grades}
                  {activeTab === 'grades' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 -mb-px" />}
                </button>
                <button 
                  onClick={() => setActiveTab('followup')}
                  className={`pb-2 text-sm font-medium transition relative whitespace-nowrap ${activeTab === 'followup' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {t.students.tabs.followup}
                  {activeTab === 'followup' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 -mb-px" />}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              
              {/* INTERVENTIONS TAB */}
              {activeTab === 'interventions' && (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase flex items-center">
                      <History size={16} className="mr-2" /> {t.students.history}
                    </h3>
                    <button 
                      onClick={() => setIsAddInterventionOpen(true)}
                      className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 flex items-center"
                    >
                      <Plus size={14} className="mr-1" /> {t.students.addIntervention}
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {interventions.length === 0 && <p className="text-slate-400 italic text-sm">{t.students.noRecords}</p>}
                    
                    {interventions.map(inter => (
                      <div key={inter.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative group">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider
                            ${inter.type === 'Conducta' ? 'bg-red-100 text-red-700' : 
                              inter.type === 'Positivo' ? 'bg-green-100 text-green-700' : 
                              inter.type === 'Académico' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}
                          `}>
                            {t.students.types[inter.type] || inter.type}
                          </span>
                          <span className="text-xs text-slate-400">{new Date(inter.date).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-700 mb-3">{inter.description}</p>
                        <div className="flex justify-end">
                          <button 
                            onClick={() => toggleStatus(inter)}
                            className={`text-xs px-3 py-1 rounded-full border transition
                              ${inter.status === 'resuelto' 
                                ? 'bg-green-50 text-green-600 border-green-200' 
                                : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200'}
                            `}
                          >
                            {inter.status === 'resuelto' ? t.students.status.resolved : t.students.status.markResolved}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* GRADES TAB */}
              {activeTab === 'grades' && (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase flex items-center">
                      <GraduationCap size={16} className="mr-2" /> {t.students.grades}
                    </h3>
                    <button 
                      onClick={() => openGradeModal()}
                      className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 flex items-center"
                    >
                      <Plus size={14} className="mr-1" /> {t.students.addGrade}
                    </button>
                  </div>
                  
                  {/* Grades grouped by Class */}
                  {selectedStudent.groups.length === 0 && <p className="text-slate-400 italic text-sm">Este alumno no está asignado a ninguna clase.</p>}
                  
                  <div className="space-y-6">
                    {selectedStudent.groups.map(classId => {
                      const classObj = classes.find(c => c.id === classId);
                      const classGrades = grades.filter(g => g.classGroupId === classId);
                      if (!classObj) return null;

                      // Calculate Average
                      const numericGrades = classGrades.filter(g => g.type !== 'final').map(g => g.grade);
                      const avg = numericGrades.length ? (numericGrades.reduce((a,b) => a+b, 0) / numericGrades.length).toFixed(1) : '-';

                      return (
                        <div key={classId} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                            <div>
                              <h4 className="font-bold text-slate-800">{classObj.name}</h4>
                              <p className="text-xs text-slate-500">{classObj.subject}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500 uppercase font-bold">Media</p>
                              <p className="font-mono font-bold text-lg text-indigo-600">{avg}</p>
                            </div>
                          </div>
                          
                          <div className="p-4">
                            {classGrades.length === 0 ? (
                               <p className="text-xs text-slate-400 italic">No hay notas registradas.</p>
                            ) : (
                                <table className="w-full text-sm text-left">
                                  <thead className="text-xs text-slate-500 uppercase border-b border-slate-100">
                                    <tr>
                                      <th className="pb-2 font-medium">Concepto</th>
                                      <th className="pb-2 font-medium">Tipo</th>
                                      <th className="pb-2 font-medium text-right">Nota</th>
                                      <th className="w-8"></th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                    {classGrades.map(grade => (
                                      <tr key={grade.id} className={`group hover:bg-slate-50 transition ${grade.type === 'final' ? 'bg-indigo-50/50' : ''}`}>
                                        <td className="py-2 text-slate-700">
                                            {grade.title}
                                            <div className="text-[10px] text-slate-400">{new Date(grade.date).toLocaleDateString()}</div>
                                        </td>
                                        <td className="py-2 text-slate-500 text-xs">
                                          <span className={`px-2 py-0.5 rounded-full 
                                            ${grade.type === 'exam' ? 'bg-red-50 text-red-600' : 
                                              grade.type === 'work' ? 'bg-blue-50 text-blue-600' : 'bg-green-100 text-green-700 font-bold'}`}>
                                            {grade.type === 'exam' ? 'Examen' : grade.type === 'work' ? 'Trabajo' : 'Final'}
                                          </span>
                                        </td>
                                        <td className={`py-2 text-right font-mono font-bold ${grade.grade < 5 ? 'text-red-500' : 'text-slate-700'}`}>
                                          {grade.grade}
                                        </td>
                                        <td className="py-2 text-right">
                                          <button 
                                            onClick={() => openGradeModal(grade)}
                                            className="p-1 text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition"
                                            title={t.students.editGrade}
                                          >
                                            <Edit2 size={14} />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* FOLLOW UP TAB */}
              {activeTab === 'followup' && (
                <>
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-sm font-bold text-slate-400 uppercase flex items-center">
                      <FileText size={16} className="mr-2" /> {t.students.tabs.followup}
                    </h3>
                    <button 
                      onClick={() => setIsAddFollowUpOpen(true)}
                      className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 flex items-center"
                    >
                      <Plus size={14} className="mr-1" /> {t.students.addFollowUp}
                    </button>
                  </div>

                  <div className="relative pl-4 border-l-2 border-indigo-100 space-y-8">
                     {followUpNotes.length === 0 && (
                        <div className="text-slate-400 italic text-sm pl-4">{t.students.noRecords}</div>
                     )}

                     {followUpNotes.map(note => (
                       <div key={note.id} className="relative pl-6">
                          {/* Timeline dot */}
                          <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-indigo-500 border-4 border-slate-50 shadow-sm z-10"></div>
                          
                          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-3 pb-3 border-b border-slate-50">
                                <h4 className="text-lg font-bold text-slate-800">{note.title}</h4>
                                <div className="flex items-center text-xs text-indigo-500 font-medium bg-indigo-50 px-2 py-1 rounded-md mt-2 sm:mt-0">
                                   <Calendar size={12} className="mr-1.5" />
                                   {new Date(note.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                             </div>
                             <div className="prose prose-sm prose-slate max-w-none">
                                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <User size={64} className="mb-4 text-slate-200" />
            <p>{t.students.selectPrompt}</p>
          </div>
        )}
      </div>

      {/* Create/Edit Student Modal */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">
                {editingStudent ? t.students.editStudent : t.students.newStudent}
              </h3>
              <button onClick={() => setIsStudentModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            
            <form onSubmit={handleSaveStudent} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.students.forms.firstName}</label>
                    <input required name="firstName" defaultValue={editingStudent?.firstName} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.students.forms.lastName}</label>
                    <input required name="lastName" defaultValue={editingStudent?.lastName} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">{t.students.forms.contact}</label>
                 <input name="contactInfo" defaultValue={editingStudent?.contactInfo} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              {/* Enhanced Class Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">{t.students.forms.group}</label>
                <div className="grid grid-cols-2 gap-3">
                   {classes.length === 0 && <p className="text-xs text-slate-400 italic">Crea clases primero en el apartado 'Gelak'</p>}
                   {classes.map(cls => {
                     const isSelected = formSelectedGroups.includes(cls.id!);
                     return (
                        <div 
                           key={cls.id}
                           onClick={() => cls.id && toggleGroupSelection(cls.id)}
                           className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between
                             ${isSelected 
                                ? 'bg-indigo-50 border-indigo-500 shadow-sm' 
                                : 'bg-white border-slate-200 hover:border-indigo-300'}
                           `}
                        >
                           <div className="flex items-center space-x-3">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                                ${isSelected ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-500'}
                             `}>
                               {cls.name.substring(0,2)}
                             </div>
                             <div className="text-sm">
                               <p className={`font-medium ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{cls.name}</p>
                               <p className="text-xs text-slate-500">{cls.subject}</p>
                             </div>
                           </div>
                           {isSelected && <Check size={16} className="text-indigo-600" />}
                        </div>
                     );
                   })}
                </div>
              </div>

              {/* Enhanced Special Needs Selection */}
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-3">{t.students.forms.tags}</label>
                 <div className="flex flex-wrap gap-2 mb-3">
                    {COMMON_NEEDS.map(need => {
                        const isSelected = formSpecialNeeds.includes(need.label);
                        return (
                          <button
                            type="button"
                            key={need.key}
                            onClick={() => toggleSpecialNeed(need.label)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border
                               ${isSelected 
                                 ? 'bg-indigo-600 text-white border-indigo-600' 
                                 : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}
                            `}
                          >
                            {need.label}
                          </button>
                        );
                    })}
                 </div>
                 
                 {/* Current custom tags not in common list */}
                 <div className="flex flex-wrap gap-2 mb-3">
                    {formSpecialNeeds.filter(tag => !COMMON_NEEDS.some(cn => cn.label === tag)).map(tag => (
                        <span key={tag} className="px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 flex items-center">
                           {tag}
                           <button type="button" onClick={() => toggleSpecialNeed(tag)} className="ml-2 hover:text-amber-900"><X size={12}/></button>
                        </span>
                    ))}
                 </div>

                 {/* Custom Input */}
                 <div className="flex gap-2">
                    <input 
                      value={customNeedInput}
                      onChange={(e) => setCustomNeedInput(e.target.value)}
                      placeholder={t.students.forms.addTag}
                      className="flex-1 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addCustomNeed(); }}}
                    />
                    <button type="button" onClick={addCustomNeed} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200 font-medium">
                        +
                    </button>
                 </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all transform hover:scale-[1.01]">
                   {editingStudent ? t.students.forms.updateStudent : t.students.forms.saveStudent}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Intervention Modal */}
      {isAddInterventionOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{t.students.addIntervention}</h3>
              <button onClick={() => setIsAddInterventionOpen(false)}><X className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddIntervention} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.students.forms.type}</label>
                <select name="type" className="w-full p-2 border rounded bg-white">
                  <option value="Conducta">{t.students.types.Conducta}</option>
                  <option value="Académico">{t.students.types.Académico}</option>
                  <option value="Familia">{t.students.types.Familia}</option>
                  <option value="Positivo">{t.students.types.Positivo}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.students.forms.description}</label>
                <textarea required name="description" rows={4} className="w-full p-2 border rounded" placeholder={t.students.forms.descPlaceholder} />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded font-medium hover:bg-indigo-700">{t.students.forms.saveRecord}</button>
            </form>
          </div>
        </div>
      )}

      {/* Add Follow Up Modal */}
      {isAddFollowUpOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{t.students.addFollowUp}</h3>
              <button onClick={() => setIsAddFollowUpOpen(false)}><X className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddFollowUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.students.forms.followUpTitle}</label>
                <input required name="title" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.students.forms.followUpContent}</label>
                <textarea 
                   required 
                   name="content" 
                   rows={8} 
                   className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" 
                   placeholder={t.students.forms.followUpContent} 
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 shadow-md">
                 {t.students.forms.saveRecord}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create/Edit Grade Modal */}
      {isGradeModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
             <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                 {editingGrade ? t.students.editGrade : t.students.addGrade}
              </h3>
              <button onClick={() => setIsGradeModalOpen(false)}><X className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Clase</label>
                <select 
                  name="classGroupId" 
                  className="w-full p-2 border rounded bg-white" 
                  required 
                  defaultValue={editingGrade?.classGroupId}
                >
                  {selectedStudent.groups.map(gid => {
                    const c = classes.find(cl => cl.id === gid);
                    return c ? <option key={c.id} value={c.id}>{c.name} - {c.subject}</option> : null;
                  })}
                </select>
              </div>
              
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t.students.forms.examTitle}</label>
                  <input required name="title" defaultValue={editingGrade?.title} className="w-full p-2 border rounded" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">{t.students.forms.gradeValue}</label>
                   <input required type="number" step="0.1" min="0" max="10" name="grade" defaultValue={editingGrade?.grade} className="w-full p-2 border rounded" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">{t.students.forms.gradeType}</label>
                   <select name="type" defaultValue={editingGrade?.type || 'exam'} className="w-full p-2 border rounded bg-white">
                      <option value="exam">Examen</option>
                      <option value="work">Trabajo/Deberes</option>
                      <option value="final">Evaluación Final</option>
                   </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded font-medium hover:bg-indigo-700">{t.students.forms.saveRecord}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
