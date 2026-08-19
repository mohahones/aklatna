# 🚀 خطوات تنفيذ الرسم البياني للمبيعات

## ⚠️ ملخص سريع

**الجداول المطلوبة:** 2 جداول جديدة
- `daily_sales_stats` - إحصائيات يومية
- `daily_top_items` - الأصناف الأكثر مبيعاً

**الـ Triggers المطلوبة:** 2 trigger
- `update_daily_sales_stats` - تحديث الإحصائيات
- `update_daily_top_items` - تحديث الأصناف الأكثر مبيعاً

**الـ Hooks اللي لازم تضيفها:** 2 hook جديدة
- `useSalesChart.js` - جلب بيانات الرسم البياني
- `useDayDetails.js` - جلب تفاصيل يوم محدد

**المكونات اللي لازم تعديلها:** 2 مكون
- `SalesChart.jsx` - ربط البيانات الحقيقية
- `DayDetailsModal.jsx` - عرض تفاصيل اليوم

---

## 📝 الخطوة الأولى: إنشاء الجداول في Supabase

### 1️⃣ افتح Supabase Dashboard
```
1. اذهب إلى https://supabase.com/dashboard
2. اختر المشروع الخاص بك
3. انقر على SQL Editor
```

### 2️⃣ أنسخ وشغّل هذا الأمر (الجدول الأول: `daily_sales_stats`)

```sql
CREATE TABLE IF NOT EXISTS daily_sales_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  sales_date DATE NOT NULL,
  total_revenue NUMERIC(10, 2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,
  average_order_value NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  UNIQUE(business_id, sales_date)
);

-- Index للأداء الأفضل
CREATE INDEX IF NOT EXISTS idx_daily_sales_stats_business_date 
ON daily_sales_stats(business_id, sales_date DESC);

-- تفعيل RLS
ALTER TABLE daily_sales_stats ENABLE ROW LEVEL SECURITY;

-- سياسة الوصول (عرض فقط البيانات الخاصة بالمستخدم)
CREATE POLICY select_own_sales_stats ON daily_sales_stats
FOR SELECT USING (
  business_id = auth.uid()
);

CREATE POLICY update_own_sales_stats ON daily_sales_stats
FOR UPDATE USING (
  business_id = auth.uid()
);

CREATE POLICY insert_own_sales_stats ON daily_sales_stats
FOR INSERT WITH CHECK (
  business_id = auth.uid()
);
```

### 3️⃣ أنسخ وشغّل هذا الأمر (الجدول الثاني: `daily_top_items`)

```sql
CREATE TABLE IF NOT EXISTS daily_top_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  sales_date DATE NOT NULL,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity_sold INTEGER DEFAULT 0,
  revenue NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  
  UNIQUE(business_id, sales_date, menu_item_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_top_items_business_date 
ON daily_top_items(business_id, sales_date DESC);

-- تفعيل RLS
ALTER TABLE daily_top_items ENABLE ROW LEVEL SECURITY;

-- سياسة الوصول
CREATE POLICY select_own_top_items ON daily_top_items
FOR SELECT USING (
  business_id = auth.uid()
);

CREATE POLICY update_own_top_items ON daily_top_items
FOR UPDATE USING (
  business_id = auth.uid()
);

CREATE POLICY insert_own_top_items ON daily_top_items
FOR INSERT WITH CHECK (
  business_id = auth.uid()
);
```

---

## 🔄 الخطوة الثانية: إنشاء الـ Triggers

### 1️⃣ الـ Trigger الأول: `update_daily_sales_stats`

أنسخ وشغّل هذا الأمر:

```sql
CREATE OR REPLACE FUNCTION update_daily_sales_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- عند إنشاء طلب جديد
  IF TG_OP = 'INSERT' THEN
    INSERT INTO daily_sales_stats (
      business_id,
      sales_date,
      total_revenue,
      total_orders,
      completed_orders,
      cancelled_orders,
      average_order_value
    )
    VALUES (
      NEW.business_id,
      DATE(NEW.created_at),
      COALESCE(NEW.total_price, 0),
      1,
      CASE WHEN NEW.order_status = 'completed' THEN 1 ELSE 0 END,
      CASE WHEN NEW.order_status = 'cancelled' THEN 1 ELSE 0 END,
      COALESCE(NEW.total_price, 0)
    )
    ON CONFLICT (business_id, sales_date)
    DO UPDATE SET
      total_revenue = daily_sales_stats.total_revenue + COALESCE(NEW.total_price, 0),
      total_orders = daily_sales_stats.total_orders + 1,
      completed_orders = daily_sales_stats.completed_orders + 
        CASE WHEN NEW.order_status = 'completed' THEN 1 ELSE 0 END,
      cancelled_orders = daily_sales_stats.cancelled_orders + 
        CASE WHEN NEW.order_status = 'cancelled' THEN 1 ELSE 0 END,
      average_order_value = (daily_sales_stats.total_revenue + COALESCE(NEW.total_price, 0)) / 
        (daily_sales_stats.total_orders + 1),
      updated_at = now();
  
  -- عند تحديث حالة الطلب
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.order_status != NEW.order_status THEN
      UPDATE daily_sales_stats
      SET
        completed_orders = completed_orders + 
          CASE 
            WHEN NEW.order_status = 'completed' AND OLD.order_status != 'completed' THEN 1 
            WHEN OLD.order_status = 'completed' AND NEW.order_status != 'completed' THEN -1
            ELSE 0 
          END,
        cancelled_orders = cancelled_orders + 
          CASE 
            WHEN NEW.order_status = 'cancelled' AND OLD.order_status != 'cancelled' THEN 1
            WHEN OLD.order_status = 'cancelled' AND NEW.order_status != 'cancelled' THEN -1
            ELSE 0 
          END,
        updated_at = now()
      WHERE business_id = NEW.business_id 
        AND sales_date = DATE(NEW.created_at);
    END IF;
  
  -- عند حذف طلب
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE daily_sales_stats
    SET
      total_revenue = total_revenue - COALESCE(OLD.total_price, 0),
      total_orders = total_orders - 1,
      completed_orders = completed_orders - 
        CASE WHEN OLD.order_status = 'completed' THEN 1 ELSE 0 END,
      cancelled_orders = cancelled_orders - 
        CASE WHEN OLD.order_status = 'cancelled' THEN 1 ELSE 0 END,
      average_order_value = CASE 
        WHEN (total_orders - 1) > 0 THEN 
          (total_revenue - COALESCE(OLD.total_price, 0)) / (total_orders - 1)
        ELSE 0
      END,
      updated_at = now()
    WHERE business_id = OLD.business_id 
      AND sales_date = DATE(OLD.created_at);
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- حذف الـ trigger القديم إن وجد
DROP TRIGGER IF EXISTS trigger_update_daily_sales_stats ON "order";

-- إنشاء الـ trigger الجديد
CREATE TRIGGER trigger_update_daily_sales_stats
AFTER INSERT OR UPDATE OR DELETE ON "order"
FOR EACH ROW
EXECUTE FUNCTION update_daily_sales_stats();
```

### 2️⃣ الـ Trigger الثاني: `update_daily_top_items`

أنسخ وشغّل هذا الأمر:

```sql
CREATE OR REPLACE FUNCTION update_daily_top_items()
RETURNS TRIGGER AS $$
DECLARE
  v_items JSONB;
  v_item JSONB;
  v_item_id UUID;
  v_item_name TEXT;
  v_item_quantity INTEGER;
  v_item_price NUMERIC;
BEGIN
  -- فقط للطلبات المكتملة
  IF NEW.order_status NOT IN ('completed') THEN
    RETURN NEW;
  END IF;

  -- استخراج الأصناف من JSON
  v_items := COALESCE(NEW.items, '[]'::jsonb);

  IF jsonb_array_length(v_items) > 0 THEN
    FOR i IN 0..jsonb_array_length(v_items) - 1 LOOP
      v_item := v_items -> i;
      v_item_id := CASE 
        WHEN (v_item ->> 'id')::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN (v_item ->> 'id')::UUID
        ELSE NULL
      END;
      v_item_name := COALESCE(v_item ->> 'name', 'Unknown Item');
      v_item_quantity := COALESCE((v_item ->> 'quantity')::INTEGER, 1);
      v_item_price := COALESCE((v_item ->> 'price')::NUMERIC, 0);

      INSERT INTO daily_top_items (
        business_id,
        sales_date,
        menu_item_id,
        item_name,
        quantity_sold,
        revenue
      )
      VALUES (
        NEW.business_id,
        DATE(NEW.created_at),
        v_item_id,
        v_item_name,
        v_item_quantity,
        v_item_quantity * v_item_price
      )
      ON CONFLICT (business_id, sales_date, menu_item_id)
      DO UPDATE SET
        quantity_sold = daily_top_items.quantity_sold + v_item_quantity,
        revenue = daily_top_items.revenue + (v_item_quantity * v_item_price);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- حذف الـ trigger القديم إن وجد
DROP TRIGGER IF EXISTS trigger_update_daily_top_items ON "order";

-- إنشاء الـ trigger الجديد
CREATE TRIGGER trigger_update_daily_top_items
AFTER INSERT ON "order"
FOR EACH ROW
EXECUTE FUNCTION update_daily_top_items();
```

---

## 📱 الخطوة الثالثة: تحديث المكونات

### الملفات التي تحتاج تعديل:

✅ `src/components/dashboard/SalesChart.jsx` - استبدال البيانات الوهمية  
✅ `src/components/dashboard/DayDetailsModal.jsx` - ربط تفاصيل اليوم  

### الملفات الجديدة المُنشأة:

✅ `src/hooks/useSalesChart.js` - جلب بيانات الرسم البياني  
✅ `src/hooks/useDayDetails.js` - جلب تفاصيل اليوم  

---

## ⚠️ ملاحظات مهمة

### عن الـ Triggers:
- **Trigger الإدراج (INSERT):** ينشئ صف جديد في `daily_sales_stats` أو يزيد الأرقام
- **Trigger التحديث (UPDATE):** يحدّث عدد الطلبات المكتملة/الملغاة عند تغيير الحالة
- **Trigger الحذف (DELETE):** ينقص الأرقام عند حذف طلب

### عن الـ Hooks:
- `useSalesChart` يجلب البيانات من جدول `daily_sales_stats`
- `useDayDetails` يجلب التفاصيل من جدول `daily_top_items`
- كلاهما يستخدم Real-Time subscriptions لتحديث البيانات فوراً

### عن RLS (صيانة الأمان):
- فقط صاحب المطعم يمكنه رؤية بيانات مطعمه
- لا يمكن لأحد الوصول لبيانات مطاعم أخرى

---

## ✅ التحقق من التنفيذ

بعد إنشاء الجداول والـ Triggers، جرّب هذا:

1. **أضف طلب جديد** من البطاقة الخاصة بك
2. **تحقق من جدول `daily_sales_stats`** - يجب أن ترى صف جديد
3. **غيّر حالة الطلب** إلى "completed"
4. **تحقق مرة أخرى** - يجب أن يزيد عدد الطلبات المكتملة
5. **افتح الرسم البياني** - يجب أن ترى البيانات الحقيقية

---

## 🐛 حل المشاكل

### المشكلة: الرسم البياني فارغ
```
✓ تأكد من أن الجداول موجودة
✓ تأكد من أن الـ Triggers تم إنشاؤها بنجاح
✓ تأكد من أن لديك طلبات في النظام
✓ تحقق من RLS Policies
```

### المشكلة: الأرقام خاطئة
```
✓ تأكد من أن `order_status` قيمته "completed"
✓ تأكد من أن `total_price` موجود والقيمة صحيحة
✓ شغّل Trigger يدوياً على طلبات قديمة
```

### المشكلة: لا توجد بيانات تاريخية
```
✓ استخدم هذا الـ Query لملء البيانات القديمة:

INSERT INTO daily_sales_stats (
  business_id,
  sales_date,
  total_revenue,
  total_orders,
  completed_orders,
  cancelled_orders,
  average_order_value
)
SELECT
  business_id,
  DATE(created_at) as sales_date,
  SUM(COALESCE(total_price, 0)) as total_revenue,
  COUNT(*) as total_orders,
  SUM(CASE WHEN order_status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
  SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
  AVG(COALESCE(total_price, 0)) as average_order_value
FROM orders
GROUP BY business_id, DATE(created_at)
ON CONFLICT (business_id, sales_date)
DO NOTHING;
```
```

---

## 📊 الخطوة التالية

بعد تنفيذ هذه الخطوات، ستحتاج إلى:

1. ✏️ تعديل `SalesChart.jsx` لاستخدام `useSalesChart` hook
2. ✏️ تعديل `DayDetailsModal.jsx` لاستخدام `useDayDetails` hook
3. 🧪 اختبار الرسم البياني والتفاصيل
4. 🚀 نشر التحديثات

