import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getApiStatus } from '../services/api';
import { Save, Trash2, Cloud, Database } from 'lucide-react';

const CONFIG_KEY = "teacher_mate_firebase_config";

export const Settings: React.FC = () => {
  const { t } = useLanguage();
  const [status, setStatus] = useState(getApiStatus());
  const [config, setConfig] = useState({
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  });

  useEffect(() => {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      setConfig(JSON.parse(stored));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    window.location.reload(); // Hard reload to re-init firebase
  };

  const handleClear = () => {
    localStorage.removeItem(CONFIG_KEY);
    window.location.reload();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">{t.settings.title}</h2>
        <p className="text-slate-500">{t.settings.subtitle}</p>
      </div>

      <div className={`p-4 rounded-xl border flex items-center space-x-4 
        ${status === 'connected' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
        <div className={`p-2 rounded-full ${status === 'connected' ? 'bg-green-100' : 'bg-amber-100'}`}>
          {status === 'connected' ? <Cloud size={24} /> : <Database size={24} />}
        </div>
        <div>
          <p className="text-xs uppercase font-bold tracking-wider opacity-70">{t.settings.status.label}</p>
          <p className="font-semibold">{status === 'connected' ? t.settings.status.connected : t.settings.status.mock}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">{t.settings.form.apiKey}</label>
            <input 
              name="apiKey" 
              value={config.apiKey} 
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">{t.settings.form.projectId}</label>
            <input 
              name="projectId" 
              value={config.projectId} 
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">{t.settings.form.authDomain}</label>
            <input 
              name="authDomain" 
              value={config.authDomain} 
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
            />
          </div>
           <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Storage Bucket</label>
            <input 
              name="storageBucket" 
              value={config.storageBucket} 
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
            />
          </div>
           <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Messaging Sender ID</label>
            <input 
              name="messagingSenderId" 
              value={config.messagingSenderId} 
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
            />
          </div>
           <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">App ID</label>
            <input 
              name="appId" 
              value={config.appId} 
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400 italic">
            {t.settings.warning}
          </p>
          <div className="flex gap-4 w-full md:w-auto">
            {status === 'connected' && (
              <button 
                onClick={handleClear}
                className="flex-1 md:flex-none px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center"
              >
                <Trash2 size={18} className="mr-2" /> {t.settings.form.clear}
              </button>
            )}
            <button 
              onClick={handleSave}
              className="flex-1 md:flex-none px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center shadow-lg shadow-indigo-200"
            >
              <Save size={18} className="mr-2" /> {t.settings.form.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};