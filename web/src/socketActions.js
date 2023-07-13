class moves {
  static wait(socket, board) {
    socket.emit('wait', JSON.stringify(board));
  }

  static move(socket, board) {
    socket.emit('move', JSON.stringify(board));
  }

  static take(socket, board, historyw, historyb) {
    socket.emit('take', JSON.stringify(board));
    this.wait(socket.broadcast, board);
    this.history(socket, historyw, historyb);
    this.history(socket.broadcast, historyw, historyb);
  }

  static switch(socket, board, historyw, historyb) {
    this.wait(socket, board);
    this.move(socket.broadcast, board);
    this.history(socket, historyw, historyb);
    this.history(socket.broadcast, historyw, historyb);
  }

  static history(socket, historyw, historyb) {
    socket.emit(
      'history',
      JSON.stringify({
        w: historyw,
        b: historyb,
      })
    );
  }
}
class other {
  static time(socket, w, b) {
    socket.emit(
      'time',
      JSON.stringify({
        w: w,
        b: b,
      })
    );
    socket.broadcast.emit(
      'time',
      JSON.stringify({
        w: w,
        b: b,
      })
    );
  }

  static error = (socket, err) => {
    socket.emit('error', err);
  };
}

class results {
  static win(socket, io, pool, id, board, reason, history) {
    socket.emit('win', JSON.stringify(board), reason, history);
    socket.broadcast.emit('lose', JSON.stringify(board), reason);
    io.of(socket.nsp.name).disconnectSockets();
    pool.query('DELETE FROM games WHERE id = $1', [id], (err, ret) => {});
  }
  static lose(socket, io, pool, id, board, reason, history) {
    socket.emit('lose', JSON.stringify(board), reason);
    socket.broadcast.emit('win', JSON.stringify(board), reason, history);
    io.of(socket.nsp.name).disconnectSockets();
    pool.query('DELETE FROM games WHERE id = $1', [id], (err, ret) => {});
  }
  static draw(socket, io, pool, id, board, reason, history) {
    socket.emit('draw', JSON.stringify(board), reason, history);
    socket.broadcast.emit('draw', JSON.stringify(board), reason), history;
    io.of(socket.nsp.name).disconnectSockets();
    pool.query('DELETE FROM games WHERE id = $1', [id], (err, ret) => {});
  }
}

module.exports = { moves, other, results };
