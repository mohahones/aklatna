import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../supabaseClient";

export function useRestaurantProfile() {
  const [restaurantName, setRestaurantName] = useState("Time is a guest at the library");
  const [restaurantAddress, setRestaurantAddress] = useState("الرياض، حي الحمراء");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadRestaurantName() {
      if (!isSupabaseConfigured || !supabase) {
        if (isMounted) {
          setRestaurantName("Time is a guest at the library");
          setRestaurantAddress("الرياض، حي الحمراء");
          setIsLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("name_ar, name, address")
        .limit(1)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (!error && data) {
        setRestaurantName(data.name_ar || data.name || "Time is a guest at the library");
        setRestaurantAddress(data.address || "الرياض، حي الحمراء");
      } else {
        setRestaurantName("Time is a guest at the library");
        setRestaurantAddress("الرياض، حي الحمراء");
      }

      setIsLoading(false);
    }

    loadRestaurantName();

    return () => {
      isMounted = false;
    };
  }, []);

  return { restaurantName, restaurantAddress, isLoading };
}
