import { duesDescription, monthlyAmountCentavos, parseDueDate, parsePeriod } from "../charges";
import type {
  DuesRepository,
  Failure,
  MonthlyDuesInput,
  Result,
  SpecialAssessmentInput,
} from "../repository";
import type { AppUser, Charge, SeedData, Unit, UnitDraft } from "../types";

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

  function requireAdmin(userId: string): AppUser | Failure {
    const user = actor(userId);
    if (!user) return { ok: false, message: "Sign in is required." };
    if (user.role !== "admin_treasurer") {
      return {
        ok: false,
        message: "Only the admin treasurer can change this.",
      };
    }
    return user;
  }

  function isFailure(value: AppUser | Failure): value is Failure {
    return "ok" in value;
  }

  function normalizeDraft(draft: UnitDraft): Result<UnitDraft> {
    const label = draft.label.trim();
    if (!label) return { ok: false, message: "Unit label is required." };
    if (label.length > 80) {
      return { ok: false, message: "Unit label is too long." };
    }
    if (draft.rateType !== "flat" && draft.rateType !== "per_sqm") {
      return { ok: false, message: "Choose a flat amount or a per-sqm rate." };
    }
    if (!Number.isSafeInteger(draft.rateCentavos) || draft.rateCentavos < 0) {
      return {
        ok: false,
        message: "Enter the amount in pesos, such as 1500.00.",
      };
    }
    if (draft.rateType === "flat") {
      return {
        ok: true,
        value: {
          label,
          rateType: "flat",
          rateCentavos: draft.rateCentavos,
          areaSqm: null,
        },
      };
    }
    if (
      draft.areaSqm === null ||
      !Number.isFinite(draft.areaSqm) ||
      draft.areaSqm <= 0
    ) {
      return { ok: false, message: "Enter the floor area in square metres." };
    }
    return {
      ok: true,
      value: {
        label,
        rateType: "per_sqm",
        rateCentavos: draft.rateCentavos,
        areaSqm: draft.areaSqm,
      },
    };
  }

  function monthlyDrafts(
    hoaId: string,
    input: MonthlyDuesInput,
  ): Result<Charge[]> {
    const period = parsePeriod(input.period);
    if (!period.ok) return period;
    const dueDate = parseDueDate(input.dueDate);
    if (!dueDate.ok) return dueDate;
    const typed = input.description.trim().replace(/\s+/g, " ");
    if (typed.length > 200) {
      return { ok: false, message: "Description is too long." };
    }
    const description = typed || duesDescription(period.value);
    const units = data.units.filter((unit) => unit.hoaId === hoaId);
    const already = new Set(
      data.charges
        .filter(
          (charge) =>
            charge.kind === "dues" &&
            charge.period === period.value &&
            charge.hoaId === hoaId,
        )
        .map((charge) => charge.unitId),
    );
    const missing = units.filter((unit) => !already.has(unit.id));
    if (missing.length === 0) {
      return {
        ok: false,
        message: "Monthly dues for that period already exist.",
      };
    }
    return {
      ok: true,
      value: missing.map((unit) => ({
        id: crypto.randomUUID(),
        hoaId,
        unitId: unit.id,
        kind: "dues" as const,
        description,
        period: period.value,
        amountCentavos: monthlyAmountCentavos(unit),
        dueDate: dueDate.value,
        status: "unpaid" as const,
      })),
    };
  }

  function specialDrafts(
    hoaId: string,
    input: SpecialAssessmentInput,
  ): Result<Charge[]> {
    const description = input.description.trim().replace(/\s+/g, " ");
    if (!description) {
      return { ok: false, message: "Description is required." };
    }
    if (description.length > 200) {
      return { ok: false, message: "Description is too long." };
    }
    const dueDate = parseDueDate(input.dueDate);
    if (!dueDate.ok) return dueDate;
    if (!Number.isSafeInteger(input.amountCentavos) || input.amountCentavos <= 0) {
      return {
        ok: false,
        message: "Enter the amount in pesos, such as 500.00.",
      };
    }
    const allowed = new Set(
      data.units.filter((unit) => unit.hoaId === hoaId).map((unit) => unit.id),
    );
    const uniqueIds = [...new Set(input.unitIds)];
    if (uniqueIds.length === 0) {
      return { ok: false, message: "Choose at least one unit." };
    }
    if (uniqueIds.some((id) => !allowed.has(id))) {
      return { ok: false, message: "Choose a unit in this association." };
    }
    return {
      ok: true,
      value: uniqueIds.map((unitId) => ({
        id: crypto.randomUUID(),
        hoaId,
        unitId,
        kind: "special" as const,
        description,
        period: null,
        amountCentavos: input.amountCentavos,
        dueDate: dueDate.value,
        status: "unpaid" as const,
      })),
    };
  }

  function labelTaken(hoaId: string, label: string, exceptId?: string): boolean {
    return data.units.some(
      (unit) =>
        unit.hoaId === hoaId && unit.label === label && unit.id !== exceptId,
    );
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

    async updateRegisteredName(userId, registeredName) {
      const admin = requireAdmin(userId);
      if (isFailure(admin)) return admin;
      const name = registeredName.trim();
      if (!name) return { ok: false, message: "Registered name is required." };
      if (name.length > 200) {
        return { ok: false, message: "Registered name is too long." };
      }
      const hoa = data.hoas.find((row) => row.id === admin.hoaId);
      if (!hoa) return { ok: false, message: "Association was not found." };
      hoa.registeredName = name;
      return { ok: true, value: copy(hoa) };
    },

    async createUnit(userId, draft) {
      const admin = requireAdmin(userId);
      if (isFailure(admin)) return admin;
      const normalized = normalizeDraft(draft);
      if (!normalized.ok) return normalized;
      if (labelTaken(admin.hoaId, normalized.value.label)) {
        return { ok: false, message: "A unit with that label already exists." };
      }
      const unit: Unit = {
        id: crypto.randomUUID(),
        hoaId: admin.hoaId,
        ...normalized.value,
      };
      data.units.push(unit);
      return { ok: true, value: copy(unit) };
    },

    async updateUnit(userId, unitId, draft) {
      const admin = requireAdmin(userId);
      if (isFailure(admin)) return admin;
      const normalized = normalizeDraft(draft);
      if (!normalized.ok) return normalized;
      const unit = data.units.find(
        (row) => row.id === unitId && row.hoaId === admin.hoaId,
      );
      if (!unit) return { ok: false, message: "That unit was not found." };
      if (labelTaken(admin.hoaId, normalized.value.label, unit.id)) {
        return { ok: false, message: "A unit with that label already exists." };
      }
      unit.label = normalized.value.label;
      unit.rateType = normalized.value.rateType;
      unit.rateCentavos = normalized.value.rateCentavos;
      unit.areaSqm = normalized.value.areaSqm;
      return { ok: true, value: copy(unit) };
    },

    async createMonthlyDues(userId, input) {
      const admin = requireAdmin(userId);
      if (isFailure(admin)) return admin;
      const drafted = monthlyDrafts(admin.hoaId, input);
      if (!drafted.ok) return drafted;
      const created = drafted.value.map((charge) => {
        data.charges.push(charge);
        return copy(charge);
      });
      return { ok: true, value: created };
    },

    async createSpecialAssessment(userId, input) {
      const admin = requireAdmin(userId);
      if (isFailure(admin)) return admin;
      const drafted = specialDrafts(admin.hoaId, input);
      if (!drafted.ok) return drafted;
      const created = drafted.value.map((charge) => {
        data.charges.push(charge);
        return copy(charge);
      });
      return { ok: true, value: created };
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
