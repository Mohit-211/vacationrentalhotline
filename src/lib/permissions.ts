// What staff roles can be allowed to do in the admin panel. Roles (stored in
// the roles table) are named sets of these; admins can create roles and pick
// permissions, but the list itself is fixed here because the API checks it.

export const PERMISSIONS = {
  "dashboard.view": "See the dashboard figures",
  "customers.view": "Look up customers, their properties, notes and payments",
  "customers.manage": "Create, edit and delete customers, their properties and notes",
  "billing.manage": "Cancel renewals, end cover and refund payments",
  "messages.view": "Read contact-form messages",
  "messages.manage": "Delete contact-form messages",
  "activity.view": "See the sign-in history",
  "staff.manage": "Manage staff accounts and roles",
} as const;

export type Permission = keyof typeof PERMISSIONS;
export const PERMISSION_NAMES = Object.keys(PERMISSIONS) as Permission[];

export const isPermission = (value: unknown): value is Permission =>
  typeof value === "string" && value in PERMISSIONS;

/** Built-in roles. "admin" can do everything and can't be changed; "customer" is for site accounts only. */
export const SYSTEM_ROLES = {
  admin: { label: "Admin", permissions: PERMISSION_NAMES },
  employee: {
    label: "Employee",
    permissions: ["dashboard.view", "customers.view", "customers.manage"] as Permission[],
  },
  customer: { label: "Customer", permissions: [] as Permission[] },
} as const;

export const ADMIN_ROLE = "admin";
export const CUSTOMER_ROLE = "customer";
