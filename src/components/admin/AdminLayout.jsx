import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Heart, Trophy, Settings,
  LogOut, Menu, X, ChevronRight, Globe, BarChart3, Shield, PieChart, UserCheck, Gift, DollarSign, FileBarChart2
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/events', label: 'Events', icon: Trophy },
  { to: '/admin/causes', label: 'Beneficiaries', icon: Heart },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/donations', label: 'Donations', icon: DollarSign },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/prize-payouts', label: 'Prize Payouts', icon: Gift },
  { to: '/admin/beneficiary-payouts', label: 'Beneficiary Payouts', icon: DollarSign },
  { to: '/admin/cause-impact', label: 'Cause Impact', icon: FileBarChart2 },
  { to: '/admin/donation-summary', label: 'Beneficiary Summary', icon: PieChart },
  { to: '/admin/user-summary', label: 'User Summary', icon: UserCheck },
  { to: '/admin/settings', label: 'Site Settings', icon: Settings },
];

export default function AdminLayout({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (item) =>
    item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);

  const handleLogout = () => {
    base44.auth.logout('/admin');
  };

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col
        transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div>
            <span className="text-xl font-extrabold text-white">Qada<span className="text-yellow-400">.</span>Bet</span>
            <div className="flex items-center gap-1 mt-0.5">
              <Shield className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Admin Panel</span>
            </div>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const active = isActive(item);
            return (
              <Link key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}>
                <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}>
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                  {active && <ChevronRight className="w-3 h-3 ml-auto" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center shrink-0">
              <span className="text-slate-900 font-bold text-xs">
                {user?.full_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'AD'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.full_name || 'Admin'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" /> Logout
          </Button>
          <Link to="/" className="block mt-1">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800">
              <Globe className="w-4 h-4" /> View Site
            </Button>
          </Link>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-3 lg:px-6">
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-sm text-slate-400">
              {navItems.find(i => isActive(i))?.label || 'Admin'}
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-slate-950 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}