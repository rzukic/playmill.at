function Elo(w, b, won = 'x', kFactor = 20) {
  const expectedScore = (self, opponent) =>
    1 / (1 + 10 ** ((opponent - self) / 400));
  const newRating = (rating, i) =>
    rating + kFactor * (i - expectedScore(i ? w : b, i ? b : w));
  if (won === 'w') return { w: newRating(w, 1), b: newRating(b, 0) };
  if (won === 'b') return { w: newRating(w, 0), b: newRating(b, 1) };
  return { w: newRating(w, 0.5), b: newRating(b, 0.5) };
}

module.exports = { Elo };
