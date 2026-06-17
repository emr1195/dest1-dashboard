import { redirect } from "next/navigation";

const CertificatesRedirectPage = () => {
  redirect("/list/certificates");
};

export default CertificatesRedirectPage;
