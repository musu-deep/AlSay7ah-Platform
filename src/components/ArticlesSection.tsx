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
  deleteDoc,
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';
import { UserProfile, UserRole, Article, Comment } from '../types';
import { 
  BookOpen, 
  Feather, 
  Heart, 
  MessageSquare, 
  Plus, 
  X, 
  Send, 
  Trash2, 
  Search,
  BookMarked,
  Filter,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface ArticlesSectionProps {
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
  searchQuery: string;
}

export default function ArticlesSection({ userProfile, onOpenAuth, searchQuery }: ArticlesSectionProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  
  // Full article overlay reader
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  // Submit article form state
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('الديوان الشعري');
  const [successMsg, setSuccessMsg] = useState('');

  const categories = [
    'الكل',
    'الديوان الشعري',
    'مرفأ النثر والقصة القصيرة',
    'الدراسات والقراءات النقدية',
    'آفاق فكرية وحوارات'
  ];

  // 1. Fetch Approved Articles in Real-Time
  useEffect(() => {
    const q = query(collection(db, "articles"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Article[] = [];
      snapshot.forEach((doc) => {
        const art = { id: doc.id, ...doc.data() } as Article;
        if (art.status === 'approved' || art.status === 'featured') {
          fetched.push(art);
        }
      });
      setArticles(fetched);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch Comments for Active Article in Real-Time
  useEffect(() => {
    if (!activeArticle) return;

    const q = query(
      collection(db, "articles", activeArticle.id, "comments"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Comment[] = [];
      snapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as Comment);
      });
      setComments(fetched);
    }, (err) => {
      console.error(err);
    });

    return () => unsubscribe();
  }, [activeArticle?.id]);

  const handlePostArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    // Permissions logic
    const canPublishDirectly = userProfile.role === UserRole.ADMIN || 
      (userProfile.role === UserRole.EDITOR && userProfile.sections?.includes(category));
    
    const initialStatus = canPublishDirectly ? 'approved' : 'pending';

    try {
      const newArt = {
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt.trim() || (content.substring(0, 150) + '...'),
        category,
        authorId: userProfile.uid,
        authorName: userProfile.name,
        createdAt: new Date().toISOString(),
        likes: [],
        status: initialStatus,
        commentsCount: 0
      };

      await addDoc(collection(db, "articles"), newArt);
      
      if (initialStatus === 'pending') {
        setSuccessMsg("تم رفع مقالك بنجاح. هو بانتظار مراجعة واعتماد رئيس التحرير ليظهر بالرئيسية.");
      } else {
        setSuccessMsg("تهانينا! تم نشر قصيدتك/مقالك بنجاح على منبر الصيحة.");
      }

      setTimeout(() => {
        setShowWriteModal(false);
        setSuccessMsg('');
        setTitle('');
        setContent('');
        setExcerpt('');
      }, 3000);
    } catch (err) {
      console.error("Error creating article:", err);
    }
  };

  const handleLikeArticle = async (e: React.MouseEvent, artId: string, currentLikes: string[]) => {
    e.stopPropagation();
    if (!userProfile) {
      onOpenAuth();
      return;
    }

    const artRef = doc(db, "articles", artId);
    const hasLiked = currentLikes.includes(userProfile.uid);

    try {
      await updateDoc(artRef, {
        likes: hasLiked ? arrayRemove(userProfile.uid) : arrayUnion(userProfile.uid)
      });
      
      // If full article reader is open, update local state
      if (activeArticle && activeArticle.id === artId) {
        setActiveArticle({
          ...activeArticle,
          likes: hasLiked 
            ? activeArticle.likes.filter(id => id !== userProfile.uid)
            : [...activeArticle.likes, userProfile.uid]
        });
      }
    } catch (err) {
      console.error("Error liking article:", err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeArticle || !userProfile) return;

    try {
      const commentColl = collection(db, "articles", activeArticle.id, "comments");
      await addDoc(commentColl, {
        articleId: activeArticle.id,
        authorId: userProfile.uid,
        authorName: userProfile.name,
        authorRole: userProfile.role,
        content: newCommentText.trim(),
        createdAt: new Date().toISOString()
      });

      // Update comment count on parent article
      const artRef = doc(db, "articles", activeArticle.id);
      await updateDoc(artRef, {
        commentsCount: (activeArticle.commentsCount || 0) + 1
      });

      // Update local state reader count
      setActiveArticle({
        ...activeArticle,
        commentsCount: (activeArticle.commentsCount || 0) + 1
      });

      setNewCommentText('');
    } catch (err) {
      console.error("Error posting comment:", err);
    }
  };

  const handleDeleteArticle = async (e: React.MouseEvent, artId: string, authorId: string, artCategory: string) => {
    e.stopPropagation();
    
    // Check delete permission
    const isOwner = userProfile?.uid === authorId;
    const isAdmin = userProfile?.role === UserRole.ADMIN;
    const isSectionEditor = userProfile?.role === UserRole.EDITOR && userProfile?.sections?.includes(artCategory);

    if (!isOwner && !isAdmin && !isSectionEditor) {
      alert("عذراً، لا تمتلك الصلاحية الكافية لحذف هذا النص.");
      return;
    }

    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذا النص الأدبي بشكل نهائي؟")) return;

    try {
      await deleteDoc(doc(db, "articles", artId));
      if (activeArticle?.id === artId) {
        setActiveArticle(null);
      }
    } catch (err) {
      console.error("Delete article error:", err);
    }
  };

  // Filter & Search logic
  const filteredArticles = articles.filter((a) => {
    const matchesCategory = selectedCategory === 'الكل' || a.category === selectedCategory;
    const matchesSearch = searchQuery.trim() === '' || 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Search and Filters Hub */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/10 pb-6 mb-8">
        
        {/* Category Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none pr-1">
          <Filter className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />
          {categories.map((cat) => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${selectedCategory === cat ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-slate-950/20 border border-white/10 text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Create Post Action */}
        <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
          {userProfile ? (
            <button 
              onClick={() => setShowWriteModal(true)}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition active:scale-95 shadow-md shadow-blue-500/10"
            >
              <Plus className="w-4 h-4" />
              <span>انشر قصيدة أو دراسة</span>
            </button>
          ) : (
            <button 
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-emerald-400 hover:text-emerald-300 hover:bg-white/10 text-xs font-bold transition"
            >
              <span>انضم لكتابة النصوص</span>
            </button>
          )}
        </div>

      </div>

      {/* Main Articles Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin mb-3" />
          <span className="text-xs font-medium">جاري رصّ الأبيات وفهرسة المقالات...</span>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="py-20 text-center rounded-2xl glass-panel border-dashed border-white/10 max-w-md mx-auto text-gray-500">
          <BookMarked className="w-10 h-10 mx-auto mb-3 text-gray-600 animate-pulse" />
          <p className="text-sm font-bold">لم نعثر على كتابات أدبية هنا</p>
          <p className="text-xs mt-1 leading-relaxed">
            {searchQuery ? "حاول البحث بكلمات دلالية أخرى، أو " : "كن البادئ و"}انشر نصك الأدبي الأول ليشاركه النقاد والجمهور!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((art) => {
            const hasLiked = userProfile ? art.likes.includes(userProfile.uid) : false;
            
            return (
              <div 
                key={art.id}
                onClick={() => setActiveArticle(art)}
                className="rounded-3xl glass-panel glass-panel-hover p-6 border-white/10 cursor-pointer flex flex-col justify-between group h-[270px] relative overflow-hidden transition duration-300"
              >
                {/* Glowing Top line indicator on Hover */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div>
                  {/* Category & Date */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2.5 py-0.5 rounded-full">
                      {art.category}
                    </span>
                    <span className="text-[9px] text-gray-500 font-mono">
                      {new Date(art.createdAt).toLocaleDateString('ar-EG')}
                    </span>
                  </div>

                  {/* Title & Excerpt */}
                  <h3 className="text-base font-black text-white font-serif mb-2 group-hover:text-emerald-400 transition leading-tight">
                    {art.title}
                  </h3>
                  <p className="text-xs text-gray-300 line-clamp-4 leading-relaxed font-serif">
                    {art.excerpt}
                  </p>
                </div>

                {/* Card Footer: Author + Likes/Comments */}
                <div className="flex items-center justify-between border-t border-white/10 pt-3.5 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6.5 h-6.5 rounded bg-blue-500/10 flex items-center justify-center text-blue-400 text-[10px] font-bold">
                      ✒️
                    </div>
                    <span className="text-[11px] font-bold text-gray-200">{art.authorName}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Likes */}
                    <button 
                      onClick={(e) => handleLikeArticle(e, art.id, art.likes)}
                      className={`flex items-center gap-1.5 text-xs transition hover:text-red-400 ${hasLiked ? 'text-red-400' : 'text-gray-400'}`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      <span className="font-mono text-[11px]">{art.likes.length}</span>
                    </button>

                    {/* Comments */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="font-mono text-[11px]">{art.commentsCount || 0}</span>
                    </div>

                    {/* Delete option for authorized hosts */}
                    {(userProfile?.uid === art.authorId || userProfile?.role === UserRole.ADMIN || (userProfile?.role === UserRole.EDITOR && userProfile?.sections?.includes(art.category))) && (
                      <button 
                        onClick={(e) => handleDeleteArticle(e, art.id, art.authorId, art.category)}
                        className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition"
                        title="حذف هذا النص"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* FULL SCREEN OVERLAY READER & LIVE COMMENTS */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-4xl overflow-hidden rounded-3xl glass-panel border-white/20 flex flex-col md:flex-row h-[85vh]">
            
            {/* Left Column (Spans 60% width): Text Content */}
            <div className="w-full md:w-3/5 p-6 md:p-8 overflow-y-auto flex flex-col justify-between border-b md:border-b-0 md:border-l border-white/10">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-3 py-1 rounded-full">
                    {activeArticle.category}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    نُشر في: {new Date(activeArticle.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>

                <h2 className="text-xl md:text-2xl font-black text-white font-serif mb-4 leading-snug">
                  {activeArticle.title}
                </h2>
                
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold text-xs">
                    ✍️
                  </div>
                  <div>
                    <div className="text-xs font-black text-gray-200">{activeArticle.authorName}</div>
                    <div className="text-[10px] text-gray-400">أقلام منبر الصيحة المعتمدة</div>
                  </div>
                </div>

                {/* Core Literary Content body */}
                <div className="text-base text-gray-100 font-serif whitespace-pre-line leading-loose tracking-wide pr-3 border-r border-emerald-500/20">
                  {activeArticle.content}
                </div>
              </div>

              {/* Reader footer */}
              <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-8">
                <button 
                  onClick={(e) => handleLikeArticle(e, activeArticle.id, activeArticle.likes)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition duration-200 ${activeArticle.likes.includes(userProfile?.uid || '') ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-white/5 text-gray-400 hover:text-white border-transparent'}`}
                >
                  <Heart className={`w-4 h-4 ${activeArticle.likes.includes(userProfile?.uid || '') ? 'fill-red-500 text-red-500' : ''}`} />
                  <span>أعجبني هذا النص ({activeArticle.likes.length})</span>
                </button>

                <button 
                  onClick={() => setActiveArticle(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-gray-300 hover:text-white text-xs font-bold transition"
                >
                  إغلاق القراءة
                </button>
              </div>

            </div>

            {/* Right Column (Spans 40% width): Live Instant Comments Feed */}
            <div className="w-full md:w-2/5 p-5 md:p-6 flex flex-col justify-between overflow-hidden bg-slate-950/40">
              
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-3.5 mb-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4.5 h-4.5 text-blue-400 animate-pulse" />
                      <h3 className="text-sm font-bold text-white">التعليقات والمناظرة الحية</h3>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {comments.length} تعليق فوري
                    </span>
                  </div>

                  {/* Scrollable list of comments */}
                  <div className="space-y-4 overflow-y-auto max-h-[45vh] pr-1">
                    {comments.length === 0 ? (
                      <div className="py-16 text-center text-gray-500 space-y-1">
                        <HelpCircle className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                        <p className="text-xs font-semibold text-gray-400">لا توجد تعليقات فورية</p>
                        <p className="text-[10px]">كن أول من يثري هذا النص برأيه البليغ ونقده!</p>
                      </div>
                    ) : (
                      comments.map((c) => (
                        <div key={c.id} className="text-right space-y-1">
                          <div className="flex items-baseline justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-emerald-400">{c.authorName}</span>
                              {c.authorRole === UserRole.ADMIN && (
                                <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[8px] px-1.5 py-0.2 rounded font-black">إدارة</span>
                              )}
                              {c.authorRole === UserRole.EDITOR && (
                                <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] px-1.5 py-0.2 rounded font-black">محرر</span>
                              )}
                            </div>
                            <span className="text-[9px] text-gray-500 font-mono">
                              {new Date(c.createdAt).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-200 bg-slate-900/50 p-2.5 rounded-xl border border-white/10 leading-relaxed">
                            {c.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Instant comment input box */}
                <form onSubmit={handlePostComment} className="pt-4 border-t border-white/10 mt-4">
                  {userProfile ? (
                    <div className="relative">
                      <input 
                        type="text" 
                        required
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="اكتب تعقيباً لغوياً أو ثناءً بليغاً..." 
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl glass-input text-xs"
                      />
                      <button 
                        type="submit"
                        className="absolute left-2 top-2 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-2 bg-slate-900/40 rounded-xl border border-white/10">
                      <button 
                        type="button" 
                        onClick={onOpenAuth}
                        className="text-xs text-emerald-400 hover:underline font-bold"
                      >
                        انضم للمجلس لتتمكن من التعليق ⟵
                      </button>
                    </div>
                  )}
                </form>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* PUBLISH MODAL */}
      {showWriteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl glass-panel border-white/20 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Feather className="w-5 h-5 text-blue-400" />
                <span>تسجيل ونشر إبداع أدبي جديد</span>
              </h3>
              <button 
                onClick={() => setShowWriteModal(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                إغلاق ✕
              </button>
            </div>

            {successMsg ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-center space-y-2 py-10 animate-pulse">
                <CheckCircle className="w-10 h-10 mx-auto animate-bounce" />
                <h4 className="font-bold text-sm">تم تسجيل المقال بنجاح</h4>
                <p className="text-xs max-w-md mx-auto leading-relaxed">{successMsg}</p>
              </div>
            ) : (
              <form onSubmit={handlePostArticle} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 mb-1">عنوان النص الكريم</label>
                    <input 
                      type="text" 
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="مثال: من وحي بغداد الحزينة"
                      className="w-full p-2.5 rounded-xl glass-input text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">القسم المستهدف</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2.5 rounded-xl glass-input text-xs"
                    >
                      <option value="الديوان الشعري">الديوان الشعري</option>
                      <option value="مرفأ النثر والقصة القصيرة">مرفأ النثر والقصة القصيرة</option>
                      <option value="الدراسات والقراءات النقدية">الدراسات والقراءات النقدية</option>
                      <option value="آفاق فكرية وحوارات">آفاق فكرية وحوارات</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">خلاصة أو مقدمة قصيرة (يظهر في المعاينة - اختياري)</label>
                  <input 
                    type="text" 
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="اكتب فكرة ملخصة سريعة في سطرين لشد انتباه القراء..."
                    className="w-full p-2.5 rounded-xl glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">متن النص / الأبيات الشعرية</label>
                  <textarea 
                    required
                    rows={12}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="اكتب قصيدتك أو مقالتك هنا بطريقة فنية رصينة ومتقنة..."
                    className="w-full p-3.5 rounded-xl glass-input text-xs font-serif leading-loose"
                  />
                </div>

                <div className="p-3 bg-slate-900/40 rounded-xl border border-white/10 text-[10px] text-gray-400 leading-relaxed">
                  ⚠️ صلاحية النشر: بصفتك <span className="text-emerald-400 font-bold">{(userProfile?.role === UserRole.ADMIN || userProfile?.role === UserRole.EDITOR) ? 'مشرف / رئيس تحرير' : 'كاتب ومؤلف مبرز'}</span>، { (userProfile?.role === UserRole.ADMIN || userProfile?.role === UserRole.EDITOR) ? 'سيتم نشر هذا النص مباشرة وبشكل فوري على واجهة المنصة لعموم القراء.' : 'سيخضع نصك لفلترة المراجعة والتحكيم الأدبي من قبل طاقم التحرير لضمان الرصانة والوزن قبل نشره علناً.'}
                </div>

                <div className="flex gap-3 justify-end border-t border-white/10 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowWriteModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 text-xs font-bold transition"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shadow-blue-500/20"
                  >
                    إرسال ونشر العمل الأدبي
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
