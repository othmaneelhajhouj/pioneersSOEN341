// simulates a payment processor for local testing
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const CARDS = {
  '4242424242424242': {outcome: 'succeeded', message: 'Approved'},
  '4000000000009995': {outcome:'failed', message: 'Insufficient funds'},
  '4000000000009987': {outcome: 'failed', message: 'Card declined'},
}

async function processMockPayment({cardNumber, amount, name}) {
  await delay(1200);
  const card = CARDS[cardNumber.replace(/\s+/g, '')] ?? {outcome: 'succeeded', message: 'Approved'};
  if (card.outcome === 'succeeded') {
    return {id: `mock_${Date.now()}`, status: 'succeeded', message: card.message};
  }
  const err = new Error(card.message);
  err.status = 'failed';
  throw err;
}
module.exports = {processMockPayment};
