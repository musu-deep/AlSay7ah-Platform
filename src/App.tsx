import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import { UserProfile, UserRole } from './types';

// Component Imports
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ArticlesSection from './components/ArticlesSection';
import ProseBoard from './components/ProseBoard';
import EveningRoom from './components/EveningRoom';
import AiCritique from './components/AiCritique';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';

import { Sparkles, Calendar, BookOpen, Volume2, Shield } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'home' | 'prose' | 'evenings' | 'critique' | 'admin'>('home');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Stats for the Hero Section
  const [poetsCount, setPoetsCount] = useState(4);
  const [articlesCount, setArticlesCount] = useState(12);

  // 1. Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch custom profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          } else {
            // Setup default member profile if they don't have one
            const defaultProfile: UserProfile = {
              uid: user.uid,
              name: user.displayName || 'أديب زائر',
              email: user.email || 'anonymous@assayha.com',
              role: UserRole.MEMBER,
              joinDate: new Date().toLocaleDateString('ar-EG'),
              avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.uid}`
            };
            await setDoc(doc(db, "users", user.uid), defaultProfile);
            setUserProfile(defaultProfile);
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Database Auto-Seeder
  // Pre-populates Firestore with rich, elegant Arabic literature if currently empty.
  useEffect(() => {
    const seedDatabase = async () => {
      try {
        const articlesSnap = await getDocs(collection(db, "articles"));
        if (articlesSnap.empty) {
          console.log("Seeding initial articles database...");
          
          const seedArticles = [
            {
              title: "عَلى قَدْرِ أَهْلِ العَزْمِ تَأْتِي العَزَائِمُ",
              excerpt: "من عيون الحكمة وشوامخ معلقات ديوان المتنبي، قصيدة الفخر والشهامة وعزم الملوك المأثورة على مر الدهور.",
              content: `عَلى قَدْرِ أَهْلِ العَزْمِ تَأْتِي العَزَائِمُ ... وَتَأْتِي عَلَى قَدْرِ الكِرَامِ المَكَارِمُ
وَتَعْظُمُ فِي عَيْنِ الصَّغِيرِ صِغَارُهَا ... وَتَصْغُرُ فِي عَيْنِ العَظِيمِ العَظَائِمُ

يُكَلِّفُ سَيْفُ الدَّوْلَةِ الجيشَ هَمَّهُ ... وَقَدْ عَجَزَتْ عَنْهُ الجُيُوشُ الخَضَارِمُ
وَيَطْلُبُ عِنْدَ النَّاسِ مَا عِنْدَ نَفْسِهِ ... وَذَلِكَ مَا لا تَدَّعِيهِ الضَّرَاغِمُ

يَفْدِي أَتَمُّ الرَّائِيِينَ سُهَادَهُ ... وَيُهْدِمُ مَا تُبْنَى الحِصُونُ المَهَادِمُ
مَضَى بِكَ جَدٌّ فِي الجِهَادِ مُبَارَكٌ ... كَأَنَّكَ فِيهِ لِلْقُلُوبِ مُلائِمُ`,
              category: "الديوان الشعري",
              authorName: "أبو الطيب المتنبي",
              authorId: "seeder-mutanabbi",
              createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
              likes: ["seed-user-1", "seed-user-2"],
              status: "approved",
              commentsCount: 1
            },
            {
              title: "أصداء بغداد القديمة وتأويل الفقد النثري",
              excerpt: "قراءة وجدانية نثرية تحاكي الموروث العراقي الأصيل، وتستلهم ملامح النخيل الفارع ونهر دجلة الخالد.",
              content: `حين تمرّ الذكرى فوق جسر الشهداء، ينبعث عطر الهيل من دكاكين الصالحية القديمة. بغداد ليست مجرد جغرافيا من طابوق، بل هي قصيدة نثرية طويلة، لم يكتمل سطرها الأخير بعد.

هنا، على حواف نهر دجلة، كتب السياب أجمل أناشيد المطر، وهنا تشبث الجواهري بطين الفرات صارخاً كالموج الهادر. ينساب الماء هادئاً، حاملاً معه أسرار الحكايات والملوك الصالحين الذين خطوا حضارة بمداد الذهب والزعفران.

نحن لا نكتب لأننا نملك الكلمات، بل لأن الكلمات تملكنا، تحاصرنا كأعمدة البيوت البغدادية ذات الشناشيل العتيقة، تهمس في آذاننا برواية عشق لا تنتهي.`,
              category: "مرفأ النثر والقصة القصيرة",
              authorName: "د. عبد السلام الرفاعي",
              authorId: "seeder-rifai",
              createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), // 2 days ago
              likes: ["seed-user-3"],
              status: "approved",
              commentsCount: 0
            },
            {
              title: "بنية القصيدة الحديثة وتناغم البحور الخليلية",
              excerpt: "دراسة نقدية أكاديمية معمقة تبحث في تفكيك قوالب الموسيقى الشعرية التقليدية ومحاولات التجديد المعاصر.",
              content: `تظل القضية الإيقاعية في الشعر العربي المعاصر مثار جدل منهجي واسع بين دعاة الأصالة الخليلية وفرسان التحديث الهيكلي. إن بحور الشعر الخليلية الستة عشر لم تكن قيداً كبّل المعنى بقدر ما كانت دوزاناً فطرياً يتناغم مع الوجدان العربي وروح الصحراء الشاسعة.

في هذه الدراسة، نسلط الضوء على تراجع رقعة التفعيلة لصالح قصيدة النثر، ونبحث فيما إذا كانت الموسيقى الداخلية قادرة على تعويض غياب القافية الرنانة التي صاغت مسامع الأدب لقرون متعاقبة.`,
              category: "الدراسات والقراءات النقدية",
              authorName: "أ.د. منيرة الفاضل",
              authorId: "seeder-fadhil",
              createdAt: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
              likes: ["seed-user-1", "seed-user-4"],
              status: "approved",
              commentsCount: 2
            }
          ];

          for (const art of seedArticles) {
            await addDoc(collection(db, "articles"), art);
          }
        }

        // Seed initial gatherings/evenings if empty
        const eveningsSnap = await getDocs(collection(db, "evenings"));
        if (eveningsSnap.empty) {
          console.log("Seeding initial evenings...");
          const seedEvenings = [
            {
              title: "الأمسية الشعرية الافتتاحية: ديوان دجلة والفرات",
              description: "أمسية شعرية حرة يقرأ فيها نخبة من شعراء منبر الصيحة عيون قصائدهم في حب الوطن وأريج الموروث الوجداني، يعقبها طاولة نقاش نقدية.",
              hostName: "الأستاذ نزار قاسم",
              hostId: "seeder-host-1",
              date: new Date(Date.now() + 3600000 * 24).toISOString(), // Tomorrow
              meetingUrl: "https://meet.jit.si/AlSay7ah-Evening-First#config.startWithVideoMuted=true",
              status: "upcoming",
              attendantCount: 15,
              featuredPoem: {
                title: "أنشودة المطر الخالدة",
                author: "بدر شاكر السياب",
                text: `عيناكِ غابتا نخيلٍ ساعةَ السَّحَر
أو شُرفتانِ راحَ ينأى عنهما القمر
عيناكِ حين تبسمانِ تورقُ الكروم
وترقصُ الأضواءُ.. كالأقمارِ في نهر
يرجّهُ المِجدافُ وهناً ساعةَ السَّحَر
كأنَّما تنبضُ في غوريهما النُّجوم`
              }
            }
          ];

          for (const ev of seedEvenings) {
            await addDoc(collection(db, "evenings"), ev);
          }
        }

        // Seed initial interactive board quotes if empty
        const versesSnap = await getDocs(collection(db, "verses"));
        if (versesSnap.empty) {
          console.log("Seeding initial verses on the interactive board...");
          const seedVerses = [
            {
              text: "أَعزُّ مَكانٍ في الدُّنَى سَرْجُ سَابِحٍ ... وَخَيْرُ جَلِيسٍ في الزَّمَانِ كِتَابُ",
              authorName: "المتنبي",
              authorId: "seeder-mutanabbi",
              createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
              color: "#f59e0b",
              style: "gold",
              likes: ["seed-1"]
            },
            {
              text: "ما أجمل النثر الصادق! إنه يبني في الخيال قلاعاً لا تحطمها عواصف السنين.",
              authorName: "جبران خليل",
              authorId: "seeder-jibran",
              createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
              color: "#3b82f6",
              style: "neon",
              likes: []
            }
          ];

          for (const v of seedVerses) {
            await addDoc(collection(db, "verses"), v);
          }
        }

        // Query collections count to update stats
        const allArticles = await getDocs(collection(db, "articles"));
        setArticlesCount(allArticles.size);

        const allUsers = await getDocs(collection(db, "users"));
        setPoetsCount(Math.max(4, allUsers.size));

      } catch (err) {
        console.error("Auto-seeder error:", err);
      }
    };

    if (!loading) {
      seedDatabase();
    }
  }, [loading]);

  const handleStartWritingRedirect = () => {
    setView('home');
    // Scroll smoothly to articles input/actions
    setTimeout(() => {
      const el = document.getElementById('articles-view-root');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-gray-100 antialiased selection:bg-amber-500/30 selection:text-white">
      
      {/* 1. Header Navigation */}
      <Navbar 
        currentView={view}
        setView={setView}
        userProfile={userProfile}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={() => setUserProfile(null)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* 2. Main Content Section */}
      <main className="flex-grow">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin mb-4" />
            <p className="text-sm font-semibold text-gray-300">يتم الآن تهيئة الفضاء الثقافي لمنبر الصيحة...</p>
          </div>
        ) : (
          <div>
            {/* Page View routers */}
            {view === 'home' && (
              <div id="articles-view-root">
                <HeroSection 
                  onStartWriting={handleStartWritingRedirect}
                  onExploreEvenings={() => setView('evenings')}
                  onOpenAiCritique={() => setView('critique')}
                  poetsCount={poetsCount}
                  articlesCount={articlesCount}
                />
                
                <ArticlesSection 
                  userProfile={userProfile}
                  onOpenAuth={() => setAuthModalOpen(true)}
                  searchQuery={searchQuery}
                />
              </div>
            )}

            {view === 'prose' && (
              <ProseBoard 
                userProfile={userProfile}
                onOpenAuth={() => setAuthModalOpen(true)}
              />
            )}

            {view === 'evenings' && (
              <EveningRoom 
                userProfile={userProfile}
                onOpenAuth={() => setAuthModalOpen(true)}
              />
            )}

            {view === 'critique' && (
              <AiCritique 
                userProfile={userProfile}
                onOpenAuth={() => setAuthModalOpen(true)}
              />
            )}

            {view === 'admin' && userProfile?.role === UserRole.ADMIN && (
              <AdminPanel 
                userProfile={userProfile}
              />
            )}
          </div>
        )}

      </main>

      {/* 3. Global Footer with academic credit lines */}
      <footer className="border-t border-white/5 py-8 bg-slate-950/60 mt-12 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <p className="font-serif text-gray-400">
            «ومن يتهيب صعود الجبال - يعش أبد الدهر بين الحفر » — أبو القاسم الشابي
          </p>
          <div className="flex justify-center items-center gap-4 text-[10px] text-gray-600 font-sans">
            <span>حقوق النشر © {new Date().getFullYear()} منبر الصيحة الأدبي الثقافي</span>
            <span>•</span>
            <span>إعادة تصميم كاملة بهوية بصرية متطورة</span>
          </div>
        </div>
      </footer>

      {/* 4. Login / Fast Demo Center Modal */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(profile) => setUserProfile(profile)}
      />

    </div>
  );
}
