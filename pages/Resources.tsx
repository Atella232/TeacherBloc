import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Resource } from '../types';
import { ExternalLink, Copy, Search, Tag, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Resources: React.FC = () => {
  const { t } = useLanguage();
  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Mock adding - skipping full form for brevity, usually similar to Student form
  const [isAdding, setIsAdding] = useState(false);

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    await api.addItem<Resource>('resources', {
      title: formData.get('title') as string,
      url: formData.get('url') as string,
      category: formData.get('category') as string,
      tags: (formData.get('tags') as string).split(',').map(t => t.trim()),
      isFavorite: false
    });
    setIsAdding(false);
    loadResources();
  };

  const filtered = resources.filter(r => 
    r.title.toLowerCase().includes(search.toLowerCase()) || 
    r.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">{t.resources.title}</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            <input 
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
              placeholder={t.resources.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium"
          >
            {t.resources.add}
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1">
            <input required name="title" placeholder={t.resources.forms.title} className="w-full p-2 border rounded text-sm" />
          </div>
          <div className="md:col-span-1">
            <input required name="url" placeholder={t.resources.forms.url} className="w-full p-2 border rounded text-sm" />
          </div>
          <div className="md:col-span-1">
            <input name="tags" placeholder={t.resources.forms.tags} className="w-full p-2 border rounded text-sm" />
          </div>
           <div className="md:col-span-1">
            <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded text-sm hover:bg-slate-700">{t.resources.forms.save}</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-600 text-sm">{t.resources.table.resource}</th>
              <th className="p-4 font-semibold text-slate-600 text-sm hidden md:table-cell">{t.resources.table.tags}</th>
              <th className="p-4 font-semibold text-slate-600 text-sm w-20">{t.resources.table.action}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(res => (
              <tr key={res.id} className="hover:bg-slate-50 transition">
                <td className="p-4">
                  <div className="font-medium text-slate-800">{res.title}</div>
                  <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline truncate block max-w-xs flex items-center mt-1">
                    {res.url} <ExternalLink size={10} className="ml-1" />
                  </a>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <div className="flex gap-1 flex-wrap">
                    {res.tags.map((t, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                        <Tag size={10} className="mr-1 opacity-50" /> {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4">
                  <button 
                    onClick={() => res.url && handleCopy(res.url, res.id || '')}
                    className="p-2 text-slate-400 hover:bg-slate-100 rounded transition"
                    title="Copiar Enlace"
                  >
                    {copiedId === res.id ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            {t.resources.noResources}
          </div>
        )}
      </div>
    </div>
  );
};