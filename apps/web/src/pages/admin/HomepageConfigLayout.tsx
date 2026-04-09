import { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';
import { toast } from 'sonner';
import {
  GripVertical, Eye, EyeOff, Loader2, Save, ChevronDown, ChevronRight,
} from 'lucide-react';

interface HomepageSection {
  id: string;
  key: string;
  label: string;
  enabled: boolean;
  order: number;
  config: any;
}

export function HomepageConfigLayout() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchApi('/admin/homepage/sections')
      .then((data) => {
        setSections(data.sections || []);
        const configs: Record<string, any> = {};
        for (const s of data.sections || []) {
          configs[s.key] = s.config || {};
        }
        setEditingConfig(configs);
      })
      .catch(() => toast.error('Failed to load homepage config'))
      .finally(() => setLoading(false));
  }, []);

  const toggleEnabled = async (key: string) => {
    const section = sections.find(s => s.key === key);
    if (!section) return;
    const newEnabled = !section.enabled;
    try {
      await fetchApi(`/admin/homepage/sections/${key}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: newEnabled }),
      });
      setSections(prev => prev.map(s => s.key === key ? { ...s, enabled: newEnabled } : s));
      toast.success(`${section.label} ${newEnabled ? 'enabled' : 'disabled'}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update');
    }
  };

  const moveSection = async (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newSections.length) return;
    [newSections[index], newSections[swapIdx]] = [newSections[swapIdx], newSections[index]];
    setSections(newSections);

    try {
      await fetchApi('/admin/homepage/sections/reorder', {
        method: 'POST',
        body: JSON.stringify({ keys: newSections.map(s => s.key) }),
      });
    } catch {
      toast.error('Failed to reorder');
    }
  };

  const saveConfig = async (key: string) => {
    setSaving(true);
    try {
      await fetchApi(`/admin/homepage/sections/${key}`, {
        method: 'PATCH',
        body: JSON.stringify({ config: editingConfig[key] }),
      });
      toast.success('Section config saved');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2B1B]">Homepage Configuration</h1>
          <p className="text-sm text-[#5A6E5A] mt-1">Manage homepage sections and their display order</p>
        </div>
        <div className="bg-white rounded-xl border border-[#2E7D32]/10 p-6 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-[#2E7D32]/5 rounded-lg mb-2" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1B2B1B]">Homepage Configuration</h1>
        <p className="text-sm text-[#5A6E5A] mt-1">Toggle, reorder, and configure homepage sections</p>
      </div>

      <div className="bg-white rounded-xl border border-[#2E7D32]/10 divide-y divide-[#2E7D32]/10">
        {sections.map((section, idx) => (
          <div key={section.key}>
            {/* Section row */}
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Drag handle (visual) */}
              <GripVertical size={16} className="text-[#5A6E5A]/40 flex-shrink-0" />

              {/* Move buttons */}
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button
                  onClick={() => moveSection(idx, 'up')}
                  disabled={idx === 0}
                  className="text-[#5A6E5A] hover:text-[#2E7D32] disabled:opacity-20 text-xs leading-none"
                  title="Move up"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveSection(idx, 'down')}
                  disabled={idx === sections.length - 1}
                  className="text-[#5A6E5A] hover:text-[#2E7D32] disabled:opacity-20 text-xs leading-none"
                  title="Move down"
                >
                  ▼
                </button>
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${section.enabled ? 'text-[#1B2B1B]' : 'text-[#5A6E5A]/50'}`}>
                  {section.label}
                </p>
                <p className="text-xs text-[#5A6E5A]/60">{section.key}</p>
              </div>

              {/* Toggle */}
              <button
                onClick={() => toggleEnabled(section.key)}
                className={`p-1.5 rounded-lg transition-colors ${
                  section.enabled ? 'text-[#2E7D32] hover:bg-[#2E7D32]/10' : 'text-[#5A6E5A]/40 hover:bg-gray-100'
                }`}
                title={section.enabled ? 'Disable' : 'Enable'}
              >
                {section.enabled ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>

              {/* Expand config */}
              <button
                onClick={() => setExpandedKey(expandedKey === section.key ? null : section.key)}
                className="p-1.5 rounded-lg text-[#5A6E5A] hover:bg-[#2E7D32]/5 transition-colors"
                title="Configure"
              >
                {expandedKey === section.key ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
            </div>

            {/* Expanded config editor */}
            {expandedKey === section.key && (
              <div className="px-6 pb-4 bg-[#FAFAF5]">
                <div className="space-y-3 pt-2">
                  {section.key === 'hero' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-[#1B2B1B] mb-1">Hero Title</label>
                        <input
                          type="text"
                          value={editingConfig[section.key]?.title ?? ''}
                          onChange={e => setEditingConfig(prev => ({
                            ...prev,
                            [section.key]: { ...prev[section.key], title: e.target.value }
                          }))}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-[#2E7D32]/20 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#1B2B1B] mb-1">Subtitle</label>
                        <input
                          type="text"
                          value={editingConfig[section.key]?.subtitle ?? ''}
                          onChange={e => setEditingConfig(prev => ({
                            ...prev,
                            [section.key]: { ...prev[section.key], subtitle: e.target.value }
                          }))}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-[#2E7D32]/20 bg-white"
                        />
                      </div>
                    </>
                  )}

                  {section.key !== 'hero' && (
                    <div>
                      <label className="block text-xs font-medium text-[#1B2B1B] mb-1">Section Config (JSON)</label>
                      <textarea
                        value={JSON.stringify(editingConfig[section.key] || {}, null, 2)}
                        onChange={e => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            setEditingConfig(prev => ({ ...prev, [section.key]: parsed }));
                          } catch { /* invalid JSON, ignore */ }
                        }}
                        rows={4}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-[#2E7D32]/20 bg-white font-mono"
                      />
                    </div>
                  )}

                  <button
                    onClick={() => saveConfig(section.key)}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#2E7D32] text-white hover:bg-[#2E7D32]/90 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Config
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
