import React from 'react';
import { motion } from 'motion/react';
import { Feather, Heart, Flame, Sparkles, BookOpen, Quote, Shield } from 'lucide-react';

interface HeroSectionProps {
  onStartWriting: () => void;
  onExploreEvenings: () => void;
  onOpenAiCritique: () => void;
  poetsCount: number;
  articlesCount: number;
}

export default function HeroSection({ 
  onStartWriting, 
  onExploreEvenings, 
  onOpenAiCritique,
  poetsCount,
  articlesCount
}: HeroSectionProps) {
  return (
    <div className="relative overflow-hidden py-12 md:py-20 px-4 border-b border-white/10 bg-slate-950/20">
      
      {/* Background ambient glowing blobs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] -z-10" />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        
        {/* Animated Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
          <span>إعادة بناء رقمية معاصرة ومُتكاملة لموقع الصيحة الأدبي</span>
        </motion.div>

        {/* Main Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-black text-white font-serif tracking-tight leading-tight mb-6"
        >
          مَنْبَــرُ <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-300 to-blue-500">الصَّيْحَة الأدَبِــي</span> الثَّقَـافِي
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8 font-sans"
        >
          فضاء رقمي رحب مكرّس لفرسان الكلمة، نلتقي فيه لنبثّ الروح في قصائد الديوان، ونرسو بجماليات النثر، ونضيء مرافئ الدراسات النقدية المنهجية والأمسيات الوجدانية تحت سقفٍ فنيّ تفاعلي متطوّر.
        </motion.p>

        {/* Call to Actions */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-16"
        >
          <button 
            onClick={onStartWriting}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition"
          >
            انشر قصيدة أو نصاً جديداً
          </button>
          
          <button 
            onClick={onOpenAiCritique}
            className="px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-black hover:bg-emerald-400 text-sm shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition"
          >
            استشر الناقد الأدبي الذكي (AI)
          </button>

          <button 
            onClick={onExploreEvenings}
            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-sm hover:scale-[1.02] active:scale-95 transition"
          >
            الأمسيات الرقمية القادمة
          </button>
        </motion.div>

        {/* Core Features Bento/Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-right">
          
          {/* Stat 1 */}
          <div className="p-5 rounded-2xl glass-panel border-white/10 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 font-semibold">ملف أدبي</span>
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-white font-mono">{articlesCount || 12}</div>
              <div className="text-xs text-gray-400 mt-1">القصائد والدراسات المنشورة</div>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="p-5 rounded-2xl glass-panel border-white/10 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 font-semibold">الأقلام المبدعة</span>
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <Feather className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-white font-mono">{poetsCount || 4}</div>
              <div className="text-xs text-gray-400 mt-1">الأدباء والشعراء المسجلين</div>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="p-5 rounded-2xl glass-panel border-white/10 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 font-semibold">نظام النقد الذكي</span>
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">Gemini 2.5</div>
              <div className="text-xs text-gray-400 mt-1">المراجعة والتحليل الفوري للنصوص</div>
            </div>
          </div>

          {/* Stat 4 */}
          <div className="p-5 rounded-2xl glass-panel border-white/10 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-400 to-blue-500 opacity-100" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-emerald-400 font-semibold">إدارة الصلاحيات</span>
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">أدوار دقيقة</div>
              <div className="text-xs text-gray-400 mt-1">تحكيم وتحرير لكل قسم بشكل مستقل</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
