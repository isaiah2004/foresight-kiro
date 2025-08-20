"use client";
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface CategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
}

export function CategoryModal({ open, onOpenChange, onCreated }: CategoryModalProps) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [type, setType] = useState<'recurring' | 'one-time'>('one-time');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/expense-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, emoji, type }),
      });
      if (!res.ok) throw new Error('Failed to create category');
      const data = await res.json();
      onCreated?.(data.id);
      onOpenChange(false);
      setName('');
      setEmoji('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>Create a custom category for your expenses.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 items-center">
            <Label>Name</Label>
            <div className="col-span-2">
              <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="e.g., Student Loan" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 items-center">
            <Label>Emoji</Label>
            <div className="col-span-2">
              <Input value={emoji} onChange={(e)=>setEmoji(e.target.value)} placeholder="e.g., 🎓" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 items-center">
            <Label>Type</Label>
            <div className="col-span-2 flex gap-2">
              <Button type="button" variant={type==='one-time'?'default':'outline'} onClick={()=>setType('one-time')}>One-time</Button>
              <Button type="button" variant={type==='recurring'?'default':'outline'} onClick={()=>setType('recurring')}>Recurring</Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={()=>onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button type="button" onClick={handleCreate} disabled={loading || !name || !emoji}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
