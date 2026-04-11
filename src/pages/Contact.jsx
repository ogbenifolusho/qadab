import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { buildEmailHtml } from '@/lib/emailTemplate';
import { toast } from 'sonner';
import { Mail, Phone, MapPin, Send, Loader2, MessageSquare, Globe } from 'lucide-react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: 'hello@qada.bet',
        subject: `Contact Form: ${form.subject}`,
        body: buildEmailHtml({
          preheader: `New contact message from ${form.name}`,
          body: `
            <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#1a237e;">New Contact Message</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
                <table width="100%"><tr>
                  <td style="font-size:13px;color:#666;width:30%;">Name</td>
                  <td style="font-size:13px;font-weight:600;color:#1a1a2e;">${form.name}</td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
                <table width="100%"><tr>
                  <td style="font-size:13px;color:#666;width:30%;">Email</td>
                  <td style="font-size:13px;font-weight:600;color:#1a1a2e;">${form.email}</td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
                <table width="100%"><tr>
                  <td style="font-size:13px;color:#666;width:30%;">Subject</td>
                  <td style="font-size:13px;font-weight:600;color:#1a1a2e;">${form.subject}</td>
                </tr></table>
              </td></tr>
            </table>
            <div style="background:#f8f9ff;border-radius:8px;padding:16px;border-left:4px solid #1a237e;">
              <p style="margin:0;font-size:14px;color:#333;line-height:1.7;">${form.message}</p>
            </div>
          `,
        }),
      });
      setSent(true);
      toast.success('Message sent! We\'ll get back to you shortly.');
    } catch (e) {
      toast.error('Failed to send message. Please try emailing us directly.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="py-16 sm:py-20 text-center bg-gradient-to-b from-background to-card">
        <div className="max-w-2xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-full mb-5">
              Get In Touch
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-primary">
              Contact <span className="text-secondary">Us</span>
            </h1>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Have a question, partnership inquiry, or need support? We'd love to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 py-12">
        {/* Contact info */}
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-extrabold mb-6">Reach Us Directly</h2>
            <div className="space-y-5">
              {[
                { icon: Mail, label: 'Email', value: 'hello@qada.bet', href: 'mailto:hello@qada.bet' },
                { icon: Phone, label: 'Phone', value: '+234 909 999 6424', href: 'tel:+2349099996424' },
                { icon: MapPin, label: 'Address', value: 'Asokoro, Abuja, FCT, Nigeria', href: null },
                { icon: Globe, label: 'Website', value: 'www.qada.bet', href: 'https://www.qada.bet' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="font-medium text-primary hover:underline">{item.value}</a>
                    ) : (
                      <p className="font-medium">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
            <MessageSquare className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-bold text-lg mb-2">Partnership & Sponsorship</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Interested in partnering with Qada.Bet or sponsoring the platform to support social impact? We welcome organizations, foundations, and businesses who share our mission.
            </p>
            <p className="mt-3 text-sm font-semibold text-primary">📧 partnerships@qada.bet</p>
          </div>
        </div>

        {/* Contact form */}
        <div className="bg-card border border-border rounded-2xl p-8">
          {sent ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-extrabold mb-2">Message Sent!</h3>
              <p className="text-muted-foreground mb-6">We'll get back to you within 24 hours.</p>
              <Button variant="outline" onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}>
                Send Another Message
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-xl font-bold mb-6">Send a Message</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block">Name</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" required />
                </div>
                <div>
                  <Label className="mb-1.5 block">Email</Label>
                  <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" required />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block">Subject</Label>
                <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="What's it about?" required />
              </div>
              <div>
                <Label className="mb-1.5 block">Message</Label>
                <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Tell us more..." rows={5} required />
              </div>
              <Button type="submit" disabled={sending} className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}