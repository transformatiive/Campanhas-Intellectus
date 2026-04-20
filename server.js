const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const N8N_BASE = 'https://trnsf.up.railway.app';
const DATA_WEBHOOK  = `${N8N_BASE}/webhook/intellectus-campaigns-data`;
const SEND_WEBHOOK  = `${N8N_BASE}/webhook/intellectus-campaigns-send`;

// GET /api/data — busca campanhas, listas e áreas via n8n
app.get('/api/data', async (req, res) => {
  try {
    const r = await fetch(DATA_WEBHOOK, { timeout: 15000 });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error('Erro ao buscar dados:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/send — dispara o envio via n8n
app.post('/api/send', async (req, res) => {
  const { campaign_id, list_key, mode, area, hours_between } = req.body;

  if (!campaign_id || !list_key) {
    return res.status(400).json({ ok: false, error: 'campaign_id e list_key são obrigatórios' });
  }

  try {
    const payload = { campaign_id, list_key, mode: mode || 'broadcast', area: area || '', hours_between: hours_between || 3 };
    const r = await fetch(SEND_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      timeout: 10000
    });

    // n8n responde imediatamente com onReceived
    res.json({ ok: true, message: 'Campanha iniciada com sucesso. O envio está a processar em segundo plano.' });
  } catch (err) {
    console.error('Erro ao iniciar envio:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Intellectus Campanhas a correr na porta ${PORT}`));
