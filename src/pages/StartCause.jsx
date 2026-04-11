import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, Upload, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['shelter', 'education', 'water', 'health', 'food', 'environment'];
const STEPS = [
  { num: 1, title: 'Cause Details', desc: 'Basic information' },
  { num: 2, title: 'Location & Purpose', desc: 'Where and why' },
  { num: 3, title: 'Contact Person', desc: 'Your information' },
  { num: 4, title: 'Documents', desc: 'CAC, supporting docs' },
  { num: 5, title: 'Consent', desc: 'Terms & attestation' },
];

export default function StartCause() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);
  const [form, setForm] = useState({
    name: '', category: 'education', description: '',
    location: '', address: '', purpose: '', amount_to_raise: '',
    contact_person: '', contact_gender: '', contact_dob: '', contact_phone: '',
    contact_email: '',
    cac_documents: '', supporting_documents: '', contact_id_document: '', contact_passport_photo: '',
    consent_agreed: false,
  });

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setForm(f => ({ ...f, contact_email: u.email }));
      setLoading(false);
    }).catch(() => {
      base44.auth.redirectToLogin('/start-cause');
    });
  }, []);

  const [submitted, setSubmitted] = useState(false);

  const createCause = useMutation({
    mutationFn: async () => {
      const causeData = {
        name: form.name,
        category: form.category,
        description: form.description,
        location: form.location,
        address: form.address,
        purpose: form.purpose,
        amount_to_raise: Number(form.amount_to_raise) || 0,
        goal_amount: Number(form.amount_to_raise) || 0,
        contact_person: form.contact_person,
        contact_gender: form.contact_gender,
        contact_dob: form.contact_dob,
        contact_phone: form.contact_phone,
        contact_email: form.contact_email,
        cac_documents: form.cac_documents,
        supporting_documents: form.supporting_documents,
        contact_id_document: form.contact_id_document,
        contact_passport_photo: form.contact_passport_photo,
        status: 'pending',
      };

      const result = await base44.entities.Cause.create(causeData);

      try {
        const { buildEmailHtml, detailRow } = await import('@/lib/emailTemplate');
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: 'Your Cause Registration is Under Review — Qada.Bet',
          body: buildEmailHtml({
            preheader: `Your cause "${form.name}" has been submitted for review`,
            body: `
              <h2 style="margin:0 0 6px;font-size:24px;font-weight:800;color:#1a237e;">Application Received! 🎉</h2>
              <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
                Hi <strong>${user.full_name || 'there'}</strong>, thank you for registering your cause on Qada.Bet!
              </p>
              <div style="background:linear-gradient(135deg,#1a237e,#283593);border-radius:12px;padding:20px 24px;text-align:center;margin-bottom:24px;">
                <p style="margin:0 0 4px;font-size:13px;color:rgba(255,255,255,0.7);font-weight:600;text-transform:uppercase;letter-spacing:1px;">Cause Submitted</p>
                <p style="margin:0;font-size:22px;font-weight:900;color:#f9a825;">${form.name}</p>
                <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.7);capitalize">${form.category}</p>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                ${detailRow('Status', '⏳ Pending Review')}
                ${detailRow('Location', form.location)}
                ${detailRow('Goal Amount', '₦' + Number(form.amount_to_raise).toLocaleString(), true)}
                ${detailRow('Submitted On', new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' }))}
              </table>
              <div style="background:#fff8e1;border-left:4px solid #f9a825;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:20px;">
                <p style="margin:0;font-size:13px;color:#795548;line-height:1.6;">
                  ✅ <strong>What happens next?</strong> Our team will review your documents and verify your information. You will receive an email notification once your status is updated.<br/><br/>
                  If we need clarifications, we will send a query email to this address.
                </p>
              </div>
              <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">Thank you for partnering with us,<br/><strong style="color:#1a237e;">The Qada.Bet Team</strong></p>
            `,
          }),
        });
      } catch (e) {
        console.error('Failed to send confirmation email', e);
      }

      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['causes'] });
      setSubmitted(true);
    },
    onError: (e) => {
      toast.error('Failed to submit application.');
      console.error(e);
    },
  });

  const handleFileUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(field);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, [field]: file_url }));
      toast.success(`${field} uploaded`);
    } catch (err) {
      toast.error('Upload failed');
      console.error(err);
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-12 h-12 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-primary mb-3">Application Submitted!</h1>
          <p className="text-muted-foreground mb-2 text-lg">
            Your cause <strong className="text-foreground">"{form.name}"</strong> has been submitted for review.
          </p>
          <p className="text-muted-foreground mb-8">
            We've sent a confirmation email to <strong>{user?.email}</strong>. Our team will review your documents and get back to you.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-left mb-8">
            <p className="text-sm font-bold text-amber-800 mb-2">⏭ What happens next?</p>
            <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
              <li>Our team reviews your documents (1–3 business days)</li>
              <li>You may receive a query email if we need more info</li>
              <li>Once approved, your cause goes live on the platform</li>
            </ul>
          </div>
          <a href="/beneficiary" className="block">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold">Go to Your Beneficiary Dashboard</Button>
          </a>
          <a href="/causes" className="block mt-3">
            <Button variant="outline" className="w-full">Browse Other Causes</Button>
          </a>
        </div>
      </div>
    );
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return form.name && form.category && form.description;
      case 2:
        return form.location && form.address && form.purpose && form.amount_to_raise;
      case 3:
        return form.contact_person && form.contact_gender && form.contact_dob && form.contact_phone && form.contact_email;
      case 4:
        return form.cac_documents && form.supporting_documents && form.contact_id_document && form.contact_passport_photo;
      case 5:
        return form.consent_agreed;
      default:
        return false;
    }
  };

  return (
    <div className="pb-16 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary mb-2">Start a Cause</h1>
          <p className="text-muted-foreground">Register to raise donations for your cause or organization</p>
        </div>

        {/* Step indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between gap-2">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.num}>
                <button
                  onClick={() => step > s.num && setStep(s.num)}
                  className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    step >= s.num ? 'opacity-100' : 'opacity-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    step === s.num
                      ? 'bg-primary text-primary-foreground'
                      : step > s.num
                      ? 'bg-emerald-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {step > s.num ? <Check className="w-5 h-5" /> : s.num}
                  </div>
                  <p className="text-xs font-semibold hidden sm:block">{s.title}</p>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 rounded-full ${step > s.num ? 'bg-emerald-500' : 'bg-muted'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form */}
        <Card className="p-8 mb-8">
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold">Cause Details</h2>
              <div>
                <Label className="mb-2 block">Cause Name <span className="text-destructive">*</span></Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Water Project for Rural Communities" />
              </div>
              <div>
                <Label className="mb-2 block">Category <span className="text-destructive">*</span></Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Description <span className="text-destructive">*</span></Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What is your cause about?" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold">Location & Purpose</h2>
              <div>
                <Label className="mb-2 block">Location <span className="text-destructive">*</span></Label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Lagos, Nigeria" />
              </div>
              <div>
                <Label className="mb-2 block">Address <span className="text-destructive">*</span></Label>
                <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Full street address" />
              </div>
              <div>
                <Label className="mb-2 block">Purpose of Donation <span className="text-destructive">*</span></Label>
                <Input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                  placeholder="What will the funds be used for?" />
              </div>
              <div>
                <Label className="mb-2 block">Amount to Raise (₦) <span className="text-destructive">*</span></Label>
                <Input type="number" value={form.amount_to_raise} onChange={e => setForm(f => ({ ...f, amount_to_raise: e.target.value }))}
                  placeholder="1000000" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold">Contact Person</h2>
              <div>
                <Label className="mb-2 block">Full Name <span className="text-destructive">*</span></Label>
                <Input value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))}
                  placeholder="Your full name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Gender <span className="text-destructive">*</span></Label>
                  <Select value={form.contact_gender} onValueChange={v => setForm(f => ({ ...f, contact_gender: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">Date of Birth <span className="text-destructive">*</span></Label>
                  <Input type="date" value={form.contact_dob} onChange={e => setForm(f => ({ ...f, contact_dob: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Phone Number <span className="text-destructive">*</span></Label>
                <Input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                  placeholder="+234..." />
              </div>
              <div>
                <Label className="mb-2 block">Email <span className="text-destructive">*</span></Label>
                <Input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} disabled
                  className="opacity-70" />
                <p className="text-xs text-muted-foreground mt-1">Using your registered email</p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold">Documents</h2>
              <p className="text-sm text-muted-foreground">Upload CAC registration documents and supporting evidence</p>

              {[
                { field: 'cac_documents', label: 'CAC/NGO Registration Documents' },
                { field: 'supporting_documents', label: 'Supporting Documents' },
                { field: 'contact_id_document', label: 'Valid ID Document (Driver\'s License, NIN, Passport)' },
                { field: 'contact_passport_photo', label: 'Passport Photograph' },
              ].map(({ field, label }) => (
                <div key={field}>
                  <Label className="mb-2 block">{label} <span className="text-destructive">*</span></Label>
                  {form[field] ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-emerald-700 flex-1 truncate">{form[field].split('/').pop()}</span>
                      <button type="button" onClick={() => setForm(f => ({ ...f, [field]: '' }))}
                        className="text-xs text-emerald-600 hover:underline">Remove</button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input type="file" onChange={e => handleFileUpload(e, field)} disabled={uploading === field}
                        className="absolute inset-0 opacity-0 cursor-pointer" />
                      <Button type="button" variant="outline" className="w-full justify-start gap-2" disabled={uploading === field}>
                        {uploading === field ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                        ) : (
                          <><Upload className="w-4 h-4" /> Choose file</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold">Consent & Attestation</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-blue-900">Terms & Conditions:</p>
                <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
                  <li>I confirm that all information provided is accurate and truthful</li>
                  <li>I have the right to seek donations on behalf of this cause/organization</li>
                  <li>All submitted documents are authentic and valid</li>
                  <li>I consent to Qada.Bet verifying my information with relevant authorities</li>
                  <li>I agree to use funds solely for the stated purpose</li>
                  <li>I will provide regular updates on fund utilization</li>
                </ul>
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted transition-colors">
                <input type="checkbox" checked={form.consent_agreed} onChange={e => setForm(f => ({ ...f, consent_agreed: e.target.checked }))}
                  className="w-5 h-5" />
                <span className="text-sm font-medium">I understand and agree to all terms and conditions</span>
              </label>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t">
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1}>
              Back
            </Button>
            <p className="text-xs text-muted-foreground">Step {step} of {STEPS.length}</p>
            {step === STEPS.length ? (
              <Button onClick={() => createCause.mutate()} disabled={!canProceed() || createCause.isPending}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                {createCause.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Application
              </Button>
            ) : (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
                Next
              </Button>
            )}
          </div>
        </Card>

        {/* Help card */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900">What happens next?</p>
              <p className="text-xs text-blue-800 mt-1">After submission, you'll receive a confirmation email. Our team will review your application and documents. If anything is unclear, we'll email you for clarifications (query status). Once approved, your cause will appear on the Qada.Bet platform.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}