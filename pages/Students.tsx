
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Student, Intervention, InterventionType, ClassGroup, Grade, FollowUpNote } from '../types';
import { Search, Plus, User, Phone, BrainCircuit, X, History, Save, GraduationCap, School, Edit2, Check, BookOpen, FileText, Calendar } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useLocation } from 'react-router-dom';

export const Students: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation(); // Hook to get navigation state
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

  // Check for incoming navigation state (from Classes)
  useEffect(() => {
    if (location.state && location.state.studentId && students.length > 0) {
        const targetStudent = students.find(s => s.id === location.state.studentId);
        if (targetStudent) {
            setSelectedStudent(targetStudent);
        }
    }
  }, [location.state, students]);

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
    return (s.groups || []).map(gid => classes.find(c => c.id === gid)?.name).filter(Boolean).join(", ");
  };

  const filteredStudents = students.filter(s => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const groupNames = (s.groups || []).map(gid => classes.find(c => c.id === gid)?.name || '').join(' ').toLowerCase();
    const query = search.toLowerCase();
    return fullName.includes(query) || groupNames.includes(query);
  });

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] gap-6">
      {/* List Section */}
      <div className={`w-full md:w-1/3 glass-panel rounded-3xl flex flex-col overflow-hidden transition-all duration-300 ${selectedStudent ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-slate-100/50 dark:border-slate-700/50 space-y-3 bg-white/40 dark:bg-slate-800/40">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-xl font-sans tracking-tight">{t.students.title}</h2>
            <button onClick={() => openStudentModal()} className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 shadow-sm transition-all hover:scale-105">
              <Plus size={20} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder={t.students.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 text-sm placeholder-slate-400 text-slate-700 dark:text-slate-200 transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredStudents.map(student => (
            <div 
              key={student.id}
              onClick={() => setSelectedStudent(student)}
              className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 flex items-center
                ${selectedStudent?.id === student.id 
                  ? 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/40 dark:to-blue-900/40 shadow-sm border border-purple-100 dark:border-purple-800' 
                  : 'hover:bg-white/40 dark:hover:bg-slate-700/40 hover:pl-5 border border-transparent'}
              `}
            >
               <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mr-3 shadow-sm ${selectedStudent?.id === student.id ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                 {student.firstName.charAt(0)}{student.lastName.charAt(0)}
               </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`font-semibold text-sm ${selectedStudent?.id === student.id ? 'text-slate-800 dark:text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>{student.firstName} {student.lastName}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px] font-body">{getStudentGroupNames(student)}</p>
                  </div>
                  {(student.specialNeeds || []).length > 0 && (
                    <BrainCircuit size={14} className="text-amber-400" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Section */}
      <div className={`flex-1 glass-panel rounded-3xl flex flex-col overflow-hidden relative ${!selectedStudent ? 'hidden md:flex' : 'flex'}`}>
        {selectedStudent ? (
          <>
             {/* Header Background Decoration */}
             <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-50/50 dark:from-blue-900/30 to-transparent pointer-events-none"></div>

            <div className="p-6 md:p-8 border-b border-slate-100/50 dark:border-slate-700/50 relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <button onClick={() => setSelectedStudent(null)} className="md:hidden text-slate-500 dark:text-slate-400 mb-2 text-sm flex items-center font-medium bg-white/50 dark:bg-slate-700/50 px-2 py-1 rounded-lg">
                     ← {t.students.back}
                  </button>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">{selectedStudent.firstName} {selectedStudent.lastName}</h2>
                    <button 
                      onClick={() => openStudentModal(selectedStudent)}
                      className="p-2 text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/50 rounded-xl transition"
                      title={t.students.editStudent}
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center flex-wrap gap-2 mt-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
                    <span className="flex items-center bg-white/60 dark:bg-slate-800/60 px-2 py-1 rounded-lg border border-white/50 dark:border-slate-700"><School size={14} className="mr-2 text-blue-400"/> {getStudentGroupNames(selectedStudent)}</span>
                    <span className="flex items-center bg-white/60 dark:bg-slate-800/60 px-2 py-1 rounded-lg border border-white/50 dark:border-slate-700"><Phone size={14} className="mr-2 text-green-400" /> {selectedStudent.contactInfo}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(selectedStudent.specialNeeds || []).map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs rounded-full border border-amber-100 dark:border-amber-800/50 font-bold tracking-wide shadow-sm">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl w-full md:w-fit">
                {['interventions', 'grades', 'followup'].map((tab) => (
                   <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300
                       ${activeTab === tab 
                         ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm transform scale-100' 
                         : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-700/40'}
                    `}
                  >
                    {t.students.tabs[tab as keyof typeof t.students.tabs]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-transparent">
              
              {/* INTERVENTIONS TAB */}
              {activeTab === 'interventions' && (
                <div className="animate-in fade-in duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase flex items-center tracking-wider">
                      <History size={16} className="mr-2" /> {t.students.history}
                    </h3>
                    <button 
                      onClick={() => setIsAddInterventionOpen(true)}
                      className="text-xs bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded-xl hover:bg-slate-700 dark:hover:bg-slate-600 flex items-center shadow-lg shadow-slate-200 dark:shadow-none transition-transform hover:scale-105"
                    >
                      <Plus size={14} className="mr-1" /> {t.students.addIntervention}
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {interventions.length === 0 && <div className="text-center py-10 text-slate-400 dark:text-slate-500 font-hand text-lg">{t.students.noRecords}</div>}
                    
                    {interventions.map(inter => (
                      <div key={inter.id} className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm p-5 rounded-2xl border border-white dark:border-slate-700 shadow-sm relative group hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                            ${inter.type === 'Conducta' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 
                              inter.type === 'Positivo' ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 
                              inter.type === 'Académico' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}
                          `}>
                            {t.students.types[inter.type] || inter.type}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{new Date(inter.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 mb-4 font-body leading-relaxed">{inter.description}</p>
                        <div className="flex justify-end">
                          <button 
                            onClick={() => toggleStatus(inter)}
                            className={`text-xs px-4 py-1.5 rounded-full border transition-all font-medium flex items-center
                              ${inter.status === 'resuelto' 
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' 
                                : 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 hover:border-green-200'}
                            `}
                          >
                            {inter.status === 'resuelto' && <Check size={12} className="mr-1"/>}
                            {inter.status === 'resuelto' ? t.students.status.resolved : t.students.status.markResolved}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* GRADES TAB */}
              {activeTab === 'grades' && (
                <div className="animate-in fade-in duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase flex items-center tracking-wider">
                      <GraduationCap size={16} className="mr-2" /> {t.students.grades}
                    </h3>
                    <button 
                      onClick={() => openGradeModal()}
                      className="text-xs bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded-xl hover:bg-slate-700 dark:hover:bg-slate-600 flex items-center shadow-lg shadow-slate-200 dark:shadow-none transition-transform hover:scale-105"
                    >
                      <Plus size={14} className="mr-1" /> {t.students.addGrade}
                    </button>
                  </div>
                  
                  {(!selectedStudent.groups || selectedStudent.groups.length === 0) && <p className="text-slate-400 italic text-sm font-hand">Este alumno no está asignado a ninguna clase.</p>}
                  
                  <div className="space-y-6">
                    {(selectedStudent.groups || []).map(classId => {
                      const classObj = classes.find(c => c.id === classId);
                      const classGrades = grades.filter(g => g.classGroupId === classId);
                      if (!classObj) return null;

                      // Calculate Average
                      const numericGrades = classGrades.filter(g => g.type !== 'final').map(g => g.grade);
                      const avg = numericGrades.length ? (numericGrades.reduce((a,b) => a+b, 0) / numericGrades.length).toFixed(1) : '-';
                      const avgNum = parseFloat(avg as string);
                      const avgColor = avgNum >= 5 ? 'text-green-500 dark:text-green-400' : avgNum < 5 && avg !== '-' ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500';

                      return (
                        <div key={classId} className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm border border-white dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm">
                          <div className="bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <div>
                              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{classObj.name}</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{classObj.subject}</p>
                            </div>
                            <div className="text-right bg-white dark:bg-slate-800 px-3 py-1 rounded-xl shadow-sm">
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">Media</p>
                              <p className={`font-mono font-bold text-xl ${avgColor}`}>{avg}</p>
                            </div>
                          </div>
                          
                          <div className="p-4">
                            {classGrades.length === 0 ? (
                               <p className="text-sm text-slate-400 dark:text-slate-500 font-hand text-center py-4">No hay notas registradas.</p>
                            ) : (
                                <table className="w-full text-sm text-left border-collapse">
                                  <thead className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">
                                    <tr>
                                      <th className="pb-3 pl-2">Concepto</th>
                                      <th className="pb-3">Tipo</th>
                                      <th className="pb-3 text-right pr-2">Nota</th>
                                      <th className="w-8"></th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100/50 dark:divide-slate-700/50">
                                    {classGrades.map(grade => (
                                      <tr key={grade.id} className={`group hover:bg-white/50 dark:hover:bg-slate-700/50 transition rounded-lg`}>
                                        <td className="py-3 pl-2 text-slate-700 dark:text-slate-300 font-medium">
                                            {grade.title}
                                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono opacity-70">{new Date(grade.date).toLocaleDateString()}</div>
                                        </td>
                                        <td className="py-3">
                                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase
                                            ${grade.type === 'exam' ? 'bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400' : 
                                              grade.type === 'work' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-1 ring-purple-200 dark:ring-purple-800/50'}
                                          `}>
                                            {grade.type === 'exam' ? 'Examen' : grade.type === 'work' ? 'Trabajo' : 'Final'}
                                          </span>
                                        </td>
                                        <td className={`py-3 text-right font-mono font-bold text-base pr-2 ${grade.grade < 5 ? 'text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                          {grade.grade}
                                        </td>
                                        <td className="py-3 text-right">
                                          <button 
                                            onClick={() => openGradeModal(grade)}
                                            className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/50 rounded-lg opacity-0 group-hover:opacity-100 transition"
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
                </div>
              )}

              {/* FOLLOW UP TAB */}
              {activeTab === 'followup' && (
                <div className="animate-in fade-in duration-300">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase flex items-center tracking-wider">
                      <FileText size={16} className="mr-2" /> {t.students.tabs.followup}
                    </h3>
                    <button 
                      onClick={() => setIsAddFollowUpOpen(true)}
                      className="text-xs bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded-xl hover:bg-slate-700 dark:hover:bg-slate-600 flex items-center shadow-lg shadow-slate-200 dark:shadow-none transition-transform hover:scale-105"
                    >
                      <Plus size={14} className="mr-1" /> {t.students.addFollowUp}
                    </button>
                  </div>

                  <div className="relative pl-4 space-y-8">
                     {/* Timeline line */}
                     <div className="absolute top-2 bottom-0 left-[27px] w-0.5 bg-gradient-to-b from-purple-200 via-blue-200 to-transparent dark:from-purple-900 dark:via-blue-900"></div>

                     {followUpNotes.length === 0 && (
                        <div className="text-center py-10 text-slate-400 dark:text-slate-500 font-hand text-lg">{t.students.noRecords}</div>
                     )}

                     {followUpNotes.map(note => (
                       <div key={note.id} className="relative pl-10 group">
                          {/* Timeline dot */}
                          <div className="absolute left-[20px] top-6 w-4 h-4 rounded-full bg-white dark:bg-slate-800 border-4 border-purple-300 dark:border-purple-700 shadow-sm z-10 transition-transform group-hover:scale-125 group-hover:border-purple-400 dark:group-hover:border-purple-600"></div>
                          
                          <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-3xl border border-white dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                             {/* Decoration */}
                             <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full blur-2xl opacity-50 pointer-events-none"></div>

                             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-4 pb-4 border-b border-slate-100/50 dark:border-slate-700/50">
                                <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">{note.title}</h4>
                                <div className="flex items-center text-xs text-purple-600 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-900/30 px-3 py-1.5 rounded-full mt-2 sm:mt-0">
                                   <Calendar size={12} className="mr-2" />
                                   {new Date(note.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                             </div>
                             <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                                <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-body">{note.content}</p>
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 relative">
             <div className="w-32 h-32 bg-white/40 dark:bg-slate-800/40 rounded-full flex items-center justify-center mb-6 shadow-sm backdrop-blur-sm">
                <User size={64} className="text-slate-300/80 dark:text-slate-600" />
             </div>
            <p className="font-hand text-xl opacity-70">{t.students.selectPrompt}</p>
          </div>
        )}
      </div>

      {/* --- MODALS (Kept functional but with updated styling) --- */}

      {/* Create/Edit Student Modal */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 dark:bg-slate-900/95 rounded-3xl max-w-2xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto border border-white dark:border-slate-800">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-sans">
                {editingStudent ? t.students.editStudent : t.students.newStudent}
              </h3>
              <button onClick={() => setIsStudentModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"><X className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            
            <form onSubmit={handleSaveStudent} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t.students.forms.firstName}</label>
                    <input required name="firstName" defaultValue={editingStudent?.firstName} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-full focus:ring-2 focus:ring-purple-400 dark:focus:ring-purple-600 outline-none transition-shadow text-slate-800 dark:text-slate-200" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t.students.forms.lastName}</label>
                    <input required name="lastName" defaultValue={editingStudent?.lastName} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-full focus:ring-2 focus:ring-purple-400 dark:focus:ring-purple-600 outline-none transition-shadow text-slate-800 dark:text-slate-200" />
                </div>
              </div>
              
              <div>
                 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t.students.forms.contact}</label>
                 <input name="contactInfo" defaultValue={editingStudent?.contactInfo} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-full focus:ring-2 focus:ring-purple-400 dark:focus:ring-purple-600 outline-none transition-shadow text-slate-800 dark:text-slate-200" />
              </div>

              {/* Enhanced Class Selection */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 ml-1">{t.students.forms.group}</label>
                <div className="grid grid-cols-2 gap-3">
                   {classes.length === 0 && <p className="text-xs text-slate-400 italic">Crea clases primero en el apartado 'Gelak'</p>}
                   {classes.map(cls => {
                     const isSelected = formSelectedGroups.includes(cls.id!);
                     return (
                        <div 
                           key={cls.id}
                           onClick={() => cls.id && toggleGroupSelection(cls.id)}
                           className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between
                             ${isSelected 
                                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-600 shadow-sm' 
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-800'}
                           `}
                        >
                           <div className="flex items-center space-x-3">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                                ${isSelected ? 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}
                             `}>
                               {cls.name.substring(0,2)}
                             </div>
                             <div className="text-sm">
                               <p className={`font-bold ${isSelected ? 'text-purple-900 dark:text-purple-300' : 'text-slate-700 dark:text-slate-300'}`}>{cls.name}</p>
                               <p className="text-xs text-slate-500 dark:text-slate-400">{cls.subject}</p>
                             </div>
                           </div>
                           {isSelected && <Check size={16} className="text-purple-600 dark:text-purple-400" />}
                        </div>
                     );
                   })}
                </div>
              </div>

              {/* Enhanced Special Needs Selection */}
              <div>
                 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 ml-1">{t.students.forms.tags}</label>
                 <div className="flex flex-wrap gap-2 mb-3">
                    {COMMON_NEEDS.map(need => {
                        const isSelected = formSpecialNeeds.includes(need.label);
                        return (
                          <button
                            type="button"
                            key={need.key}
                            onClick={() => toggleSpecialNeed(need.label)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border
                               ${isSelected 
                                 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 shadow-sm transform scale-105' 
                                 : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-200'}
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
                        <span key={tag} className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center shadow-sm">
                           {tag}
                           <button type="button" onClick={() => toggleSpecialNeed(tag)} className="ml-2 hover:text-amber-900 dark:hover:text-amber-100"><X size={12}/></button>
                        </span>
                    ))}
                 </div>

                 {/* Custom Input */}
                 <div className="flex gap-2">
                    <input 
                      value={customNeedInput}
                      onChange={(e) => setCustomNeedInput(e.target.value)}
                      placeholder={t.students.forms.addTag}
                      className="flex-1 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-800 outline-none text-slate-800 dark:text-slate-200"
                      onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addCustomNeed(); }}}
                    />
                    <button type="button" onClick={addCustomNeed} className="px-5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm hover:bg-slate-300 dark:hover:bg-slate-600 font-bold">
                        +
                    </button>
                 </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <button type="submit" className="w-full bg-slate-800 dark:bg-slate-700 text-white py-4 rounded-2xl font-bold hover:bg-slate-700 dark:hover:bg-slate-600 shadow-xl shadow-slate-200 dark:shadow-none transition-all transform hover:-translate-y-1">
                   {editingStudent ? t.students.forms.updateStudent : t.students.forms.saveStudent}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Intervention Modal */}
      {isAddInterventionOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 dark:bg-slate-900/95 rounded-3xl max-w-md w-full p-8 shadow-2xl border border-white dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.students.addIntervention}</h3>
              <button onClick={() => setIsAddInterventionOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleAddIntervention} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t.students.forms.type}</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Conducta', 'Académico', 'Familia', 'Positivo'].map(type => (
                    <label key={type} className="cursor-pointer">
                      <input type="radio" name="type" value={type} className="peer sr-only" required defaultChecked={type === 'Conducta'} />
                      <div className="text-center py-2 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 peer-checked:bg-purple-100 dark:peer-checked:bg-purple-900/30 peer-checked:text-purple-700 dark:peer-checked:text-purple-300 peer-checked:border-purple-300 dark:peer-checked:border-purple-700 transition-all">
                        {t.students.types[type as InterventionType]}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t.students.forms.description}</label>
                <textarea required name="description" rows={4} className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-700 outline-none resize-none text-slate-800 dark:text-slate-200" placeholder={t.students.forms.descPlaceholder} />
              </div>
              <button type="submit" className="w-full bg-slate-800 dark:bg-slate-700 text-white py-3 rounded-xl font-bold hover:bg-slate-700 dark:hover:bg-slate-600 shadow-lg transition-transform hover:-translate-y-1">{t.students.forms.saveRecord}</button>
            </form>
          </div>
        </div>
      )}

      {/* Add Follow Up Modal */}
      {isAddFollowUpOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 dark:bg-slate-900/95 rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-white dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.students.addFollowUp}</h3>
              <button onClick={() => setIsAddFollowUpOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleAddFollowUp} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t.students.forms.followUpTitle}</label>
                <input required name="title" className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700 outline-none text-slate-800 dark:text-slate-200" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t.students.forms.followUpContent}</label>
                <textarea 
                   required 
                   name="content" 
                   rows={8} 
                   className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700 outline-none resize-none text-slate-800 dark:text-slate-200" 
                   placeholder={t.students.forms.followUpContent} 
                />
              </div>
              <button type="submit" className="w-full bg-slate-800 dark:bg-slate-700 text-white py-3 rounded-xl font-bold hover:bg-slate-700 dark:hover:bg-slate-600 shadow-lg transition-transform hover:-translate-y-1">
                 {t.students.forms.saveRecord}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create/Edit Grade Modal */}
      {isGradeModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 dark:bg-slate-900/95 rounded-3xl max-w-md w-full p-8 shadow-2xl border border-white dark:border-slate-800">
             <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                 {editingGrade ? t.students.editGrade : t.students.addGrade}
              </h3>
              <button onClick={() => setIsGradeModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleSaveGrade} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">Clase</label>
                <select 
                  name="classGroupId" 
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-700 outline-none text-slate-800 dark:text-slate-200" 
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
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t.students.forms.examTitle}</label>
                  <input required name="title" defaultValue={editingGrade?.title} className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-700 outline-none text-slate-800 dark:text-slate-200" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t.students.forms.gradeValue}</label>
                   <input required type="number" step="0.1" min="0" max="10" name="grade" defaultValue={editingGrade?.grade} className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-700 outline-none text-slate-800 dark:text-slate-200" />
                </div>
                <div>
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t.students.forms.gradeType}</label>
                   <select name="type" defaultValue={editingGrade?.type || 'exam'} className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-700 outline-none text-slate-800 dark:text-slate-200">
                      <option value="exam">Examen</option>
                      <option value="work">Trabajo/Deberes</option>
                      <option value="final">Evaluación Final</option>
                   </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-slate-800 dark:bg-slate-700 text-white py-3 rounded-xl font-bold hover:bg-slate-700 dark:hover:bg-slate-600 shadow-lg transition-transform hover:-translate-y-1">{t.students.forms.saveRecord}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
