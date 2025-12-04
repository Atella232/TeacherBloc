import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Intervention, QuickNote, Student } from '../types';
import { AlertCircle, CheckCircle2, StickyNote, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-4">
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({ students: 0, pending: 0, notes: 0 });
  const [recentPending, setRecentPending] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  if (loading) return <div className="p-10 text-center text-slate-400">...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">{t.dashboard.hello}</h2>
        <p className="text-slate-500">{t.dashboard.summary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={Users} label={t.dashboard.stats.students} value={stats.students} color="bg-blue-500" />
        <StatCard icon={AlertCircle} label={t.dashboard.stats.pending} value={stats.pending} color="bg-amber-500" />
        <StatCard icon={StickyNote} label={t.dashboard.stats.notes} value={stats.notes} color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Interventions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">{t.dashboard.pendingTitle}</h3>
            <Link to="/students" className="text-indigo-600 text-sm hover:underline flex items-center">
              {t.dashboard.viewStudents} <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
          <div className="p-6 flex-1">
            {recentPending.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
                <CheckCircle2 size={48} className="mb-2 text-green-100 text-green-500" />
                <p>{t.dashboard.allClear}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPending.map(item => (
                  <div key={item.id} className="flex items-start p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-amber-900">{item.studentName}</span>
                        <span className="text-xs text-amber-600 bg-amber-200 px-2 py-0.5 rounded-full">
                          {t.students.types[item.type] || item.type}
                        </span>
                      </div>
                      <p className="text-sm text-amber-800 mt-1 line-clamp-2">{item.description}</p>
                      <p className="text-xs text-amber-500 mt-2">
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
          <div className="bg-indigo-600 rounded-xl p-6 text-white shadow-lg shadow-indigo-200">
            <h3 className="text-xl font-bold mb-2">{t.dashboard.quickActions.title}</h3>
            <p className="text-indigo-100 mb-6">{t.dashboard.quickActions.desc}</p>
            
            <div className="grid grid-cols-2 gap-4">
              <Link to="/students" className="bg-white/10 hover:bg-white/20 p-4 rounded-lg text-center transition backdrop-blur-sm">
                <span className="block font-medium">{t.dashboard.quickActions.newIntervention}</span>
              </Link>
              <Link to="/notes" className="bg-white/10 hover:bg-white/20 p-4 rounded-lg text-center transition backdrop-blur-sm">
                <span className="block font-medium">{t.dashboard.quickActions.createNote}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};