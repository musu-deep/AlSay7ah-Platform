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
  arrayUnion
} from 'firebase/firestore';
import { UserProfile, UserRole, CultureEvening } from '../types';
import { 
  Video, 
  Users, 
  Calendar, 
  PlusCircle, 
  Clock, 
  Sparkles, 
  BookOpen, 
  Send, 
  Info, 
  Mic, 
  X,
  Volume2
} from 'lucide-react';

interface EveningRoomProps {
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
}

export interface SalonMessage {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export default function EveningRoom({ userProfile, onOpenAuth }: EveningRoomProps) {
  const [evenings, setEvenings] = useState<CultureEvening[]>([]);
  const [activeEvening, setActiveEvening] = useState<CultureEvening | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [meetingRoom, setMeetingRoom] = useState('');
  const [poemTitle, setPoemTitle] = useState('');
  const [poemText, setPoemText] = useState('');
  const [poemAuthor, setPoemAuthor] = useState('');

  // Salon Chat states
  const [chatMessages, setChatMessages] = useState<SalonMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');

  // 1. Fetch evenings in real-time
  useEffect(() => {
    const q = query(collection(db, "evenings"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: CultureEvening[] = [];
      snapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as CultureEvening);
      });
      setEvenings(fetched);
      setLoading(false);
      
      // If active evening is open, keep its state updated
      if (activeEvening) {
        const updated = fetched.find(e => e.id === activeEvening.id);
        if (updated) setActiveEvening(updated);
      }
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeEvening?.id]);

  // 2. Fetch Chat messages for active evening in real-time
  useEffect(() => {
    if (!activeEvening) return;

    const q = query(
      collection(db, "evenings", activeEvening.id, "chat"), 
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMsgs: SalonMessage[] = [];
      snapshot.forEach((doc) => {
        fetchedMsgs.push({ id: doc.id, ...doc.data() } as SalonMessage);
      });
      setChatMessages(fetchedMsgs);
    }, (err) => {
      console.error("Chat fetch error:", err);
    });

    return () => unsubscribe();
  }, [activeEvening?.id]);

  const handleCreateEvening = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    try {
      const room = meetingRoom.trim() || `AlSay7ah-Salon-${Math.floor(Math.random() * 10000)}`;
      const jitsiUrl = `https://meet.jit.si/${room}#config.startWithVideoMuted=true&config.startWithAudioMuted=true`;

      const newEvening: Omit<CultureEvening, 'id'> = {
        title: title.trim(),
        description: description.trim(),
        hostName: userProfile.name,
        hostId: userProfile.uid,
        date,
        meetingUrl: jitsiUrl,
        status: 'upcoming',
        attendantCount: 0,
        featuredPoem: poemTitle.trim() ? {
          title: poemTitle.trim(),
          text: poemText.trim(),
          author: poemAuthor.trim() || userProfile.name
        } : undefined
      };

      await addDoc(collection(db, "evenings"), newEvening);
      setShowCreateModal(false);
      
      // Clear form
      setTitle('');
      setDescription('');
      setDate('');
      setMeetingRoom('');
      setPoemTitle('');
      setPoemText('');
      setPoemAuthor('');
    } catch (err) {
      console.error("Error creating evening:", err);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'upcoming' | 'live' | 'completed') => {
    try {
      const ref = doc(db, "evenings", id);
      await updateDoc(ref, { status: newStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeEvening || !userProfile) return;

    try {
      const chatRef = collection(db, "evenings", activeEvening.id, "chat");
      await addDoc(chatRef, {
        authorName: userProfile.name,
        content: newMsg.trim(),
        createdAt: new Date().toISOString()
      });
      setNewMsg('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinEveningRoom = async (evening: CultureEvening) => {
    setActiveEvening(evening);
    // Increment attendance count
    try {
      const ref = doc(db, "evenings", evening.id);
      await updateDoc(ref, {
        attendantCount: (evening.attendantCount || 0) + 1
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLeaveEveningRoom = () => {
    setActiveEvening(null);
    setChatMessages([]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* If no active evening video session is playing */}
      {!activeEvening ? (
        <div>
          {/* Header */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/10 pb-6 mb-8">
            <div className="text-right">
              <h2 className="text-2xl md:text-3xl font-black text-white font-serif mb-1.5 flex items-center gap-2">
                <Video className="w-8 h-8 text-blue-400 animate-pulse" />
                <span>صالون الصيحة واللقاءات الرقمية</span>
              </h2>
              <p className="text-xs text-gray-400">
                منصة رقمية متكاملة لتقريب الأفكار واللقاءات المباشرة، لمناقشة الدواوين وقراءة نقدية للمؤلفات بالصوت والصورة.
              </p>
            </div>

            {userProfile && (userProfile.role === UserRole.ADMIN || userProfile.role === UserRole.EDITOR) && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition active:scale-95 shadow-lg shadow-blue-500/20"
              >
                <PlusCircle className="w-4.5 h-4.5" />
                <span>جدولة أمسية ثقافية جديدة</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin mb-3" />
              <span className="text-xs font-semibold">تحميل مجلس الأمسيات...</span>
            </div>
          ) : evenings.length === 0 ? (
            <div className="p-12 text-center rounded-3xl glass-panel border-dashed border-white/10 text-gray-500 max-w-md mx-auto">
              <Video className="w-10 h-10 mx-auto mb-3 text-gray-600" />
              <p className="text-sm font-bold">لا توجد أمسيات مجدولة حالياً</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                صالون الصيحة ينظم لقاءات أسبوعية بحضور كبار النقاد. سيقوم مدير عام المنصة أو المحررين بجدولة اللقاء القادم قريباً.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {evenings.map((ev) => (
                <div key={ev.id} className="rounded-3xl glass-panel p-6 border-white/10 flex flex-col justify-between hover:border-blue-500/20 transition duration-300">
                  <div>
                    {/* Status badge */}
                    <div className="flex justify-between items-center mb-4">
                      {ev.status === 'live' ? (
                        <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-black text-red-400 bg-red-500/10 border border-red-500/25 rounded-full animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          مباشر الآن
                        </span>
                      ) : ev.status === 'completed' ? (
                        <span className="px-2.5 py-1 text-[10px] font-bold text-gray-400 bg-gray-500/10 border border-gray-500/20 rounded-full">
                          انتهى اللقاء
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                          قادم قريباً
                        </span>
                      )}

                      <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
                        <Users className="w-3.5 h-3.5 text-gray-500" />
                        <span>{ev.attendantCount || 0} حضور</span>
                      </div>
                    </div>

                    <h3 className="text-base font-black text-white font-serif mb-2">{ev.title}</h3>
                    <p className="text-xs text-gray-300 line-clamp-3 mb-4 leading-relaxed">{ev.description}</p>
                    
                    {ev.featuredPoem && (
                      <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/15 mb-4 text-right">
                        <div className="flex items-center gap-1.5 text-[10px] text-blue-400 font-bold mb-1">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>القصيدة المقررة للإلقاء والمناقشة:</span>
                        </div>
                        <p className="text-xs font-bold text-gray-200">«{ev.featuredPoem.title}»</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">بقلم: {ev.featuredPoem.author}</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-white/10 pt-4 mt-auto">
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 font-sans">
                      <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>{new Date(ev.date).toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'short' })}</span>
                    </div>

                    {/* Actions based on role and status */}
                    <div className="flex gap-2">
                      {ev.status === 'live' ? (
                        <button 
                          onClick={() => handleJoinEveningRoom(ev)}
                          className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/5"
                        >
                          <Mic className="w-4 h-4 animate-bounce" />
                          <span>انضم للمجلس المباشر</span>
                        </button>
                      ) : (
                        <button 
                          disabled={ev.status === 'completed'}
                          onClick={() => handleJoinEveningRoom(ev)}
                          className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                        >
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span>تصفح الصالون</span>
                        </button>
                      )}

                      {userProfile && (userProfile.role === UserRole.ADMIN || ev.hostId === userProfile.uid) && (
                        <div className="flex gap-1.5">
                          {ev.status === 'upcoming' && (
                            <button 
                              onClick={() => handleUpdateStatus(ev.id, 'live')}
                              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
                            >
                              بدء البث
                            </button>
                          )}
                          {ev.status === 'live' && (
                            <button 
                              onClick={() => handleUpdateStatus(ev.id, 'completed')}
                              className="px-3.5 py-2 rounded-xl bg-gray-600 hover:bg-gray-500 text-white font-bold text-xs transition"
                            >
                              إنهاء اللقاء
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Active Evening Gathering Room (Embedded Jitsi + Live Chat + Poem Board) */
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="text-right">
              <button 
                onClick={handleLeaveEveningRoom}
                className="text-xs text-amber-400 hover:underline mb-2 flex items-center gap-1"
              >
                ← العودة إلى قائمة الأمسيات
              </button>
              <h2 className="text-xl md:text-2xl font-black text-white font-serif flex items-center gap-2">
                <Volume2 className="w-6 h-6 text-red-500 animate-pulse" />
                <span>{activeEvening.title}</span>
              </h2>
              <p className="text-xs text-gray-400">مستضاف بواسطة: الأديب {activeEvening.hostName}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold rounded-xl animate-pulse flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                صالون مباشر
              </span>
              <button 
                onClick={handleLeaveEveningRoom}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left Col (8 spans): Video & Recitations */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Remote Video Container - Embeds Jitsi meet beautifully */}
              <div className="rounded-2xl overflow-hidden glass-panel border-white/5 bg-slate-950/60 aspect-video relative flex flex-col justify-between">
                {activeEvening.status === 'live' ? (
                  <iframe 
                    src={activeEvening.meetingUrl}
                    title="صالون الصيحة الثقافي - لقاء مرئي ومسموع"
                    allow="camera; microphone; fullscreen; display-capture"
                    className="w-full h-full border-0 rounded-2xl"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-4 bg-slate-950/80">
                    <Mic className="w-12 h-12 text-gray-600 animate-bounce" />
                    <div>
                      <h3 className="text-base font-bold text-gray-300">مجلس الأمسية لم يبدأ بثه بعد</h3>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 leading-relaxed">
                        سيقوم المضيف ببدء اللقاء الصوتي والمرئي من خلال زر البدء في لوحة الإشراف. تفضل بالمشاركة في الدردشة الجانبية وقراءة القصائد المقررة في الانتظار.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Featured Poem Card for recital */}
              {activeEvening.featuredPoem && (
                <div className="rounded-2xl glass-card-gold p-6 border-amber-500/10">
                  <div className="flex items-center gap-2 mb-4 border-b border-amber-500/15 pb-3">
                    <BookOpen className="w-5 h-5 text-amber-500" />
                    <h3 className="text-sm font-bold text-amber-400">النص المقرر للإلقاء والمناقشة بالأمسية</h3>
                  </div>
                  <div className="text-center font-serif leading-relaxed max-w-xl mx-auto space-y-4">
                    <h4 className="text-lg font-black text-white">« {activeEvening.featuredPoem.title} »</h4>
                    <p className="text-xs text-gray-400 mb-4">بقلم الشاعر: {activeEvening.featuredPoem.author}</p>
                    
                    {/* Poem text split into lines for aesthetic classical formatting */}
                    <div className="text-base text-gray-200 tracking-wide font-medium whitespace-pre-line leading-loose inline-block text-right border-r border-blue-500/30 pr-4">
                      {activeEvening.featuredPoem.text}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Right Col (4 spans): Live Salon chat */}
            <div className="lg:col-span-4 rounded-3xl glass-panel border-white/10 flex flex-col justify-between max-h-[600px]">
              
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-950/20 rounded-t-3xl">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <h3 className="text-xs font-bold text-white">مجلس النقاش والتفاعل الفوري</h3>
                </div>
                <span className="text-[10px] text-gray-400">{chatMessages.length} رسالة</span>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-[350px]">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-600">
                    <Info className="w-5 h-5 mb-1.5 text-gray-500" />
                    <span className="text-xs leading-relaxed max-w-[180px]">الدردشة هادئة حالياً. اكتب تعليقاً أو صفق للشاعر لإثراء الحفل!</span>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="text-right">
                      <div className="flex items-baseline justify-between mb-0.5">
                        <span className="text-[11px] font-bold text-blue-400">{msg.authorName}</span>
                        <span className="text-[9px] font-mono text-gray-400">
                          {new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-200 bg-slate-900/40 p-2.5 rounded-xl border border-white/10 leading-relaxed inline-block max-w-full">
                        {msg.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChatMessage} className="p-3 border-t border-white/10 bg-slate-950/30 rounded-b-3xl">
                {userProfile ? (
                  <div className="relative">
                    <input 
                      type="text" 
                      required
                      value={newMsg}
                      onChange={(e) => setNewMsg(e.target.value)}
                      placeholder="صفق للشاعر، شارك بفكرة، أو علق على الوزن..." 
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl glass-input text-xs"
                    />
                    <button 
                      type="submit"
                      className="absolute left-2 top-2 p-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shadow-md shadow-blue-500/25"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <button 
                      type="button" 
                      onClick={onOpenAuth}
                      className="text-xs text-blue-400 hover:underline font-semibold"
                    >
                      سجل الدخول للمشاركة في الدردشة المباشرة
                    </button>
                  </div>
                )}
              </form>

            </div>

          </div>

        </div>
      )}

      {/* CREATE GATHERING MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl glass-panel border-white/10 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-blue-400" />
                <span>جدولة صالون / أمسية رقمية جديدة</span>
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                إغلاق ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvening} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">عنوان الأمسية</label>
                  <input 
                    type="text" 
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: أمسية ديوان المتنبي ونقد الحواشي"
                    className="w-full p-2.5 rounded-xl glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">موعد الانطلاق (تاريخ ووقت)</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl glass-input text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">وصف الأمسية ومحاور النقاش</label>
                <textarea 
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب نبذة عن اللقاء، ومن هم الضيوف، وما هو المخرج المتوقع..."
                  className="w-full p-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/10 pt-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">اسم غرفة الاجتماع (Jitsi Room Name - اختياري)</label>
                  <input 
                    type="text" 
                    value={meetingRoom}
                    onChange={(e) => setMeetingRoom(e.target.value)}
                    placeholder="مثال: alsay7ah-evening-33"
                    className="w-full p-2.5 rounded-xl glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">عنوان قصيدة الإلقاء (اختياري)</label>
                  <input 
                    type="text" 
                    value={poemTitle}
                    onChange={(e) => setPoemTitle(e.target.value)}
                    placeholder="مثال: قصيدة المواكب لخليل جبران"
                    className="w-full p-2.5 rounded-xl glass-input text-xs"
                  />
                </div>
              </div>

              {poemTitle.trim() && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">اسم كاتب القصيدة الأصلية</label>
                    <input 
                      type="text" 
                      value={poemAuthor}
                      onChange={(e) => setPoemAuthor(e.target.value)}
                      placeholder="مثال: جبران خليل جبران"
                      className="w-full p-2.5 rounded-xl glass-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">متن القصيدة (استخدم السطور للفصل)</label>
                    <textarea 
                      rows={4}
                      value={poemText}
                      onChange={(e) => setPoemText(e.target.value)}
                      placeholder="اكتب أبيات القصيدة هنا ليتسنى للمستمعين تصفحها وإبداء تعليقاتهم ونقدهم حولها بالأمسية..."
                      className="w-full p-2.5 rounded-xl glass-input text-xs font-serif"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end border-t border-white/10 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 text-xs font-bold transition"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shadow-blue-500/20"
                >
                  جدولة الأمسية وإشهارها
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
