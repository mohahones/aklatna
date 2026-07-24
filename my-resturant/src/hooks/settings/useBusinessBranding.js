import imageCompression from "browser-image-compression";
import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../../supabaseClient";

const logoBucketName = "restaurant-logos";

async function compressLogo(file) {
  return imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 800,
    useWebWorker: true,
    initialQuality: 0.8,
  });
}

async function compressCover(file) {
  return imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    initialQuality: 0.8,
  });
}

function buildLogoPath(file) {
  const extension = file.type?.split("/")[1] || "jpg";
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `logos/${suffix}.${extension}`;
}

function buildCoverPath(file) {
  const extension = file.type?.split("/")[1] || "jpg";
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `covers/${suffix}.${extension}`;
}

export default function useBusinessBranding() {
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadBranding = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase غير مهيأة");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const businessId = session?.user?.id;
      if (!businessId) {
        setError("لم يتم العثور على جلسة المستخدم");
        return;
      }

      const { data, error: queryError } = await supabase
        .from("businesses")
        .select("logo_url, cover_url")
        .eq("id", businessId)
        .maybeSingle();

      if (queryError) {
        console.error("Error loading business branding:", queryError);
        setError("فشل تحميل صور المطعم");
        return;
      }

      setLogoUrl(data?.logo_url || "");
      setCoverUrl(data?.cover_url || "");
      setError(null);
    } catch (err) {
      console.error("Exception loading business branding:", err);
      setError("حدث خطأ أثناء تحميل الصور");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBranding();
  }, [loadBranding]);

  async function saveBranding({ logoFile, coverFile, removeLogo, removeCover }) {
    if (!isSupabaseConfigured || !supabase) {
      return { error: new Error("Supabase غير مهيأة") };
    }

    setIsSaving(true);

    let uploadedLogoPath = "";
    let uploadedCoverPath = "";

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const businessId = session?.user?.id;
      if (!businessId) {
        return { error: new Error("لم يتم العثور على جلسة المستخدم") };
      }

      let nextLogoUrl = removeLogo ? null : logoUrl || null;
      let nextCoverUrl = removeCover ? null : coverUrl || null;

      if (logoFile instanceof File) {
        const compressedLogo = await compressLogo(logoFile);
        uploadedLogoPath = buildLogoPath(compressedLogo);

        const { error: uploadError } = await supabase.storage
          .from(logoBucketName)
          .upload(uploadedLogoPath, compressedLogo, {
            contentType: compressedLogo.type || logoFile.type,
            upsert: false,
            metadata: { business: businessId },
          });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from(logoBucketName)
          .getPublicUrl(uploadedLogoPath);
        nextLogoUrl = publicData.publicUrl;
      }

      if (coverFile instanceof File) {
        const compressedCover = await compressCover(coverFile);
        uploadedCoverPath = buildCoverPath(compressedCover);

        const { error: uploadError } = await supabase.storage
          .from(logoBucketName)
          .upload(uploadedCoverPath, compressedCover, {
            contentType: compressedCover.type || coverFile.type,
            upsert: false,
            metadata: { business: businessId },
          });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from(logoBucketName)
          .getPublicUrl(uploadedCoverPath);
        nextCoverUrl = publicData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("businesses")
        .update({
          logo_url: nextLogoUrl,
          cover_url: nextCoverUrl,
        })
        .eq("id", businessId);

      if (updateError) throw updateError;

      setLogoUrl(nextLogoUrl || "");
      setCoverUrl(nextCoverUrl || "");

      return {
        logoUrl: nextLogoUrl || "",
        coverUrl: nextCoverUrl || "",
        error: null,
      };
    } catch (err) {
      if (uploadedLogoPath) {
        await supabase.storage.from(logoBucketName).remove([uploadedLogoPath]);
      }
      if (uploadedCoverPath) {
        await supabase.storage.from(logoBucketName).remove([uploadedCoverPath]);
      }

      console.error("Error saving business branding:", err);
      return { error: err };
    } finally {
      setIsSaving(false);
    }
  }

  return {
    logoUrl,
    coverUrl,
    isLoading,
    isSaving,
    error,
    saveBranding,
    reloadBranding: loadBranding,
  };
}
