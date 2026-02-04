import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" })); // لدعم الصور الكبيرة base64

// ────────────────────────────────────────────────
//          الاتصال بـ Supabase (استخدم service_role key فقط هنا)
// ────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ────────────────────────────────────────────────
//          تسجيل دخول البائع (Login)
// ────────────────────────────────────────────────
app.post("/api/seller/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "الإيميل وكلمة المرور مطلوبين" });
  }

  try {
    const { data: seller, error } = await supabase
      .from("sellers")
      .select("id, name, email, password, role")
      .eq("email", email)
      .single();

    if (error || !seller) {
      return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    }

    const passwordMatch = await bcrypt.compare(password, seller.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    }

    const userData = {
      id: seller.id,
      name: seller.name,
      email: seller.email,
      role: seller.role || "seller",
    };

    res.json({
      success: true,
      message: "تم تسجيل الدخول بنجاح",
      user: userData,
    });
  } catch (err) {
    console.error("خطأ في تسجيل الدخول:", err);
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});

// ────────────────────────────────────────────────
//          جلب جميع المنتجات (مع دعم الفلتر حسب الفئة)
// ────────────────────────────────────────────────
app.get("/api/products", async (req, res) => {
  try {
    const { category } = req.query; // استقبال الفئة من الرابط
    
    let query = supabase
      .from("Products")
      .select("*")
      .order("id", { ascending: false });

    // إذا تم تحديد فئة، نقوم بالتصفية بناءً عليها
    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error("خطأ في جلب المنتجات:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────
//          إضافة منتج جديد (محمي – يحتاج تسجيل دخول)
// ────────────────────────────────────────────────
app.post("/api/products", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "غير مصرّح – يرجى تسجيل الدخول" });
  }

  const token = authHeader.split(" ")[1]; // Bearer email → email

  try {
    // تحقق من أن المستخدم بائع
    const { data: seller, error: authError } = await supabase
      .from("sellers")
      .select("id, email, role")
      .eq("email", token)
      .single();

    if (authError || !seller || seller.role !== "seller") {
      return res.status(403).json({ error: "صلاحيات غير كافية" });
    }

    const { name, price, description, image, category } = req.body;

    if (!name || !price || !image) {
      return res.status(400).json({ error: "الحقول الإجبارية مفقودة" });
    }

    const { data, error } = await supabase
      .from("Products")
      .insert([{ name, price, description, image, category }])
      .select();

    if (error) throw error;

    res.json({ message: "تمت الإضافة بنجاح", data });
  } catch (err) {
    console.error("خطأ في الإضافة:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────
//          حذف منتج (محمي بنفس الطريقة)
// ────────────────────────────────────────────────
app.delete("/api/products", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "غير مصرّح – يرجى تسجيل الدخول" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const { data: seller, error: authError } = await supabase
      .from("sellers")
      .select("id, email, role")
      .eq("email", token)
      .single();

    if (authError || !seller || seller.role !== "seller") {
      return res.status(403).json({ error: "صلاحيات غير كافية" });
    }

    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "معرف المنتج مطلوب" });
    }

    const { error } = await supabase.from("Products").delete().eq("id", id);

    if (error) throw error;

    res.json({ message: "تم حذف المنتج بنجاح" });
  } catch (err) {
    console.error("خطأ في الحذف:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────
//          تعديل منتج (PUT /api/products/:id)
// ────────────────────────────────────────────────
app.put("/api/products/:id", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "غير مصرّح – يرجى تسجيل الدخول" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // تحقق من أن المستخدم بائع
    const { data: seller, error: authError } = await supabase
      .from("sellers")
      .select("id, email, role")
      .eq("email", token)
      .single();

    if (authError || !seller || seller.role !== "seller") {
      return res.status(403).json({ error: "صلاحيات غير كافية" });
    }

    const { id } = req.params;
    const { name, price, description, image, category } = req.body;

    if (!name || !price || !image) {
      return res.status(400).json({ error: "الحقول الإجبارية مفقودة" });
    }

    const { data, error } = await supabase
      .from("Products")
      .update({ name, price, description, image, category })
      .eq("id", id)
      .select();

    if (error) throw error;

    if (data.length === 0) {
      return res.status(404).json({ error: "المنتج غير موجود" });
    }

    res.json({ message: "تم التعديل بنجاح", data });
  } catch (err) {
    console.error("خطأ في التعديل:", err.message);
    res.status(500).json({ error: "حدث خطأ في الخادم" });
  }
});
// ────────────────────────────────────────────────
//          تشغيل السيرفر
// ────────────────────────────────────────────────
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`السيرفر يعمل على http://localhost:${PORT}`);
});
