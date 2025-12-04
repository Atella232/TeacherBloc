import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
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
  BookOpen
} from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label, onClick }: any) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
          isActive 
            ? 'bg-indigo-50 text-indigo-700 font-medium' 
            : 'text-slate-600 hover:bg-slate-100'
        }`
      }
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  );
};

export const Layout: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { t, language, toggleLanguage } = useLanguage();
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
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">TeacherMate</h1>
              <p className="text-xs text-slate-500 font-mono">{t.sidebar.devMode}</p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <SidebarItem to="/" icon={LayoutDashboard} label={t.sidebar.dashboard} onClick={() => setIsMobileOpen(false)} />
            <SidebarItem to="/calendar" icon={CalendarDays} label={t.sidebar.calendar} onClick={() => setIsMobileOpen(false)} />
            <SidebarItem to="/classes" icon={BookOpen} label={t.sidebar.classes} onClick={() => setIsMobileOpen(false)} />
            <SidebarItem to="/students" icon={Users} label={t.sidebar.students} onClick={() => setIsMobileOpen(false)} />
            <SidebarItem to="/notes" icon={StickyNote} label={t.sidebar.notes} onClick={() => setIsMobileOpen(false)} />
            <SidebarItem to="/resources" icon={Library} label={t.sidebar.resources} onClick={() => setIsMobileOpen(false)} />
            <SidebarItem to="/settings" icon={Settings} label={t.sidebar.settings} onClick={() => setIsMobileOpen(false)} />
          </nav>

          <div className="p-4 border-t border-slate-100 space-y-4">
            {/* Language Toggle */}
            <button 
              onClick={toggleLanguage}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700"
            >
              <div className="flex items-center">
                <Languages size={16} className="mr-2 text-slate-500" />
                <span>Hizkuntza / Idioma</span>
              </div>
              <div className="flex space-x-1 text-xs">
                <span className={`${language === 'eu' ? 'font-bold text-indigo-600' : 'text-slate-400'}`}>EU</span>
                <span className="text-slate-300">|</span>
                <span className={`${language === 'es' ? 'font-bold text-indigo-600' : 'text-slate-400'}`}>ES</span>
              </div>
            </button>

            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-xs text-slate-500">{t.sidebar.session}</p>
              <p className="text-sm font-semibold text-slate-700 truncate">profe_master_dev</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header (Mobile Only mostly) */}
        <header className="bg-white border-b border-slate-200 lg:hidden px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-md"
          >
            <Menu size={24} />
          </button>
          <span className="font-semibold text-slate-800">{getTitle()}</span>
          <div className="w-10" /> {/* Spacer */}
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
