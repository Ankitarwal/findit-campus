import React, { useState } from 'react';
import { 
  Compass, 
  Search, 
  PlusCircle, 
  Shield, 
  User, 
  Menu, 
  X, 
  Sparkles, 
  LogOut, 
  Layers,
  HelpCircle,
  FolderOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AiStatusBadge } from './AiStatusBadge';
import { NotificationCenter } from './NotificationCenter';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string, params?: any) => void;
  onOpenReportLost: () => void;
  onOpenReportFound: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenReportLost,
  onOpenReportFound,
}) => {
  const { user, profile, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Compass },
    { id: 'browse', label: 'Browse Items', icon: Search },
    { id: 'how-it-works', label: 'How It Works', icon: HelpCircle },
    { id: 'ai-info', label: 'AI Transparency', icon: Sparkles },
    ...(user ? [{ id: 'student-dashboard', label: 'My Dashboard', icon: Layers }] : []),
    ...(isAdmin ? [{ id: 'admin-dashboard', label: 'Admin Portal', icon: Shield }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => onNavigate('home')} 
              className="flex items-center gap-2.5 focus:outline-none group text-left"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-600 to-navy-900 flex items-center justify-center text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5 text-tealAccent-300" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-slate-900 flex items-center gap-1">
                  FindIt <span className="text-primary-600">Campus</span>
                </span>
                <span className="block text-[10px] font-medium text-slate-400 -mt-1 tracking-wider uppercase">
                  AI Lost & Found
                </span>
              </div>
            </button>

            {/* AI Status Badge */}
            <div className="hidden lg:block">
              <AiStatusBadge />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const active = currentPage === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-primary-600' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Actions & User Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Quick Report Buttons */}
            <button
              onClick={onOpenReportLost}
              className="btn-primary text-xs px-3.5 py-2"
              title="Report an item you lost"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Report Lost</span>
            </button>

            <button
              onClick={onOpenReportFound}
              className="btn-teal text-xs px-3.5 py-2"
              title="Report an item you found"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Report Found</span>
            </button>

            {/* Notification Center */}
            <NotificationCenter onNavigateToReport={(id) => onNavigate('item-detail', { reportId: id })} />

            {/* User Profile / Auth State */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
                >
                  <img
                    src={profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                  <span className="text-xs font-medium text-slate-700 hidden xl:inline">
                    {profile?.display_name?.split(' ')[0]}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-elevated border border-slate-100 py-1.5 z-50 animate-fadeIn">
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900 truncate">{profile?.display_name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{profile?.email}</p>
                      <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isAdmin ? 'Campus Admin' : 'Student'}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavigate('student-dashboard');
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-400" /> My Reports & Claims
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate('admin-dashboard');
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs text-amber-700 font-medium hover:bg-amber-50/50 flex items-center gap-2"
                      >
                        <Shield className="w-3.5 h-3.5 text-amber-600" /> Admin Control Panel
                      </button>
                    )}

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onNavigate('auth')}
                className="btn-secondary text-xs px-3.5 py-2"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1.5 animate-fadeIn">
          <div className="py-2">
            <AiStatusBadge />
          </div>
          {navItems.map(item => {
            const active = currentPage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  active ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
