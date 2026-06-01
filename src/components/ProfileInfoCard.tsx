import Image from "next/image";
import BadgeBox from "./BadgeBox";
import ProfileImageUpload from "./ProfileImageUpload";
import ProfileRankEditor from "./ProfileRankEditor";

const studentGroupColors: Record<string, string> = {
  Navegantes: "#BC0E0D",
  Pioneros: "#004A92",
  Seguidores: "#702382",
  Exploradores: "#3DA435",
};

const ProfileInfoCard = ({
  id,
  type,
  img,
  name,
  email,
  phone,
  rank,
  canUpload,
  studentGroup,
}: {
  id: string;
  type: "student" | "teacher";
  img?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  rank?: string | null;
  canUpload: boolean;
  studentGroup?: string;
}) => {
  const studentBackgroundColor =
    type === "student" && studentGroup ? studentGroupColors[studentGroup] : undefined;

  return (
    <div
      className="relative z-40 flex min-w-0 flex-1 flex-col items-center gap-4 rounded-md bg-lamaSky px-4 py-6 text-white sm:flex-row sm:items-start"
      style={studentBackgroundColor ? { backgroundColor: studentBackgroundColor } : undefined}
    >
      <div className="flex w-full justify-center sm:w-[180px] sm:min-w-[180px]">
        <div className="relative h-[184px] w-36 shrink-0">
          <ProfileImageUpload id={id} type={type} src={img} canUpload={canUpload} />
          <ProfileRankEditor id={id} type={type} rank={rank} canEdit={canUpload} />
        </div>
      </div>

      <div className="flex min-w-0 w-full flex-col gap-4 py-1 text-center sm:flex-1 sm:pl-4 sm:text-left md:pl-5">
        <div>
          <h1 className="break-words text-xl font-semibold">{name}</h1>
          {rank && (
            <p className="mt-1 break-words text-sm font-semibold text-white/80">
              {rank}
            </p>
          )}
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-4 gap-y-3 text-xs font-medium sm:justify-start">
          <div className="flex min-w-0 items-center gap-2">
            <Image src="/mail.png" alt="" width={14} height={14} />
            <span className="min-w-0 break-all">{email || "-"}</span>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <Image src="/phone.png" alt="" width={14} height={14} />
            <span className="min-w-0 break-all">{phone || "-"}</span>
          </div>
          {type === "teacher" || studentGroup !== "Navegantes" ? (
            <div className="w-full min-w-0">
              <BadgeBox
                userId={id}
                userType={type}
                canUpload={canUpload}
                studentGroup={studentGroup}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProfileInfoCard;
