-- Actualiza el campo categoria en la tabla inventario para productos terminados existentes.
-- Ajusta los patrones de nombre según tu catálogo real.

begin;

update inventario
set categoria = 'PRODUCTO_TERMINADO'
where categoria is distinct from 'PRODUCTO_TERMINADO'
  and (
      nombre ilike '%bidón%'
      or nombre ilike '%bidon%'
      or nombre ilike '%20l%'
      or nombre ilike '%garrafa%'
      or nombre ilike '%botella%'
      or nombre ilike '%jerrycan%'
      or nombre ilike '%tanque%'
  );

commit;
