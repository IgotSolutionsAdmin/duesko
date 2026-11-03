import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { describe, it } from "node:test";
import { seed } from "../lib/mock/seed";

const resident = seed.users.find((user) => user.role === "resident");
const admin = seed.users.find((user) => user.role === "admin_treasurer");
if (!resident?.unitId || !admin) {
  throw new Error("Seed is missing the demo admin treasurer or resident");
}

const database = "duesko_rls";

function psqlAvailable(): boolean {
  try {
    execFileSync("sudo", ["-u", "postgres", "psql", "-d", "postgres", "-c", "select 1"], {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function psql(db: string, sql: string): string {
  return execFileSync(
    "sudo",
    ["-u", "postgres", "psql", "-d", db, "-v", "ON_ERROR_STOP=1", "-t", "-A"],
    { encoding: "utf8", input: sql },
  );
}

function sqlText(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function seedSql(): string {
  const authUsers = seed.users
    .map((user) => `insert into auth.users (id) values ('${user.id}');`)
    .join("\n");
  const hoas = seed.hoas
    .map(
      (hoa) =>
        `insert into public.hoas (id, registered_name) values ('${hoa.id}', ${sqlText(hoa.registeredName)});`,
    )
    .join("\n");
  const units = seed.units
    .map(
      (unit) =>
        `insert into public.units (id, hoa_id, label, area_sqm, rate_type, rate_centavos) values ('${unit.id}', '${unit.hoaId}', ${sqlText(unit.label)}, ${unit.areaSqm ?? "null"}, '${unit.rateType}', ${unit.rateCentavos});`,
    )
    .join("\n");
  const users = seed.users
    .map(
      (user) =>
        `insert into public.users (id, hoa_id, unit_id, email, full_name, role) values ('${user.id}', '${user.hoaId}', ${user.unitId ? `'${user.unitId}'` : "null"}, ${sqlText(user.email)}, ${sqlText(user.fullName)}, '${user.role}');`,
    )
    .join("\n");
  const charges = seed.charges
    .map(
      (charge) =>
        `insert into public.charges (id, hoa_id, unit_id, kind, description, period, amount_centavos, due_date, status) values ('${charge.id}', '${charge.hoaId}', '${charge.unitId}', '${charge.kind}', ${sqlText(charge.description)}, ${charge.period ? sqlText(charge.period) : "null"}, ${charge.amountCentavos}, '${charge.dueDate}', '${charge.status}');`,
    )
    .join("\n");
  const payments = seed.payments
    .map(
      (payment) =>
        `insert into public.payments (id, hoa_id, charge_id, unit_id, method, amount_centavos, paid_at, hoa_reference_no, recorded_by, status, reviewed_by, reviewed_at) values ('${payment.id}', '${payment.hoaId}', '${payment.chargeId}', '${payment.unitId}', '${payment.method}', ${payment.amountCentavos}, '${payment.paidAt}', ${payment.hoaReferenceNo ? sqlText(payment.hoaReferenceNo) : "null"}, '${payment.recordedBy}', '${payment.status}', '${payment.reviewedBy}', '${payment.reviewedAt}');`,
    )
    .join("\n");
  return [authUsers, hoas, units, users, charges, payments].join("\n");
}

function asUser(userId: string, statement: string): string {
  const output = psql(
    database,
    `begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '${userId}', true);
${statement}
rollback;`,
  );
  const noise = new Set(["BEGIN", "ROLLBACK", "COMMIT", userId]);
  return (
    output
      .trim()
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !noise.has(line))
      .at(-1) ?? ""
  );
}

describe("supabase row level security", { skip: psqlAvailable() ? false : "local Postgres is not running" }, () => {
  it("lets a resident read only their own unit and charges", () => {
    execFileSync("sudo", ["-u", "postgres", "psql", "-d", "postgres", "-c", `drop database if exists ${database}`], {
      stdio: "ignore",
    });
    execFileSync("sudo", ["-u", "postgres", "psql", "-d", "postgres", "-c", `create database ${database}`], {
      stdio: "ignore",
    });
    psql(
      database,
      `create extension if not exists pgcrypto;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end $$;
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;`,
    );
    psql(
      database,
      `create schema if not exists storage;
create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null references storage.buckets (id),
  name text not null,
  owner uuid,
  created_at timestamptz not null default now()
);`,
    );
    for (const file of [
      "supabase/migrations/20261102120000_v3_initial.sql",
      "supabase/migrations/20261103120000_payment_proofs.sql",
    ]) {
      execFileSync(
        "sudo",
        ["-u", "postgres", "psql", "-d", database, "-v", "ON_ERROR_STOP=1", "-f", file],
        { stdio: "pipe" },
      );
    }
    psql(database, seedSql());

    assert.equal(asUser(resident.id, "select count(*) from public.units;"), "1");
    assert.equal(
      asUser(resident.id, "select id::text from public.units;"),
      resident.unitId,
    );
    assert.equal(
      asUser(
        resident.id,
        `select count(*) from public.units where id <> '${resident.unitId}';`,
      ),
      "0",
    );
    assert.equal(
      asUser(
        resident.id,
        `select count(*) from public.charges where unit_id <> '${resident.unitId}';`,
      ),
      "0",
    );
    assert.equal(
      asUser(resident.id, "select count(*) from public.charges;"),
      String(seed.charges.filter((charge) => charge.unitId === resident.unitId).length),
    );
    assert.equal(asUser(admin.id, "select count(*) from public.units;"), String(seed.units.length));
    assert.equal(
      asUser(admin.id, "select count(*) from public.charges;"),
      String(seed.charges.length),
    );

    psql(
      database,
      `begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '${resident.id}', true);
do $$
begin
  insert into public.charges (hoa_id, unit_id, kind, description, amount_centavos, due_date, status)
  values ('${admin.hoaId}', '${resident.unitId}', 'special', 'Resident insert', 100, '2026-12-01', 'unpaid');
  raise exception 'resident insert succeeded';
exception
  when insufficient_privilege then
    null;
  when others then
    if sqlerrm = 'resident insert succeeded' then
      raise;
    end if;
    if sqlstate <> '42501' then
      raise;
    end if;
end $$;
rollback;`,
    );

    assert.equal(asUser(resident.id, "select count(*) from public.payments;"), "0");
    assert.equal(asUser(admin.id, "select count(*) from public.payments;"), "1");

    const ownCharge = seed.charges.find((charge) => charge.unitId === resident.unitId);
    const otherCharge = seed.charges.find((charge) => charge.unitId !== resident.unitId);
    if (!ownCharge || !otherCharge) throw new Error("Seed charges missing");
    const ownPath = `${admin.hoaId}/${ownCharge.id}/own.png`;
    const otherPath = `${admin.hoaId}/${otherCharge.id}/other.png`;

    psql(
      database,
      `begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '${resident.id}', true);
insert into public.payments (
  hoa_id, charge_id, unit_id, method, amount_centavos, paid_at,
  status, reference_no, proof_path, recorded_by
) values (
  '${admin.hoaId}', '${ownCharge.id}', '${resident.unitId}', 'gcash', 150000, now(),
  'pending', 'GC-1', '${ownPath}', '${resident.id}'
);
insert into storage.objects (bucket_id, name)
values ('payment-proofs', '${ownPath}');
rollback;`,
    );

    psql(
      database,
      `begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '${resident.id}', true);
do $$
begin
  insert into public.payments (
    hoa_id, charge_id, unit_id, method, amount_centavos, paid_at,
    status, reference_no, proof_path, recorded_by
  ) values (
    '${admin.hoaId}', '${otherCharge.id}', '${otherCharge.unitId}', 'gcash', 100, now(),
    'pending', 'NO', '${otherPath}', '${resident.id}'
  );
  raise exception 'cross-unit payment insert succeeded';
exception
  when insufficient_privilege then null;
  when others then
    if sqlerrm = 'cross-unit payment insert succeeded' then raise; end if;
    if sqlstate <> '42501' then raise; end if;
end $$;
do $$
begin
  insert into storage.objects (bucket_id, name)
  values ('payment-proofs', '${otherPath}');
  raise exception 'cross-unit proof insert succeeded';
exception
  when insufficient_privilege then null;
  when others then
    if sqlerrm = 'cross-unit proof insert succeeded' then raise; end if;
    if sqlstate <> '42501' then raise; end if;
end $$;
rollback;`,
    );

    psql(
      database,
      `insert into storage.objects (bucket_id, name) values ('payment-proofs', '${otherPath}');`,
    );
    assert.equal(
      asUser(
        resident.id,
        `select count(*) from storage.objects where name = '${otherPath}';`,
      ),
      "0",
    );
    assert.equal(
      asUser(admin.id, "select count(*) from storage.objects;"),
      "1",
    );
  });
});
