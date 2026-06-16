import CertificateCenter from "@/components/CertificateCenter";
import { getCurrentUser } from "@/lib/auth";
import { getBadgeCatalog, getStudentGroupName } from "@/lib/badgeCatalog";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

const CertificatesPage = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser) redirect("/");

  if (currentUser.role === "admin") {
    return (
      <div className="flex-1 p-4">
        <CertificateCenter role="admin" />
      </div>
    );
  }

  if (currentUser.role === "teacher") {
    return (
      <div className="flex-1 p-4">
        <CertificateCenter
          role="teacher"
          userId={currentUser.id}
          userType="teacher"
          badges={getBadgeCatalog("teacher")}
        />
      </div>
    );
  }

  if (currentUser.role !== "student") notFound();

  const student = await prisma.muchacho.findUnique({
    where: { id: currentUser.id },
    select: { birthday: true },
  });

  if (!student) notFound();

  const studentGroup = getStudentGroupName(student.birthday);

  return (
    <div className="flex-1 p-4">
      <CertificateCenter
        role="student"
        userId={currentUser.id}
        userType="student"
        studentGroup={studentGroup}
        badges={getBadgeCatalog("student", studentGroup)}
      />
    </div>
  );
};

export default CertificatesPage;
