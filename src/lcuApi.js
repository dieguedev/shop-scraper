import axios from 'axios';
import https from 'node:https';

const agent = new https.Agent({ rejectUnauthorized: false });

const MAX_RETRIES = 20;
const RETRY_INTERVAL_MS = 3000;

export async function getStoreFeatured(port, password) {
  const url = `https://127.0.0.1:${port}/lol-store/v1/featured`;
  const auth = Buffer.from(`riot:${password}`).toString('base64');
  const config = {
    headers: { 'Authorization': `Basic ${auth}` },
    httpsAgent: agent,
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.get(url, config);
      return response.data;
    } catch (err) {
      const isConnError = err.code === 'ECONNREFUSED' || err.response?.status >= 500;
      if (attempt === MAX_RETRIES || !isConnError) throw err;
      console.log(`   LCU API no lista, reintentando... (${attempt}/${MAX_RETRIES})`);
      await new Promise(r => setTimeout(r, RETRY_INTERVAL_MS));
    }
  }
}

export function extractSkinSales(storeData) {
  return storeData.catalog
    .filter(item => item.inventoryType === 'CHAMPION_SKIN' && item.sale)
    .map(skin => ({
      item_id: skin.itemId,
      name: skin.name,
      icon_url: skin.iconUrl,
      champion_id: skin.parentItem?.itemId ?? null,
      original_rp: skin.rp,
      sale_rp: skin.sale.rp,
      percent_off: skin.sale.percentOff,
      sale_end_date: skin.sale.endDate,
      raw_data: skin,
    }));
}
