import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, Info, Heart, TrendingUp, LayoutDashboard, Trophy, History, User, ChevronDown, LogOut, Settings, DollarSign, Shield, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import NotificationBell from '@/components/NotificationBell';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (auth) => {
      setIsAuth(auth);
      if (auth) {
        const me = await base44.auth.me();
        setUser(me);
      }
    });
  }, []);

  // Public links always visible
  const publicLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/about', label: 'About', icon: Info },
    { to: '/causes', label: 'Causes', icon: Heart },
    { to: '/impact', label: 'Impact', icon: TrendingUp },
  ];

  // Authenticated nav links
  const authLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/predict', label: 'Predict', icon: Trophy },
    { to: '/donate', label: 'Donate', icon: DollarSign },
    { to: '/history', label: 'History', icon: History },
    { to: '/leaderboard', label: 'Leaderboard', icon: TrendingUp },
  ];
  
  // Cause managers should not see regular user links
  const [isCauseManager, setIsCauseManager] = React.useState(false);
  React.useEffect(() => {
    if (user?.email) {
      base44.entities.Cause.filter({ created_by: user.email }).then(causes => {
        setIsCauseManager(causes.length > 0);
      });
    }
  }, [user]);

  const causeLinks = isAuth && !isCauseManager ? [
    { to: '/start-cause', label: 'Start a Cause', icon: Heart },
  ] : [];

  const activeLinks = isCauseManager ? publicLinks : (isAuth ? authLinks : publicLinks);
  const isActive = (path) => location.pathname === path;
  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').toUpperCase() || '?';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary fill-primary" />
            </div>
            <span className="text-xl font-extrabold text-primary">
              Qada<span className="text-secondary">.Bet</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {activeLinks.map(link => (
              <Link key={link.to} to={link.to}>
                <Button variant={isActive(link.to) ? 'default' : 'ghost'} size="sm" className="gap-2">
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Button>
              </Link>
            ))}
            {causeLinks.map(link => (
              <Link key={link.to} to={link.to}>
                <Button variant={isActive(link.to) ? 'default' : 'ghost'} size="sm" className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white">
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-2">
            {isAuth && user && <NotificationBell userEmail={user.email} />}
            {isAuth === null ? null : isAuth ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 pl-1">
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:inline font-medium">{user?.full_name?.split(' ')[0] || 'Account'}</span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="gap-2 flex items-center"><User className="w-4 h-4" /> Profile</Link>
                  </DropdownMenuItem>
                  {isCauseManager && (
                    <DropdownMenuItem asChild>
                      <Link to="/beneficiary" className="gap-2 flex items-center text-emerald-600 font-semibold"><Heart className="w-4 h-4" /> My Cause</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="gap-2 flex items-center"><Settings className="w-4 h-4" /> Settings</Link>
                  </DropdownMenuItem>
                  {user?.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="gap-2 flex items-center text-yellow-600 font-semibold">
                          <Shield className="w-4 h-4" /> Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive gap-2 cursor-pointer" onClick={() => base44.auth.logout('/')}>
                    <LogOut className="w-4 h-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => base44.auth.redirectToLogin()}>Login</Button>
                <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold"
                  onClick={() => base44.auth.redirectToLogin()}>Register</Button>
              </>
            )}
          </div>

          {/* Mobile notification + hamburger */}
          <div className="md:hidden flex items-center gap-1">
            {isAuth && user && <NotificationBell userEmail={user.email} />}
            <button className="p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-card overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {isAuth && user && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted mb-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              )}
              {activeLinks.map(link => (
                <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}>
                  <Button variant={isActive(link.to) ? 'default' : 'ghost'} className="w-full justify-start gap-3">
                    <link.icon className="w-5 h-5" />
                    {link.label}
                  </Button>
                </Link>
              ))}
              {causeLinks.map(link => (
                <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}>
                  <Button variant="default" className="w-full justify-start gap-3 bg-emerald-500 hover:bg-emerald-600">
                    <link.icon className="w-5 h-5" />
                    {link.label}
                  </Button>
                </Link>
              ))}
              <div className="pt-3 border-t border-border space-y-2">
                {isAuth ? (
                  <>
                    <Link to="/profile" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-3"><User className="w-5 h-5" /> Profile</Button>
                    </Link>
                    <Link to="/settings" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-3"><Settings className="w-5 h-5" /> Settings</Button>
                    </Link>
                    {isCauseManager && (
                      <Link to="/beneficiary" onClick={() => setMobileOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-3 text-emerald-600"><Heart className="w-5 h-5" /> My Cause</Button>
                      </Link>
                    )}
                    {user?.role === 'admin' && (
                      <Link to="/admin" onClick={() => setMobileOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-3 text-yellow-600 font-semibold"><Shield className="w-5 h-5" /> Admin Panel</Button>
                      </Link>
                    )}
                    <Button variant="destructive" className="w-full gap-2" onClick={() => base44.auth.logout('/')}>
                      <LogOut className="w-4 h-4" /> Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" onClick={() => base44.auth.redirectToLogin()}>Login</Button>
                    <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold"
                      onClick={() => base44.auth.redirectToLogin()}>Register</Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}