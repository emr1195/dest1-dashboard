import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const main = async () => {
  const { syncFirebaseAttendance } = await import(
    "../src/lib/firebaseAttendanceSync"
  );
  const result = await syncFirebaseAttendance();
  console.log(JSON.stringify(result, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
