import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { UserProfile, UserRole, Article } from '../types';
import { Shield, Users, BookOpen, Check, Trash2, Edit3, UserCheck, Lock, AlertCircle } from 'lucide-react';

interface AdminPanelProps {
  userProfile: UserProfile;
}

export default function AdminPanel({ userProfile }: AdminPanelProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pendingArticles, setPendingArticles] = useState<Article[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sectionsList = [
    "الديوان الشعري",
    "مرفأ النثر والقصة القصيرة",
    "الدراسات والقراءات النقدية",
    "آفاق فكرية وحوارات"
  ];

  // 1. Fetch Users
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const fetched: UserProfile[] = [];
      snapshot.forEach((doc) => {
        fetched.push({ uid: doc.id, ...doc.data() } as UserProfile);
      });
      setUsers(fetched);
      setLoadingUsers(false);
    }, (err) => {
      console.error(err);
      setError("فشل تحميل قائمة المستخدمين من قاعدة البيانات.");
      setLoadingUsers(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch Pending Articles
  useEffect(() => {
    const q = query(collection(db, "articles"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Article[] = [];
      snapshot.forEach((doc) => {
        const art = { id: doc.id, ...doc.data() } as Article;
        if (art.status === 'pending') {
          fetched.push(art);
        }
      });
      setPendingArticles(fetched);
      setLoadingArticles(false);
    }, (err) => {
      console.error(err);
      setError("فشل تحميل مسودات المقالات المعلقة.");
      setLoadingArticles(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    setSuccess('');
    setError('');
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { role: newRole });
      setSuccess("تم تحديث رتبة المستخدم وصلاحياته بنجاح.");
    } catch (err) {
      console.error(err);
      setError("فشل تحديث الرتبة في قاعدة البيانات.");
    }
  };

  const handleToggleSection = async (userId: string, currentSections: string[] = [], sectionName: string) => {
    setSuccess('');
    setError('');
    let updatedSections = [...currentSections];
    if (updatedSections.includes(sectionName)) {
      updatedSections = updatedSections.filter(s => s !== sectionName);
    } else {
      updatedSections.push(sectionName);
    }

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { sections: updatedSections });
      setSuccess("تم تحديث صلاحية تسيير الأقسام للمشرف بنجاح.");
    } catch (err) {
      console.error(err);
      setError("فشل تحديث صلاحيات الأقسام.");
    }
  };

  const handleApproveArticle = async (articleId: string) => {
    setSuccess('');
    try {
      const artRef = doc(db, "articles", articleId);
      await updateDoc(artRef, { status: 'approved' });
      setSuccess("تم اعتماد ونشر النص الأدبي بنجاح على الصفحة الرئيسية.");
    } catch (err) {
      console.error(err);
      setError("فشل نشر المقال.");
    }
  };

  const handleRejectArticle = async (articleId: string) => {
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف/رفض هذا النص؟")) return;
    setSuccess('');
    try {
      const artRef = doc(db, "articles", articleId);
      await deleteDoc(artRef);
      setSuccess("تم حذف/استبعاد النص الأدبي بنجاح.");
    } catch (err) {
      console.error(err);
      setError("فشل استبعاد المقال.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <h2 className="text-2xl font-black text-white font-serif flex items-center gap-2.5">
          <Shield className="w-7 h-7 text-emerald-400" />
          <span>ديوان الرقابة والإشراف العام (لوحة الإدارة)</span>
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          أهلاً بك يا {userProfile.name}. تتيح لك هذه اللوحة التحكم الكامل بصلاحيات القبول، وتعيين المحررين للمساحات الثنائية، ومطالعة تقارير النشاط.
        </p>
      </div>

      {success && (
        <div className="p-3 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          ✓ {success}
        </div>
      )}

      {error && (
        <div className="p-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* User Role Management: spans 7 */}
        <div className="lg:col-span-7 rounded-3xl glass-panel p-6 border-white/10 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold text-white">إدارة صلاحيات وتراخيص الأعضاء</h3>
            </div>
            <span className="text-[10px] bg-slate-950/40 text-gray-400 px-2.5 py-1 rounded-md border border-white/10 font-mono">
              {users.length} مستخدمين مسجلين
            </span>
          </div>

          {loadingUsers ? (
            <div className="py-12 text-center text-gray-500 text-xs font-semibold">جاري سحب جداول الأعضاء...</div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {users.map((u) => (
                <div key={u.uid} className="p-4 rounded-2xl bg-slate-950/40 border border-white/10 space-y-3 hover:border-white/20 transition">
                  
                  {/* Row 1: Profile basic */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <img 
                      src={u.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.uid}`}
                        alt={u.name} 
                        className="w-9 h-9 rounded-lg border border-white/10 bg-slate-900 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{u.name}</span>
                          <span className="text-[9px] text-gray-400 font-mono">منضم: {u.joinDate}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[200px]">{u.email}</div>
                      </div>
                    </div>

                    {/* Role Selection dropdown */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-400 font-medium ml-1 font-sans">الدور:</span>
                      <select 
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.uid, e.target.value as UserRole)}
                        className="p-1 text-[11px] font-bold rounded bg-slate-900 text-white border border-white/10"
                      >
                        <option value={UserRole.ADMIN}>مدير عام المنصة</option>
                        <option value={UserRole.EDITOR}>محرر قسم</option>
                        <option value={UserRole.WRITER}>أديب / كاتب</option>
                        <option value={UserRole.MEMBER}>عضو تفاعلي</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Allowed sections for Editors/Writers */}
                  {(u.role === UserRole.EDITOR || u.role === UserRole.WRITER) && (
                    <div className="p-2.5 rounded-xl bg-slate-900/50 border border-white/10 space-y-1.5">
                      <div className="text-[10px] font-bold text-emerald-400">الأقسام المخول بإدارتها وتسييرها:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {sectionsList.map((sec) => {
                          const isAssigned = u.sections?.includes(sec);
                          return (
                            <button 
                              key={sec}
                              onClick={() => handleToggleSection(u.uid, u.sections, sec)}
                              className={`px-2 py-0.5 rounded text-[9px] font-semibold transition ${isAssigned ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-transparent text-gray-400 border border-white/10'}`}
                            >
                              {isAssigned ? `✓ ${sec}` : `+ ${sec}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content Moderation: Spans 5 */}
        <div className="lg:col-span-5 rounded-3xl glass-panel p-6 border-white/10 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">المشاركات والقصائد المعلقة للمراجعة</h3>
            </div>
            <span className="text-[10px] bg-blue-500/15 text-blue-400 px-2.5 py-1 rounded-md border border-blue-500/20 font-bold">
              {pendingArticles.length} بانتظار الاعتماد
            </span>
          </div>

          {loadingArticles ? (
            <div className="py-12 text-center text-gray-500 text-xs font-semibold">تحميل مسودات الرقابة...</div>
          ) : pendingArticles.length === 0 ? (
            <div className="py-16 text-center text-gray-500 flex flex-col items-center justify-center space-y-2">
              <Check className="w-8 h-8 text-emerald-400 bg-emerald-500/10 p-1.5 rounded-full border border-emerald-500/20 mb-1" />
              <p className="text-xs font-bold text-gray-300">طاولة التحكيم فارغة ومثالية</p>
              <p className="text-[10px] leading-relaxed">كافة المقالات والقصائد المرسلة مسبقاً تم مراجعتها ونشرها للأعضاء.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {pendingArticles.map((art) => (
                <div key={art.id} className="p-4 rounded-2xl bg-slate-950/40 border border-white/10 space-y-3">
                  <div className="flex justify-between items-start gap-1">
                    <div>
                      <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {art.category}
                      </span>
                      <h4 className="text-sm font-black text-white font-serif mt-1.5">{art.title}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">الكاتب: {art.authorName}</p>
                    </div>
                    
                    <span className="text-[8px] text-gray-400 font-mono">
                      {new Date(art.createdAt).toLocaleDateString('ar-EG')}
                    </span>
                  </div>

                  <div className="text-xs text-gray-300 bg-slate-900/40 p-2.5 rounded-lg border border-white/10 font-serif line-clamp-4 leading-relaxed whitespace-pre-line">
                    {art.content}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => handleRejectArticle(art.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/35 text-red-400 text-[10px] font-bold transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>رفض واستبعاد</span>
                    </button>
                    
                    <button 
                      onClick={() => handleApproveArticle(art.id)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] transition shadow-lg shadow-blue-500/20 flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>اعتماد ونشر للعامة</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
