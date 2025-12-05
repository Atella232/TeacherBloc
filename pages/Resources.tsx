
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Resource } from '../types';
import { ExternalLink, Copy, Search, Tag, Check, Plus, Trash2, Edit2, X, AlertTriangle, Save } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Resources: React.FC = () => {
  const { t, language } = useLanguage();
  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  
  // Delete Confirmation State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{isOpen: boolean, resourceId: string | null}>({
    isOpen: false,
    resourceId: null
  });

  const loadResources = async () => {
    const data = await api.getItems<Resource>('resources');
    setResources(data);
  };

  useEffect(() => {
    loadResources();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openModal = (resource?: Resource) => {
    setEditingResource(resource || null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const resourceData: any = {
      title: formData.get('title') as string,
      url: formData.get('url') as string,
      category: formData.get('category') as string,
      tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean),
      isFavorite: false
    };

    if (editingResource && editingResource.id) {
        await api.updateItem('resources', editingResource.id, resourceData);
    } else {
        await api.addItem<Resource>('resources', resourceData);
    }
    
    setIsModalOpen(false);
    loadResources();
  };

  const requestDelete = (id: string) => {
    setDeleteConfirmation({ isOpen: true, resourceId: id });
  };

  const confirmDelete = async () => {
    if (deleteConfirmation.resourceId) {
        await api.deleteItem('resources', deleteConfirmation.resourceId);
        setDeleteConfirmation({ isOpen: false, resourceId: null });
        loadResources();
    }
  };

  const filtered = resources.filter(r => 
    r.title.toLowerCase().includes(search.toLowerCase()) || 
    (r.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">{t.resources.title}</h2>
            <p className="text-slate-500 dark:text-slate-400 font-hand text-lg mt-1">
                {language === 'eu' ? 'Antolatu zure material didaktikoa.' : 'Organiza tu material didáctico.'}
            </p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            <input 
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none shadow-sm transition-all text-slate-800 dark:text-slate-200" 
              placeholder={t.resources.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => openModal()}
            className="bg-slate-800 dark:bg-slate-700 text-white px-5 py-2.5 rounded-xl hover:bg-slate-700 dark:hover:bg-slate-600 font-bold shadow-lg shadow-slate-200 dark:shadow-none transition-transform hover:scale-105 flex items-center"
          >
            <Plus size={18} className="mr-2" />
            {t.resources.add}
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden border border-white dark:border-slate-700">
        <table className="w-full text-left">
          <thead className="bg-white/40 dark:bg-slate-800/40 border-b border-slate-100/50 dark:border-slate-700/50">
            <tr>
              <th className="p-5 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">{t.resources.table.resource}</th>
              <th className="p-5 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider hidden md:table-cell">{t.resources.table.tags}</th>
              <th className="p-5 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider w-32 text-right">{t.resources.table.action}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50 dark:divide-slate-700/50">
            {filtered.length === 0 && (
                <tr>
                    <td colSpan={3} className="p-10 text-center text-slate-400 dark:text-slate-500 font-hand text-lg">
                        {t.resources.noResources}
                    </td>
                </tr>
            )}
            {filtered.map(res => (
              <tr key={res.id} className="hover:bg-white/40 dark:hover:bg-slate-700/40 transition group">
                <td className="p-5">
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-lg font-sans">{res.title}</div>
                  <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline truncate block max-w-xs flex items-center mt-1 font-medium">
                    {res.url} <ExternalLink size={10} className="ml-1" />
                  </a>
                </td>
                <td className="p-5 hidden md:table-cell">
                  <div className="flex gap-2 flex-wrap">
                    {(res.tags || []).map((t, i) => (
                      <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700 shadow-sm">
                        <Tag size={10} className="mr-1.5 opacity-50 text-purple-400" /> {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-5 text-right">
                  <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => res.url && handleCopy(res.url, res.id || '')}
                        className="p-2 text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition"
                        title="Copiar Enlace"
                    >
                        {copiedId === res.id ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                    <button 
                        onClick={() => openModal(res)}
                        className="p-2 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition"
                        title="Editar"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button 
                        onClick={() => res.id && requestDelete(res.id)}
                        className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                        title="Borrar"
                    >
                        <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 dark:bg-slate-900/95 rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-white dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-sans">
                  {editingResource ? (language === 'eu' ? 'Baliabidea Editatu' : 'Editar Recurso') : t.resources.add}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"><X className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t.resources.forms.title}</label>
                <input required name="title" defaultValue={editingResource?.title} className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-300 outline-none transition-shadow text-slate-800 dark:text-slate-200" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t.resources.forms.url}</label>
                <input required name="url" defaultValue={editingResource?.url} className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-300 outline-none transition-shadow font-mono text-slate-800 dark:text-slate-200" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t.resources.forms.tags}</label>
                <input name="tags" defaultValue={editingResource?.tags.join(', ')} placeholder="pdf, mates, examen..." className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-300 outline-none transition-shadow text-slate-800 dark:text-slate-200" />
              </div>
              
              <div className="pt-4">
                  <button type="submit" className="w-full bg-slate-800 dark:bg-slate-700 text-white py-3 rounded-xl font-bold hover:bg-slate-700 dark:hover:bg-slate-600 shadow-lg transition-transform hover:-translate-y-1 flex items-center justify-center">
                    <Save size={18} className="mr-2" />
                    {t.resources.forms.save}
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-8 shadow-2xl border border-white dark:border-slate-800 animate-in zoom-in-95 duration-200">
             <div className="flex flex-col items-center text-center">
               <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse">
                 <AlertTriangle size={32} className="text-red-500" />
               </div>
               <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 font-sans">
                 {language === 'eu' ? 'Baliabidea ezabatu?' : '¿Eliminar recurso?'}
               </h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-body">
                 {language === 'eu' 
                   ? 'Ekintza hau ezin da desegin.' 
                   : 'Esta acción no se puede deshacer.'}
               </p>
               <div className="flex gap-4 w-full">
                 <button 
                   onClick={() => setDeleteConfirmation({ isOpen: false, resourceId: null })}
                   className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                 >
                   {language === 'eu' ? 'Utzi' : 'Cancelar'}
                 </button>
                 <button 
                   onClick={confirmDelete}
                   className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition shadow-lg shadow-red-200 dark:shadow-none"
                 >
                   {language === 'eu' ? 'Ezabatu' : 'Eliminar'}
                 </button>
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};
