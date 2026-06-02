-- Agrega la columna `categoria` a la tabla `inventario`.
-- Valores posibles: 'INSUMO' o 'PRODUCTO_TERMINADO'
-- Asegura que filas existentes tengan una categoría por defecto 'INSUMO'.

begin;

alter table if exists inventario
    add column if not exists categoria text not null default 'INSUMO';

-- Opcional: actualizar productos terminados existentes por nombre (ajusta los nombres según tu catálogo)
-- update inventario set categoria = 'PRODUCTO_TERMINADO' where nombre ilike '%bidón%' or nombre ilike '%bidon%';

commit;
