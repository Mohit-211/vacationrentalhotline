import "server-only";
import { asc, count, eq } from "drizzle-orm";
import { ADMIN_ROLE, CUSTOMER_ROLE, PERMISSION_NAMES, PERMISSIONS } from "@/lib/permissions";
import { db } from "@/server/db";
import { roles, users } from "@/server/db/schema";
import { HttpError, notFound } from "@/server/http";

// Staff roles: named sets of permissions. "admin" always has every
// permission and can't be changed; "customer" is for site accounts and
// isn't a staff role; other built-in roles can be edited but not deleted.

type RoleRow = typeof roles.$inferSelect;

const serializeRole = (role: RoleRow, members: number) => ({
  name: role.name,
  label: role.label,
  permissions: role.name === ADMIN_ROLE ? PERMISSION_NAMES : role.permissions,
  system: role.system,
  /** Whether permissions and label can be changed. */
  editable: role.name !== ADMIN_ROLE,
  members,
});

/** The permissions a role can include, with what each allows. */
export const listPermissions = () => PERMISSION_NAMES.map((name) => ({ name, description: PERMISSIONS[name] }));

/** Staff roles (not "customer"), with how many people have each. */
export async function listRoles() {
  const [rows, counts] = await Promise.all([
    db().select().from(roles).orderBy(asc(roles.label)),
    db().select({ role: users.role, n: count() }).from(users).groupBy(users.role),
  ]);
  const members = new Map(counts.map((row) => [row.role, row.n]));
  return rows.filter((row) => row.name !== CUSTOMER_ROLE).map((row) => serializeRole(row, members.get(row.name) ?? 0));
}

async function findRole(name: string): Promise<RoleRow> {
  const [row] = await db().select().from(roles).where(eq(roles.name, name)).limit(1);
  if (!row || row.name === CUSTOMER_ROLE) throw notFound("Role");
  return row;
}

export async function createRole(input: { name: string; label: string; permissions: string[] }) {
  const [existing] = await db().select().from(roles).where(eq(roles.name, input.name)).limit(1);
  if (existing) throw new HttpError(409, "ROLE_EXISTS", "A role with this name already exists.", { name: ["A role with this name already exists."] });
  await db().insert(roles).values({ name: input.name, label: input.label, permissions: [...new Set(input.permissions)] });
  return serializeRole(await findRole(input.name), 0);
}

export async function updateRole(name: string, changes: { label?: string; permissions?: string[] }) {
  const role = await findRole(name);
  if (role.name === ADMIN_ROLE) throw new HttpError(409, "ROLE_LOCKED", "The admin role always has every permission.");
  await db()
    .update(roles)
    .set({
      ...(changes.label ? { label: changes.label } : {}),
      ...(changes.permissions ? { permissions: [...new Set(changes.permissions)] } : {}),
    })
    .where(eq(roles.name, name));
  const [{ n }] = await db().select({ n: count() }).from(users).where(eq(users.role, name));
  return serializeRole(await findRole(name), n);
}

export async function deleteRole(name: string) {
  const role = await findRole(name);
  if (role.system) throw new HttpError(409, "ROLE_LOCKED", "Built-in roles can't be deleted.");
  const [{ n }] = await db().select({ n: count() }).from(users).where(eq(users.role, name));
  if (n > 0) throw new HttpError(409, "ROLE_IN_USE", `${n} staff ${n === 1 ? "member has" : "members have"} this role; give them another role first.`);
  await db().delete(roles).where(eq(roles.name, name));
}
