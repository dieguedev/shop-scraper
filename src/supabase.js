import { createClient } from '@supabase/supabase-js';

let client;

export function getSupabaseClient(url, key) {
  if (!client) {
    client = createClient(url, key);
  }
  return client;
}

export async function upsertSkinSales(supabaseUrl, supabaseKey, skins) {
  const supabase = getSupabaseClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('skin_sales')
    .upsert(skins, { onConflict: 'item_id' })
    .select();

  if (error) {
    throw new Error(`Error al subir datos a Supabase: ${error.message}`);
  }

  console.log(`${data.length} skins actualizadas en Supabase.`);
  return data;
}
