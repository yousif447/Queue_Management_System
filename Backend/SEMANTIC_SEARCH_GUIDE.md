# كيفية تشغيل البحث الدلالي

## للتشغيل الفوري (Development)

1. تأكد من وجود COHERE_API_KEY في ملف .env:
   ```
   COHERE_API_KEY=LanGHG5RhtGMfv24ikdhZ1mhUyIvSpUpyaVheMvT
   ```

2. أعد تشغيل الـ Backend server:
   ```bash
   cd Backend
   npm run dev
   ```

3. اختبر البحث:
   ```bash
   # في terminal جديد
   node test_arabic_search.js
   ```

## للـ Production/Deployment

### الإعداد التلقائي (مدمج بالفعل ✅)

النظام **يولد embeddings تلقائياً** عند:
- ✅ إنشاء business جديد (في `createBusiness`)
- ✅ تحديث business (في `updateBusinessById`)

**لا تحتاج** لتشغيل `sync_embeddings.js` يدوياً بعد كل إضافة!

### متطلبات الـ Deployment:

1. **أضف COHERE_API_KEY للـ environment variables في منصة الـ deployment:**
   - Vercel/Netlify: في Dashboard → Settings → Environment Variables
   - Heroku: `heroku config:set COHERE_API_KEY=xxxxx`
   - Railway/Render: في Settings → Environment Variables

2. **للبيانات الموجودة مسبقاً فقط:**
   - شغّل `sync_embeddings.js` مرة واحدة بعد الـ deployment الأول
   - يمكنك إضافة npm script:
     ```json
     "scripts": {
       "sync-embeddings": "node sync_embeddings.js"
     }
     ```
   - ثم شغله: `npm run sync-embeddings`

### النظام الحالي (التلقائي):

```javascript
// في businessController.js - يعمل تلقائياً
exports.createBusiness = async (req, res) => {
  const newBusiness = await Business.create(businessData);
  
  // ✅ يولد embeddings تلقائياً في الخلفية
  generateBusinessEmbeddings(newBusiness)
    .then(async (embeddings) => {
      await Business.findByIdAndUpdate(newBusiness._id, embeddings);
    });
  
  res.status(201).json({ data: safeBusiness });
};
```

## الخلاصة:

✅ **التحديث التلقائي مفعّل**: أي business جديد يضاف سيحصل على embeddings تلقائياً
✅ **لا حاجة لتشغيل sync يدوياً**: إلا للبيانات القديمة الموجودة قبل تفعيل النظام
✅ **فقط تأكد من**: وجود COHERE_API_KEY في environment variables للـ production

## اختبار:

```bash
# اختبر إضافة business جديد وسيحصل على embeddings تلقائياً
curl -X POST http://localhost:3000/api/v1/businesses \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Clinic", "specialization":"Medical", ...}'

# ثم ابحث عنه
curl "http://localhost:3000/api/v1/search/semantic?q=test"
```
