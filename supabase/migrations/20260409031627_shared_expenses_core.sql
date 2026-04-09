create extension if not exists pgcrypto;

create table if not exists public.transacciones_compartidas_detalle (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  gasto_transaccion_id uuid not null references public.transacciones(id) on delete cascade,
  deudor_user_id uuid null references auth.users(id) on delete set null,
  deudor_nombre text null,
  monto_asignado numeric(12,2) not null check (monto_asignado > 0),
  monto_pagado numeric(12,2) not null default 0 check (monto_pagado >= 0),
  saldo_pendiente numeric(12,2) generated always as (greatest(monto_asignado - monto_pagado, 0)) stored,
  estado text not null default 'pending' check (estado in ('pending', 'partial', 'paid')),
  ultima_transaccion_pago_id uuid null references public.transacciones(id) on delete set null,
  nota text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tcd_deudor_required check (deudor_user_id is not null or nullif(trim(deudor_nombre), '') is not null),
  constraint tcd_pago_not_over check (monto_pagado <= monto_asignado)
);

create unique index if not exists tcd_unique_user_per_gasto
  on public.transacciones_compartidas_detalle (gasto_transaccion_id, deudor_user_id)
  where deudor_user_id is not null;

create unique index if not exists tcd_unique_name_per_gasto
  on public.transacciones_compartidas_detalle (gasto_transaccion_id, lower(deudor_nombre))
  where deudor_user_id is null and deudor_nombre is not null;

create index if not exists tcd_project_idx
  on public.transacciones_compartidas_detalle (proyecto_id, estado, created_at desc);

create index if not exists tcd_deudor_user_idx
  on public.transacciones_compartidas_detalle (deudor_user_id, estado);

create or replace function public.fn_transacciones_compartidas_sync_estado()
returns trigger
language plpgsql
as $$
begin
  new.monto_pagado := least(greatest(new.monto_pagado, 0), new.monto_asignado);

  if new.monto_pagado = 0 then
    new.estado := 'pending';
  elsif new.monto_pagado < new.monto_asignado then
    new.estado := 'partial';
  else
    new.estado := 'paid';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_tcd_sync_estado on public.transacciones_compartidas_detalle;
create trigger trg_tcd_sync_estado
before insert or update of monto_asignado, monto_pagado
on public.transacciones_compartidas_detalle
for each row
execute function public.fn_transacciones_compartidas_sync_estado();

create or replace view public.v_pendientes_cobro_proyecto as
select
  proyecto_id,
  coalesce(deudor_user_id::text, lower(deudor_nombre)) as deudor_key,
  max(deudor_user_id) as deudor_user_id,
  max(deudor_nombre) as deudor_nombre,
  sum(monto_asignado) as total_asignado,
  sum(monto_pagado) as total_pagado,
  sum(saldo_pendiente) as total_pendiente,
  count(*) filter (where estado <> 'paid') as pendientes_count,
  min(created_at) as deuda_mas_antigua
from public.transacciones_compartidas_detalle
group by proyecto_id, coalesce(deudor_user_id::text, lower(deudor_nombre))
having sum(saldo_pendiente) > 0;

create or replace view public.v_mis_deudas_compartidas as
select
  tcd.id,
  tcd.proyecto_id,
  p.nombre as proyecto_nombre,
  tcd.gasto_transaccion_id,
  tcd.deudor_user_id,
  tcd.deudor_nombre,
  tcd.monto_asignado,
  tcd.monto_pagado,
  tcd.saldo_pendiente,
  tcd.estado,
  tcd.created_at
from public.transacciones_compartidas_detalle tcd
join public.proyectos p on p.id = tcd.proyecto_id
where tcd.deudor_user_id is not null
  and tcd.saldo_pendiente > 0;

alter table public.transacciones_compartidas_detalle enable row level security;

drop policy if exists tcd_select on public.transacciones_compartidas_detalle;
create policy tcd_select
on public.transacciones_compartidas_detalle
for select
using (
  exists (
    select 1
    from public.proyectos p
    where p.id = proyecto_id
      and p.user_id = auth.uid()
  )
  or deudor_user_id = auth.uid()
);

drop policy if exists tcd_insert on public.transacciones_compartidas_detalle;
create policy tcd_insert
on public.transacciones_compartidas_detalle
for insert
with check (
  exists (
    select 1
    from public.proyectos p
    where p.id = proyecto_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists tcd_update on public.transacciones_compartidas_detalle;
create policy tcd_update
on public.transacciones_compartidas_detalle
for update
using (
  exists (
    select 1
    from public.proyectos p
    where p.id = proyecto_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.proyectos p
    where p.id = proyecto_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists tcd_delete on public.transacciones_compartidas_detalle;
create policy tcd_delete
on public.transacciones_compartidas_detalle
for delete
using (
  exists (
    select 1
    from public.proyectos p
    where p.id = proyecto_id
      and p.user_id = auth.uid()
  )
);
