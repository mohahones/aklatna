import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../../supabaseClient";

export default function useBusinessAvatar() {
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [rating, setRating] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadAvatar() {
      if (!isSupabaseConfigured || !supabase) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const businessId = session?.user?.id;
        if (!businessId) {
          if (isMounted) setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("businesses")
          .select("logo_url, cover_url, name_ar, name, rating")
          .eq("id", businessId)
          .maybeSingle();

        if (!isMounted) return;

        if (error) {
          console.error("Error loading business avatar:", error);
          return;
        }

        setLogoUrl(data?.logo_url || "");
        setCoverUrl(data?.cover_url || "");
        setNameAr(data?.name_ar || data?.name || "");
        setRating(data?.rating ?? null);
      } catch (err) {
        console.error("Exception loading business avatar:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAvatar();

    return () => {
      isMounted = false;
    };
  }, []);

  const initial = (nameAr || "م").trim().charAt(0) || "م";

  return { logoUrl, coverUrl, nameAr, initial, isLoading, rating };
}
