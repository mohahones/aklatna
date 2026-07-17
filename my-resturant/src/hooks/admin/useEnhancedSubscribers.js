import { useMemo } from "react";
import { formatDate, getRemainingTime } from "../../utils/dateUtils";

export function useEnhancedSubscribers(subscribers, now) {
  return useMemo(
    () =>
      subscribers.map((subscriber) => {
        const remaining = getRemainingTime(subscriber.expires_at, now);
        const isExpiringSoon = !remaining.isExpired && remaining.milliseconds <= 5 * 86400000;
        return {
          ...subscriber,
          remaining: { ...remaining, isExpiringSoon },
          createdAtLabel: formatDate(subscriber.created_at),
          expiresAtLabel: formatDate(subscriber.expires_at),
        };
      }),
    [subscribers, now]
  );
}
