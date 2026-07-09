import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';
import { UserProfile, InteractiveVerse } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Heart, Sparkles, Feather, Send, Trash2, Calendar, Smile } from 'lucide-react';

interface ProseBoardProps {
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
}

export default function ProseBoard({ userProfile, onOpenAuth }: ProseBoardProps) {
  const [verses, setVerses] = useState<InteractiveVerse[]>([]);
  const [text, setText] = useState('');
  const [color, setColor] = useState('#d97706'); // default goldish amber
  const [style, setStyle] = useState<'glass' | 'gold' | 'neon' | 'vintage'>('glass');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Real-time listener for the interactive board
  useEffect(() => {
    const q = query(collection(db, "verses"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedVerses: InteractiveVerse[] = [];
      snapshot.forEach((doc) => {
        fetchedVerses.push({ id: doc.id, ...doc.data() } as InteractiveVerse);
      });
      setVerses(fetchedVerses);
      setLoading(false);
    }, (error) => {
      console.error("Firestore listener error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePostVerse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (!userProfile) {
      onOpenAuth();
      return;
    }

    setSubmitting(true);
    try {
      const newVerse = {
        text: text.trim(),
        authorName: userProfile.name,
        authorId: userProfile.uid,
        createdAt: new Date().toISOString(),
        color,
        style,
        likes: []
      };

      await addDoc(collection(db, "verses"), newVerse);
      setText('');
      setStyle('glass');
    } catch (err) {
      console.error("Error posting verse:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (verseId: string, currentLikes: string[]) => {
    if (!userProfile) {
      onOpenAuth();
      return;
    }

    const verseRef = doc(db, "verses", verseId);
    const hasLiked = currentLikes.includes(userProfile.uid);

    try {
      await updateDoc(verseRef, {
        likes: hasLiked ? arrayRemove(userProfile.uid) : arrayUnion(userProfile.uid)
      });
    } catch (err) {
      console.error("Error liking verse:", err);
    }
  };

  const getStyleClasses = (cardStyle: 'glass' | 'gold' | 'neon' | 'vintage') => {
    switch (cardStyle) {
      case 'gold':
        return 'glass-card-gold text-emerald-100 hover:scale-[1.02] border-emerald-500/25';
      case 'neon':
        return 'glass-card-neon text-blue-100 hover:scale-[1.02] border-blue-500/20';
      case 'vintage':
        return 'bg-gradient-to-tr from-purple-950/40 to-slate-900/60 backdrop-blur-md border-purple-500/20 text-purple-100 hover:scale-[1.02]';
      default:
        return 'glass-panel text-white hover:scale-[1.02] border-white/10';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-black text-white font-serif mb-2">الجدَارُ الإبْدَاعِي التَّفَاعُلِي</h2>
        <p className="text-xs md:text-sm text-gray-400 max-w-2xl mx-auto">
          مساحة تفاعلية حية تتيح لك مشاركة أبيات من نظمك، أو درر مقتبسة، أو خلجات فكرية سريعة في لوحة زجاجية يشترك في خطها وقراءتها جميع زوار المنصة في ذات اللحظة.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Creator Panel */}
        <div className="lg:col-span-4 rounded-3xl glass-panel p-6 border-white/10 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <Feather className="w-5 h-5 text-blue-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white">خطّ خاطرة جديدة</h3>
          </div>

          <form onSubmit={handlePostVerse} className="space-y-4">
            <div>
              <textarea 
                required
                maxLength={240}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={userProfile ? "اكتب بيت شعر، أو خاطرة، أو حكمة... (حد أقصى 240 حرفاً)" : "الرجاء تسجيل الدخول لتتمكن من الكتابة على الجدار التفاعلي..."}
                disabled={!userProfile}
                rows={4}
                className="w-full p-3 rounded-xl glass-input text-xs font-serif leading-relaxed resize-none"
              />
              <div className="flex justify-between items-center mt-1 text-[10px] text-gray-500">
                <span>{userProfile ? 'متاح للنشر الفوري' : 'يتطلب تسجيل دخول'}</span>
                <span>{text.length}/240</span>
              </div>
            </div>

            {userProfile && (
              <>
                {/* Style Picker */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5">نمط بطاقة العرض</label>
                  <div className="grid grid-cols-4 gap-2">
                    <button 
                      type="button" 
                      onClick={() => setStyle('glass')}
                      className={`py-1.5 text-[10px] font-bold rounded-lg border text-center transition ${style === 'glass' ? 'bg-white/10 border-white/30 text-white' : 'bg-transparent border-white/5 text-gray-400'}`}
                    >
                      زجاجي
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setStyle('gold')}
                      className={`py-1.5 text-[10px] font-bold rounded-lg border text-center transition ${style === 'gold' ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300' : 'bg-transparent border-white/5 text-gray-400'}`}
                    >
                      زمردي
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setStyle('neon')}
                      className={`py-1.5 text-[10px] font-bold rounded-lg border text-center transition ${style === 'neon' ? 'bg-blue-500/15 border-blue-500/40 text-blue-400' : 'bg-transparent border-white/5 text-gray-400'}`}
                    >
                      سماوي
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setStyle('vintage')}
                      className={`py-1.5 text-[10px] font-bold rounded-lg border text-center transition ${style === 'vintage' ? 'bg-purple-500/15 border-purple-500/40 text-purple-400' : 'bg-transparent border-white/5 text-gray-400'}`}
                    >
                      بنفسجي
                    </button>
                  </div>
                </div>

                {/* Accent Color picker */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5">لون خط الهوية</label>
                  <div className="flex items-center gap-3">
                    {['#3b82f6', '#10b981', '#a855f7', '#ec4899', '#ffffff'].map((c) => (
                      <button 
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full border-2 transition ${color === c ? 'border-white scale-125' : 'border-black/50'}`}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {!userProfile ? (
              <button 
                type="button" 
                onClick={onOpenAuth}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition duration-200 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                <span>سجل دخولك لتشاركنا قلمك</span>
              </button>
            ) : (
              <button 
                type="submit"
                disabled={submitting || !text.trim()}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition duration-200 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-1.5"
              >
                <Send className="w-4.5 h-4.5" />
                <span>علقها على الجدار الأدبي</span>
              </button>
            )}
          </form>

          {/* Guidelines info card */}
          <div className="p-3.5 rounded-xl bg-slate-900/40 border border-white/10 text-[11px] text-gray-400 leading-relaxed space-y-1">
            <p className="font-semibold text-emerald-400">🔖 ضوابط جدار الإبداع:</p>
            <p>1. يحق لكل عضو كتابة خلجاته الشعرية أو الفكرية بما يخدم الثقافة والأدب.</p>
            <p>2. يرجى تجنب الإساءة والالتزام بالذوق الرفيع وقواعد البلاغة الموروثة.</p>
          </div>

        </div>

        {/* Verses Board List */}
        <div className="lg:col-span-8 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin mb-3" />
              <span className="text-xs">جاري سحب كتابات الجدار التفاعلي فورياً...</span>
            </div>
          ) : verses.length === 0 ? (
            <div className="p-12 text-center rounded-3xl glass-panel border-dashed border-white/10 text-gray-500">
              <Smile className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p className="text-sm font-semibold">المجلس تفاعلي وهادئ حالياً</p>
              <p className="text-xs mt-1">كن أول من يخط كلمة أو بيت شعر على جدار منبر الصيحة!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {verses.map((v) => {
                  const isLikedByMe = userProfile ? v.likes.includes(userProfile.uid) : false;
                  
                  return (
                    <motion.div 
                      key={v.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className={`p-5 rounded-3xl border flex flex-col justify-between min-h-[160px] shadow-lg transition duration-300 group relative ${getStyleClasses(v.style)}`}
                    >
                      {/* Ribbon / Style accent tag */}
                      <div className="absolute top-0 right-6 w-8 h-1 rounded-b-md" style={{ backgroundColor: v.color }} />

                      {/* Content text */}
                      <div className="mb-4">
                        <p 
                          className="text-sm md:text-base font-serif leading-relaxed"
                          style={{ color: v.color === '#ffffff' ? '#ffffff' : undefined }}
                        >
                          "{v.text}"
                        </p>
                      </div>

                      {/* Author & Footer */}
                      <div className="flex items-center justify-between border-t border-white/10 pt-3 mt-auto">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center text-[10px] text-blue-400 border border-blue-500/20">
                            ✍️
                          </div>
                          <div>
                            <div className="text-[11px] font-bold text-gray-200">{v.authorName}</div>
                            <div className="text-[9px] text-gray-400 font-mono">
                              {new Date(v.createdAt).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>

                        {/* Likes counter */}
                        <button 
                          onClick={() => handleLike(v.id, v.likes)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition duration-200 ${isLikedByMe ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'}`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isLikedByMe ? 'fill-red-500 text-red-500' : ''}`} />
                          <span className="font-mono text-[11px] font-bold">{v.likes.length}</span>
                        </button>
                      </div>

                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
