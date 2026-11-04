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
        `insert into public.hoas (id, registered_name, how_to_pay) values ('${hoa.id}', ${sqlText(hoa.registeredName)}, ${sqlText(hoa.howToPay)});`,
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
        `insert into public.payments (id, hoa_id, charge_id, unit_id, method, amount_centavos, paid_at, hoa_reference_no, recorded_by, status, reviewed_by, reviewed_at, reference_no, rejection_reason, proof_path) values ('${payment.id}', '${payment.hoaId}', '${payment.chargeId}', '${payment.unitId}', '${payment.method}', ${payment.amountCentavos}, '${payment.paidAt}', ${payment.hoaReferenceNo ? sqlText(payment.hoaReferenceNo) : "null"}, ${payment.recordedBy ? `'${payment.recordedBy}'` : "null"}, '${payment.status}', ${payment.reviewedBy ? `'${payment.reviewedBy}'` : "null"}, ${payment.reviewedAt ? `'${payment.reviewedAt}'` : "null"}, ${payment.referenceNo ? sqlText(payment.referenceNo) : "null"}, ${payment.rejectionReason ? sqlText(payment.rejectionReason) : "null"}, ${payment.proofPath ? sqlText(payment.proofPath) : "null"});`,
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
);
alter table storage.objects enable row level security;
grant usage on schema storage to authenticated;
grant select on table storage.buckets to authenticated;
grant select, insert on table storage.objects to authenticated;`,
    );
    for (const file of [
      "supabase/migrations/20261102120000_v3_initial.sql",
      "supabase/migrations/20261103120000_payment_proofs.sql",
      "supabase/migrations/20261103180000_export_and_acknowledgments.sql",
      "supabase/migrations/20261103210000_how_to_pay.sql",
      "supabase/migrations/20261107120000_waitlist_signups.sql",
      "supabase/migrations/20261108120000_lock_security_definer_helpers.sql",
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

    assert.equal(
      asUser(resident.id, "select count(*) from public.payments;"),
      String(seed.payments.filter((payment) => payment.unitId === resident.unitId).length),
    );
    assert.equal(asUser(admin.id, "select count(*) from public.payments;"), String(seed.payments.length));
    assert.equal(asUser(resident.id, "select count(*) from public.export_audit_log;"), "0");
    psql(
      database,
      `begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '${admin.id}', true);
insert into public.export_audit_log (hoa_id, exported_by, kind)
values ('${admin.hoaId}', '${admin.id}', 'payments');
commit;`,
    );
    assert.equal(asUser(admin.id, "select count(*) from public.export_audit_log;"), "1");
    assert.equal(asUser(resident.id, "select count(*) from public.export_audit_log;"), "0");

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

    const waitlistInsert = `
insert into public.waitlist_signups (
  full_name, email, hoa_name, city, units_range, role, collect_methods, consent_at, user_agent
) values (
  'Maria Santos', 'maria.santos@example.com', 'Greenfields HOA', 'Quezon City',
  '51-150', 'Treasurer', array['GCash'], now(), 'test'
);`;
    psql(
      database,
      `begin;
set local role anon;
${waitlistInsert}
commit;`,
    );
    psql(
      database,
      `begin;
set local role anon;
do $$
begin
  perform count(*) from public.waitlist_signups;
  raise exception 'anon select succeeded';
exception
  when insufficient_privilege then
    null;
end $$;
rollback;`,
    );
    assert.equal(asUser(admin.id, "select count(*) from public.waitlist_signups;"), "1");
    assert.equal(asUser(resident.id, "select count(*) from public.waitlist_signups;"), "0");

    const otherHoa = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const otherUnit = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const stranger = "99999999-9999-4999-8999-999999999999";
    psql(
      database,
      `insert into public.hoas (id, registered_name) values ('${otherHoa}', 'Other HOA');
insert into public.units (id, hoa_id, label, rate_type, rate_centavos)
values ('${otherUnit}', '${otherHoa}', 'Other Lot', 'flat', 100);`,
    );

    assert.equal(
      psql(
        database,
        `select count(*) from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('current_hoa_id', 'current_unit_id', 'is_admin_treasurer', 'can_read_unit');`,
      ).trim(),
      "0",
    );

    for (const name of [
      "private.current_hoa_id()",
      "private.current_unit_id()",
      "private.is_admin_treasurer()",
      "private.can_read_unit(uuid, uuid)",
    ]) {
      assert.equal(
        psql(database, `select has_function_privilege('anon', '${name}', 'execute');`).trim(),
        "f",
        `${name} must not be executable by anon`,
      );
      assert.equal(
        psql(database, `select has_function_privilege('public', '${name}', 'execute');`).trim(),
        "f",
        `${name} must not be executable by public`,
      );
      assert.equal(
        psql(
          database,
          `select 'search_path=""' = any(proconfig)
from pg_proc
where oid = '${name}'::regprocedure;`,
        ).trim(),
        "t",
        `${name} must set an empty search_path`,
      );
    }

    psql(
      database,
      `do $probe$
begin
  if not exists (select 1 from pg_roles where rolname = 'duesko_public_probe') then
    create role duesko_public_probe nologin;
  end if;
end
$probe$;`,
    );

    for (const role of ["anon", "duesko_public_probe"]) {
      for (const call of [
        "perform private.current_hoa_id()",
        "perform private.current_unit_id()",
        "perform private.is_admin_treasurer()",
        `perform private.can_read_unit('${admin.hoaId}', '${resident.unitId}')`,
      ]) {
        psql(
          database,
          `begin;
set local role ${role};
do $denied$
begin
  ${call};
  raise exception 'unauthorized call succeeded';
exception
  when insufficient_privilege then
    null;
  when others then
    if sqlerrm = 'unauthorized call succeeded' then
      raise;
    end if;
    if sqlstate <> '42501' then
      raise;
    end if;
end
$denied$;
rollback;`,
        );
      }
    }

    assert.equal(asUser(stranger, "select private.current_hoa_id() is null;"), "t");
    assert.equal(asUser(stranger, "select private.current_unit_id() is null;"), "t");
    assert.equal(asUser(stranger, "select private.is_admin_treasurer();"), "f");
    assert.equal(
      asUser(stranger, `select private.can_read_unit('${admin.hoaId}', '${resident.unitId}');`),
      "f",
    );
    assert.equal(asUser(resident.id, "select private.is_admin_treasurer();"), "f");
    assert.equal(asUser(resident.id, "select private.current_hoa_id()::text;"), admin.hoaId);
    assert.equal(asUser(resident.id, "select private.current_unit_id()::text;"), resident.unitId);
    assert.equal(
      asUser(resident.id, `select private.can_read_unit('${admin.hoaId}', '${resident.unitId}');`),
      "t",
    );
    assert.equal(
      asUser(
        resident.id,
        `select private.can_read_unit('${admin.hoaId}', '22222222-2222-4222-8222-222222222202');`,
      ),
      "f",
    );
    assert.equal(
      asUser(resident.id, `select private.can_read_unit('${otherHoa}', '${otherUnit}');`),
      "f",
    );
    assert.equal(asUser(admin.id, "select private.is_admin_treasurer();"), "t");
    assert.equal(
      asUser(admin.id, `select private.can_read_unit('${otherHoa}', '${otherUnit}');`),
      "f",
    );
    assert.equal(
      asUser(
        admin.id,
        `select private.can_read_unit('${admin.hoaId}', '22222222-2222-4222-8222-222222222202');`,
      ),
      "t",
    );
    psql(
      database,
      `begin;
set local role anon;
do $$
begin
  update public.waitlist_signups set city = 'Makati';
  if found then
    raise exception 'anon update succeeded';
  end if;
exception
  when insufficient_privilege then null;
  when others then
    if sqlerrm = 'anon update succeeded' then raise; end if;
    if sqlstate <> '42501' then raise; end if;
end $$;
do $$
begin
  delete from public.waitlist_signups;
  if found then
    raise exception 'anon delete succeeded';
  end if;
exception
  when insufficient_privilege then null;
  when others then
    if sqlerrm = 'anon delete succeeded' then raise; end if;
    if sqlstate <> '42501' then raise; end if;
end $$;
rollback;`,
    );
  });
});
