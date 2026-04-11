import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Edit2, Save, X, TrendingUp, Users, Wallet, FileText, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function BeneficiaryDashboard() {
  const qc = useQueryClient();
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [payoutReason, setPayoutReason] = useState('');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedCauseForPayout, setSelectedCauseForPayout] = useState(null);

  // Load current user
  React.useEffect(() => {
    (async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setProfileForm({
          full_name: currentUser.full_name || '',
          email: currentUser.email || '',
        });
      } catch (e) {
        console.error('Auth error:', e);
      } finally {
        setIsLoadingUser(false);
      }
    })();
  }, []);

  // Fetch causes created by current user
  const { data: myCauses = [], isLoading: causesLoading } = useQuery({
    queryKey: ['my-causes', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Cause.filter({ created_by: user.email }, '-updated_date');
    },
    enabled: !!user?.email,
  });

  // Fetch donations to my causes
  const { data: myDonations = [], isLoading: donationsLoading } = useQuery({
    queryKey: ['my-donations', myCauses.map(c => c.id).join(',')],
    queryFn: async () => {
      if (myCauses.length === 0) return [];
      const causeIds = myCauses.map(c => c.id);
      const allDonations = await base44.entities.Donation.list('-created_date', 1000);
      return allDonations.filter(d => causeIds.includes(d.cause_id));
    },
    enabled: myCauses.length > 0,
  });

  // Fetch payouts for my causes
  const { data: myPayouts = [] } = useQuery({
    queryKey: ['my-payouts', myCauses.map(c => c.id).join(',')],
    queryFn: async () => {
      if (myCauses.length === 0) return [];
      const causeIds = myCauses.map(c => c.id);
      const allPayouts = await base44.entities.Payout.list('-created_date', 1000);
      return allPayouts.filter(p => causeIds.includes(p.cause_id));
    },
    enabled: myCauses.length > 0,
  });

  const updateProfile = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe(data);
      setUser(prev => ({ ...prev, ...data }));
    },
    onSuccess: () => { toast.success('Profile updated'); setEditMode(false); },
    onError: () => toast.error('Failed to update profile'),
  });

  const requestPayout = useMutation({
    mutationFn: async () => {
      if (!selectedCauseForPayout) return;
      const cause = myCauses.find(c => c.id === selectedCauseForPayout);
      const relatedDonations = myDonations.filter(d => d.cause_id === selectedCauseForPayout && d.payment_status === 'success');
      const totalAmount = relatedDonations.reduce((sum, d) => sum + (d.amount || 0), 0);

      if (totalAmount <= 0) {
        toast.error('No successful donations to request payout for');
        return;
      }

      const payout = await base44.entities.Payout.create({
        cause_id: cause.id,
        cause_name: cause.name,
        amount: totalAmount,
        donation_count: relatedDonations.length,
        period_from: new Date().toISOString().split('T')[0],
        period_to: new Date().toISOString().split('T')[0],
        note: payoutReason,
        status: 'pending',
        bank_name: cause.bank_name || '',
        bank_account_name: cause.bank_account_name || '',
        bank_account_number: cause.bank_account_number || '',
      });

      // Send email to cause owner
      try {
        await base44.integrations.Core.SendEmail({
          to: cause.contact_email,
          subject: `Payout Request Received: "${cause.name}"`,
          body: `Hello ${cause.contact_person || ''},\n\nYour payout request for ₦${totalAmount.toLocaleString()} has been received and is pending admin review.\n\nTotal donations: ${relatedDonations.length}\nNote: ${payoutReason || 'No additional notes'}\n\nYou will be notified once the payout is processed.\n\nBest,\nQada.Bet Team`,
        });
      } catch (e) {
        console.error('Failed to send payout email', e);
      }

      qc.invalidateQueries({ queryKey: ['my-payouts'] });
      setShowPayoutModal(false);
      setPayoutReason('');
      setSelectedCauseForPayout(null);
      toast.success('Payout request submitted');
    },
  });

  const getCauseStatus = (cause) => {
    const status = cause.status || (cause.is_verified ? 'approved' : 'pending');
    return {
      approved: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Approved' },
      pending: { icon: Clock, color: 'text-amber-400', label: 'Pending Review' },
      queried: { icon: AlertCircle, color: 'text-blue-400', label: 'Awaiting Info' },
      rejected: { icon: XCircle, color: 'text-red-400', label: 'Rejected' },
    }[status];
  };

  const getPayoutStatus = (status) => {
    return {
      pending: { icon: Clock, color: 'text-amber-400', label: 'Pending' },
      processing: { icon: Loader2, color: 'text-blue-400', label: 'Processing' },
      paid: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Paid' },
      failed: { icon: XCircle, color: 'text-red-400', label: 'Failed' },
    }[status] || { icon: Clock, color: 'text-slate-400', label: status };
  };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalDonations = myDonations.filter(d => d.payment_status === 'success').reduce((s, d) => s + (d.amount || 0), 0);
  const totalRaised = myCauses.reduce((s, c) => s + (c.raised_amount || 0), 0);
  const approvedCauses = myCauses.filter(c => (c.status === 'approved' || (c.status === undefined && c.is_verified)));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Profile */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-white">Beneficiary Dashboard</h1>
            <p className="text-slate-400 mt-1">Manage your causes and donations</p>
          </div>
          <Button
            onClick={() => setEditMode(!editMode)}
            variant={editMode ? 'outline' : 'default'}
            className="bg-primary hover:bg-primary/90 gap-2"
          >
            {editMode ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            {editMode ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>

        {/* Edit Profile Modal */}
        {editMode && (
          <Card className="border-primary/50 bg-slate-900 border-2">
            <CardHeader>
              <CardTitle className="text-white">Update Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">Name</Label>
                <Input
                  value={profileForm.full_name}
                  onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))}
                  className="mt-2 bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Email</Label>
                <Input
                  value={profileForm.email}
                  disabled
                  className="mt-2 bg-slate-800 border-slate-700 text-slate-500"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => updateProfile.mutate(profileForm)}
                  disabled={updateProfile.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                >
                  {updateProfile.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400">Active Causes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{approvedCauses.length}</p>
              <p className="text-xs text-slate-500 mt-1">Approved & live</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Total Donations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-400">₦{totalRaised.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">{myDonations.length} donations</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400 flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Pending Payouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-400">
                ₦{myPayouts.filter(p => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">{myPayouts.filter(p => p.status === 'pending').length} requests</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardDescription className="text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Paid Out
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-300">
                ₦{myPayouts.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">{myPayouts.filter(p => p.status === 'paid').length} completed</p>
            </CardContent>
          </Card>
        </div>

        {/* My Causes */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">My Causes</h2>
          {causesLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : myCauses.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800 text-center py-12">
              <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
              <p className="text-slate-400">You haven't registered any causes yet.</p>
              <Button className="mt-4 bg-primary hover:bg-primary/90">
                <a href="/start-cause">Start a Cause</a>
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {myCauses.map(cause => {
                const causeStatus = getCauseStatus(cause);
                const StatusIcon = causeStatus.icon;
                const donations = myDonations.filter(d => d.cause_id === cause.id && d.payment_status === 'success');
                const raised = donations.reduce((s, d) => s + (d.amount || 0), 0);
                const progress = ((raised / (cause.goal_amount || 1)) * 100).toFixed(1);

                return (
                  <Card key={cause.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-white">{cause.name}</CardTitle>
                            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${causeStatus.color} bg-slate-800/50`}>
                              <StatusIcon className="w-3 h-3" />
                              {causeStatus.label}
                            </div>
                          </div>
                          <CardDescription className="text-slate-400">{cause.category} • {cause.location}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Progress</p>
                          <p className="text-lg font-bold text-emerald-400">₦{raised.toLocaleString()}</p>
                          <p className="text-xs text-slate-500">of ₦{(cause.goal_amount || 0).toLocaleString()} ({progress}%)</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Donations</p>
                          <p className="text-lg font-bold text-slate-300">{donations.length}</p>
                          <p className="text-xs text-slate-500">successful donations</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full transition-all"
                          style={{ width: `${Math.min(Number(progress), 100)}%` }}
                        />
                      </div>

                      {/* Bank details status */}
                      {causeStatus.label === 'Approved' && (
                        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                          <p className="text-xs text-slate-300 font-semibold mb-2">💳 Bank Details on File</p>
                          <p className="text-xs text-slate-400">
                            {cause.bank_account_name} • {cause.bank_account_number}
                          </p>
                        </div>
                      )}

                      {/* Payout button */}
                      {causeStatus.label === 'Approved' && raised > 0 && (
                        <Button
                          onClick={() => {
                            setSelectedCauseForPayout(cause.id);
                            setShowPayoutModal(true);
                          }}
                          className="w-full bg-primary hover:bg-primary/90 gap-2"
                        >
                          <Wallet className="w-4 h-4" />
                          Request Payout
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Payout History */}
        {myPayouts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Payout History</h2>
            <div className="space-y-3">
              {myPayouts.map(payout => {
                const status = getPayoutStatus(payout.status);
                const StatusIcon = status.icon;

                return (
                  <Card key={payout.id} className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold">{payout.cause_name}</p>
                          <p className="text-xs text-slate-500">₦{payout.amount.toLocaleString()} • {payout.donation_count} donations</p>
                        </div>
                        <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${status.color} bg-slate-800/50`}>
                          {payout.status === 'processing' ? (
                            <StatusIcon className="w-3 h-3 animate-spin" />
                          ) : (
                            <StatusIcon className="w-3 h-3" />
                          )}
                          {status.label}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Payout Request Modal */}
      {showPayoutModal && selectedCauseForPayout && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Request Payout</CardTitle>
              <button
                onClick={() => {
                  setShowPayoutModal(false);
                  setPayoutReason('');
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedCauseForPayout && (
                <>
                  <div>
                    <p className="text-sm text-slate-300 font-semibold">
                      {myCauses.find(c => c.id === selectedCauseForPayout)?.name}
                    </p>
                    <p className="text-sm text-emerald-400 font-bold mt-2">
                      ₦{myDonations
                        .filter(d => d.cause_id === selectedCauseForPayout && d.payment_status === 'success')
                        .reduce((s, d) => s + (d.amount || 0), 0)
                        .toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <Label className="text-slate-300 text-xs">Additional Note (optional)</Label>
                    <Textarea
                      value={payoutReason}
                      onChange={e => setPayoutReason(e.target.value)}
                      placeholder="Any additional details about this payout request..."
                      className="mt-2 bg-slate-800 border-slate-700 text-white text-sm"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowPayoutModal(false);
                        setPayoutReason('');
                      }}
                      className="flex-1 text-slate-400"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => requestPayout.mutate()}
                      disabled={requestPayout.isPending}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
                    >
                      {requestPayout.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                      Submit Request
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}