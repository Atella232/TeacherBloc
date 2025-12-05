
import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  Users, 
  StickyNote, 
  Library, 
  Menu, 
  GraduationCap,
  Languages,
  Settings,
  CalendarDays,
  BookOpen,
  Sun,
  Moon
} from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label, onClick }: any) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${
          isActive 
            ? 'bg-gradient-to-r from-purple-100 to-blue-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-slate-800 dark:text-slate-100 font-bold shadow-sm scale-105' 
            : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:text-slate-700 dark:hover:text-slate-200 hover:pl-6'
        }`
      }
    >
      <Icon size={20} className="transition-transform group-hover:rotate-6" />
      <span className="font-medium">{label}</span>
    </NavLink>
  );
};

export const Layout: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const getTitle = () => {
    switch(location.pathname) {
      case '/': return t.sidebar.dashboard;
      case '/students': return t.sidebar.students;
      case '/classes': return t.sidebar.classes;
      case '/notes': return t.sidebar.notes;
      case '/resources': return t.sidebar.resources;
      case '/calendar': return t.sidebar.calendar;
      case '/settings': return t.sidebar.settings;
      default: return 'TeacherMate';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Glassmorphism */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-30 w-72 glass transform transition-transform duration-500 ease-out
          lg:m-4 lg:rounded-3xl border-none shadow-xl lg:shadow-slate-200/50 dark:lg:shadow-black/20
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-full flex flex-col p-2">
          <div className="p-6 mb-2 flex items-center space-x-3">
            <div className="w-12 h-12 bg-watercolor-blue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none rotate-3">
              <GraduationCap size={28} className="drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-500 dark:from-slate-200 dark:to-slate-400 font-sans tracking-tight">TeacherMate</h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-hand text-lg -mt-1">{t.sidebar.devMode}</p>
            </div>
          </div>

          <nav className="flex-1 px-3 space-y-2 overflow-y-auto custom-scrollbar">
            <SidebarItem to="/" icon={LayoutDashboard} label={t.sidebar.dashboard} onClick={() => setIsMobileOpen(false)} />
            <SidebarItem to="/calendar" icon={CalendarDays} label={t.sidebar.calendar} onClick={() => setIsMobileOpen(false)} />
            <SidebarItem to="/classes" icon={BookOpen} label={t.sidebar.classes} onClick={() => setIsMobileOpen(false)} />
            <SidebarItem to="/students" icon={Users} label={t.sidebar.students} onClick={() => setIsMobileOpen(false)} />
            <SidebarItem to="/notes" icon={StickyNote} label={t.sidebar.notes} onClick={() => setIsMobileOpen(false)} />
            <SidebarItem to="/resources" icon={Library} label={t.sidebar.resources} onClick={() => setIsMobileOpen(false)} />
            <SidebarItem to="/settings" icon={Settings} label={t.sidebar.settings} onClick={() => setIsMobileOpen(false)} />
          </nav>

          <div className="p-4 space-y-4">
             <div className="grid grid-cols-2 gap-3">
                {/* Language Toggle */}
                <button 
                onClick={toggleLanguage}
                className="flex items-center justify-center px-4 py-3 bg-white/60 dark:bg-slate-800/50 hover:bg-white/90 dark:hover:bg-slate-700 rounded-2xl transition-all shadow-sm text-sm font-medium text-slate-600 dark:text-slate-300"
                title="Change Language"
                >
                <Languages size={18} className="mr-2" />
                <span className="font-bold">{language.toUpperCase()}</span>
                </button>

                {/* Theme Toggle */}
                <button 
                onClick={toggleTheme}
                className="flex items-center justify-center px-4 py-3 bg-white/60 dark:bg-slate-800/50 hover:bg-white/90 dark:hover:bg-slate-700 rounded-2xl transition-all shadow-sm text-sm font-medium text-slate-600 dark:text-slate-300"
                title="Toggle Dark Mode"
                >
                {theme === 'light' ? <Moon size={18} className="mr-2 text-indigo-400" /> : <Sun size={18} className="mr-2 text-amber-400" />}
                <span className="font-bold">{theme === 'light' ? 'Dark' : 'Light'}</span>
                </button>
            </div>

            <div className="bg-white/40 dark:bg-slate-800/40 p-4 rounded-2xl border border-white/50 dark:border-white/10 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-hand text-lg">{t.sidebar.session}</p>
              <div className="mt-1 w-8 h-8 bg-gradient-to-tr from-pink-300 to-purple-300 rounded-full mx-auto shadow-sm border-2 border-white dark:border-slate-700"></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Decorative blobs - lowered opacity in dark mode */}
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-purple-200/30 dark:bg-purple-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 dark:opacity-20 animate-blob pointer-events-none"></div>
        <div className="absolute top-[-10%] left-[10%] w-96 h-96 bg-blue-200/30 dark:bg-blue-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 dark:opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[20%] w-96 h-96 bg-pink-200/30 dark:bg-indigo-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 dark:opacity-20 animate-blob animation-delay-4000 pointer-events-none"></div>

        {/* Header (Mobile Only mostly) */}
        <header className="lg:hidden px-6 py-4 flex items-center justify-between glass m-4 rounded-2xl z-10 dark:text-slate-200">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-700 rounded-xl transition"
          >
            <Menu size={24} />
          </button>
          <span className="font-bold text-slate-800 dark:text-slate-100 font-sans">{getTitle()}</span>
          <div className="w-10" /> 
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth z-10">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
