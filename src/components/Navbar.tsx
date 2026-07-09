import React from 'react';
import { UserProfile, UserRole } from '../types';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { 
  Feather, 
  Search, 
  LogOut, 
  LogIn, 
  User, 
  Layers, 
  Calendar, 
  Cpu, 
  MessageSquareCode,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

interface NavbarProps {
  currentView: 'home' | 'prose' | 'evenings' | 'critique' | 'admin';
  setView: (view: 'home' | 'prose' | 'evenings' | 'critique' | 'admin') => void;
  userProfile: UserProfile | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function Navbar({ 
  currentView, 
  setView, 
  userProfile, 
  onLogout, 
  onOpenAuth, 
  searchQuery, 
  setSearchQuery 
}: NavbarProps) {
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <span className="bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">مدير عام</span>;
      case UserRole.EDITOR:
        return <span className="bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">محرر</span>;
      case UserRole.WRITER:
        return <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">أديب / كاتب</span>;
      default:
        return <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded-full">قارئ</span>;
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 backdrop-blur-md px-4 py-3.5 rounded-b-2xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => setView('home')}>
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-400 text-white font-serif font-bold text-lg shadow-xl shadow-blue-500/10">
            <Feather className="w-5.5 h-5.5" />
            <div className="absolute -inset-1 rounded-2xl border border-blue-500/20 animate-pulse -z-10" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide font-serif">مَـنْـبَـر الـصَّـيْـحَـة الأدبي</h1>
            <p className="text-[10px] text-emerald-400 font-medium tracking-widest font-sans">مِنَصَّةُ الثَّقَافَةِ وَالإبْدَاعِ الفِكْرِي</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-950/40 p-1 rounded-xl border border-white/10 overflow-x-auto w-full md:w-auto">
          <button 
            onClick={() => setView('home')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${currentView === 'home' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Layers className="w-4 h-4" />
            <span>الأقسام الثقافية</span>
          </button>

          <button 
            onClick={() => setView('prose')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${currentView === 'prose' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <MessageSquareCode className="w-4 h-4" />
            <span>الجدار الإبداعي التفاعلي</span>
          </button>

          <button 
            onClick={() => setView('evenings')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${currentView === 'evenings' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Calendar className="w-4 h-4" />
            <span>الأمسيات الرقمية</span>
          </button>

          <button 
            onClick={() => setView('critique')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${currentView === 'critique' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Cpu className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300" />
            <span>الناقد الذكي (AI)</span>
          </button>

          {userProfile?.role === UserRole.ADMIN && (
            <button 
              onClick={() => setView('admin')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${currentView === 'admin' ? 'bg-red-500 text-white shadow-md' : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'}`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>لوحة التحكم</span>
            </button>
          )}
        </div>

        {/* Search, Profile, Login Controls */}
        <div className="flex items-center gap-3 justify-end w-full md:w-auto shrink-0">
          
          {/* Quick Search */}
          {currentView === 'home' && (
            <div className="relative max-w-[180px] hidden lg:block">
              <input 
                type="text" 
                placeholder="ابحث عن قصيدة أو مقال..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-8 py-1.5 rounded-lg bg-slate-950/30 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500/50 transition"
              />
              <Search className="absolute right-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
            </div>
          )}

          {userProfile ? (
            <div className="flex items-center gap-2 bg-slate-950/50 p-1.5 pr-3 rounded-xl border border-white/10">
              {/* User Avatar */}
              <div className="flex items-center gap-2.5">
                <img 
                  src={userProfile.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userProfile.uid}`}
                  alt={userProfile.name} 
                  className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="text-right">
                  <div className="text-xs font-bold text-white max-w-[110px] truncate">{userProfile.name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {getRoleBadge(userProfile.role)}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                title="تسجيل الخروج"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition mr-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-bold text-xs transition active:scale-95 shadow-lg shadow-blue-500/10"
            >
              <LogIn className="w-4 h-4" />
              <span>انضم للمجلس الثقافي</span>
            </button>
          )}

        </div>

      </div>
    </nav>
  );
}
