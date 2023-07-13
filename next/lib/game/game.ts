class Game {
  public constructor(timed = false, timeW = 300, timeB = 300) {
    this.timed = timed;
    this.timew = timeW;
    this.timeb = timeB;
  }

  private timed = false;

  public move(color, from, to) {
    if (this[`action${color}`] != Action.MOVE) return false;
    let mills;
    switch (this[`phase${color}`]) {
      case 0:
        // field empty check
        if (this.board[to] != 'x') return false;
        // side not empty check
        if (this.board[`${color}side`].filter((c) => c === color).length == 0) return false;
        //set field
        this.board[to] = color;
        //remove from side
        this.board[`${color}side`].shift();
        //add to history
        this[`history${color}`].unshift({ action: 'move', from: 'x', to });
        //check if side empty
        if (this.board[`${color}side`].filter((c) => c === color).length == 0) this[`phase${color}`]++;
        //mills check
        mills = this.isMill(to);
        //set action
        if (mills == 1) this[`action${color}`] = Action.TAKE;
        else if (mills == 2) this[`action${color}`] = Action.TAKE2;
        else {
          this[`action${color}`] = Action.WAIT;
          this[`action${color === 'w' ? 'b' : 'w'}`] = Action.MOVE;
          if (this[`phase${color === 'w' ? 'b' : 'w'}`] == 1 && !this.canMove(color === 'w' ? 'b' : 'w')) {
            this.winner = color;
            return true;
          }
        }
        break;
      case 1:
        // from color check
        if (this.board[from] != color) return false;
        // field empty check
        if (this.board[to] != 'x') return false;
        //check neighbors
        if (!this.isNeighbor(from, to)) return false;
        //set field
        this.board[to] = color;
        //remove from field
        this.board[from] = 'x';
        //add to history
        this[`history${color}`].unshift({ action: 'move', from, to });
        //check if repetition
        if (this.repetition(color)) {
          this.winner = 'x';
          return true;
        }
        //check if 30 moves
        if (this.thirty(color)) {
          this.winner = 'x';
          return true;
        }
        //mills check
        mills = this.isMill(to);
        //set action
        if (mills == 1) this[`action${color}`] = Action.TAKE;
        else if (mills == 2) this[`action${color}`] = Action.TAKE2;
        else {
          this[`action${color}`] = Action.WAIT;
          this[`action${color === 'w' ? 'b' : 'w'}`] = Action.MOVE;
          if (this[`phase${color === 'w' ? 'b' : 'w'}`] == 1 && !this.canMove(color === 'w' ? 'b' : 'w')) {
            this.winner = color;
            return true;
          }
        }
        break;
      case 2:
        // from color check
        if (this.board[from] != color) return false;
        // field empty check
        if (this.board[to] != 'x') return false;
        //set field
        this.board[to] = color;
        //remove from field
        this.board[from] = 'x';
        //add to history
        this[`history${color}`].unshift({ action: 'move', from, to });
        //check if repetition
        if (this.repetition(color)) {
          this.winner = 'x';
          return true;
        }
        //check if 30 moves
        if (this.thirty(color)) {
          this.winner = 'x';
          return true;
        }
        //mills check
        mills = this.isMill(to);
        //set action
        if (mills == 1) this[`action${color}`] = Action.TAKE;
        else if (mills == 2) this[`action${color}`] = Action.TAKE2;
        else {
          this[`action${color}`] = Action.WAIT;
          this[`action${color === 'w' ? 'b' : 'w'}`] = Action.MOVE;
          if (this[`phase${color === 'w' ? 'b' : 'w'}`] == 1 && !this.canMove(color === 'w' ? 'b' : 'w')) {
            this.winner = color;
            return true;
          }
        }
        break;
    }
    return true;
  }

  public take(color, field) {
    if ([Action.TAKE, Action.TAKE2].filter((a) => a === this[`action${color}`]).length === 0) return false;
    // field color check
    if (this.board[field] != (color === 'w' ? 'b' : 'w')) return false;
    // field not in mill check
    if (this.isMill(field) != 0) {
      //check if all in mill
      const enemyPieces = Object.keys(this.board).filter((k) => this.board[k] == (color === 'w' ? 'b' : 'w'));
      if (enemyPieces.filter((k) => this.isMill(k) == 0).length != 0) return false;
    }
    //remove field
    this.board[field] = 'x';
    //add to side
    this.board[`${color}side`].push(color === 'w' ? 'b' : 'w');
    //add to history
    this[`history${color}`].unshift({ action: 'take', from: field });
    //amount of enemy pieces on board
    const enemyPieces = Object.keys(this.board).filter((k) => this.board[k] == (color === 'w' ? 'b' : 'w'));
    // if not phase 0
    if (this[`phase${color === 'w' ? 'b' : 'w'}`] != 0) {
      //check if phase 2
      if (enemyPieces.length == 3) {
        this[`phase${color === 'w' ? 'b' : 'w'}`] = 2;
      }
      // check if win
      if (enemyPieces.length == 2) {
        this.winner = color;
        return true;
      }
    }
    //set action
    if (this[`phase${color === 'w' ? 'b' : 'w'}`] == 1 && !this.canMove(color === 'w' ? 'b' : 'w')) {
      this.winner = color;
      return true;
    }
    if (this[`action${color}`] == Action.TAKE) {
      this[`action${color}`] = Action.WAIT;
      this[`action${color === 'w' ? 'b' : 'w'}`] = Action.MOVE;
    } else if (this[`action${color}`] == Action.TAKE2) {
      this[`action${color}`] = Action.TAKE;
    }
    return true;
  }

  public winner = null;

  public historyw = [];

  public historyb = [];

  public actionw = Action.MOVE;

  public actionb = Action.WAIT;

  public timew = 300;

  public timeb = 300;

  public LastMovew = Date.now();

  public LastMoveb = Date.now();

  public phasew = 0;

  public phaseb = 0;

  public board = {
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

  public mills = [
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

  public neighbors = {
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

  public isMill(field) {
    const millsOnField = this.mills.filter((mill) => mill.includes(field));
    let millCount = 0;
    const color = this.board[field];
    millsOnField.forEach((mill) => {
      let fields = 0;
      mill.forEach((f) => {
        if (this.board[f] == color) fields++;
      });
      if (fields == 3) millCount++;
    });
    return millCount;
  }

  private isNeighbor(from, to) {
    return this.neighbors[from].includes(to);
  }

  public canMove(color) {
    let canMove = false;
    Object.entries(this.board)
      .filter((a) => a[0] != 'wside' && a[0] != 'bside')
      .filter((a) => a[1] == color)
      .forEach((a) => {
        if (this.fieldCanMove(a[0])) canMove = true;
      });
    return canMove;
  }

  public fieldCanMove(field) {
    let canMove = false;
    this.neighbors[field].forEach((neighbor) => {
      if (this.board[neighbor] == 'x') canMove = true;
    });
    return canMove;
  }

  private repetition(color) {
    const opponent = color == 'w' ? 'b' : 'w';
    const history = this[`history${color}`];
    const enemyhistory = this[`history${opponent}`];
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

  private thirty(color) {
    const opponent = color == 'w' ? 'b' : 'w';
    const history = this[`history${color}`];
    const enemyhistory = this[`history${opponent}`];
    if (history.length <= 30 || enemyhistory.length <= 30) return false;
    for (let i = 0; i <= 30; i++) {
      if (history[i].action != 'move' || enemyhistory[i].action != 'move') return false;
    }
    return true;
  }
}

enum Action {
  MOVE = 'move',
  WAIT = 'wait',
  TAKE = 'take',
  TAKE2 = 'take2',
}

export { Game, Action };
