import type { DuesRepository } from "../repository";
import type { AppUser, SeedData } from "../types";

function copy<T extends object>(value: T): T {
  return { ...value };
}

/**
 * In-memory repository over the local JSON seed.
 * A resident receives rows for their own unit. An admin treasurer receives
 * every unit in their HOA, including who has paid. An unknown user id
 * receives nothing.
 */
export function createMemoryRepository(data: SeedData): DuesRepository {
  const usersById = new Map(data.users.map((user) => [user.id, user]));

  function actor(userId: string): AppUser | null {
    return usersById.get(userId) ?? null;
  }

  function visibleUnitIds(user: AppUser): Set<string> {
    if (user.role === "admin_treasurer") {
      return new Set(
        data.units
          .filter((unit) => unit.hoaId === user.hoaId)
          .map((unit) => unit.id),
      );
    }
    return new Set(user.unitId ? [user.unitId] : []);
  }

  return {
    async getUser(userId) {
      const user = actor(userId);
      return user ? copy(user) : null;
    },

    async getHoa(userId) {
      const user = actor(userId);
      if (!user) return null;
      const hoa = data.hoas.find((row) => row.id === user.hoaId);
      return hoa ? copy(hoa) : null;
    },

    async listUnits(userId) {
      const user = actor(userId);
      if (!user) return [];
      const allowed = visibleUnitIds(user);
      return data.units.filter((unit) => allowed.has(unit.id)).map(copy);
    },

    async listCharges(userId) {
      const user = actor(userId);
      if (!user) return [];
      const allowed = visibleUnitIds(user);
      return data.charges
        .filter((charge) => allowed.has(charge.unitId))
        .map(copy);
    },

    async listPayments(userId) {
      const user = actor(userId);
      if (!user) return [];
      const allowed = visibleUnitIds(user);
      return data.payments
        .filter((payment) => allowed.has(payment.unitId))
        .map(copy);
    },

    async listPaymentLinks(userId) {
      const user = actor(userId);
      if (!user) return [];
      const allowed = visibleUnitIds(user);
      return data.paymentLinks
        .filter((link) => allowed.has(link.unitId))
        .map(copy);
    },

    async listUsers(userId) {
      const user = actor(userId);
      if (!user) return [];
      if (user.role === "admin_treasurer") {
        return data.users
          .filter((row) => row.hoaId === user.hoaId)
          .map(copy);
      }
      return [copy(user)];
    },
  };
}
