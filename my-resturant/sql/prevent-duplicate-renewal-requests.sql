-- 1) منع أكثر من طلب pending لنفس المطعم
CREATE UNIQUE INDEX IF NOT EXISTS subscription_requests_one_pending_renewal
ON public.subscription_requests (business_id)
WHERE status = 'pending' AND request_type = 'RENEWAL';

-- 2) السماح للمطعم بقراءة طلباته (مهم جداً لعمل الزر)
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_read_own_subscription_requests" ON public.subscription_requests;
CREATE POLICY "business_read_own_subscription_requests"
ON public.subscription_requests
FOR SELECT
TO authenticated
USING (business_id = auth.uid());

-- 3) السماح للمطعم بإرسال طلب تجديد
DROP POLICY IF EXISTS "business_insert_own_renewal_request" ON public.subscription_requests;
CREATE POLICY "business_insert_own_renewal_request"
ON public.subscription_requests
FOR INSERT
TO authenticated
WITH CHECK (
  business_id = auth.uid()
  AND request_type = 'RENEWAL'
  AND status = 'pending'
);
