import { createAccessControl } from "better-auth/plugins/access"
import { defaultStatements, ownerAc, adminAc, memberAc } from "better-auth/plugins/organization/access";

// convert readonly arrays to mutable string[]
function makeMutable<T extends Record<string, readonly string[]>>(input: T): {
  [K in keyof T]: string[]
} {
  const output = {} as any
  for (const key in input) {
    output[key] = [...(input[key] as readonly string[])]
  }
  return output
}

const defaultOrgPerms = makeMutable(defaultStatements)

export const statements = {
  ...defaultOrgPerms,
  inventory: ["view", "add", "edit", "delete"],
  orders: ["view", "create", "fulfill", "cancel"],
  shifts: ["read", "approve", "manage"],
  pricing: ["view", "set"],
  analytics: ["basic", "advanced"],
  financials: ["view", "manage"],
  users: ["manage"],
  team: ["manage"],

  wallet: ["view", "topup", "use", "withdraw"],
  report: ["view", "export"],
  settings: ["read", "update"],
}

export const ac = createAccessControl(statements)

export const roles = {
  owner: ac.newRole({
    ...ownerAc.statements,
    ...statements
  }),

  admin: ac.newRole({
    ...defaultOrgPerms, // include org-level permissions like invite
    ...ownerAc.statements,
    inventory: ["view", "edit", "add", "delete"],
    orders: ["view", "create", "fulfill", "cancel"],
    shifts: ["read", "approve", "manage"],
    pricing: ["view", "set"],
    analytics: ["basic", "advanced"],
    financials: ["view", "manage"],
    users: ["manage"],
    team: ["manage"],
  }),

  wholesaler: ac.newRole({
    inventory: ["view", "edit"],
    orders: ["view", "fulfill"],
    shifts: ["read", "approve"],
    pricing: ["view", "set"],
    analytics: ["advanced"],
  }),

  retailer: ac.newRole({
    inventory: ["view"],
    orders: ["view", "create", "cancel"],
    shifts: ["read", "approve"],
    pricing: ["view"],
    analytics: ["basic"],
  }),

  bartender: ac.newRole({
    orders: ["create", "view", "fulfill"],
    analytics: ["basic"],
  }),

  cashier: ac.newRole({
    orders: ["view", "create", "cancel"],
    financials: ["view"],
  }),

  finance: ac.newRole({
    financials: ["view", "manage"],
    analytics: ["advanced"],
  }),

  driver: ac.newRole({
    orders: ["view", "fulfill"],
  }),
  member: ac.newRole({
    ...memberAc.statements,
    inventory: ["read"],
    wallet: ["view", "use"],
    report: ["view"],
    settings: ["read"],
  })
}
