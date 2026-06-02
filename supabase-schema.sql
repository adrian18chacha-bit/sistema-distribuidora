-- Supabase / PostgreSQL schema for Distribuidora Chávez
-- Crea las tablas que utiliza la aplicación: pedidos, gastos, inventario, proveedores y plan_produccion.

create table if not exists pedidos (
    id uuid primary key default gen_random_uuid(),
    cliente text not null,
    producto text not null,
    precio_total numeric(12,2) not null default 0,
    entregado boolean not null default false,
    creado_en timestamptz not null default now()
);

create table if not exists gastos (
    id uuid primary key default gen_random_uuid(),
    descripcion text not null,
    monto numeric(12,2) not null default 0,
    creado_en timestamptz not null default now()
);

create table if not exists inventario (
    id uuid primary key default gen_random_uuid(),
    nombre text not null,
    stock int not null default 0,
    creado_en timestamptz not null default now()
);

create table if not exists proveedores (
    id uuid primary key default gen_random_uuid(),
    nombre text not null,
    creado_en timestamptz not null default now()
);

create table if not exists plan_produccion (
    id uuid primary key default gen_random_uuid(),
    producto text not null,
    cantidad int not null default 0,
    fecha_entrega date not null,
    estado text not null default 'PROGRAMADO',
    creado_en timestamptz not null default now()
);

create index if not exists idx_pedidos_creado_en on pedidos (creado_en desc);
create index if not exists idx_gastos_creado_en on gastos (creado_en desc);
create index if not exists idx_inventario_creado_en on inventario (creado_en desc);
create index if not exists idx_proveedores_creado_en on proveedores (creado_en desc);
create index if not exists idx_plan_produccion_creado_en on plan_produccion (creado_en desc);
