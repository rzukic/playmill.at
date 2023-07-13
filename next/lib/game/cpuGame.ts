import apiBaseUrl from '../apiBaseURL';
import { Game } from './game';

class CpuGame extends Game {
  constructor() {
    super();
  }

  async makeMove(color, from, to) {
    if (this[`action${color}`] === 'move') {
      if (!this.move(color, from, to)) return false;
    } else if (['take', 'take2'].includes(this[`action${color}`])) {
      if (!this.take(color, from)) return false;
    }
    if (this[`action${color}`] !== 'wait') return true;
    let enemy = color === 'w' ? 'b' : 'w';
    let enemyAction = this[`action${enemy}`];
    let enemyPhase = this[`phase${enemy}`];
    if (enemyAction === 'move' && enemyPhase == 0) enemyAction = 'place';
    let prediction = await this.getPrediction(enemy, enemyAction);
    if (['take', 'take2'].includes(enemyAction) && !this.take(enemy, prediction)) return false;
    else if (enemyAction === 'place' && !this.move(enemy, 'x', prediction)) return false;
    else if (enemyAction === 'move' && !this.move(enemy, prediction[0], prediction[1])) return false;
    if (prediction === undefined) return false;
    enemyAction = this[`action${enemy}`];
    enemyPhase = this[`phase${enemy}`];
    while (enemyAction !== 'wait') {
      if (enemyAction === 'take2') enemyAction = 'take';
      prediction = await this.getPrediction(enemy, enemyAction);
      if (typeof prediction === 'string' && !this.take(enemy, prediction)) return false;
      else if (typeof prediction === 'object' && !this.move(enemy, prediction[0], prediction[1])) return false;
      if (prediction === undefined) return false;
      enemyAction = this[`action${enemy}`];
      enemyPhase = this[`phase${enemy}`];
    }
    return true;
  }

  convertBoard(color) {
    let board = { ...this.board };
    let output = [];
    let arr = Object.values(board);
    const opponentcolor = color == 'w' ? 'b' : 'w';
    for (let i = 0; i < 24; i++) {
      if (arr[i] == color) output.push(1);
      else if (arr[i] == opponentcolor) output.push(-1);
      else output.push(0);
    }
    output[24] = output.filter((a) => a == 1).length;
    output[25] = output.filter((a) => a == -1).length;
    output[26] = board[`${color}side`].filter((c) => c == color).length;
    output[27] = board[`${opponentcolor}side`].filter((c) => c == opponentcolor).length;
    return output;
  }

  async getPrediction(color, moveType) {
    let enemy = color == 'w' ? 'b' : 'w';
    let prediction;
    switch (moveType) {
      case 'place':
        let freeSpace;
        let millWithMoreThanTwo = this.mills.filter(
          (a) => a.filter((b) => this.board[b] == enemy).length == 2 && a.filter((b) => this.board[b] == 'x').length > 0
        );
        let millWithMoreThanTwoOfMine = this.mills.filter(
          (a) => a.filter((b) => this.board[b] == color).length != 0 && a.filter((b) => this.board[b] == 'x').length > 0
        );
        if (millWithMoreThanTwo.length > 0) {
          freeSpace = millWithMoreThanTwo[0].filter((a) => this.board[a] == 'x')[0];
        } else if (millWithMoreThanTwoOfMine.length > 0) {
          let sortedbyAmount = millWithMoreThanTwoOfMine.sort(
            (b, a) => a.filter((c) => this.board[c] == color).length - b.filter((c) => this.board[c] == color).length
          );
          freeSpace = sortedbyAmount[0].filter((a) => this.board[a] == 'x')[0];
        } else {
          let spaces = Object.entries(this.board).filter((a) => a[1] == enemy && a[0] != `${enemy}side`);
          for (let space of spaces) {
            for (let neighbor of this.neighbors[space[0]]) {
              if (this.board[neighbor] == 'x') {
                freeSpace = neighbor;
                break;
              }
            }
          }
        }
        prediction = freeSpace;
        await new Promise((resolve) => setTimeout(resolve, 300));
        break;
      case 'move':
        let input = this.convertBoard(color);
        let response = await fetch(`${apiBaseUrl}/predict/${moveType}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ input }),
        });
        response = (await response.json()).prediction;
        let possibleNums = [];
        let rows;
        let cols;
        let needle;
        prediction = [];
        possibleNums = this.findPossibleMovesFrom(color);
        possibleNums = possibleNums.map((a) => this.fieldHash[a]);
        needle = response[0];
        possibleNums.sort((a, b) => Math.abs(a - needle) - Math.abs(b - needle));
        prediction.push(Object.keys(this.fieldHash)[possibleNums[0]]);
        if (prediction[0] == undefined) return undefined;
        possibleNums = this.findPossibleMovesTo(prediction[0]);
        possibleNums = possibleNums.map((a) => this.fieldHash[a]);
        needle = response[1];
        possibleNums.sort((a, b) => Math.abs(a - needle) - Math.abs(b - needle));
        prediction.push(Object.keys(this.fieldHash)[possibleNums[0]]);
        const currentclosedMills = this.mills.filter((a) => a.filter((b) => this.board[b] == color).length == 3);
        for (let mill of currentclosedMills) {
          for (let field of mill) {
            for (let neighbor of this.neighbors[field]) {
              if (this.board[neighbor] == 'x') {
                if (this.neighbors[field].filter((a) => this.board[a] == enemy).length != 0) continue;
                prediction = [field, neighbor];
                break;
              }
            }
          }
        }
        const closeableMills = this.mills.filter((a) => a.filter((b) => this.board[b] == color).length == 2);
        for (let mill of closeableMills) {
          for (let field of mill) {
            for (let neighbor of this.neighbors[field]) {
              if (this.board[neighbor] == color && this.board[field] == 'x' && !mill.includes(neighbor)) {
                prediction = [neighbor, field];
                break;
              }
            }
          }
        }
        break;
      case 'take':
        let possibleTakes = this.findPossibleTakes(color);
        let chosen = Math.floor(Math.random() * possibleTakes.length);
        prediction = possibleTakes[chosen];
        await new Promise((resolve) => setTimeout(resolve, 300));
        break;
    }
    return prediction;
  }

  convertResponse(response) {
    for (let i = 0; i < response.length; i++) {
      response[i] = Object.keys(this.fieldHash)[response[i]];
    }
    return response;
  }

  convertSingleResponse(response) {
    return [`${String.fromCharCode(response[0])}${response[1]}`];
  }

  findPossiblePlaces(color) {
    let output = [];
    let arr = Object.entries(this.board);
    for (let i = 0; i < arr.length; i++) {
      if (arr[i][1] == 'x') output.push(arr[i][0]);
    }
    return output;
  }

  findPossibleMovesFrom(color) {
    let mine = [];
    let arr = Object.entries(this.board);
    for (let i = 0; i < arr.length; i++) {
      if (arr[i][1] == color && arr[i][0] != 'wside' && arr[i][0] != 'bside') mine.push(arr[i][0]);
    }
    let output = mine.filter((a) => this.fieldCanMove(a));
    return output;
  }

  findPossibleMovesTo(from) {
    let output = [];
    this.neighbors[from].forEach((neighbor) => {
      if (this.board[neighbor] == 'x') output.push(neighbor);
    });
    return output;
  }

  findPossibleTakes(color) {
    let output = [];
    let opponent = color == 'w' ? 'b' : 'w';
    let arr = Object.entries(this.board).filter((a) => a[1] === opponent);
    for (let i = 0; i < arr.length; i++) {
      if (this.isMill(arr[i][0]) === 0) output.push(arr[i][0]);
    }
    return output;
  }

  public fieldHash = {
    a1: 0,
    a4: 1,
    a7: 2,
    d7: 3,
    g7: 4,
    g4: 5,
    g1: 6,
    d1: 7,
    d2: 8,
    b2: 9,
    b4: 10,
    b6: 11,
    d6: 12,
    f6: 13,
    f4: 14,
    f2: 15,
    d3: 16,
    c3: 17,
    c4: 18,
    c5: 19,
    d5: 20,
    e5: 21,
    e4: 22,
    e3: 23,
  };

  private sortCharsByProximityToNeedle(chars, needle) {
    // Create a dictionary to assign a numerical value to each character
    const charValues = {
      a: 1,
      b: 2,
      c: 3,
      d: 4,
      e: 5,
      f: 6,
      g: 7,
    };

    // Custom comparator function
    function compareChars(a, b) {
      const proximityA = Math.abs(charValues[a] - charValues[needle]);
      const proximityB = Math.abs(charValues[b] - charValues[needle]);

      if (proximityA === proximityB) {
        // If two characters have the same proximity, sort them lexicographically
        return a.localeCompare(b);
      }

      return proximityA - proximityB;
    }

    // Sort the array using the custom comparator function
    return chars.sort(compareChars);
  }
}

export { CpuGame };
