const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const VALID_PLANS = {
  light: { name: 'ワンカードリーディング', amount: 1500 },
  full: { name: 'フルリーディング', amount: 5000 },
  premium: { name: 'プレミアム鑑定', amount: 15000 },
};

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { plan, name, email, topic } = req.body;

    if (!plan || !VALID_PLANS[plan]) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const planInfo = VALID_PLANS[plan];

    const paymentIntent = await stripe.paymentIntents.create({
      amount: planInfo.amount,
      currency: 'jpy',
      metadata: {
        plan,
        plan_name: planInfo.name,
        customer_name: name,
        customer_email: email,
        consultation_topic: topic || 'general',
      },
      receipt_email: email,
      description: `月詠みこ鑑定 - ${planInfo.name}`,
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
};
