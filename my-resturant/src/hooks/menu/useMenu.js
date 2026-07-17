import { useCallback, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../../supabaseClient";

function mapCategory(row, dishCount = 0) {
  return {
    id: row.id,
    name: row.name_ar || row.name || "بدون اسم",
    nameEn: row.name || "",
    nameAr: row.name_ar || "",
    sortOrder: row.sort_order ?? 0,
    count: dishCount,
  };
}

function mapDish(row) {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name_ar || row.name || "بدون اسم",
    nameEn: row.name || "",
    nameAr: row.name_ar || "",
    description: row.description || "",
    price: Number(row.price) || 0,
    image: row.photo_url || "",
    imagePath: null,
    available: row.is_available !== false,
    sortOrder: row.sort_order ?? 0,
    badge: null,
    showHoverOverlay: false,
    ingredients: [],
  };
}

async function getBusinessId() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export default function useMenu() {
  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMenu = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase غير مهيأة");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const businessId = await getBusinessId();
      if (!businessId) {
        setError("لم يتم العثور على جلسة المستخدم");
        setCategories([]);
        setDishes([]);
        return;
      }

      const [categoriesResult, dishesResult] = await Promise.all([
        supabase
          .from("menu_categories")
          .select("id, business_id, name, name_ar, sort_order")
          .eq("business_id", businessId)
          .order("sort_order", { ascending: true }),
        supabase
          .from("menu_items")
          .select(
            "id, business_id, category_id, name, name_ar, description, price, photo_url, is_available, sort_order"
          )
          .eq("business_id", businessId)
          .order("sort_order", { ascending: true }),
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (dishesResult.error) throw dishesResult.error;

      const mappedDishes = (dishesResult.data || []).map(mapDish);
      const countByCategory = mappedDishes.reduce((acc, dish) => {
        if (!dish.categoryId) return acc;
        acc[dish.categoryId] = (acc[dish.categoryId] || 0) + 1;
        return acc;
      }, {});

      setCategories(
        (categoriesResult.data || []).map((row) => mapCategory(row, countByCategory[row.id] || 0))
      );
      setDishes(mappedDishes);
      setError(null);
    } catch (err) {
      console.error("Error loading menu:", err);
      setError(err.message || "فشل تحميل القائمة");
      setCategories([]);
      setDishes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const refreshCategoryCounts = useCallback((nextDishes, nextCategories) => {
    const countByCategory = nextDishes.reduce((acc, dish) => {
      if (!dish.categoryId) return acc;
      acc[dish.categoryId] = (acc[dish.categoryId] || 0) + 1;
      return acc;
    }, {});

    return nextCategories.map((category) => ({
      ...category,
      count: countByCategory[category.id] || 0,
    }));
  }, []);

  async function addCategory({ name }) {
    const businessId = await getBusinessId();
    if (!businessId) return { error: new Error("لا توجد جلسة") };

    const trimmed = String(name || "").trim();
    if (!trimmed) return { error: new Error("اسم الفئة مطلوب") };

    const sortOrder =
      categories.reduce((max, category) => Math.max(max, category.sortOrder || 0), 0) + 1;

    const { data, error: insertError } = await supabase
      .from("menu_categories")
      .insert({
        business_id: businessId,
        name: trimmed,
        name_ar: trimmed,
        sort_order: sortOrder,
      })
      .select("id, business_id, name, name_ar, sort_order")
      .single();

    if (insertError) return { error: insertError };

    const mapped = mapCategory(data, 0);
    setCategories((prev) => [...prev, mapped]);
    return { category: mapped, error: null };
  }

  async function deleteCategory(categoryId) {
    // احذف الأطباق التابعة أولاً لتجنب فشل المفتاح الأجنبي
    const { error: dishesDeleteError } = await supabase
      .from("menu_items")
      .delete()
      .eq("category_id", categoryId);

    if (dishesDeleteError) return { error: dishesDeleteError };

    const { error: deleteError } = await supabase
      .from("menu_categories")
      .delete()
      .eq("id", categoryId);

    if (deleteError) return { error: deleteError };

    setDishes((prev) => {
      const nextDishes = prev.filter((dish) => dish.categoryId !== categoryId);
      setCategories((prevCategories) =>
        refreshCategoryCounts(
          nextDishes,
          prevCategories.filter((category) => category.id !== categoryId)
        )
      );
      return nextDishes;
    });

    return { error: null };
  }

  async function saveDish({ mode, dishId, formData }) {
    const businessId = await getBusinessId();
    if (!businessId) return { error: new Error("لا توجد جلسة") };

    const payload = {
      business_id: businessId,
      category_id: formData.categoryId || null,
      name: formData.nameEn || "",
      name_ar: formData.name || "",
      description: formData.description || null,
      price: Number(formData.price) || 0,
      photo_url: formData.image || null,
      is_available: true,
    };

    if (mode === "edit" && dishId) {
      const { data, error: updateError } = await supabase
        .from("menu_items")
        .update({
          category_id: payload.category_id,
          name: payload.name,
          name_ar: payload.name_ar,
          description: payload.description,
          price: payload.price,
          photo_url: payload.photo_url,
        })
        .eq("id", dishId)
        .eq("business_id", businessId)
        .select(
          "id, business_id, category_id, name, name_ar, description, price, photo_url, is_available, sort_order"
        )
        .single();

      if (updateError) return { error: updateError };

      const mapped = mapDish(data);
      setDishes((prev) => {
        const nextDishes = prev.map((dish) => (dish.id === dishId ? mapped : dish));
        setCategories((prevCategories) => refreshCategoryCounts(nextDishes, prevCategories));
        return nextDishes;
      });

      return { dish: mapped, error: null };
    }

    const sortOrder =
      dishes.reduce((max, dish) => Math.max(max, dish.sortOrder || 0), 0) + 1;

    const { data, error: insertError } = await supabase
      .from("menu_items")
      .insert({
        ...payload,
        sort_order: sortOrder,
      })
      .select(
        "id, business_id, category_id, name, name_ar, description, price, photo_url, is_available, sort_order"
      )
      .single();

    if (insertError) return { error: insertError };

    const mapped = mapDish(data);
    setDishes((prev) => {
      const nextDishes = [...prev, mapped];
      setCategories((prevCategories) => refreshCategoryCounts(nextDishes, prevCategories));
      return nextDishes;
    });

    return { dish: mapped, error: null };
  }

  async function toggleDishAvailability(dishId) {
    const target = dishes.find((dish) => dish.id === dishId);
    if (!target) return { error: new Error("الطبق غير موجود") };

    const nextAvailable = !target.available;

    setDishes((prev) =>
      prev.map((dish) => (dish.id === dishId ? { ...dish, available: nextAvailable } : dish))
    );

    const { error: updateError } = await supabase
      .from("menu_items")
      .update({ is_available: nextAvailable })
      .eq("id", dishId);

    if (updateError) {
      setDishes((prev) =>
        prev.map((dish) => (dish.id === dishId ? { ...dish, available: target.available } : dish))
      );
      return { error: updateError };
    }

    return { error: null };
  }

  const hasCategories = useMemo(() => categories.length > 0, [categories]);

  return {
    categories,
    dishes,
    isLoading,
    error,
    hasCategories,
    reloadMenu: loadMenu,
    addCategory,
    deleteCategory,
    saveDish,
    toggleDishAvailability,
  };
}
