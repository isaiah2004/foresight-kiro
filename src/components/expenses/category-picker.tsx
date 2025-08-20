"use client";
import { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { ExpenseCategoryItem } from '@/types/financial';

interface CategoryPickerProps {
  value?: string; // categoryId
  onChange: (id: string) => void;
  onAddCategory: () => void;
}

export function CategoryPicker({ value, onChange, onAddCategory }: CategoryPickerProps) {
  const [tab, setTab] = useState<'recurring' | 'one-time'>('one-time');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ExpenseCategoryItem[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/user/expense-categories?type=${tab}`);
        const data = await res.json();
        if (mounted) setCategories(data);
      } catch (e) {
        console.error('Failed to load categories', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [tab]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(c => c.name.toLowerCase().includes(q));
  }, [categories, query]);

  return (
    <div className="space-y-3">
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="one-time">One-time</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
        </TabsList>
        <div className="flex gap-2 mt-3">
          <div className="relative flex-1">
            <Input
              placeholder="Search categories"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Button type="button" variant="outline" onClick={onAddCategory}>
            <Plus className="w-4 h-4 mr-2" /> Add
          </Button>
        </div>

        <TabsContent value="one-time">
          <CategoryGrid categories={filtered} value={value} onChange={onChange} loading={loading} />
        </TabsContent>
        <TabsContent value="recurring">
          <CategoryGrid categories={filtered} value={value} onChange={onChange} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CategoryGrid({ categories, value, onChange, loading }:{ categories: ExpenseCategoryItem[]; value?: string; onChange:(id:string)=>void; loading:boolean; }) {
  if (loading) {
    return <div className="grid grid-cols-3 gap-2">{Array.from({length:6}).map((_,i)=> (
      <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
    ))}</div>;
  }
  return (
    <div className="max-h-56 overflow-auto">
      <div className="grid grid-cols-3 gap-2">
        {categories.map((c) => {
          const selected = value === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.id)}
              className={`flex items-center gap-2 p-2 border rounded-md text-left hover:bg-accent ${selected ? 'border-primary ring-1 ring-primary' : 'border-input'}`}
            >
              <span className="text-lg" aria-hidden>{c.emoji}</span>
              <span className="truncate">{c.name}</span>
            </button>
          );
        })}
        {categories.length === 0 && (
          <div className="col-span-3 text-sm text-muted-foreground p-2">No categories found</div>
        )}
      </div>
    </div>
  );
}
