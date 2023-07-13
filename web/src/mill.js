function isMill(board, field) {
  const mills = [
    ['a1', 'a4', 'a7'],
    ['a7', 'd7', 'g7'],
    ['g7', 'g4', 'g1'],
    ['a1', 'd1', 'g1'],
    ['b2', 'b4', 'b6'],
    ['b6', 'd6', 'f6'],
    ['f6', 'f4', 'f2'],
    ['b2', 'd2', 'f2'],
    ['c3', 'c4', 'c5'],
    ['c5', 'd5', 'e5'],
    ['e5', 'e4', 'e3'],
    ['e3', 'd3', 'c3'],
    ['a4', 'b4', 'c4'],
    ['d1', 'd2', 'd3'],
    ['d5', 'd6', 'd7'],
    ['e4', 'f4', 'g4'],
  ];

  const millsOnField = mills.filter((mill) => mill.includes(field));
  let millCount = 0;
  const color = board[field];
  millsOnField.forEach((mill) => {
    let fields = 0;
    mill.forEach((f) => {
      if (board[f] == color) fields++;
    });
    if (fields == 3) millCount++;
  });
  return millCount;
}

function isNeighbor(from, to) {
  return neighbors[from].includes(to);
}

function canMove(board, color) {
  let canMove = false;
  Object.entries(board)
    .filter((a) => a[0] != 'wside' && a[0] != 'bside')
    .filter((a) => a[1] == color)
    .forEach((a) => {
      neighbors[a[0]].forEach((neighbor) => {
        if (board[neighbor] == 'x') canMove = true;
      });
    });
  return canMove;
}

const neighbors = {
  a1: ['a4', 'd1'],
  a4: ['a1', 'a7', 'b4'],
  a7: ['a4', 'd7'],
  d7: ['a7', 'g7', 'd6'],
  g7: ['d7', 'g4'],
  g4: ['g7', 'f4', 'g1'],
  g1: ['g4', 'd1'],
  d1: ['g1', 'a1', 'd2'],
  d2: ['d1', 'b2', 'd3', 'f2'],
  b2: ['d2', 'b4'],
  b4: ['b2', 'a4', 'c4', 'b6'],
  b6: ['b4', 'd6'],
  d6: ['b6', 'd7', 'f6', 'd5'],
  f6: ['d6', 'f4'],
  f4: ['f6', 'g4', 'e4', 'f2'],
  f2: ['f4', 'd2'],
  d3: ['d2', 'e3', 'c3'],
  c3: ['d3', 'c4'],
  c4: ['c3', 'b4', 'c5'],
  c5: ['c4', 'd5'],
  d5: ['c5', 'd6', 'e5'],
  e5: ['d5', 'e4'],
  e4: ['e5', 'f4', 'e3'],
  e3: ['d3', 'e4'],
};

const board = {
  a1: 'x',
  a4: 'x',
  a7: 'x',
  d7: 'x',
  g7: 'x',
  g4: 'x',
  g1: 'x',
  d1: 'x',
  d2: 'x',
  b2: 'x',
  b4: 'x',
  b6: 'x',
  d6: 'x',
  f6: 'x',
  f4: 'x',
  f2: 'x',
  d3: 'x',
  c3: 'x',
  c4: 'x',
  c5: 'x',
  d5: 'x',
  e5: 'x',
  e4: 'x',
  e3: 'x',
  wside: ['w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w'],
  bside: ['b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b'],
};

module.exports = { isMill, isNeighbor, canMove, board };
