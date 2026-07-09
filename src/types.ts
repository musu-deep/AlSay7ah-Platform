export enum UserRole {
  ADMIN = 'admin',       // مدير عام المنصة
  EDITOR = 'editor',     // محرر قسم معين
  WRITER = 'writer',     // كاتب / أديب
  MEMBER = 'member'      // عضو قارئ / متفاعل
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  sections?: string[];   // الأقسام المسموح له بتحريرها (خاصة بالمحررين والكتّاب)
  bio?: string;
  avatarUrl?: string;
  joinDate: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;      // مثلاً: الديوان الشعري، مرفأ النثر، قراءات نقدية، آفاق فكرية
  authorId: string;
  authorName: string;
  createdAt: string;
  likes: string[];       // قائمة UIDs للمستخدمين الذين أعجبهم المقال
  status: 'pending' | 'approved' | 'featured';
  commentsCount: number;
}

export interface Comment {
  id: string;
  articleId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
}

export interface CultureEvening {
  id: string;
  title: string;
  description: string;
  hostName: string;
  hostId: string;
  date: string;          // وقت وتاريخ الفعالية
  meetingUrl: string;    // رابط Jitsi أو Zoom
  status: 'upcoming' | 'live' | 'completed';
  attendantCount: number;
  featuredPoem?: {
    title: string;
    text: string;
    author: string;
  };
}

export interface InteractiveVerse {
  id: string;
  text: string;          // شطر بيت أو بيت كامل أو حكمة قصيرة
  authorName: string;
  authorId: string;
  createdAt: string;
  color: string;         // لون بطاقة الكتابة
  style: 'glass' | 'gold' | 'neon' | 'vintage';
  likes: string[];
}
