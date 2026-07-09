import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { UserRole, UserProfile } from '../types';
import { Shield, Sparkles, User, Mail, Lock, Feather, BookOpen, LogOut, CheckCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.MEMBER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  // Real anonymous sign-in linked to a custom role in Firestore
  const handleDemoLogin = async (demoRole: UserRole, demoName: string, demoSections?: string[]) => {
    setLoading(true);
    setError('');
    try {
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;

      const profile: UserProfile = {
        uid: user.uid,
        name: `${demoName} (تجريبي)`,
        email: `${demoRole}@assayha-demo.com`,
        role: demoRole,
        sections: demoSections || [],
        bio: `حساب تجريبي لمحاكاة دور ${demoName} في منصة الصيحة الأدبية.`,
        joinDate: new Date().toLocaleDateString('ar-EG'),
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.uid}`
      };

      // Save user profile in Firestore
      await setDoc(doc(db, "users", user.uid), profile);
      setSuccess(`تم الدخول بنجاح بصفتك: ${demoName}`);
      
      setTimeout(() => {
        onAuthSuccess(profile);
        onClose();
        setSuccess('');
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setError('فشل الدخول التجريبي: ' + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isSignUp) {
        if (!name) throw new Error('الرجاء إدخال الاسم الكريم');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const profile: UserProfile = {
          uid: user.uid,
          name,
          email,
          role: UserRole.WRITER, // Default to writer so they can write articles
          sections: ["مرفأ النثر والقصة القصيرة"], // default allowed section
          bio: bio || "أديب مهتم بالأدب والثقافة في منبر الصيحة.",
          joinDate: new Date().toLocaleDateString('ar-EG'),
          avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.uid}`
        };

        await setDoc(doc(db, "users", user.uid), profile);
        setSuccess('تم إنشاء حسابك بنجاح ككاتب!');
        setTimeout(() => {
          onAuthSuccess(profile);
          onClose();
          setSuccess('');
        }, 1200);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Fetch profile
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const profile = userDoc.data() as UserProfile;
          setSuccess(`أهلاً بك مجدداً، ${profile.name}`);
          setTimeout(() => {
            onAuthSuccess(profile);
            onClose();
            setSuccess('');
          }, 1200);
        } else {
          // If profile does not exist in Firestore for some reason, create it
          const profile: UserProfile = {
            uid: user.uid,
            name: email.split('@')[0],
            email,
            role: UserRole.MEMBER,
            joinDate: new Date().toLocaleDateString('ar-EG'),
            avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.uid}`
          };
          await setDoc(doc(db, "users", user.uid), profile);
          onAuthSuccess(profile);
          onClose();
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('هذا البريد الإلكتروني مستخدم بالفعل.');
      } else {
        setError(err.message || 'حدث خطأ أثناء تسجيل الدخول.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl glass-panel border-white/10 flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Left Side: Brand and Demo Logins */}
        <div className="w-full md:w-1/2 p-6 md:p-8 bg-slate-950/60 border-b md:border-b-0 md:border-l border-white/10 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500">
                <Feather className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-amber-500">منبر الصيحة الأدبي</h2>
                <p className="text-xs text-gray-400">نظام تسجيل الدخول وإدارة الصلاحيات</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-300 mb-6 leading-relaxed">
              لتسهيل تجربة المنصة واختبار كامل ميزاتها فورياً، قمنا بإعداد حسابات تجريبية بضغطة زر واحدة تمثل كافة الصلاحيات المتاحة.
            </p>

            <h3 className="text-xs font-semibold tracking-wider uppercase text-amber-500/80 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              الدخول السريع بصلاحيات مخصصة (Demo):
            </h3>

            <div className="space-y-3">
              {/* Admin Button */}
              <button 
                onClick={() => handleDemoLogin(UserRole.ADMIN, 'مدير عام المنصة')}
                disabled={loading}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 text-right transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">مدير عام المنصة (Admin)</div>
                    <div className="text-xs text-gray-400">صلاحيات كاملة: إدارة المستخدمين والأقسام وتعيين الأدوار</div>
                  </div>
                </div>
                <span className="text-xs font-medium text-red-400">دخول ⟵</span>
              </button>

              {/* Editor Button */}
              <button 
                onClick={() => handleDemoLogin(UserRole.EDITOR, 'محرر ديوان الشعر', ['الديوان الشعري'])}
                disabled={loading}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 text-right transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">محرر ديوان الشعر (Editor)</div>
                    <div className="text-xs text-gray-400">صلاحيات الإشراف والتحرير الكامل لقسم "الديوان الشعري"</div>
                  </div>
                </div>
                <span className="text-xs font-medium text-purple-400">دخول ⟵</span>
              </button>

              {/* Writer Button */}
              <button 
                onClick={() => handleDemoLogin(UserRole.WRITER, 'الأديب / الكاتب نزار قاسم', ['مرفأ النثر والقصة القصيرة'])}
                disabled={loading}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 text-right transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                    <Feather className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">أديب وكاتب محتوى (Writer)</div>
                    <div className="text-xs text-gray-400">إضافة المقالات والقصائد، وتعديل ومتابعة منشوراته الخاصة</div>
                  </div>
                </div>
                <span className="text-xs font-medium text-amber-400">دخول ⟵</span>
              </button>

              {/* Member Button */}
              <button 
                onClick={() => handleDemoLogin(UserRole.MEMBER, 'عضو متفاعل')}
                disabled={loading}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 text-right transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">قارئ وعضو تفاعلي (Member)</div>
                    <div className="text-xs text-gray-400">كتابة التعليقات الفورية، التفاعل، والمشاركة بالأمسيات</div>
                  </div>
                </div>
                <span className="text-xs font-medium text-blue-400">دخول ⟵</span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 text-center">
            <span className="text-[10px] text-gray-500 font-mono">نظام حماية منبر الصيحة المستند إلى Firebase</span>
          </div>
        </div>

        {/* Right Side: Traditional Custom Credentials Logins */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">
              {isSignUp ? 'إنشاء حساب جديد' : 'تسجيل دخول بالبريد'}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-white/5 transition"
            >
              إغلاق ✕
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {error && (
              <div className="p-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 animate-bounce" />
                <span>{success}</span>
              </div>
            )}

            {isSignUp && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">الاسم الكريم الأدبي</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: أدونيس الفرات"
                      className="w-full p-2.5 pl-3 pr-10 rounded-xl glass-input text-sm"
                    />
                    <User className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">نبذة أدبية قصيرة (البيو)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="مثال: شاعر وباحث في نقد الحداثة الشعرية..."
                      className="w-full p-2.5 pl-3 pr-10 rounded-xl glass-input text-sm"
                    />
                    <Feather className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">البريد الإلكتروني</label>
              <div className="relative">
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full p-2.5 pl-3 pr-10 rounded-xl glass-input text-sm"
                />
                <Mail className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">كلمة المرور</label>
              <div className="relative">
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 pl-3 pr-10 rounded-xl glass-input text-sm"
                />
                <Lock className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm hover:bg-amber-400 active:scale-95 transition disabled:opacity-50"
            >
              {loading ? 'الرجاء الانتظار...' : isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-400">
            {isSignUp ? 'لديك حساب بالفعل؟ ' : 'ليس لديك حساب مسبق؟ '}
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-amber-400 font-semibold hover:underline"
            >
              {isSignUp ? 'سجل دخولك هنا' : 'سجل ككاتب وأديب جديد'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
