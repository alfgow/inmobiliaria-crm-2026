export const USER_ROLES = ["admin", "user"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

export function getUserRoleLabel(role: UserRole | string) {
  switch (role) {
    case "admin":
      return "Administrador";
    default:
      return "Usuario";
  }
}

export function userRoleBadgeClass(role: UserRole | string) {
  switch (role) {
    case "admin":
      return "border-violet-200 bg-violet-50 text-violet-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}
