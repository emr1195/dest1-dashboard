"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, useRef, useState } from "react";

const ProfileImageUpload = ({
  id,
  type,
  src,
  canUpload,
  compact = false,
}: {
  id: string;
  type: "student" | "teacher";
  src?: string | null;
  canUpload: boolean;
  compact?: boolean;
}) => {
  const [imageSrc, setImageSrc] = useState(src || "/noAvatar.png");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const saveImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setSaving(true);

    const formData = new FormData();
    formData.append("id", id);
    formData.append("type", type);
    formData.append("file", file);

    const response = await fetch("/api/profile-image", {
      method: "POST",
      body: formData,
    });

    const data = await response.json().catch(() => null);
    setSaving(false);
    event.target.value = "";

    if (!response.ok) return;

    setImageSrc(data.img);
    router.refresh();
  };

  const image = (
    <div
      className={`relative overflow-hidden rounded-full ${compact ? "h-20 w-20" : "h-40 w-40"} ${
        canUpload ? `cursor-pointer ring-2 ${compact ? "ring-[#DCE4EE] ring-offset-2 ring-offset-white" : "ring-white/80 ring-offset-2 ring-offset-lamaSky"}` : ""
      }`}
      title={canUpload ? "Cambiar foto de perfil" : undefined}
    >
      <Image
        src={imageSrc}
        alt="Foto de perfil"
        width={compact ? 80 : 160}
        height={compact ? 80 : 160}
        className={`${compact ? "h-20 w-20" : "h-40 w-40"} rounded-full object-cover`}
      />
      {canUpload && (
        <div className="group absolute inset-0 flex items-end justify-center bg-black/0 text-xs font-medium text-white transition hover:bg-black/35">
          <span className={`${compact ? "mb-2 px-2" : "mb-4 px-3"} rounded-full bg-[#0F2747]/90 py-1 opacity-0 transition group-hover:opacity-100`}>
            {saving ? "Guardando..." : "Cambiar foto"}
          </span>
        </div>
      )}
    </div>
  );

  if (!canUpload) return image;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={saveImage}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={saving}
        className="block rounded-full disabled:cursor-wait"
        aria-label="Cambiar foto de perfil"
      >
        {image}
      </button>
    </>
  );
};

export default ProfileImageUpload;
