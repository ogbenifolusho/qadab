import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Loader2, Save, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_SETTINGS = {
  site_name: 'Qada.Bet',
  tagline: 'Social Impact through Predictions',
  logo_url: '',
  default_pledge_amount: 100,
  contact_email: 'hello@qada.bet',
  contact_phone: '+234 909 999 6424',
  address: 'Asokoro, Abuja, FCT, Nigeria',
  twitter_url: 'https://twitter.com/QadaBet',
  instagram_url: 'https://instagram.com/QadaBet',
  facebook_url: 'https://facebook.com/QadaBet',
  maintenance_mode: false,
};

export default function AdminSettings() {
  const qc = useQueryClient();
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [settingsId, setSettingsId] = useState(null);

  const { data: settingsList = [], isLoading } = useQuery({
    queryKey: ['admin-site-settings'],
    queryFn: () => base44.entities.SiteSettings.list(),
  });

  useEffect(() => {
    if (settingsList.length > 0) {
      const s = settingsList[0];
      setSettingsId(s.id);
      setForm({ ...DEFAULT_SETTINGS, ...s });
    }
  }, [settingsList]);

  const save = useMutation({
    mutationFn: (data) => settingsId
      ? base44.entities.SiteSettings.update(settingsId, data)
      : base44.entities.SiteSettings.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-site-settings'] });
      toast.success('Settings saved successfully!');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    save.mutate({ ...form, default_pledge_amount: Number(form.default_pledge_amount) });
  };

  const Field = ({ label, name, type = 'text', placeholder }) => (
    <div>
      <Label className="text-slate-300 text-xs mb-1 block">{label}</Label>
      <Input
        type={type}
        value={form[name] || ''}
        onChange={e => setForm(f => ({ ...f, [name]: type === 'number' ? e.target.value : e.target.value }))}
        placeholder={placeholder}
        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
      />
    </div>
  );

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-yellow-400" /></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Site Settings</h1>
        <p className="text-slate-500 text-sm">Configure platform-wide settings</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Branding */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-yellow-400 uppercase tracking-wider">Branding</h2>
          <Field label="Site Name" name="site_name" placeholder="Qada.Bet" />
          <Field label="Tagline" name="tagline" placeholder="Social Impact through Predictions" />
          <Field label="Logo URL" name="logo_url" placeholder="https://yourdomain.com/logo.png" />
        </div>

        {/* Platform Config */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-yellow-400 uppercase tracking-wider">Platform Config</h2>
          <Field label="Default Pledge Amount (₦)" name="default_pledge_amount" type="number" placeholder="100" />
          <div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-white">Maintenance Mode</p>
              <p className="text-xs text-slate-500">Temporarily disable public access</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, maintenance_mode: !f.maintenance_mode }))}
              className={`w-12 h-6 rounded-full transition-all relative ${form.maintenance_mode ? 'bg-red-500' : 'bg-slate-600'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.maintenance_mode ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-yellow-400 uppercase tracking-wider">Contact Info</h2>
          <Field label="Email" name="contact_email" placeholder="hello@qada.bet" />
          <Field label="Phone" name="contact_phone" placeholder="+234 909 999 6424" />
          <Field label="Address" name="address" placeholder="Asokoro, Abuja, FCT, Nigeria" />
        </div>

        {/* Socials */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-yellow-400 uppercase tracking-wider">Social Media</h2>
          <Field label="Twitter / X URL" name="twitter_url" placeholder="https://twitter.com/QadaBet" />
          <Field label="Instagram URL" name="instagram_url" placeholder="https://instagram.com/QadaBet" />
          <Field label="Facebook URL" name="facebook_url" placeholder="https://facebook.com/QadaBet" />
        </div>

        <Button
          type="submit"
          disabled={save.isPending}
          className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold py-5 text-base gap-2"
        >
          {save.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {save.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </form>
    </div>
  );
}