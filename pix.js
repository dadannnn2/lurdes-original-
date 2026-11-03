export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const response = await fetch('https://api.omegapayments.com.br/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': 'danilolintz1_h433cjjzcd0l6swe',
        'x-client-secret': 'fne4xv7eqge2wdsatljmrtpe1hq86xoxg4hnffnwser1c3y1lbfrv2ilr85025jn'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao conectar à gateway: ' + error.message });
  }
}