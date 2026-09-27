# BAYT-X
### من أول البحث... لحد المفتاح

منصة عقارية متكاملة للسوق المصري — Real Estate Transaction Platform، مش مجرد موقع إعلانات.

هذا هو **الهيكل الحقيقي للمشروع (MVP V1 skeleton)**: Next.js 14 + PostgreSQL + Prisma،
جاهز يتشغّل محليًا وتكمل عليه. الشاشات والـ UX الكاملة موجودة كديمو تفاعلي منفصل
(Artifact) بنفس التصميم — هذا المشروع هو الـ Backend/Architecture الحقيقي اللي بيقف وراه.

---

## 1) التشغيل محليًا

### المتطلبات
- Node.js 20+
- PostgreSQL 14+ (محلي أو عبر Docker/Supabase/Railway)

### الخطوات
```bash
# 1. ثبّت المكتبات
npm install

# 2. جهّز متغيرات البيئة
cp .env.example .env
# افتح .env وحط رابط قاعدة بياناتك في DATABASE_URL

# 3. أنشئ الجداول
npm run prisma:migrate

# 4. ازرع بيانات تجريبية (30 عقار + مستخدمين تجريبيين)
npm run prisma:seed

# 5. شغّل السيرفر
npm run dev
```
المشروع هيشتغل على http://localhost:3000

### بيانات دخول تجريبية (من الـ seed)
| الدور | الإيميل | الباسورد |
|---|---|---|
| Admin | admin@baytx.test | Passw0rd! |
| Seller | seller@baytx.test | Passw0rd! |
| Broker | broker@baytx.test | Passw0rd! |
| Buyer | buyer@baytx.test | Passw0rd! |

> ملحوظة: تسجيل الدخول (`/api/auth`) مبني على JWT + bcrypt لكن شاشة الـ Login نفسها
> لسه Route فاضي (`src/app/api/auth/`) — ده من أول حاجة في V2 Backlog تحت.

---

## 2) هيكل المشروع

```
bayt-x/
├─ prisma/
│  ├─ schema.prisma     ← الـ Database Schema الكامل (30 جدول تقريبًا)
│  └─ seed.ts           ← بيانات تجريبية وهمية بالكامل
├─ src/
│  ├─ app/
│  │  ├─ page.tsx        ← الصفحة الرئيسية (Server Component يقرأ من DB مباشرة)
│  │  ├─ layout.tsx
│  │  └─ api/
│  │     ├─ properties/route.ts           ← GET (بحث+فلاتر) / POST (إضافة عقار)
│  │     ├─ search/route.ts               ← POST بحث بلغة طبيعية عبر AIProvider
│  │     ├─ deals/[id]/offers/route.ts    ← محرك التفاوض (Offer/Counter/Accept)
│  │     └─ verification/route.ts         ← سير عمل التحقق من العقار
│  ├─ lib/
│  │  ├─ db.ts            ← Prisma client (singleton)
│  │  ├─ auth.ts           ← تشفير الباسورد + JWT
│  │  ├─ rbac.ts            ← Role-Based Access Control
│  │  └─ providers/         ← ⭐ طبقة الـ Provider Abstraction (مهم جدًا)
│  │     ├─ types.ts         ← الـ interfaces (Payment/Map/AI/Storage/Notification)
│  │     ├─ mock.ts          ← التنفيذ الوهمي المستخدم في V1
│  │     └─ index.ts         ← الـ Factory اللي بيختار mock أو provider حقيقي
│  └─ types/index.ts
├─ .env.example
└─ package.json
```

### مبدأ التصميم الأهم: Provider Abstraction
زي ما اتطلب بالظبط في البريف — **مفيش أي كود في المشروع بيستدعي مزود خارجي مباشرة**.
كل حاجة (دفع، خرائط، AI، تخزين، إشعارات) بتعدّي على `src/lib/providers/index.ts`.
عشان تفعّل مزود حقيقي بدل الـ Mock:
1. اكتب كلاس جديد بيطبّق نفس الـ interface (في `providers/types.ts`).
2. ضيفه في `providers/index.ts` تحت الـ env var بتاعه.
3. غيّر القيمة في `.env` (مثلاً `AI_PROVIDER=openai`) — من غير ما تلمس أي Route تاني.

---

## 3) الـ Database Schema

كل الجداول المطلوبة في البريف موجودة في `prisma/schema.prisma` مع تعليقات توضح القرارات:

- **Users & Roles**: `User` + Profiles منفصلة (`BuyerProfile`, `SellerProfile`, `BrokerProfile`, `DeveloperProfile`) — حساب واحد ممكن يكون له أكتر من دور.
- **Properties**: `Property`, `PropertyLocation`, `PropertyImage`, `PropertyDocument`, `PropertyFeature`, `PropertyVerification` (Audit trail، مش boolean بسيط).
- **CRM**: `Lead`, `Viewing`.
- **Deal Room**: `Deal`, `DealParticipant`, `Offer` (Append-only — الصفقات بتتسجّل مش بتتمسح)، `DealMessage`, `DealDocument`, `DealTimelineEvent`.
- **التحقق**: `LegalReview`, `Inspection`, `Valuation` (بديسكليمر إنه تقديري مش رسمي).
- **Swap/Chain**: `PropertySwap`, `TransactionChain`.
- **Rentals**: `Rental`, `Tenant`.
- **Payments**: `Payment` (لا يخزن بيانات بطاقات أبدًا)، `Subscription`.
- **Moderation & Admin**: `Notification`, `Review`, `Report`, `AuditLog`.

---

## 4) API — الحالي والمخطط

### مُنفّذ فعليًا في هذا الهيكل
| Route | الوصف |
|---|---|
| `GET /api/properties` | بحث وفلترة (منطقة، سعر، غرف، نوع، موثّق فقط) |
| `POST /api/properties` | إضافة عقار (Seller/Broker/Agency/Developer فقط) |
| `POST /api/search` | بحث بلغة طبيعية عبر `AIProvider.parseSearchQuery` |
| `POST /api/deals/:id/offers` | تسجيل عرض/عرض مضاد (Append-only) |
| `PATCH /api/deals/:id/offers` | قبول عرض → تحديث حالة الصفقة |
| `POST /api/verification` | تقديم/تقدّم سير عمل تحقق العقار |

### مخطط لها هيكل جاهز لكن التنفيذ لسه فاضي (V2)
`/auth`, `/users`, `/viewings`, `/messages`, `/inspections`, `/valuations`,
`/swaps`, `/rentals`, `/payments`, `/subscriptions`, `/admin` — المجلدات
موجودة تحت `src/app/api/` جاهزة تتملى بنفس النمط المستخدم في الأمثلة أعلاه.

---

## 5) تم تنفيذه في هذا الهيكل (V1)
- Database schema كامل بكل الجداول والعلاقات والـ indexes الأساسية.
- Provider abstraction layer كامل (Payment/Map/AI/Storage/Notification) مع Mock implementations شغالة.
- RBAC + Auth helpers (JWT + bcrypt).
- 3 API routes حقيقية شغّالة end-to-end (بحث، بحث AI، تفاوض، تحقق) كنموذج تُبنى عليه الباقي.
- Seed Data واقعية الشكل (30 عقار في 7 مناطق + مستخدمين بكل الأدوار).

## 6) مؤجّل إلى V2 (حسب خطة الأولويات في البريف)
- باقي الـ API routes (auth كامل، viewings، messages، inspections، valuations، swaps، rentals، payments، subscriptions، admin).
- الواجهة الأمامية الكاملة بنفس تصميم الـ Artifact Demo (حاليًا الصفحة الرئيسية Server Component بسيط فقط).
- Property Swap matching logic، Sell→Buy transaction chains.
- ربط providers حقيقية (بعد التعاقد مع مزود مرخّص) بدل الـ Mock.
- Elasticsearch/Algolia بدل PostgreSQL full-text search عند الحاجة للتوسع.
- Testing suite (unit + integration).

---

## 7) النشر (Production)
- **الأسهل**: Vercel للـ Next.js app + قاعدة بيانات مُدارة (Supabase / Railway / Neon).
- اضبط كل متغيرات `.env.example` في إعدادات المشروع على المنصة.
- شغّل `npx prisma migrate deploy` كخطوة Build/Release قبل تشغيل السيرفر.
- لا تشغّل `prisma:seed` في بيئة Production — هو لبيانات تجريبية فقط.
