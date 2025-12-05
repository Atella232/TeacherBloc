
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Intervention, QuickNote, Student } from '../types';
import { AlertCircle, CheckCircle2, StickyNote, Users, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const StatCard = ({ icon: Icon, label, value, gradient, delay }: any) => (
  <div className={`glass-panel p-6 rounded-3xl border-none shadow-sm flex items-center space-x-5 transition-transform hover:-translate-y-1 hover:shadow-lg duration-300 animate-in fade-in slide-in-from-bottom-4 dark:shadow-black/20`} style={{animationDelay: delay}}>
    <div className={`p-4 rounded-2xl shadow-inner text-white bg-${gradient} dark:opacity-90`}>
      <Icon className="w-7 h-7 drop-shadow-sm" />
    </div>
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 font-sans">{value}</p>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({ students: 0, pending: 0, notes: 0 });
  const [recentPending, setRecentPending] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting("Egun on");
    else if (hours < 18) setGreeting("Arratsalde on");
    else setGreeting("Gabon");

    const loadData = async () => {
      try {
        const [students, interventions, notes] = await Promise.all([
          api.getItems<Student>('students'),
          api.getItems<Intervention>('interventions'),
          api.getItems<QuickNote>('quick_notes')
        ]);

        const pending = interventions.filter(i => i.status === 'pendiente');
        
        setStats({
          students: students.length,
          pending: pending.length,
          notes: notes.filter(n => !n.isArchived).length
        });
        
        setRecentPending(pending.sort((a, b) => b.date - a.date).slice(0, 5));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return (
     <div className="flex h-full items-center justify-center">
       <div className="animate-bounce p-4 bg-white/50 dark:bg-slate-800/50 rounded-full shadow-lg">
          <Sparkles className="text-purple-400 w-8 h-8 animate-spin-slow" />
       </div>
     </div>
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="relative">
        <h2 className="text-4xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight mb-2 flex items-center">
          {t.dashboard.hello} <span className="text-3xl ml-2 animate-wave">👋</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg font-hand">{t.dashboard.summary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={Users} label={t.dashboard.stats.students} value={stats.students} gradient="watercolor-blue" delay="0ms" />
        <StatCard icon={AlertCircle} label={t.dashboard.stats.pending} value={stats.pending} gradient="watercolor-peach" delay="100ms" />
        <StatCard icon={StickyNote} label={t.dashboard.stats.notes} value={stats.notes} gradient="watercolor-green" delay="200ms" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Interventions */}
        <div className="glass-panel rounded-3xl flex flex-col overflow-hidden relative group">
           {/* Decorative corner */}
           <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-100 to-white dark:from-orange-900/30 dark:to-slate-800 rounded-bl-full opacity-50 transition-opacity group-hover:opacity-80"></div>

          <div className="p-6 border-b border-slate-100/50 dark:border-slate-700/50 flex justify-between items-center bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center">
               <AlertCircle size={18} className="mr-2 text-orange-400" />
               {t.dashboard.pendingTitle}
            </h3>
            <Link to="/students" className="text-slate-500 dark:text-slate-300 text-sm hover:text-purple-600 dark:hover:text-purple-300 font-medium flex items-center transition-colors bg-white/50 dark:bg-slate-700/50 px-3 py-1 rounded-full">
              {t.dashboard.viewStudents} <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
          <div className="p-6 flex-1 min-h-[300px]">
            {recentPending.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3 animate-pulse">
                  <CheckCircle2 size={32} className="text-green-500 dark:text-green-400" />
                </div>
                <p className="font-hand text-xl text-slate-500 dark:text-slate-400">{t.dashboard.allClear}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPending.map(item => (
                  <div key={item.id} className="flex items-start p-4 bg-white/60 dark:bg-slate-700/40 hover:bg-white/90 dark:hover:bg-slate-700/80 rounded-2xl border border-white/50 dark:border-slate-600/30 shadow-sm transition-all hover:scale-[1.02] cursor-default group">
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-700 dark:text-slate-200">{item.studentName}</span>
                        <span className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-bold
                           ${item.type === 'Conducta' ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300' : 
                             item.type === 'Positivo' ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300'}
                        `}>
                          {t.students.types[item.type] || item.type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 font-body leading-relaxed">{item.description}</p>
                      <p className="text-xs text-slate-400 mt-2 font-mono opacity-60 flex items-center">
                        <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-500 rounded-full mr-2"></span>
                        {new Date(item.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Shortcuts */}
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl p-8 shadow-xl shadow-purple-100/50 dark:shadow-black/40">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-watercolor-blue opacity-90 dark:opacity-60 z-0"></div>
             {/* Dark mode boost background for contrast */}
            <div className="absolute inset-0 bg-slate-900/20 dark:block hidden z-0"></div>

            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
            <div className="absolute top-10 right-10 w-20 h-20 bg-purple-400/20 rounded-full blur-xl"></div>

            <div className="relative z-10 text-white">
              <h3 className="text-2xl font-bold mb-2">{t.dashboard.quickActions.title}</h3>
              <p className="text-blue-50 mb-8 font-medium font-body opacity-90">{t.dashboard.quickActions.desc}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <Link to="/students" className="group bg-white/20 hover:bg-white/30 p-5 rounded-2xl text-center transition-all backdrop-blur-md border border-white/20 hover:border-white/40">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                     <AlertCircle size={20} className="text-white" />
                  </div>
                  <span className="block font-bold text-sm tracking-wide">{t.dashboard.quickActions.newIntervention}</span>
                </Link>
                <Link to="/notes" className="group bg-white/20 hover:bg-white/30 p-5 rounded-2xl text-center transition-all backdrop-blur-md border border-white/20 hover:border-white/40">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                     <StickyNote size={20} className="text-white" />
                  </div>
                  <span className="block font-bold text-sm tracking-wide">{t.dashboard.quickActions.createNote}</span>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="glass-panel p-6 rounded-3xl flex items-center justify-between">
              <div>
                 <p className="font-hand text-xl text-slate-600 dark:text-slate-300 mb-1">"Teaching is the one profession that creates all other professions."</p>
                 <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">— Unknown</p>
              </div>
              <Sparkles className="text-yellow-400 opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
};
