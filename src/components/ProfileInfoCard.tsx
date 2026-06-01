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
      className="relative z-40 flex flex-1 gap-4 rounded-md bg-lamaSky px-4 py-6 text-white"
      style={studentBackgroundColor ? { backgroundColor: studentBackgroundColor } : undefined}
    >
      <div className="flex w-1/3 min-w-[150px] justify-center">
        <div className="relative h-[184px] w-36 shrink-0">
          <ProfileImageUpload id={id} type={type} src={img} canUpload={canUpload} />
          <ProfileRankEditor id={id} type={type} rank={rank} canEdit={canUpload} />
        </div>
      </div>

      <div className="flex w-2/3 flex-col gap-4 py-1 pl-5">
        <h1 className="text-xl font-semibold">{name}</h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-xs font-medium">
          <div className="flex items-center gap-2">
            <Image src="/mail.png" alt="" width={14} height={14} />
            <span>{email || "-"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Image src="/phone.png" alt="" width={14} height={14} />
            <span>{phone || "-"}</span>
          </div>
          {type === "teacher" || studentGroup !== "Navegantes" ? (
            <div className="w-full">
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
