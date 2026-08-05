import { cookies } from "next/headers";

import { LoginForm } from "@/features/auth/components/login-form";
import { DEVICE_COOKIE } from "@/features/auth/lib/device-token";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const hasTrustedDevice = Boolean(cookieStore.get(DEVICE_COOKIE)?.value);

  return <LoginForm hasTrustedDevice={hasTrustedDevice} />;
}
