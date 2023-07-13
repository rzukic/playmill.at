const mill = require('./mill');

class moves {
  static repetition(history, enemyhistory) {
    if (history.length < 8 || enemyhistory.length < 8) return false;
    const myhistarr1 = [history[0], history[2], history[4]];
    const myhistarr2 = [history[1], history[3]];
    const ophistarr1 = [enemyhistory[0], enemyhistory[2], enemyhistory[4]];
    const ophistarr2 = [enemyhistory[1], enemyhistory[3]];
    if (
      [myhistarr1, myhistarr2, ophistarr1, ophistarr2].every((arr) => {
        return arr.every((move) => {
          return move.to == arr[0].to && move.from == arr[0].from;
        });
      })
    )
      return true;
    return false;
  }

  static thirty(history, enemyhistory) {
    let count = 0;
    if (history.length <= 30 || enemyhistory.length <= 30) return false;
    for (let i = 0; i <= 30; i++) {
      if (history[i].action != 'move' || enemyhistory[i].action != 'move') return false;
    }
    return true;
  }
}

class phase {
  static notZero(ret) {
    return ret.phasew != 0 && ret.phaseb != 0;
  }
}

class draw {
  static autodraw(board, color, opponentcolor) {
    return (
      ((Object.values(board).filter((a) => a == color).length == 4 || Object.values(board).filter((a) => a == color).length == 5) &&
        (Object.values(board).filter((a) => a == opponentcolor).length == 4 || Object.values(board).filter((a) => a == opponentcolor).length == 5)) ||
      (Object.values(board).filter((a) => a == color).length == 6 &&
        (Object.values(board).filter((a) => a == opponentcolor).length == 4 || Object.values(board).filter((a) => a == opponentcolor).length == 5)) ||
      (Object.values(board).filter((a) => a == color).length == 3 &&
        (Object.values(board).filter((a) => a == opponentcolor).length == 4 || Object.values(board).filter((a) => a == opponentcolor).length == 5))
    );
  }
}

class fields {
  static isOccupied(board, field) {
    return board[field] != 'x';
  }
}

module.exports = { moves, phase, draw, fields };
