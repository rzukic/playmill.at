const app = require('express')();
const server = require('http').createServer(app);
const { Pool } = require('pg');
const mill = require('./mill');
const socketActions = require('./socketActions');
const checks = require('./checks');
const io = require('socket.io')(server, { cors: { origin: '*' } });
const cors = require('cors');
let timeouts = {};

app.use(
  cors({
    origin: '*',
  })
);

const pool = new Pool({
  host: 'db',
  user: 'milldaemon',
  database: 'mill',
  password: 'Qjkt9MgZzo4wuCoCevv3iaAhbZawkK4jHrkuoNp3fNZ24UEiWe',
});

app.get('/connect', (req, res) => {
  const statement = 'INSERT INTO games(id, board) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id';
  pool.query(statement, [req.query.game_id, mill.board], (err, ret) => {
    if (err) res.json(err);
    else res.json('success');
  });
});

io.of(/^\/game-\d+$/).on('connection', (socket) => {
  const game_id = parseInt(socket.nsp.name.split('-')[1]);
  let color = socket.handshake.auth.color;
  let opponentcolor = socket.handshake.auth.color === 'w' ? 'b' : 'w';
  let board = mill.board;
  let user_id;
  socket.nsp.allSockets().then((sockets) => {
    if (sockets.size > 2) {
      return socketActions.other.error(socket, 'game is full') && socket.disconnect(true);
    }
    pool.query('SELECT id, board FROM games WHERE id = $1', [game_id], (err, ret) => {
      if (ret.rows.length == 0) {
        return socketActions.other.error(socket, 'game does not exist') && socket.disconnect(true);
      }
      board = JSON.parse(ret.rows[0].board);
      if (color == 'w') {
        socketActions.moves.move(socket, board);
        pool.query(
          'UPDATE games SET player1 = $1, player2 = $2, lastmovew = NOW() WHERE id = $3 RETURNING timew',
          [color, opponentcolor, game_id],
          (err, ret2) => {
            clearTimeout(timeouts[game_id]);
            timeouts[game_id] = setTimeout(() => {
              delete timeouts[game_id];
              return socketActions.results.lose(socket, io, pool, game_id, board, 'outoftime', { w: [], b: [] });
            }, ret2.rows[0][`timew`] * 1000);
          }
        );
      } else if (color == 'b') {
        pool.query('SELECT board, actionb, movehistoryb, movehistoryw FROM games WHERE id = $1', [game_id], (err, ret) => {
          if (ret.rows[0].actionb === 'move') {
            socketActions.moves.move(socket, ret.rows[0].board);
            socketActions.moves.history(socket, JSON.parse(ret.rows[0].movehistoryw), JSON.parse(ret.rows[0].movehistoryb));
          } else if (ret.rows[0].actionb === 'wait') {
            socketActions.moves.wait(socket, board);
          }
        });
      }
    });
  });

  socket.on('move', (data) => {
    let move;
    try {
      move = JSON.parse(data);
    } catch (err) {
      return socketActions.other.error(socket, 'invalid move');
    }
    const statement = `SELECT board, phase${color}, moves${color}, action${color}, movehistory${color}, movehistory${opponentcolor}, timew, timeb FROM games WHERE id = $1`;
    pool.query(statement, [game_id], (err, ret) => {
      if (err) socketActions.other.error(socket, err);
      else if (ret.rows[0][`action${color}`] != 'move')
        return socketActions.other.error(socket, `invalid action. should be ${ret.rows[0][`action${color}`]}`);

      board = JSON.parse(ret.rows[0].board);
      let moveshistory = JSON.parse(ret.rows[0][`movehistory${color}`]);
      let moveshistoryopponent = JSON.parse(ret.rows[0][`movehistory${opponentcolor}`]);
      let phase = ret.rows[0][`phase${color}`];

      if (checks.fields.isOccupied(board, move.to)) return socketActions.other.error(socket, 'invalid move');
      // Actual Move Logic

      let historyStatement;
      let mills;
      switch (phase) {
        case 0:
          board[move.to] = color;
          let side = board[`${color}side`];
          side.shift();
          board[`${color}side`] = side;
          moveshistory.unshift({ action: 'move', from: 'x', to: move.to });
          historyStatement = `, movehistory${color} = '${JSON.stringify(moveshistory)}'`;
          mills = mill.isMill(board, move.to);
          if (mills > 0 && mills <= 2) {
            socketActions.moves.take(
              socket,
              board,
              color == 'w' ? moveshistory : moveshistoryopponent,
              color == 'w' ? moveshistoryopponent : moveshistory
            );
            const phaseStatement = ret.rows[0][`moves${color}`] + 1 == 9 ? `, phase${color} = 1` : '';
            const statement2 =
              mills == 1
                ? `UPDATE games SET board = $1${phaseStatement}, moves${color} = $2, action${color} = 'take'${historyStatement} WHERE id = $3`
                : `UPDATE games SET board = $1${phaseStatement}, moves${color} = $2, action${color} = 'take2'${historyStatement} WHERE id = $3`;
            return pool.query(statement2, [board, ret.rows[0][`moves${color}`] + 1, game_id], (err, ret) => {});
          } else {
            if (ret.rows[0][`moves${color}`] + 1 == 9) {
              if (color == 'b') {
                if (!mill.canMove(board, 'w')) {
                  clearTimeout(timeouts[game_id]);
                  delete timeouts[game_id];
                  return socketActions.results.win(socket, io, pool, game_id, board, 'lockedin', {
                    w: moveshistoryopponent,
                    b: moveshistory,
                  });
                }
                if (!mill.canMove(board, 'b')) {
                  clearTimeout(timeouts[game_id]);
                  delete timeouts[game_id];
                  return socketActions.results.lose(socket, io, pool, game_id, board, 'lockedin', { w: moveshistoryopponent, b: moveshistory });
                }
              }
              socketActions.moves.switch(
                socket,
                board,
                color == 'w' ? moveshistory : moveshistoryopponent,
                color == 'w' ? moveshistoryopponent : moveshistory
              );
              const statement2 = `UPDATE games SET board = $1, phase${color} = 1, action${color} = 'wait', action${opponentcolor} = 'move', time${color} = time${color} - EXTRACT(EPOCH from (now() - lastmove${color})), lastmove${opponentcolor} = now()${historyStatement} WHERE id = $2 RETURNING timew, timeb`;
              return pool.query(statement2, [board, game_id], (err, ret2) => {
                socketActions.other.time(socket, ret2.rows[0].timew, ret2.rows[0].timeb);
                clearTimeout(timeouts[game_id]);
                timeouts[game_id] = setTimeout(() => {
                  delete timeouts[game_id];
                  return socketActions.results.win(socket, io, pool, game_id, board, 'outoftime', {
                    w: color == 'b' ? moveshistoryopponent : moveshistory,
                    b: color == 'w' ? moveshistoryopponent : moveshistory,
                  });
                }, ret2.rows[0][`time${opponentcolor}`] * 1000);
              });
            }
            socketActions.moves.switch(
              socket,
              board,
              color == 'w' ? moveshistory : moveshistoryopponent,
              color == 'w' ? moveshistoryopponent : moveshistory
            );
            return pool.query(
              `UPDATE games SET board = $1, moves${color} = $2, action${color} = 'wait', action${opponentcolor} = 'move', time${color} = time${color} - EXTRACT(EPOCH from (now() - lastmove${color})), lastmove${opponentcolor} = now()${historyStatement} WHERE id = $3 RETURNING timew, timeb`,
              [board, ret.rows[0][`moves${color}`] + 1, game_id],
              (err, ret2) => {
                socketActions.other.time(socket, ret2.rows[0].timew, ret2.rows[0].timeb);
                clearTimeout(timeouts[game_id]);
                timeouts[game_id] = setTimeout(() => {
                  delete timeouts[game_id];
                  return socketActions.results.win(socket, io, pool, game_id, board, 'outoftime', {
                    w: color == 'b' ? moveshistoryopponent : moveshistory,
                    b: color == 'w' ? moveshistoryopponent : moveshistory,
                  });
                }, ret.rows[0][`time${opponentcolor}`] * 1000);
              }
            );
          }
          break;
        case 1:
          if (board[move.from] != color) return socketActions.other.error(socket, 'invalid move');
          if (!mill.isNeighbor(move.from, move.to)) return socketActions.other.error(socket, 'invalid move');
          board[move.from] = 'x';
          board[move.to] = color;
          moveshistory.unshift({
            action: 'move',
            from: move.from,
            to: move.to,
          });
          if (checks.moves.repetition(moveshistory, moveshistoryopponent)) {
            clearTimeout(timeouts[game_id]);
            delete timeouts[game_id];
            return socketActions.results.draw(socket, io, pool, game_id, board, 'repetition', {
              w: color == 'b' ? moveshistoryopponent : moveshistory,
              b: color == 'w' ? moveshistoryopponent : moveshistory,
            });
          }
          if (checks.moves.thirty(moveshistory, moveshistoryopponent)) {
            clearTimeout(timeouts[game_id]);
            delete timeouts[game_id];
            return socketActions.results.draw(socket, io, pool, game_id, board, 'moves', {
              w: color == 'b' ? moveshistoryopponent : moveshistory,
              b: color == 'w' ? moveshistoryopponent : moveshistory,
            });
          }
          historyStatement = `, movehistory${color} = '${JSON.stringify(moveshistory)}'`;
          mills = mill.isMill(board, move.to);
          if (mills > 0 && mills <= 2) {
            socketActions.moves.take(
              socket,
              board,
              color == 'w' ? moveshistory : moveshistoryopponent,
              color == 'w' ? moveshistoryopponent : moveshistory
            );
            const statement2 =
              mills == 1
                ? `UPDATE games SET board = $1, action${color} = 'take'${historyStatement} WHERE id = $2`
                : `UPDATE games SET board = $1, action${color} = 'take2'${historyStatement} WHERE id = $2`;
            return pool.query(statement2, [board, game_id], (err, ret) => {});
          } else {
            if (!mill.canMove(board, opponentcolor) && ret.rows[0][`phase${opponentcolor}`] == 1) {
              clearTimeout(timeouts[game_id]);
              delete timeouts[game_id];
              return socketActions.results.win(socket, io, pool, game_id, board, 'lockedin', {
                w: color == 'b' ? moveshistoryopponent : moveshistory,
                b: color == 'w' ? moveshistoryopponent : moveshistory,
              });
            }
            socketActions.moves.switch(
              socket,
              board,
              color == 'w' ? moveshistory : moveshistoryopponent,
              color == 'w' ? moveshistoryopponent : moveshistory
            );
            return pool.query(
              `UPDATE games SET board = $1, action${color} = 'wait', action${opponentcolor} = 'move', time${color} = time${color} - EXTRACT(EPOCH from (now() - lastmove${color})), lastmove${opponentcolor} = now()${historyStatement} WHERE id = $2 RETURNING timew, timeb`,
              [board, game_id],
              (err, ret2) => {
                socketActions.other.time(socket, ret2.rows[0].timew, ret2.rows[0].timeb);
                clearTimeout(timeouts[game_id]);
                timeouts[game_id] = setTimeout(() => {
                  delete timeouts[game_id];
                  return socketActions.results.win(socket, io, pool, game_id, board, 'outoftime', {
                    w: color == 'b' ? moveshistoryopponent : moveshistory,
                    b: color == 'w' ? moveshistoryopponent : moveshistory,
                  });
                }, ret.rows[0][`time${opponentcolor}`] * 1000);
              }
            );
          }
          break;
        case 2:
          if (board[move.from] != color) return socketActions.other.error(socket, 'invalid move');
          board[move.from] = 'x';
          board[move.to] = color;
          moveshistory.unshift({
            action: 'move',
            from: move.from,
            to: move.to,
          });
          if (checks.moves.repetition(moveshistory, moveshistoryopponent)) {
            clearTimeout(timeouts[game_id]);
            delete timeouts[game_id];
            return socketActions.results.draw(socket, io, pool, game_id, board, 'repetition', {
              w: color == 'b' ? moveshistoryopponent : moveshistory,
              b: color == 'w' ? moveshistoryopponent : moveshistory,
            });
          }
          if (checks.moves.thirty(moveshistory, moveshistoryopponent)) {
            clearTimeout(timeouts[game_id]);
            delete timeouts[game_id];
            return socketActions.results.draw(socket, io, pool, game_id, board, 'moves', {
              w: color == 'b' ? moveshistoryopponent : moveshistory,
              b: color == 'w' ? moveshistoryopponent : moveshistory,
            });
          }
          historyStatement = `, movehistory${color} = '${JSON.stringify(moveshistory)}'`;
          mills = mill.isMill(board, move.to);
          if (mills > 0 && mills <= 2) {
            socketActions.moves.take(
              socket,
              board,
              color == 'w' ? moveshistory : moveshistoryopponent,
              color == 'w' ? moveshistoryopponent : moveshistory
            );
            const statement2 =
              mills == 1
                ? `UPDATE games SET board = $1, action${color} = 'take'${historyStatement} WHERE id = $2`
                : `UPDATE games SET board = $1, action${color} = 'take2'${historyStatement} WHERE id = $2`;
            return pool.query(statement2, [board, game_id], (err, ret) => {});
          } else {
            socketActions.moves.switch(
              socket,
              board,
              color == 'w' ? moveshistory : moveshistoryopponent,
              color == 'w' ? moveshistoryopponent : moveshistory
            );
            return pool.query(
              `UPDATE games SET board = $1, action${color} = 'wait', action${opponentcolor} = 'move', time${color} = time${color} - EXTRACT(EPOCH from (now() - lastmove${color})), lastmove${opponentcolor} = now()${historyStatement} WHERE id = $2 RETURNING timew, timeb`,
              [board, game_id],
              (err, ret2) => {
                socketActions.other.time(socket, ret2.rows[0].timew, ret2.rows[0].timeb);
                clearTimeout(timeouts[game_id]);
                timeouts[game_id] = setTimeout(() => {
                  delete timeouts[game_id];
                  return socketActions.results.win(socket, io, pool, game_id, board, 'outoftime', {
                    w: color == 'b' ? moveshistoryopponent : moveshistory,
                    b: color == 'w' ? moveshistoryopponent : moveshistory,
                  });
                }, ret.rows[0][`time${opponentcolor}`] * 1000);
              }
            );
          }
          break;
        default:
          socketActions.other.error(socket, 'invalid move');
          break;
      }
    });
  });

  socket.on('take', (data) => {
    let move;
    try {
      move = JSON.parse(data);
    } catch (e) {
      return socketActions.other.error(socket, 'invalid move');
    }
    const statement = `SELECT board, phase${color}, phase${opponentcolor}, moves${color}, action${color}, movehistoryw, movehistoryb, time${color}, time${opponentcolor} FROM games WHERE id = $1`;
    pool.query(statement, [game_id], (err, ret) => {
      board = JSON.parse(ret.rows[0].board);
      let movehistory = JSON.parse(ret.rows[0][`movehistory${color}`]);
      let movehistoryopponent = JSON.parse(ret.rows[0][`movehistory${opponentcolor}`]);
      if (err) return socketActions.other.error(socket, err);
      let allInMills;
      switch (ret.rows[0][`action${color}`]) {
        case 'take':
          allInMills =
            Object.entries(board)
              .filter((a) => a[1] === opponentcolor)
              .map((a) => {
                return mill.isMill(board, a[0]);
              })
              .filter((a) => a === 0).length === 0;
          if (board[move.from] != opponentcolor) return socketActions.other.error(socket, 'invalid move');
          else if (mill.isMill(board, move.from) !== 0 && !allInMills) return socketActions.other.error(socket, 'cannot take piece in mill');
          else if (mill.isMill(board, move.from) === 0 || allInMills) {
            board[move.from] = 'x';
            let side = board[`${color}side`];
            side.push(opponentcolor);
            board[`${color}side`] = side;
            movehistory.unshift({
              action: 'take',
              from: move.from,
            });
            if (ret.rows[0][`phase${color}`] != 0) {
              if (Object.values(board).filter((a) => a === opponentcolor).length === 3) {
                pool.query(`UPDATE games SET phase${opponentcolor} = 2 WHERE id = $1`, [game_id], (err, ret) => {});
              }
              if (Object.values(board).filter((a) => a === opponentcolor).length < 3) {
                clearTimeout(timeouts[game_id]);
                delete timeouts[game_id];
                return socketActions.results.win(socket, io, pool, game_id, board, 'pieces', {
                  w: color == 'b' ? movehistoryopponent : movehistory,
                  b: color == 'w' ? movehistoryopponent : movehistory,
                });
              }
              if (
                ret.rows[0][`phase${opponentcolor}`] != 0 &&
                ret.rows[0][`phase${opponentcolor}`] != 2 &&
                Object.values(board).filter((a) => a === opponentcolor).length != 3
              ) {
                if (!mill.canMove(board, opponentcolor)) {
                  clearTimeout(timeouts[game_id]);
                  delete timeouts[game_id];
                  return socketActions.results.win(socket, io, pool, game_id, board, 'lockedin', {
                    w: color == 'b' ? movehistoryopponent : movehistory,
                    b: color == 'w' ? movehistoryopponent : movehistory,
                  });
                }
                if (!mill.canMove(board, color) && ret.rows[0][`phase${color}`] == 1) {
                  clearTimeout(timeouts[game_id]);
                  delete timeouts[game_id];
                  return socketActions.results.lose(socket, io, pool, game_id, board, 'lockedin', {
                    w: color == 'b' ? movehistoryopponent : movehistory,
                    b: color == 'w' ? movehistoryopponent : movehistory,
                  });
                }
              }
            }
            const historyStatement = `, movehistory${color} = '${JSON.stringify(movehistory)}'`;
            socketActions.moves.switch(
              socket,
              board,
              color == 'w' ? movehistory : movehistoryopponent,
              color == 'w' ? movehistoryopponent : movehistory
            );
            return pool.query(
              `UPDATE games SET board = $1, action${color} = 'wait', action${opponentcolor} = 'move', time${color} = time${color} - EXTRACT(EPOCH from (now() - lastmove${color})), lastmove${opponentcolor} = now()${historyStatement} WHERE id = $2 RETURNING timew, timeb`,
              [board, game_id],
              (err, ret2) => {
                socketActions.other.time(socket, ret2.rows[0].timew, ret2.rows[0].timeb);
                clearTimeout(timeouts[game_id]);
                timeouts[game_id] = setTimeout(() => {
                  delete timeouts[game_id];
                  return socketActions.results.win(socket, io, pool, game_id, board, 'outoftime', {
                    w: color == 'w' ? movehistoryopponent : movehistory,
                    b: color == 'b' ? movehistoryopponent : movehistory,
                  });
                }, ret.rows[0][`time${opponentcolor}`] * 1000);
              }
            );
          }
          break;
        case 'take2':
          allInMills =
            Object.entries(board)
              .filter((a) => a[1] === opponentcolor)
              .map((a) => {
                return mill.isMill(board, a[0]);
              })
              .filter((a) => a === 0).length === 0;
          if (board[move.from] != opponentcolor) return socketActions.other.error(socket, 'invalid move');
          else if (mill.isMill(board, move.from) !== 0 && !allInMills) return socketActions.other.error(socket, 'cannot take piece in mill');
          else if (mill.isMill(board, move.from) === 0 || allInMills) {
            board[move.from] = 'x';
            let side = board[`${color}side`];
            side.push(opponentcolor);
            board[`${color}side`] = side;
            movehistory.unshift({
              action: 'take',
              from: move.from,
            });
            if (ret.rows[0][`phase${color}`] != 0) {
              if (Object.values(board).filter((a) => a === opponentcolor).length === 3) {
                pool.query(`UPDATE games SET phase${opponentcolor} = 2 WHERE id = $1`, [game_id], (err, ret) => {});
              }
              if (Object.values(board).filter((a) => a === opponentcolor).length < 3) {
                clearTimeout(timeouts[game_id]);
                delete timeouts[game_id];
                return socketActions.results.win(socket, io, pool, game_id, board, 'pieces', {
                  w: color == 'b' ? movehistoryopponent : movehistory,
                  b: color == 'w' ? movehistoryopponent : movehistory,
                });
              }
              if (
                ret.rows[0][`phase${opponentcolor}`] != 0 &&
                ret.rows[0][`phase${opponentcolor}`] != 2 &&
                Object.values(board).filter((a) => a === opponentcolor).length != 3
              ) {
                if (!mill.canMove(board, opponentcolor)) {
                  clearTimeout(timeouts[game_id]);
                  delete timeouts[game_id];
                  return socketActions.results.win(socket, io, pool, game_id, board, 'lockedin', {
                    w: color == 'b' ? movehistoryopponent : movehistory,
                    b: color == 'w' ? movehistoryopponent : movehistory,
                  });
                }
                if (!mill.canMove(board, color) && ret.rows[0][`phase${color}`] == 1) {
                  clearTimeout(timeouts[game_id]);
                  delete timeouts[game_id];
                  return socketActions.results.lose(socket, io, pool, game_id, board, 'lockedin', {
                    w: color == 'b' ? movehistoryopponent : movehistory,
                    b: color == 'w' ? movehistoryopponent : movehistory,
                  });
                }
              }
            }
            const historyStatement = `, movehistory${color} = '${JSON.stringify(movehistory)}'`;
            socketActions.moves.take(
              socket,
              board,
              color == 'w' ? movehistory : movehistoryopponent,
              color == 'w' ? movehistoryopponent : movehistory
            );
            return pool.query(
              `UPDATE games SET board = $1, action${color} = 'take'${historyStatement} WHERE id = $2`,
              [board, game_id],
              (err, ret) => {}
            );
          }
          break;
        default:
          socketActions.other.error(socket, 'invalid action');
          break;
      }
    });
  });

  socket.on('draw', (data) => {
    const statement = `SELECT draw${color}, draw${opponentcolor}, phase${color}, phase${opponentcolor} FROM games WHERE id = $1`;
    pool.query(statement, [game_id], (err, ret) => {
      if (err) return socketActions.other.error(socket, err);
      if (checks.phase.notZero(ret.rows[0]) && checks.draw.autodraw(board, color, opponentcolor)) {
        clearTimeout(timeouts[game_id]);
        delete timeouts[game_id];
        return socketActions.results.draw(socket, io, pool, game_id, board, 'rule', {
          w: color == 'b' ? moveshistoryopponent : moveshistory,
          b: color == 'w' ? moveshistoryopponent : moveshistory,
        });
      }
      if (ret.rows[0][`draw${opponentcolor}`]) {
        clearTimeout(timeouts[game_id]);
        delete timeouts[game_id];
        return socketActions.results.draw(socket, io, pool, game_id, board, 'agreement', {
          w: color == 'w' ? moveshistoryopponent : moveshistory,
          b: color == 'b' ? moveshistoryopponent : moveshistory,
        });
      }
      socket.broadcast.emit('draw?');
      return pool.query(`UPDATE games SET draw${color} = 't' WHERE id = $1`, [game_id], (err, ret) => {});
    });
  });

  socket.on('draw!', (data) => {
    pool.query(`UPDATE games SET draww = 'f', drawb = 'f' WHERE id = $1`, [game_id], (err, ret) => {});
    socket.broadcast.emit('draw!');
    socket.emit('draw!');
  });

  socket.on('message', (data) => {
    socket.broadcast.emit('message', data);
  });

  socket.on('lose', (data) => {
    pool.query('SELECT movehistoryw, movehistoryb FROM games WHERE id = $1', [game_id], (err, ret) => {
      if (ret.rows.length == 0) return;
      clearTimeout(timeouts[game_id]);
      delete timeouts[game_id];
      return socketActions.results.lose(socket, io, pool, game_id, board, 'forfeit', {
        w: JSON.parse(ret.rows[0].movehistoryw),
        b: JSON.parse(ret.rows[0].movehistoryb),
      });
    });
  });

  socket.on('disconnect', (data) => {
    socket.nsp.allSockets().then((sockets) => {
      if (sockets.size > 2) return;
      pool.query('SELECT movehistoryw, movehistoryb FROM games WHERE id = $1', [game_id], (err, ret) => {
        if (ret.rows.length == 0) return;
        clearTimeout(timeouts[game_id]);
        delete timeouts[game_id];
        return socketActions.results.lose(socket, io, pool, game_id, board, 'disconnect', {
          w: JSON.parse(ret.rows[0].movehistoryw),
          b: JSON.parse(ret.rows[0].movehistoryb),
        });
      });
    });
  });
});

const port = process.env.PORT || 8080;
server.listen(port, () => console.log(`listening to port ${port}`));
