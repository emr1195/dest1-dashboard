"use client";

import { getBadgeCatalog } from "@/lib/badgeCatalog";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const BadgeBox = ({
  userId,
  userType,
  studentGroup,
}: {
  userId: string;
  userType: "student" | "teacher";
  canUpload: boolean;
  studentGroup?: string;
}) => {
  const [completed, setCompleted] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const completedSet = useMemo(() => new Set(completed), [completed]);
  const badges = getBadgeCatalog(userType, studentGroup);

  useEffect(() => {
    let active = true;

    const loadBadges = async () => {
      try {
        const response = await fetch(
          `/api/badge-certificates?userId=${encodeURIComponent(userId)}&userType=${encodeURIComponent(userType)}`
        );
        const data = await response.json().catch(() => null);

        if (active && response.ok && Array.isArray(data?.completedBadges)) {
          setCompleted(data.completedBadges);
          setStatuses(data.statuses || {});
        }
      } catch {
        // Preserve the last known badge state when the connection is interrupted.
      }
    };

    loadBadges();
    const interval = window.setInterval(loadBadges, 30000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [userId, userType]);

  if (!badges.length) return null;

  return (
    <div className="flex w-full flex-wrap gap-2">
      {badges.map((badge) => (
        <span
          key={badge.src}
          title={
            completedSet.has(badge.id)
              ? `${badge.alt} aprobado`
              : statuses[badge.id] === "pending"
                ? `${badge.alt} pendiente de validacion`
                : `${badge.alt} sin validar`
          }
          className={`rounded-md ${
            statuses[badge.id] === "pending" ? "ring-1 ring-lamaYellow" : ""
          }`}
        >
          <Image
            src={badge.src}
            alt={badge.alt}
            width={80}
            height={80}
            className={`h-11 w-10 rounded-md object-contain transition ${
              completedSet.has(badge.id)
                ? "filter-none"
                : "grayscale contrast-125 opacity-70"
            }`}
          />
        </span>
      ))}
    </div>
  );
};

export default BadgeBox;
