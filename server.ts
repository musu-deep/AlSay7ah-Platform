import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY matches template or is missing. Please set it in your environment/secrets.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// AI Literary Critic endpoint
app.post("/api/critique", async (req, res) => {
  const { title, text, category, authorName } = req.body;

  if (!text) {
    return res.status(400).json({ error: "الرجاء إدخال النص الأدبي للتحليل" });
  }

  try {
    const ai = getAiClient();
    
    const prompt = `
      أنت ناقد أدبي عربي محترف ورفيع المستوى من طاقم "منبر الصيحة الأدبي الثقافي".
      مهمتك هي تقديم نقد وتحليل أدبي عميق وجميل وبناء للنص التالي.
      
      تفاصيل النص:
      - العنوان: ${title || "بدون عنوان"}
      - الكاتب: ${authorName || "أديب مجهول"}
      - النوع: ${category || "نثر/شعر"}
      
      محتوى النص الأدبي:
      """
      ${text}
      """
      
      الرجاء كتابة النقد باللغة العربية الفصحى الأنيقة والمشجعة، مقسماً إلى الأقسام التالية مع تنسيق Markdown الجذاب:
      1. **الجماليات العامة اللفظية**: (الوقوف على الألفاظ والتشبيهات والجمال البلاغي والشاعرية).
      2. **الوزن والقافية / البنية الإيقاعية**: (إذا كان شعراً، حدد البحر الشعري إن أمكن وعلق على موسيقاه الداخلية، وإذا كان نثراً علق على السجع والتناغم الداخلي).
      3. **العمق الفكري والوجداني**: (تحليل المشاعر والأفكار الفلسفية أو الإنسانية التي يحملها النص).
      4. **توصيات ومقترحات التطوير**: (اقتراح تعديل لطيف في تركيب أو كلمة لتعزيز رصانة النص، دون التقليل من شأن الكاتب).
      5. **بطاقة تقدير**: (بيت شعر أو حكمة تناسب مقام النص وتثني على محاولة الكاتب بأسلوب راقٍ جداً).
    `;

    // Using gemini-2.5-flash for fast and high-quality creative text generation
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({ critique: response.text });
  } catch (error: any) {
    console.error("AI Critique Error:", error);
    res.status(500).json({ 
      error: "حدث خطأ أثناء إجراء التحليل الأدبي من قبل الناقد الذكي.",
      details: error.message || String(error)
    });
  }
});

// App Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", time: new Date().toISOString() });
});

// Setup Vite development middleware OR serve static build in production
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production build from:", distPath);
  }
}

setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error("Failed to start server:", err);
});
