import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Shield, Bell, Mail, Smartphone, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    notify_email: true,
    notify_push: false,
    notify_predictions: true,
    notify_donations: true,
    two_fa_enabled: false,
  });

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setSettings(prev => ({
        ...prev,
        ...(u.settings || {}),
      }));
    });
  }, []);

  const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({ settings });
    setSaving(false);
    toast.success('Settings saved!');
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="pb-16">
      <section className="py-10 sm:py-14 bg-gradient-to-b from-background to-card">
        <div className="max-w-2xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-extrabold text-primary">Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your account preferences</p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-lg mx-auto px-4 mt-2 space-y-5">
        {/* Notifications */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold">Notifications</h2>
          </div>
          <div className="space-y-4">
            <SettingRow
              icon={Mail}
              label="Email Notifications"
              desc="Receive updates and receipts via email"
              checked={settings.notify_email}
              onToggle={() => toggle('notify_email')}
            />
            <SettingRow
              icon={Smartphone}
              label="Push Notifications"
              desc="Browser push notifications"
              checked={settings.notify_push}
              onToggle={() => toggle('notify_push')}
            />
            <SettingRow
              icon={Bell}
              label="Prediction Results"
              desc="Get notified when event outcomes are set"
              checked={settings.notify_predictions}
              onToggle={() => toggle('notify_predictions')}
            />
            <SettingRow
              icon={Bell}
              label="Donation Confirmations"
              desc="Get notified when your donation is processed"
              checked={settings.notify_donations}
              onToggle={() => toggle('notify_donations')}
            />
          </div>
        </Card>

        {/* Security */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold">Security</h2>
          </div>
          <SettingRow
            icon={Shield}
            label="Two-Factor Authentication (2FA)"
            desc="Add an extra layer of security to your account"
            checked={settings.two_fa_enabled}
            onToggle={() => toggle('two_fa_enabled')}
          />
          {settings.two_fa_enabled && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
              2FA setup will be available soon. We'll notify you at <strong>{user.email}</strong>.
            </div>
          )}
        </Card>

        <Button
          className="w-full gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold py-5"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}

function SettingRow({ icon: Icon, label, desc, checked, onToggle }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <Label className="cursor-pointer font-medium">{label}</Label>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} />
    </div>
  );
}