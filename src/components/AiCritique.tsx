import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Sparkles, Feather, BookOpen, Clock, RefreshCw, Send, Quote, AlertTriangle } from 'lucide-react';

interface AiCritiqueProps {
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
}

export default function AiCritique({ userProfile, onOpenAuth }: AiCritiqueProps) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [category, setCategory] = useState('الديوان الشعري');
  const [loading, setLoading] = useState(false);
  const [critique, setCritique] = useState('');
  const [error, setError] = useState('');

  const loadingPhrases = [
    "الناقد الذكي يمعن النظر في موازين الحروف...",
    "يجري تتبع الموسيقى الداخلية والتناغم اللفظي...",
    "يحلل الناقد وجدانيات النص والعمق البلاغي للصور...",
    "يصيغ الناقد توصيات لطيفة لرصانة التركيب اللغوي...",
    "يكتب الناقد بطاقة التقدير التكريمية..."
  ];

  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingPhraseIndex((prev) => (prev + 1) % loadingPhrases.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('الرجاء إدخال النص الأدبي ليتسنى تحليله.');
      return;
    }

    setLoading(true);
    setError('');
    setCritique('');
    setLoadingPhraseIndex(0);

    try {
      const response = await fetch('/api/critique', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          text,
          category,
          authorName: userProfile ? userProfile.name : 'أديب زائر'
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.details || 'فشل الاتصال بالخادم.');
      }

      setCritique(data.critique);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ غير متوقع أثناء الاتصال بالناقد الذكي.');
    } finally {
      setLoading(false);
    }
  };

  // Simple Markdown parser for beautiful rendering of critique sections
  const renderCritiqueText = (rawText: string) => {
    if (!rawText) return null;
    
    // Split by lines
    const lines = rawText.split('\n');
    return lines.map((line, index) => {
      const trimmed = line.trim();
      
      // Headers e.g. ### Title or 1. **Title**
      if (trimmed.startsWith('###') || trimmed.startsWith('##') || trimmed.startsWith('#')) {
        const cleanText = trimmed.replace(/[#*]/g, '').trim();
        return (
          <h4 key={index} className="text-base font-bold text-emerald-400 mt-5 mb-2.5 flex items-center gap-2 border-r-2 border-emerald-500/50 pr-2">
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-500" />
            {cleanText}
          </h4>
        );
      }

      // Main Bold sections like 1. **الجماليات العامة**
      if (/^\d+\.\s*\*\*(.*?)\*\*/.test(trimmed)) {
        const match = trimmed.match(/^\d+\.\s*\*\*(.*?)\*\*(.*)/);
        if (match) {
          return (
            <h4 key={index} className="text-base font-bold text-emerald-400 mt-5 mb-2.5 flex items-center gap-2 border-r-2 border-emerald-500/50 pr-2">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-500" />
              {match[1]} <span className="text-xs text-gray-300 font-normal">{match[2]}</span>
            </h4>
          );
        }
      }

      // Check for bullet points
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const cleanText = trimmed.substring(1).replace(/\*\*/g, '').trim();
        return (
          <div key={index} className="flex items-start gap-2.5 my-1.5 mr-4 text-sm text-gray-200 leading-relaxed">
            <span className="text-emerald-500 shrink-0 mt-1.5">•</span>
            <span>{cleanText}</span>
          </div>
        );
      }

      // Regular lines with potential inline **bold**
      if (trimmed === '') return <div key={index} className="h-2" />;

      // Support bold replacement in general lines
      let formattedLine: React.ReactNode = trimmed;
      if (trimmed.includes('**')) {
        const parts = trimmed.split('**');
        formattedLine = parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-emerald-300 font-semibold">{part}</strong> : part);
      }

      return (
        <p key={index} className="text-sm text-gray-300 leading-relaxed my-2 mr-1">
          {formattedLine}
        </p>
      );
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Introduction */}
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-black text-white font-serif mb-2">مَجلِس النَّقد الأدبي الذَّكي</h2>
        <p className="text-xs md:text-sm text-gray-400 max-w-2xl mx-auto">
          مستشار لغوي ونقدي متاح على مدار الساعة مدعوم بنماذج الذكاء الاصطناعي المتقدمة من Google لتقديم قراءة رصينة وتحليل دقيق وتوجيه أدبي بنّاء لإبداعاتك الشعرية والنثرية.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Input Panel */}
        <div className="lg:col-span-5 rounded-3xl glass-panel p-6 border-white/10 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
            <Feather className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">اعرض إبداعك الأدبي</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">عنوان النص الأدبي</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: ترانيم على ضفاف دجلة" 
                className="w-full p-2.5 rounded-xl glass-input text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">النوع الأدبي</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl glass-input text-xs text-white"
                >
                  <option value="الديوان الشعري">ديوان الشعر (فصيح/نبطي)</option>
                  <option value="مرفأ النثر والقصة القصيرة">مرفأ النثر والقصة</option>
                  <option value="الدراسات والقراءات النقدية">دراسة نقدية</option>
                  <option value="آفاق فكرية وحوارات">خاطرة/مقالة فكرية</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">صاحب القلم</label>
                <input 
                  type="text" 
                  disabled
                  value={userProfile ? userProfile.name : 'عضو زائر'} 
                  className="w-full p-2.5 rounded-xl glass-input text-xs bg-slate-900/40 text-gray-400 border-white/10 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-gray-400">متن النص المقترح</label>
                <span className="text-[10px] text-gray-500">{text.length} حرفاً</span>
              </div>
              <textarea 
                required
                rows={10}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="اكتب هنا أبيات قصيدتك، أو مقتطفات من نصك النثري، أو فصول خاطرتك..."
                className="w-full p-3.5 rounded-xl glass-input text-xs font-serif leading-relaxed resize-none"
              />
            </div>

            {error && (
              <div className="p-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!userProfile && (
              <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-center space-y-2">
                <p className="text-[11px] text-gray-300">أنت تتصفح كزائر، يمكنك تجربة الناقد الذكي الآن، أو تسجيل الدخول لحفظ مقالاتك في المنصة.</p>
                <button 
                  type="button" 
                  onClick={onOpenAuth}
                  className="text-xs text-blue-400 font-bold hover:underline"
                >
                  تسجيل الدخول / الانضمام للمجلس ⟵
                </button>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading || !text.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-xs transition duration-200 active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>الناقد يتفحص ثنايا النص...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>عرض النص على الناقد الذكي</span>
                </>
              )}
            </button>
          </form>

        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7 rounded-3xl border border-emerald-500/20 glass-panel p-6 shadow-lg shadow-emerald-500/5 space-y-5 min-h-[500px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-emerald-500/10 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-400">صحيفة القراءة النقدية</h3>
                  <p className="text-[10px] text-gray-400">التحليل التفصيلي والتقييم اللغوي</p>
                </div>
              </div>
              <div className="text-[10px] font-mono text-gray-400 bg-slate-950/40 px-2 py-1 rounded-md border border-white/10">
                تحكيم المنبر
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin" />
                  <Feather className="absolute inset-4 w-8 h-8 text-emerald-400 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-white font-medium animate-pulse">{loadingPhrases[loadingPhraseIndex]}</p>
                  <p className="text-xs text-gray-500">هذه العملية قد تستغرق من 5 إلى 10 ثوانٍ لصياغة نقد رفيع المستوى</p>
                </div>
              </div>
            ) : critique ? (
              <div className="space-y-4 font-serif leading-relaxed text-gray-200">
                {renderCritiqueText(critique)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                <div className="p-4 bg-slate-950/40 rounded-full border border-white/10 text-gray-600">
                  <Quote className="w-10 h-10" />
                </div>
                <div className="max-w-sm">
                  <p className="text-sm font-bold text-gray-300">لم يتم تقديم أي نصوص بعد</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    اكتب قصيدتك أو نصك النثري في الحقل المجاور، ثم انقر على "عرض النص" لتحصل على مراجعة نقدية تفصيلية مبنية على قواعد البلاغة، الموسيقى، والبيان.
                  </p>
                </div>
              </div>
            )}
          </div>

          {critique && !loading && (
            <div className="pt-4 border-t border-emerald-500/10 text-center text-[10px] text-gray-500">
              ملاحظة: النقد الأدبي مُولَّد بالكامل بالذكاء الاصطناعي لمساعدتك على صقل موهبتك وإثراء كتاباتك قبل النشر الفعلي.
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
