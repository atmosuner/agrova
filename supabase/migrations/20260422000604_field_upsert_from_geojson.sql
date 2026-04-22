-- M1-06/07: store polygon as geography; area + center computed server-side
create or replace function public.field_upsert_from_geojson(
  p_id uuid,
  p_name text,
  p_crop text,
  p_variety text,
  p_plant_count int,
  p_planted_year int,
  p_notes text,
  p_address text,
  p_polygon jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  g geometry;
  b geography;
  c geography;
  a numeric;
  new_id uuid;
begin
  if not public.is_owner() then
    raise exception 'forbidden';
  end if;
  g := st_setsrid(
    st_geomfromgeojson(
      case
        when p_polygon->>'type' = 'Feature' then (p_polygon->'geometry')::text
        else p_polygon::text
      end
    ),
    4326
  );
  if st_geometrytype(g) not in ('ST_Polygon', 'ST_MultiPolygon') then
    raise exception 'invalid_geometry';
  end if;
  b := g::geography;
  c := st_centroid(g)::geography;
  a := st_area(b) / 10000.0;

  if p_id is null then
    insert into public.fields (
      name, crop, variety, plant_count, planted_year, notes, address,
      gps_center, boundary, area_hectares
    )
    values (
      p_name, coalesce(nullif(trim(p_crop), ''), '—'),
      nullif(trim(coalesce(p_variety, '')), ''),
      p_plant_count, p_planted_year,
      nullif(trim(coalesce(p_notes, '')), ''),
      nullif(trim(coalesce(p_address, '')), ''),
      c, b, a
    )
    returning id into new_id;
  else
    update public.fields
    set
      name = p_name,
      crop = coalesce(nullif(trim(p_crop), ''), '—'),
      variety = nullif(trim(coalesce(p_variety, '')), ''),
      plant_count = p_plant_count,
      planted_year = p_planted_year,
      notes = nullif(trim(coalesce(p_notes, '')), ''),
      address = nullif(trim(coalesce(p_address, '')), ''),
      gps_center = c,
      boundary = b,
      area_hectares = a
    where id = p_id;
    if not found then
      raise exception 'not_found';
    end if;
    new_id := p_id;
  end if;
  return new_id;
end;
$$;

revoke all on function public.field_upsert_from_geojson(uuid, text, text, text, int, int, text, text, jsonb) from public;
grant execute on function public.field_upsert_from_geojson(uuid, text, text, text, int, int, text, text, jsonb) to authenticated;

comment on function public.field_upsert_from_geojson is 'M1-06/07: insert/update field polygon from GeoJSON geometry or Feature; owner only';
