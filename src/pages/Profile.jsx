import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Camera, Save, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', bio: '' });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setForm({ full_name: u.full_name || '', phone: u.phone || '', bio: u.bio || '' });
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe(form);
    const updated = await base44.auth.me();
    setUser(updated);
    setSaving(false);
    setEditing(false);
    toast.success('Profile updated!');
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.auth.updateMe({ avatar_url: file_url });
    const updated = await base44.auth.me();
    setUser(updated);
    setUploadingAvatar(false);
    toast.success('Profile picture updated!');
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const initials = user.full_name?.split(' ').map(w => w[0]).join('').toUpperCase() || '?';

  return (
    <div className="pb-16">
      <section className="py-10 sm:py-14 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
            <div className="relative mb-4">
              <Avatar className="w-24 h-24 ring-4 ring-secondary">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl font-extrabold">{initials}</AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-secondary rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-secondary/90 transition-colors">
                {uploadingAvatar ? <Loader2 className="w-4 h-4 text-primary animate-spin" /> : <Camera className="w-4 h-4 text-primary" />}
                <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
            </div>
            <h1 className="text-2xl font-extrabold">{user.full_name}</h1>
            <p className="text-primary-foreground/70 text-sm mt-1">{user.email}</p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-lg mx-auto px-4 mt-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold">Profile Information</h2>
            {!editing && (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit Profile</Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <Label className="mb-1 block">Full Name</Label>
                <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div>
                <Label className="mb-1 block">Phone Number</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+234..." />
              </div>
              <div>
                <Label className="mb-1 block">Bio</Label>
                <Input value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell us about yourself" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
                <Button className="flex-1 gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Row label="Full Name" value={user.full_name} />
              <Row label="Email" value={user.email} />
              <Row label="Phone" value={user.phone || '—'} />
              <Row label="Bio" value={user.bio || '—'} />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm py-2 border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}