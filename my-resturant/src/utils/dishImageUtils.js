import imageCompression from "browser-image-compression";
import { isSupabaseConfigured, supabase } from "../supabaseClient";

export const DISH_IMAGE_BUCKET = "restaurant-logos";
const MAX_FILE_SIZE_MB = 5;

export async function compressDishImage(file) {
  return imageCompression(file, {
    maxSizeMB: 0.05, // ~50 كيلوبايت
    maxWidthOrHeight: 800,
    useWebWorker: true,
    initialQuality: 0.7,
  });
}

export function buildDishImagePath(file, businessId) {
  const extension = file.type?.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const owner = businessId || "shared";
  return `dishes/${owner}/${suffix}.${extension}`;
}

export async function getCurrentBusinessId() {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export function validateDishImageFile(file) {
  if (!file) return "يرجى اختيار صورة";
  if (!file.type.startsWith("image/")) return "يرجى اختيار صورة صالحة (JPG أو PNG)";
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `حجم الصورة يجب ألا يتجاوز ${MAX_FILE_SIZE_MB} ميجابايت`;
  }
  return null;
}

export async function uploadDishImage(file, { previousPath } = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      publicUrl: URL.createObjectURL(file),
      path: null,
      uploaded: false,
    };
  }

  const businessId = await getCurrentBusinessId();
  const path = buildDishImagePath(file, businessId);

  const { error } = await supabase.storage.from(DISH_IMAGE_BUCKET).upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });

  if (error) {
    throw new Error(`فشل رفع صورة الطبق: ${error.message}`);
  }

  const { data } = supabase.storage.from(DISH_IMAGE_BUCKET).getPublicUrl(path);

  if (previousPath?.startsWith("dishes/")) {
    await removeDishImage(previousPath);
  }

  return {
    publicUrl: data.publicUrl,
    path,
    uploaded: true,
  };
}

export async function removeDishImage(path) {
  if (!path || !isSupabaseConfigured || !supabase) return;
  await supabase.storage.from(DISH_IMAGE_BUCKET).remove([path]);
}
