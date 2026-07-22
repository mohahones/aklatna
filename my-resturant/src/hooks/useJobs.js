import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

const fallbackJobs = [
  {
    id: 1,
    title: "شيف شاورما",
    status: "active",
    restaurant: "مأكولات الشام",
    location: "شارع بغداد",
    phone: "0980152193",
    posted: "منذ يومين",
  },
  {
    id: 2,
    title: "معلم معجنات",
    status: "active",
    restaurant: "مأكولات الشام",
    location: "شارع بغداد",
    phone: "0980152193",
    posted: "منذ 5 ساعات",
  },
  {
    id: 3,
    title: "محضر بيتزا",
    status: "closed",
    restaurant: "مأكولات الشام",
    location: "شارع بغداد",
    phone: "0980152193",
    posted: "منذ أسبوع",
  },
];

export default function useJobs() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchJobs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!supabase) {
        setJobs(fallbackJobs);
        return;
      }

      const { data, error } = await supabase.from("job_listings").select("*").order("created_at", { ascending: false });
      if (error) throw error;

      const parseBoolean = (value) =>
        value === true ||
        value === "true" ||
        value === "1" ||
        value === 1 ||
        value === "t" ||
        value === "T" ||
        value === "yes" ||
        value === "y";

      const mapped = (data || []).map((r) => {
        const isApproved = parseBoolean(r.is_approved);
        const isActive = parseBoolean(r.is_active);

        return {
          id: r.id,
          title: r.title,
          isApproved,
          isActive,
          status: isApproved ? (isActive ? "active" : "closed") : "pending",
          restaurant: r.business_name,
          business_name: r.business_name,
          business_id: r.business_id,
          location: r.location,
          contact_phone: r.contact_phone,
          phone: r.contact_phone,
          requirements: r.requirements,
          description: r.description,
          is_approved: r.is_approved,
          is_active: r.is_active,
          posted: r.created_at,
          raw: r,
        };
      });
      setJobs(mapped);
    } catch (err) {
      console.error("useJobs: fetchJobs error", err);
      setError(err);
      setJobs(fallbackJobs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchJobs();
    };
    init();
  }, []);

  const toggleStatus = async (jobId) => {
    // optimistic update
    setJobs((current) => current.map((j) => (j.id === jobId ? { ...j, status: "closed" } : j)));
    try {
      const target = jobs.find((j) => j.id === jobId);
      if (!target || !supabase) return;
      await supabase.from("job_listings").update({ is_active: false }).eq("id", jobId);
    } catch (err) {
      console.error("useJobs: toggleStatus error", err);
      // on error, refresh to restore correct state
      fetchJobs();
    }
  };

  const deleteJob = async (jobId) => {
    setIsLoading(true);
    try {
      if (!supabase) {
        setJobs((current) => current.filter((j) => j.id !== jobId));
        return;
      }
      const { error } = await supabase.from("job_listings").delete().eq("id", jobId);
      if (error) throw error;
      setJobs((current) => current.filter((j) => j.id !== jobId));
    } catch (err) {
      console.error("useJobs: deleteJob error", err);
      fetchJobs();
    } finally {
      setIsLoading(false);
    }
  };

  const republishJob = async (jobId) => {
    setIsLoading(true);
    try {
      if (!supabase) return;
      const { error } = await supabase.from("job_listings").update({ is_active: true }).eq("id", jobId);
      if (error) throw error;
      setJobs((current) => current.map((job) => (job.id === jobId ? { ...job, isActive: true, status: "active" } : job)));
    } catch (err) {
      console.error("useJobs: republishJob error", err);
      fetchJobs();
    } finally {
      setIsLoading(false);
    }
  };

  const activeCount = useMemo(() => jobs.filter((j) => j.status === "active").length, [jobs]);
  const pendingCount = useMemo(() => jobs.filter((j) => j.status === "pending").length, [jobs]);
  const closedCount = useMemo(() => jobs.filter((j) => j.status === "closed").length, [jobs]);

  return {
    jobs,
    isLoading,
    error,
    activeCount,
    pendingCount,
    closedCount,
    toggleStatus,
    deleteJob,
    republishJob,
    refresh: fetchJobs,
  };
}
