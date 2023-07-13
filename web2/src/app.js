const { Manager } = require('socket.io-client');
const app = require('express')();
const express = require('express');
const device = require('browser-detect');
const cors = require('cors');
const server = require('http').createServer(app);
const { Pool, Client } = require('pg');
const io = require('socket.io')(server, { cors: { origin: '*', methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH'] } });
const bcrypt = require('bcrypt');
const sharp = require('sharp');
const elo = require('./elo');
const nodemailer = require('nodemailer');
const fs = require('fs');
const tfjs = require('@tensorflow/tfjs-node');
const { type } = require('os');
const htmls = {
  email_verification: fs.readFileSync('./src/eMail/verification.html', 'utf8'),
  html_verification: fs.readFileSync('./src/verify/page.html', 'utf8'),
};
let predictionModels = {};

tfjs.loadLayersModel('file://./src/models/movingModel/model.json').then((model) => (predictionModels.moving = model));
tfjs.loadLayersModel('file://./src/models/placingModel/model.json').then((model) => (predictionModels.placing = model));
tfjs.loadLayersModel('file://./src/models/takingModel/model.json').then((model) => (predictionModels.taking = model));

let resolvers = {
  friendly: {},
};

const transporter = nodemailer.createTransport({
  host: 'mail.zukic.net',
  port: 465,
  secure: true,
  auth: {
    user: 'support@playmill.at',
    pass: 'WmCV4LTpg4KN9nCGbGpp',
  },
});

app.use(express.json());
app.use(cors({ origin: '*' }));

const pool = new Pool({
  host: 'db2',
  user: 'postgres',
  database: 'mill',
  password: 'Qjkt9MgZzo4wuCoCevv3iaAhbZawkK4jHrkuoNp3fNZ24UEiWe',
});

// ML Calls

app.post('/predict/move', async (req, res) => {
  const { input } = req.body;
  if (typeof input !== 'object' || input.length !== 28) return res.json({ status: 'error', error: 'Invalid input' });
  for (let i of input) if (typeof i !== 'number') return res.json({ status: 'error', error: 'Invalid input' });
  let prediction = null;
  try {
    prediction = await predictionModels.moving.predict(tfjs.tensor([input])).array();
  } catch (e) {
    return res.json({ status: 'error', error: 'inproperly formated input' });
  }
  return res.json({ status: 'success', prediction: prediction });
});

app.post('/predict/place', async (req, res) => {
  const { input } = req.body;
  if (typeof input !== 'object' || input.length !== 28) return res.json({ status: 'error', error: 'Invalid input' });
  for (let i of input) if (typeof i !== 'number') return res.json({ status: 'error', error: 'Invalid input' });
  let prediction = null;
  try {
    prediction = await predictionModels.placing.predict(tfjs.tensor([input])).array();
  } catch (e) {
    return res.json({ status: 'error', error: 'inproperly formated input' });
  }
  return res.json({ status: 'success', prediction: prediction });
});

app.post('/predict/take', async (req, res) => {
  const { input } = req.body;
  if (typeof input !== 'object' || input.length !== 28) return res.json({ status: 'error', error: 'Invalid input' });
  for (let i of input) if (typeof i !== 'number') return res.json({ status: 'error', error: 'Invalid input' });
  let prediction = null;
  try {
    prediction = await predictionModels.taking.predict(tfjs.tensor([input])).array();
  } catch (e) {
    return res.json({ status: 'error', error: 'inproperly formated input' });
  }
  return res.json({ status: 'succes', prediction: prediction });
});

// gets

app.get('/countries', (req, res) => {
  pool.query('SELECT * FROM countries', (err, result) => {
    if (err)
      return res.status(500).json({
        error: err.message,
      });
    return res.json(result.rows);
  });
});

app.get('/game_modes', (req, res) => {
  pool.query('SELECT * FROM game_modes', (err, result) => {
    if (err)
      return res.status(500).json({
        error: err.message,
      });
    return res.json(result.rows);
  });
});

app.get('/puzzle_packs', (req, res) => {
  pool.query('SELECT pack_id, pack_name, premium FROM puzzle_packs WHERE hidden = false', async (err, result) => {
    if (err)
      return res.status(500).json({
        error: err.message,
      });
    for (let pack of result.rows) {
      const puzzles = await pool.query('SELECT puzzle_id FROM puzzles WHERE pack_id = $1', [pack.pack_id]);
      pack.puzzles = puzzles.rows;
    }
    return res.json(result.rows);
  });
});

app.get('/puzzle_pack/:pack_id/puzzles', (req, res) => {
  pool.query('SELECT puzzle_id FROM puzzles WHERE pack_id = $1', [req.params.pack_id], (err, result) => {
    if (err)
      return res.status(500).json({
        error: err.message,
      });
    return res.json(result.rows);
  });
});

app.get('/puzzle/:puzzle_id', (req, res) => {
  const { session_key } = req.query;
  if (!session_key || session_key == undefined) return res.json({ status: 'error', error: 'No session key specified' });
  pool.query(
    'SELECT puzzle_id, board, color, moves FROM puzzles JOIN puzzle_packs using(pack_id) WHERE puzzle_id = $1 AND (premium = false OR (premium = true AND (SELECT premium FROM users JOIN sessions using(uid) WHERE session_key = $2) = true))',
    [req.params.puzzle_id, session_key],
    (err, result) => {
      if (err)
        return res.status(500).json({
          error: err.message,
        });
      if (result.rows.length === 0) return res.json({ status: 'error', error: 'Invalid puzzle id' });
      return res.json(result.rows[0]);
    }
  );
});

app.get('/stats/users', (req, res) => {
  pool.query('SELECT COUNT(*) FROM users', (err, result) => {
    if (err)
      return res.status(500).json({
        error: err.message,
      });
    return res.json(result.rows[0]);
  });
});

app.get('/account', (req, res) => {
  pool.query(
    'SELECT users.uid, username, email, country_code, elo_visible, admin, premium, verified, elo, description, registered_date, image FROM users JOIN sessions using(uid) LEFT JOIN users_pictures ON users.uid = users_pictures.uid WHERE session_key = $1',
    [req.query.session_key],
    (err, result) => {
      if (err)
        return res.json({
          status: 'error',
          error: err.message,
        });
      else if (result.rows.length === 0)
        return res.json({
          status: 'error',
          error: 'Invalid session key',
        });
      else {
        if (result.rows[0].elo_visible === false) {
          delete result.rows[0].elo;
        }
        delete result.rows[0].elo_visible;
        return res.json({
          status: 'success',
          account: result.rows[0],
        });
      }
    }
  );
});

app.get('/badges', (req, res) => {
  const { uid } = req.query;
  if (!uid) return res.json({ status: 'error', error: 'No uid specified' });
  pool.query(
    'SELECT active, badge_id, badge_text, badge_description, bg_color, txt_color, border_color FROM badges JOIN user_badges using(badge_id) WHERE uid = $1',
    [uid],
    (err, result) => {
      if (err)
        return res.json({
          status: 'error',
          error: err.message,
        });
      return res.json({
        status: 'success',
        badges: result.rows,
      });
    }
  );
});

app.get('/allbadges', (req, res) => {
  pool.query('SELECT * FROM badges', (err, result) => {
    if (err)
      return res.json({
        status: 'error',
        error: err.message,
      });
    return res.json({
      status: 'success',
      badges: result.rows,
    });
  });
});

app.patch('/badges', (req, res) => {
  const { session_key, badge_id, active } = req.body;
  if (!session_key) return res.json({ status: 'error', error: 'No session key specified' });
  if (!badge_id) return res.json({ status: 'error', error: 'No badge id specified' });
  if (active !== true && active !== false) return res.json({ status: 'error', error: 'Invalid active value' });
  pool.query(
    'UPDATE user_badges SET active = $1 FROM sessions WHERE sessions.uid = user_badges.uid AND session_key = $2 AND badge_id = $3 RETURNING active',
    [active, session_key, badge_id],
    (err, result) => {
      if (err) {
        return res.json({
          status: 'error',
          error: err,
        });
      }
      if (result.affectedRows === 0) {
        return res.json({
          status: 'error',
          error: 'Invalid session key or badge id specified',
        });
      }
      if (result.rows[0].active !== active) {
        return res.json({
          status: 'error',
          error: 'max3',
        });
      }
      return res.json({
        status: 'success',
      });
    }
  );
});

app.get('/games', (req, res) => {
  if (!req.query.limit) req.query.limit = 10;
  if (!req.query.offset) req.query.offset = 0;
  if (req.query.limit > 100) return res.json({ status: 'error', error: "Limit can't be more than 100" });
  pool.query(
    "SELECT * FROM ((SELECT users.uid as enemy_uid, users.username as enemy_name, game_id, played_at, welo as elo, belo as enemy_elo, mode_name as game_mode, CASE WHEN winner = 'w' THEN 'win' WHEN winner='b' THEN 'lose' ELSE 'draw' END as result FROM sessions JOIN games ON wuid = sessions.uid JOIN game_modes using(mode_id) JOIN users on games.buid = users.uid WHERE session_key = $1 AND winner != 'playing') UNION (SELECT users.uid as enemy_uid, users.username as enemy_name, game_id, played_at, belo as elo, welo as enemy_elo, mode_name as game_mode, CASE WHEN winner = 'b' THEN 'win' WHEN winner='w' THEN 'lose' ELSE 'draw' END as result FROM sessions JOIN games ON buid = sessions.uid JOIN game_modes using(mode_id) JOIN users ON games.wuid = users.uid WHERE session_key = $1 AND winner != 'playing')) tmp ORDER BY played_at DESC LIMIT $2 OFFSET $3",
    [req.query.session_key, req.query.limit, req.query.offset],
    (err, result) => {
      if (err)
        return res.json({
          status: 'error',
          error: err.message,
        });
      return res.json({
        status: 'success',
        games: result.rows,
      });
    }
  );
});

app.get('/game_notation', (req, res) => {
  const { gid } = req.query;
  if (!gid || gid == undefined) return res.json({ status: 'error', error: 'No gid specified' });
  pool.query(
    'SELECT played_at, notation, winner, mode_name, wu.username as wusername, wuid, buid, bu.username as busername FROM games JOIN game_modes using(mode_id) JOIN users wu ON wuid = wu.uid JOIN users bu ON buid = bu.uid WHERE game_id = $1',
    [gid],
    (err, result) => {
      if (err)
        return res.json({
          status: 'error',
          error: err.message,
        });
      if (result.rows.length === 0)
        return res.json({
          status: 'error',
          error: 'No game found',
        });
      return res.json({
        status: 'success',
        game: result.rows[0],
      });
    }
  );
});

app.get('/leaderboard', (req, res) => {
  pool.query(
    'SELECT username, elo, uid, country_code, country_name, image FROM users JOIN countries using(country_code) LEFT JOIN users_pictures using(uid) ORDER BY elo DESC LIMIT 10',
    (err, result) => {
      if (err)
        return res.json({
          status: 'error',
          error: err.message,
        });
      return res.json({
        status: 'success',
        leaderboard: result.rows,
      });
    }
  );
});

app.get('/player', (req, res) => {
  if (!req.query.uid) return res.json({ status: 'error', error: 'No uid specified' });
  pool.query(
    'SELECT username, uid, elo, country_code, country_name, image, registered_date FROM users JOIN countries using(country_code) LEFT JOIN users_pictures using(uid) WHERE uid = $1',
    [req.query.uid],
    (err, result) => {
      if (err)
        return res.json({
          status: 'error',
          error: err.message,
        });
      else if (result.rows.length === 0)
        return res.json({
          status: 'error',
          error: 'No user with such uid',
        });
      return res.json({
        status: 'success',
        player: result.rows[0],
      });
    }
  );
});

app.get('/elo', (req, res) => {
  if (!req.query.uid) return res.json({ status: 'error', error: 'No uid specified' });
  switch (req.query.mode) {
    case 'year':
      pool.query(
        'SELECT MAX(elo) as elo, date FROM ((SELECT MAX(welo) as elo, played_at::date as date FROM games WHERE wuid = $1 GROUP BY date) UNION (SELECT MAX(belo) as elo, played_at::date as date FROM games WHERE buid = $1 GROUP BY date)) tmp WHERE date >= now()::date - 365 GROUP BY date ORDER BY date DESC',
        [req.query.uid],
        (err, result) => {
          if (err)
            return res.json({
              status: 'error',
              error: err.message,
            });
          let first = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 365);
          if (result.rows.length == 0)
            return res.json({
              status: 'error',
              error: 'no data',
            });
          let days = [];
          for (var i = new Date(); i >= first; i.setDate(i.getDate() - 1)) {
            const value = result.rows.find((a) => a.date.toISOString().split('T')[0] == i.toISOString().split('T')[0]);
            if (value && value.elo != null) {
              days.push({
                elo: value.elo,
                date: i.toISOString().split('T')[0],
              });
            } else {
              days.push({ elo: null, date: i.toISOString().split('T')[0] });
            }
          }
          for (let i = days.length - 1; i >= 0; i--) {
            if (days[i].elo == null && days[i + 1] && days[i + 1].elo && days[i + 1].elo != null) {
              days[i].elo = days[i + 1].elo;
            } else if (days[i].elo == null) {
              let j = i;
              let day = days[j];
              while (day.elo != null && day) {
                j--;
                day = days[j];
              }
              if (day) {
                days[i].elo = day.elo;
              }
            }
          }
          if (days.some((a) => a.elo == null)) {
            pool.query(
              'SELECT MAX(elo) as elo, date FROM ((SELECT MAX(welo) as elo, played_at::date as date FROM games WHERE wuid = $1 GROUP BY date) UNION (SELECT MAX(belo) as elo, played_at::date as date FROM games WHERE buid = $1 GROUP BY date)) tmp WHERE date < now()::date - 365 AND elo IS NOT null GROUP BY date ORDER BY date DESC LIMIT 1',
              [req.query.uid],
              (err, result) => {
                if (err)
                  return res.json({
                    status: 'error',
                    error: err.message,
                  });
                let val = 0;
                if (result.rows.length == 0) val = 1000;
                else val = result.rows[0].elo;
                days.forEach((a) => {
                  if (a.elo == null) a.elo = val;
                });
                return res.json({
                  status: 'success',
                  elo: days.reverse(),
                });
              }
            );
          } else {
            return res.json({
              status: 'success',
              elo: days.reverse(),
            });
          }
        }
      );
      break;
    case 'month':
      pool.query(
        'SELECT MAX(elo) as elo, date FROM ((SELECT MAX(welo) as elo, played_at::date as date FROM games WHERE wuid = $1 GROUP BY date) UNION (SELECT MAX(belo) as elo, played_at::date as date FROM games WHERE buid = $1 GROUP BY date)) tmp WHERE date >= now()::date - 30 GROUP BY date ORDER BY date DESC',
        [req.query.uid],
        (err, result) => {
          if (err)
            return res.json({
              status: 'error',
              error: err.message,
            });
          let first = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 30);
          if (result.rows.length == 0)
            return res.json({
              status: 'error',
              error: 'no data',
            });
          let days = [];
          for (var i = new Date(); i >= first; i.setDate(i.getDate() - 1)) {
            const value = result.rows.find((a) => a.date.toISOString().split('T')[0] == i.toISOString().split('T')[0]);
            if (value && value.elo != null) {
              days.push({
                elo: value.elo,
                date: i.toISOString().split('T')[0],
              });
            } else {
              days.push({ elo: null, date: i.toISOString().split('T')[0] });
            }
          }
          for (let i = days.length - 1; i >= 0; i--) {
            if (days[i].elo == null && days[i + 1] && days[i + 1].elo && days[i + 1].elo != null) {
              days[i].elo = days[i + 1].elo;
            } else if (days[i].elo == null) {
              let j = i;
              let day = days[j];
              while (day.elo != null && day) {
                j--;
                day = days[j];
              }
              if (day) {
                days[i].elo = day.elo;
              }
            }
          }
          if (days.some((a) => a.elo == null)) {
            pool.query(
              'SELECT MAX(elo) as elo, date FROM ((SELECT MAX(welo) as elo, played_at::date as date FROM games WHERE wuid = $1 GROUP BY date) UNION (SELECT MAX(belo) as elo, played_at::date as date FROM games WHERE buid = $1 GROUP BY date)) tmp WHERE date < now()::date - 30 AND elo IS NOT null GROUP BY date ORDER BY date DESC LIMIT 1',
              [req.query.uid],
              (err, result) => {
                if (err)
                  return res.json({
                    status: 'error',
                    error: err.message,
                  });
                let val = 0;
                if (result.rows.length == 0) val = 1000;
                else val = result.rows[0].elo;
                days.forEach((a) => {
                  if (a.elo == null) a.elo = val;
                });
                return res.json({
                  status: 'success',
                  elo: days.reverse(),
                });
              }
            );
          } else {
            return res.json({
              status: 'success',
              elo: days.reverse(),
            });
          }
        }
      );
      break;
    case 'week':
      pool.query(
        'SELECT MAX(elo) as elo, date FROM ((SELECT MAX(welo) as elo, played_at::date as date FROM games WHERE wuid = $1 GROUP BY date) UNION (SELECT MAX(belo) as elo, played_at::date as date FROM games WHERE buid = $1 GROUP BY date)) tmp WHERE date >= now()::date - 7 GROUP BY date ORDER BY date DESC',
        [req.query.uid],
        (err, result) => {
          if (err)
            return res.json({
              status: 'error',
              error: err.message,
            });
          let first = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 7);
          if (result.rows.length == 0)
            return res.json({
              status: 'error',
              error: 'no data',
            });
          let days = [];
          for (var i = new Date(); i >= first; i.setDate(i.getDate() - 1)) {
            const value = result.rows.find((a) => a.date.toISOString().split('T')[0] == i.toISOString().split('T')[0]);
            if (value && value.elo != null) {
              days.push({
                elo: value.elo,
                date: i.toISOString().split('T')[0],
              });
            } else {
              days.push({ elo: null, date: i.toISOString().split('T')[0] });
            }
          }
          for (let i = days.length - 1; i >= 0; i--) {
            if (days[i].elo == null && days[i + 1] && days[i + 1].elo && days[i + 1].elo != null) {
              days[i].elo = days[i + 1].elo;
            } else if (days[i].elo == null) {
              let j = i;
              let day = days[j];
              while (day.elo != null && day) {
                j--;
                day = days[j];
              }
              if (day) {
                days[i].elo = day.elo;
              }
            }
          }
          if (days.some((a) => a.elo == null)) {
            pool.query(
              'SELECT MAX(elo) as elo, date FROM ((SELECT MAX(welo) as elo, played_at::date as date FROM games WHERE wuid = $1 GROUP BY date) UNION (SELECT MAX(belo) as elo, played_at::date as date FROM games WHERE buid = $1 GROUP BY date)) tmp WHERE date < now()::date - 7 AND elo IS NOT null GROUP BY date ORDER BY date DESC LIMIT 1',
              [req.query.uid],
              (err, result) => {
                if (err)
                  return res.json({
                    status: 'error',
                    error: err.message,
                  });
                let val = 0;
                if (result.rows.length == 0) val = 1000;
                else val = result.rows[0].elo;
                days.forEach((a) => {
                  if (a.elo == null) a.elo = val;
                });
                return res.json({
                  status: 'success',
                  elo: days.reverse(),
                });
              }
            );
          } else {
            return res.json({
              status: 'success',
              elo: days.reverse(),
            });
          }
        }
      );
      break;
    default:
      return res.json({
        status: 'error',
        error: 'Invalid mode',
      });
      break;
  }
});

app.get('/friends', (req, res) => {
  pool.query(
    'SELECT * FROM ((SELECT u.uid as uid, username, elo, image FROM sessions JOIN friends ON sessions.uid = user1 JOIN users u on u.uid = user2 LEFT JOIN users_pictures up on u.uid = up.uid WHERE session_key = $1) UNION (SELECT u.uid as uid, username, elo, image FROM sessions JOIN friends ON sessions.uid = user2 JOIN users u on u.uid = user1 LEFT JOIN users_pictures up on u.uid = up.uid WHERE session_key = $1)) tmp',
    [req.query.session_key],
    (err, result) => {
      if (err)
        return res.json({
          status: 'error',
          error: err.message,
        });
      return res.json({
        status: 'success',
        friends: result.rows,
      });
    }
  );
});

app.get('/friends/request/sent', (req, res) => {
  pool.query(
    'SELECT users.uid as uid, username, image FROM sessions JOIN friend_requests ON sessions.uid = requesting JOIN users ON users.uid = requested LEFT JOIN users_pictures ON users_pictures.uid = users.uid WHERE session_key = $1',
    [req.query.session_key],
    (err, result) => {
      if (err)
        return res.json({
          status: 'error',
          error: err.message,
        });
      return res.json({
        status: 'success',
        requests: result.rows,
      });
    }
  );
});

app.get('/friends/request/received', (req, res) => {
  pool.query(
    'SELECT users.uid as uid, username, image FROM sessions JOIN friend_requests ON sessions.uid = requested JOIN users ON users.uid = requesting LEFT JOIN users_pictures ON users_pictures.uid = users.uid WHERE session_key = $1',
    [req.query.session_key],
    (err, result) => {
      if (err)
        return res.json({
          status: 'error',
          error: err.message,
        });
      return res.json({
        status: 'success',
        requests: result.rows,
      });
    }
  );
});

app.get('/friends/challenge', (req, res) => {
  if (!req.query.session_key)
    return res.json({
      status: 'error',
      error: 'Missing session_key',
    });
  pool.query(
    'SELECT users.uid as uid, username, image FROM sessions JOIN invites ON sessions.uid = invited JOIN users ON users.uid = inviting LEFT JOIN users_pictures ON users_pictures.uid = users.uid WHERE session_key = $1',
    [req.query.session_key],
    (err, result) => {
      if (err)
        return res.json({
          status: 'error',
          error: err.message,
        });
      return res.json({
        status: 'success',
        challenges: result.rows,
      });
    }
  );
});

app.post('/challenge/accept', (req, res) => {
  const { session_key, friend_uid } = req.body;
  if (!session_key || !friend_uid) {
    return res.json({
      status: 'error',
      error: 'Missing session_key or friend_uid',
    });
  }
  pool.query(
    'DELETE FROM invites WHERE inviting = $1 AND invited = (SELECT uid FROM sessions WHERE session_key = $2) RETURNING invited, mode_id',
    [friend_uid, session_key],
    (err, result) => {
      if (err)
        return res.json({
          status: 'error',
          error: err.message,
        });
      if (result.affectedRows == 0)
        return res.json({
          status: 'error',
          error: 'No challenge found',
        });
      const random = Math.round(Math.random());
      const wuid = random == 0 ? result.rows[0].invited : friend_uid;
      const buid = random == 0 ? friend_uid : result.rows[0].invited;
      const uid = result.rows[0].invited;
      pool.query(
        'INSERT INTO games (wuid, buid, mode_id) VALUES ($1, $2, $3) RETURNING game_id',
        [wuid, buid, result.rows[0].mode_id],
        (err, result) => {
          if (err)
            return res.json({
              status: 'error',
              error: err.message,
            });
          if (result.rows.length == 0)
            return res.json({
              status: 'error',
              error: 'Something went wrong',
            });
          resolvers.friendly[uid].resolve(result.rows[0].game_id);
          return res.json({
            status: 'success',
            game_id: result.rows[0].game_id,
          });
        }
      );
    }
  );
});

io.of('/challenge').on('connection', (socket) => {
  const { session_key, friend_uid, mode_id } = socket.handshake.auth;
  if (!session_key || !friend_uid || !mode_id || session_key == undefined || friend_uid == undefined || mode_id == undefined) {
    socket.emit('error', 'Missing session_key or friend_uid');
    return socket.disconnect(true);
  }
  pool.query(
    'INSERT INTO invites (inviting, invited, mode_id) VALUES ((SELECT uid FROM sessions WHERE session_key =$1), $2, $3)',
    [session_key, friend_uid, mode_id],
    (err, result) => {
      if (err) {
        socket.emit('error', err.message);
        return socket.disconnect(true);
      }
      if (result.affectedRows === 0) {
        socket.emit('error', 'Something went wrong');
        return socket.disconnect(true);
      }
      socket.emit('success');
      const a = new Promise((resolve, reject) => {
        resolvers.friendly[friend_uid] = {};
        resolvers.friendly[friend_uid].resolve = resolve;
        resolvers.friendly[friend_uid].reject = reject;
      }).then((game_id) => {
        socket.emit('gameFound', game_id);
        return socket.disconnect(true);
      });
    }
  );
  socket.on('disconnect', () => {
    pool.query(
      'DELETE FROM invites WHERE (inviting = (SELECT uid FROM sessions WHERE session_key = $1) AND invited = $2) OR (inviting = $2 AND invited = (SELECT uid FROM sessions WHERE session_key = $1))',
      [session_key, friend_uid],
      (err, result) => {}
    );
  });
});

// --------------------------------------------------------------------------
// ------------------------------ Requests ----------------------------------
// --------------------------------------------------------------------------

app.delete('/friend', (req, res) => {
  pool.query(
    'DELETE FROM friends WHERE ((user1 = (SELECT uid FROM sessions WHERE session_key = $1) AND user2 = $2) OR (user1 = $2 AND user2 = (SELECT uid FROM sessions WHERE session_key = $1)))  AND (SELECT mode_id from invites WHERE (invited = $2 AND inviting = (SELECT uid FROM sessions WHERE session_key =$1)) OR (inviting = $2 AND invited = (SELECT uid FROM sessions WHERE session_key =$1))) IS NULL',
    [req.body.session_key, req.body.friend_uid],
    (err, result) => {
      if (err)
        return res.json({
          status: 'error',
          error: err.message,
        });
      if (result.affectedRows === 0)
        return res.json({
          status: 'error',
          error: 'Friend not found',
        });
      return res.json({
        status: 'success',
      });
    }
  );
});

app.post('/request/friend', (req, res) => {
  if (!(req.body.friend_uid && req.body.session_key && req.body.message))
    return res.json({
      status: 'error',
      error: 'Missing parameters',
    });
  pool.query(
    'INSERT INTO friend_requests (requesting, requested, message) VALUES ((SELECT uid FROM sessions WHERE session_key = $1), $2, $3)',
    [req.body.session_key, req.body.friend_uid, req.body.message],
    (err, result) => {
      if (err)
        return res.json({
          status: 'error',
          error: err.message,
        });
      return res.json({
        status: 'success',
      });
    }
  );
});

app.post('/request/friend/accept', (req, res) => {
  pool.query(
    'SELECT * FROM friend_requests WHERE requesting = $1 AND requested = (SELECT uid FROM sessions WHERE session_key = $2)',
    [req.body.friend_uid, req.body.session_key],
    (err, result) => {
      if (err)
        return res.json({
          status: 'error',
          error: err.message,
        });
      else if (result.rows.length === 0)
        return res.json({
          status: 'error',
          error: 'not a request',
        });
      pool.query(
        'INSERT INTO friends (user1, user2) VALUES ((SELECT uid FROM sessions WHERE session_key = $1), $2)',
        [req.body.session_key, req.body.friend_uid],
        (err, result) => {
          if (err)
            return res.json({
              status: 'error',
              error: err.message,
            });
          pool.query(
            'DELETE FROM friend_requests WHERE requesting = $1 AND requested = (SELECT uid FROM sessions WHERE session_key = $2)',
            [req.body.friend_uid, req.body.session_key],
            (err, result) => {
              if (err)
                return res.json({
                  status: 'error',
                  error: err.message,
                });
              return res.json({
                status: 'success',
              });
            }
          );
        }
      );
    }
  );
});

app.post('/request/friend/decline', (req, res) => {
  pool.query(
    'DELETE FROM friend_requests WHERE requesting = $1 AND requested = (SELECT uid FROM sessions WHERE session_key = $2)',
    [req.body.friend_uid, req.body.session_key],
    (err, result) => {
      if (err)
        return res.json({
          status: 'error',
          error: err.message,
        });
      if (result.affectedRows === 0)
        return res.json({
          status: 'error',
          error: 'not a request',
        });
      return res.json({
        status: 'success',
      });
    }
  );
});

//queries

app.get('/query/account', (req, res) => {
  const query = req.query.query;
  pool.query('SELECT uid, username, image FROM users LEFT JOIN users_pictures using(uid) WHERE username = $1', [query], (err, result) => {
    if (err)
      return res.json({
        status: 'error',
        error: err.message,
      });
    else {
      return res.json({
        status: 'success',
        accounts: result.rows,
      });
    }
  });
});

//login

app.get('/login', (req, res) => {
  const { email, password } = req.query;
  const saltrounds = 10;
  pool.query('SELECT uid, username, password FROM users WHERE email = $1 AND active = true', [email], (err, result) => {
    if (err) {
      return res.json({ status: 'error', error: err.message });
    }
    if (result.rows.length > 0) {
      bcrypt.compare(password, result.rows[0].password, (err, isValid) => {
        if (err) {
          return res.json({ status: 'error', error: err.message });
        }
        if (isValid) {
          const deviceInfo = device(req.headers['user-agent']);
          pool.query(
            'INSERT INTO sessions (uid, session_key, ip, device, os) VALUES ($1, md5(CONCAT(now(), cast($2 as int))), $3, $4, $5) RETURNING session_key',
            [result.rows[0].uid, result.rows[0].uid, req.ip.replace('::ffff:', ''), deviceInfo.name, deviceInfo.os],
            (err, result) => {
              if (err) {
                return res.json({ status: 'error', error: err.message });
              } else if (result.rows.length === 0) {
                return res.json({
                  status: 'error',
                  error: 'Already logged in on three other devices',
                });
              }
              return res.json({
                status: 'success',
                session_key: result.rows[0].session_key,
              });
            }
          );
        } else {
          return res.json({
            status: 'error',
            error: 'Invalid email or password',
          });
        }
      });
    } else {
      return res.json({
        status: 'error',
        error: 'Invalid email or password',
      });
    }
  });
});

// logout

app.get('/logout', (req, res) => {
  if (!req.query.session_key) {
    return res.json({
      status: 'error',
      error: 'No session key provided',
    });
  }
  pool.query('DELETE FROM sessions WHERE session_key = $1', [req.query.session_key], (err, result) => {
    if (err) {
      return res.json({ status: 'error', error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.json({
        status: 'error',
        error: 'Invalid session key',
      });
    }
    return res.json({ status: 'success' });
  });
});

app.get('/logout/remote', (req, res) => {
  switch (req.query.action) {
    case 'query':
      if (!req.query.email || !req.query.password) {
        return res.json({
          status: 'error',
          error: 'No email or password provided',
        });
      }
      pool.query('SELECT uid, password FROM users WHERE email = $1', [req.query.email], (err, result) => {
        if (err) {
          return res.json({ status: 'error', error: err.message });
        }
        if (result.rows.length == 0) {
          return res.json({
            status: 'error',
            error: 'Invalid email or password',
          });
        }
        bcrypt.compare(req.query.password, result.rows[0].password, (err, isValid) => {
          if (err) {
            return res.json({ status: 'error', error: err.message });
          }
          if (isValid) {
            pool.query('SELECT session_key, ip, device, os, session_begin FROM sessions WHERE uid = $1', [result.rows[0].uid], (err, result) => {
              if (err) {
                return res.json({ status: 'error', error: err.message });
              }
              return res.json({
                status: 'success',
                sessions: result.rows,
              });
            });
          } else {
            return res.json({
              status: 'error',
              error: 'Invalid email or password',
            });
          }
        });
      });
      break;
    case 'logout':
      if (!req.query.session_key || !req.query.email || !req.query.password) {
        return res.json({
          status: 'error',
          error: 'Not all arguments provided',
        });
      }
      pool.query('SELECT uid, password FROM users WHERE email = $1', [req.query.email], (err, result) => {
        if (err) {
          return res.json({ status: 'error', error: err.message });
        }
        if (result.rows.length == 0) {
          return res.json({
            status: 'error',
            error: 'Invalid email or password',
          });
        }
        bcrypt.compare(req.query.password, result.rows[0].password, (err, isValid) => {
          if (err) {
            return res.json({ status: 'error', error: err.message });
          }
          if (isValid) {
            pool.query('DELETE FROM sessions WHERE session_key = $1 AND uid = $2', [req.query.session_key, result.rows[0].uid], (err, result) => {
              if (err) {
                return res.json({ status: 'error', error: err.message });
              }
              if (result.affectedRows === 0) {
                return res.json({
                  status: 'error',
                  error: 'Invalid session key',
                });
              }
              return res.json({ status: 'success' });
            });
          } else {
            return res.json({
              status: 'error',
              error: 'Invalid email or password',
            });
          }
        });
      });
      break;
    default:
      return res.json({
        status: 'error',
        error: 'Invalid action',
      });
  }
});

// posts

app.get('/verify', (req, res) => {
  const { uid, verification_key } = req.query;
  if (!uid || !verification_key) {
    return res.json({
      status: 'error',
      error: 'No uid or verification key provided',
    });
  }
  pool.query(
    'UPDATE users SET verified = true, verification_key = NULL WHERE uid = $1 AND verification_key = $2',
    [uid, verification_key],
    (err, result) => {
      if (err) {
        return res.json({
          status: 'error',
          error: error,
        });
      }
      if (result.affectedRows === 0) {
        return res.json({
          status: 'error',
          error: 'Invalid verification key',
        });
      }
      return res.send(htmls.html_verification);
    }
  );
});

app.patch('/premium', (req, res) => {
  const { session_key, premium } = req.body;
  if (!session_key) {
    return res.json({
      status: 'error',
      error: 'No session key provided',
    });
  }
  if (premium !== true && premium !== false) {
    return res.json({
      status: 'error',
      error: 'Invalid premium value',
    });
  }
  pool.query('UPDATE users SET premium = $2 WHERE uid = (SELECT uid FROM sessions WHERE session_key = $1)', [session_key, premium], (err, result) => {
    if (err) {
      return res.json({
        status: 'error',
        error: error,
      });
    }
    if (result.affectedRows === 0) {
      return res.json({
        status: 'error',
        error: 'Invalid session key',
      });
    }
    return res.json({ status: 'success' });
  });
});

app.post('/account', (req, res) => {
  const { email, username, password, country } = req.body;
  pool.query('SELECT 1 FROM users WHERE email = $1', [email], (err, result) => {
    if (err) {
      return res.json({ status: 'error', error: err.message });
    } else if (result.rows.length > 0) {
      return res.json({ status: 'error', error: 'Email already used' });
    }
    const saltrounds = 10;
    bcrypt.hash(password, saltrounds, (err, hash) => {
      if (err) {
        return res.json({ status: 'error', error: err.message });
      }
      pool.query(
        'INSERT INTO users (email, username, password, country_code, verification_key) VALUES ($1, $2, $3, $4, md5(random()::text)) RETURNING uid, verification_key',
        [email, username, hash, country],
        (err, result) => {
          if (err) {
            return res.json({ status: 'error', error: err.message });
          }
          const { uid, verification_key } = result.rows[0];
          const verification_link = `https://api.playmill.at/verify?uid=${uid}&verification_key=${verification_key}`;
          const mailOptions = {
            from: 'support@playmill.at',
            to: email,
            subject: 'Playmill Account Verification',
            html: htmls.email_verification.replace('{{username}}', username).replaceAll('{{link}}', verification_link),
          };
          try {
            transporter.sendMail(mailOptions);
          } catch (err) {}
          return res.json({
            status: 'success',
          });
        }
      );
    });
  });
});

app.post('/account/email', (req, res) => {
  const { email, session_key } = req.body;
  pool.query('UPDATE users SET email = $1 WHERE uid = (SELECT uid FROM sessions WHERE session_key = $2)', [email, session_key], (err, result) => {
    if (err) {
      return res.json({ status: 'error', error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.json({ status: 'error', error: 'Invalid session key' });
    }
    return res.json({ status: 'success' });
  });
});

app.post('/account/username', (req, res) => {
  const { username, session_key } = req.body;
  pool.query(
    'UPDATE users SET username = $1 WHERE uid = (SELECT uid FROM sessions WHERE session_key = $2)',
    [username, session_key],
    (err, result) => {
      if (err) {
        return res.json({ status: 'error', error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.json({ status: 'error', error: 'Invalid session key' });
      }
      return res.json({ status: 'success' });
    }
  );
});

app.post('/account/country', (req, res) => {
  const { country, session_key } = req.body;
  pool.query(
    'UPDATE users SET country_code = $1 WHERE uid = (SELECT uid FROM sessions WHERE session_key = $2)',
    [country, session_key],
    (err, result) => {
      if (err) {
        return res.json({ status: 'error', error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.json({ status: 'error', error: 'Invalid session key' });
      }
      return res.json({ status: 'success' });
    }
  );
});

app.post('/account/password', (req, res) => {
  const { email, oldPassword, newPassword } = req.body;
  pool.query('SELECT uid, password FROM users WHERE email = $1', [email], (err, result) => {
    if (err) {
      return res.json({ status: 'error', error: err.message });
    }
    if (result.rows.length == 0) {
      return res.json({
        status: 'error',
        error: 'Invalid email or password',
      });
    }
    bcrypt.compare(oldPassword, result.rows[0].password, (err, isValid) => {
      if (err) {
        return res.json({ status: 'error', error: err.message });
      }
      if (isValid) {
        const saltrounds = 10;
        bcrypt.hash(newPassword, saltrounds, (err, hash) => {
          if (err) {
            return res.json({ status: 'error', error: err.message });
          }
          pool.query('UPDATE users SET password = $1 WHERE uid = $2', [hash, result.rows[0].uid], (err, result) => {
            if (err) {
              return res.json({ status: 'error', error: err.message });
            }
            return res.json({ status: 'success' });
          });
        });
      } else {
        return res.json({
          status: 'error',
          error: 'Invalid email or password',
        });
      }
    });
  });
});

app.post('/account/image', (req, res) => {
  const image = req.body.image;
  const session_key = req.body.session_key;
  //check if image is dataUrl through regex
  if (!image.match(/^data:image\/(png|jpeg|jpg);base64,/)) {
    return res.json({
      status: 'error',
      error: 'Invalid image',
    });
  }
  //check if image has a size of less than 250x250 pixels
  const imageBuffer = Buffer.from(image.split(',')[1], 'base64');
  sharp(imageBuffer)
    .metadata()
    .then((metadata) => {
      if (metadata.width > 250 || metadata.height > 250) {
        return res.json({
          status: 'error',
          error: 'Image too large',
        });
      }
      //insert image into database. If image already exists, update it
      pool.query(
        'INSERT INTO users_pictures (uid, image) VALUES ((SELECT uid FROM sessions WHERE session_key = $1), $2) ON CONFLICT (uid) DO UPDATE SET image = $2',
        [session_key, image],
        (err, result) => {
          if (err) {
            return res.json({ status: 'error', error: err.message });
          } else if (result.affectedRows === 0) {
            return res.json({
              status: 'error',
              error: 'Invalid session key',
            });
          }
          return res.json({ status: 'success' });
        }
      );
    })
    .catch((err) => {
      return res.json({
        status: 'error',
        error: err.message,
      });
    });
});

app.delete('/account/image', (req, res) => {
  const session_key = req.body.session_key;
  pool.query('DELETE FROM users_pictures WHERE uid = (SELECT uid FROM sessions WHERE session_key = $1)', [session_key], (err, result) => {
    if (err) {
      return res.json({ status: 'error', error: err.message });
    } else if (result.affectedRows === 0) {
      return res.json({
        status: 'error',
        error: 'Invalid session key',
      });
    }
    return res.json({ status: 'success' });
  });
});

// --------------------------------------------------------------------------
// ---------------------------------- ADMIN ---------------------------------
// --------------------------------------------------------------------------

app.get('/admin/users', (req, res) => {
  const { session_key, name } = req.query;
  if (!session_key || !name || session_key === undefined || name === undefined) {
    return res.json({ status: 'error', error: 'Invalid request' });
  }
  pool.query(
    'SELECT uid, username, email FROM users WHERE (SELECT 1 FROM users JOIN sessions using(uid) WHERE session_key = $1 AND admin = true) IS NOT NULL AND username LIKE $2',
    [session_key, `%${name}%`],
    (err, result) => {
      if (err) {
        return res.json({ status: 'error', error: err.message });
      }
      if (result.rows.length === 0) {
        return res.json({ status: 'error', error: 'No users found' });
      }
      return res.json({ status: 'success', users: result.rows });
    }
  );
});

app.get('/admin/user', (req, res) => {
  const { session_key, uid } = req.query;
  if (!session_key || !uid || session_key === undefined || uid === undefined) {
    return res.json({ status: 'error', error: 'Invalid request' });
  }
  pool.query(
    'SELECT uid, username, email, admin, country_code, registered_date, image FROM users LEFT JOIN users_pictures using(uid) WHERE (SELECT 1 FROM users JOIN sessions using(uid) WHERE session_key = $1 AND admin = true) IS NOT NULL AND uid = $2',
    [session_key, uid],
    (err, result) => {
      if (err) {
        return res.json({ status: 'error', error: err.message });
      }
      if (result.rows.length === 0) {
        return res.json({ status: 'error', error: 'Not Found' });
      }
      return res.json({ status: 'success', user: result.rows[0] });
    }
  );
});

app.patch('/admin/username', (req, res) => {
  const { session_key, uid, username } = req.body;
  if (!session_key || !uid || !username || session_key === undefined || uid === undefined || username === undefined) {
    return res.json({ status: 'error', error: 'Invalid request' });
  }
  pool.query(
    'UPDATE users SET username = $1 WHERE uid = $2 AND (SELECT 1 FROM users JOIN sessions using(uid) WHERE session_key = $3 AND admin = true) IS NOT NULL',
    [username, uid, session_key],
    (err, result) => {
      if (err) {
        return res.json({ status: 'error', error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.json({ status: 'error', error: 'Invalid session key' });
      }
      return res.json({ status: 'success' });
    }
  );
});

app.patch('/admin/email', (req, res) => {
  const { session_key, uid, email } = req.body;
  if (!session_key || !uid || !email || session_key === undefined || uid === undefined || email === undefined) {
    return res.json({ status: 'error', error: 'Invalid request' });
  }
  pool.query(
    'UPDATE users SET email = $1 WHERE uid = $2 AND (SELECT 1 FROM users JOIN sessions using(uid) WHERE session_key = $3 AND admin = true) IS NOT NULL',
    [email, uid, session_key],
    (err, result) => {
      if (err) {
        return res.json({ status: 'error', error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.json({ status: 'error', error: 'Invalid session key' });
      }
      return res.json({ status: 'success' });
    }
  );
});

app.patch('/admin/admin', (req, res) => {
  const { session_key, uid, admin } = req.body;
  if (!session_key || !uid || admin === null || session_key === undefined || uid === undefined || admin === undefined) {
    return res.json({ status: 'error', error: 'Invalid request' });
  }
  if (typeof admin !== 'boolean') {
    return res.json({ status: 'error', error: 'Invalid request' });
  }

  pool.query(
    'UPDATE users SET admin = $1 WHERE uid = $2 AND (SELECT 1 FROM users JOIN sessions using(uid) WHERE session_key = $3 AND admin = true) IS NOT NULL',
    [admin, uid, session_key],
    (err, result) => {
      if (err) {
        return res.json({ status: 'error', error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.json({ status: 'error', error: 'Invalid session key' });
      }
      return res.json({ status: 'success' });
    }
  );
});

app.delete('/admin/image', (req, res) => {
  const { session_key, uid } = req.body;
  if (!session_key || !uid || session_key === undefined || uid === undefined) {
    return res.json({ status: 'error', error: 'Invalid request' });
  }
  pool.query(
    'DELETE FROM users_pictures WHERE uid = $1 AND (SELECT 1 FROM users JOIN sessions using(uid) WHERE session_key = $2 AND admin = true) IS NOT NULL',
    [uid, session_key],
    (err, result) => {
      if (err) {
        return res.json({ status: 'error', error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.json({ status: 'error', error: 'Invalid session key' });
      }
      return res.json({ status: 'success' });
    }
  );
});

// --------------------------------------------------------------------------
// ---------------------------------- GAME ----------------------------------
// --------------------------------------------------------------------------

let waiting = {};

io.of('/queue').on('connection', (socket) => {
  let uid;
  pool.query(
    'SELECT uid, (SELECT COUNT(*) FROM queue WHERE uid = (SELECT uid FROM sessions WHERE session_key = $1)) FROM sessions WHERE session_key = $1',
    [socket.handshake.auth.session_key],
    (err, result) => {
      if (err) {
        socket.emit('error', err.message);
        return socket.disconnect(true);
      }
      if (result.rows.length === 0) {
        socket.emit('error', 'Invalid session key');
        return socket.disconnect(true);
      }
      if (result.rows[0].count > 0) {
        socket.emit('error', 'Already in queue');
        return socket.disconnect(true);
      }
      uid = result.rows[0].uid;
      socket.emit('success');
      pool.query('SELECT * FROM queue WHERE mode_id = $1 ORDER BY queuing_since ASC LIMIT 1', [socket.handshake.auth.mode_id], (err, result) => {
        if (err) {
          socket.emit('error', err.message);
          return socket.disconnect(true);
        }
        if (result.rows.length === 0) {
          pool.query('INSERT INTO queue (uid, mode_id) VALUES ($1, $2)', [uid, socket.handshake.auth.mode_id], (err, result) => {
            if (err) {
              socket.emit('error', err.message);
              return socket.disconnect(true);
            }
            const a = new Promise((resolve, reject) => {
              waiting[uid] = {};
              waiting[uid].resolve = resolve;
              waiting[uid].reject = reject;
            }).then((game_id) => {
              return socket.emit('gameFound', game_id);
            });
            socket.emit('waiting');
          });
        } else {
          const opponent_uid = result.rows[0].uid;
          pool.query('DELETE FROM queue WHERE uid = $1', [opponent_uid], (err, result) => {
            if (err) {
              socket.emit('error', err.message);
              return socket.disconnect(true);
            }
            let num = Math.round(Math.random());
            let uid1 = num === 0 ? uid : opponent_uid;
            let uid2 = num === 0 ? opponent_uid : uid;
            pool.query(
              'INSERT INTO games (wuid, buid, mode_id) VALUES ($1, $2, $3) RETURNING game_id',
              [uid1, uid2, socket.handshake.auth.mode_id],
              (err, result) => {
                if (err) {
                  socket.emit('error', err.message);
                  waiting[opponent_uid].reject(err.message);
                  return socket.disconnect(true);
                }
                const game_id = result.rows[0].game_id;
                waiting[opponent_uid].resolve(game_id);
                return socket.emit('gameFound', game_id);
              }
            );
          });
        }
      });
    }
  );
  socket.on('disconnect', () => {
    pool.query('DELETE FROM queue WHERE uid = $1', [uid], (err, result) => {
      if (err) {
        console.log(err.message);
      }
    });
  });
});

io.of('/game').on('connection', (socket) => {
  let gameid = socket.handshake.auth.game_id;
  let session_key = socket.handshake.auth.session_key;
  if (!gameid || gameid == undefined || !session_key || session_key == undefined) {
    socket.emit('error', 'Invalid request');
    return socket.disconnect(true);
  }
  let color;
  let gameFound;
  let mode_id;
  let game = new Promise((resolve, reject) => {
    gameFound = resolve;
  }).then(async () => {
    const res = await fetch('http://web:8080/connect?game_id=' + gameid);
    const json = await res.json();
    if (json !== 'success') {
      socket.emit('error', 'Game not found');
      return socket.disconnect(true);
    }
    const internalManager = new Manager(`ws://web:8080`, {
      autoConnect: true,
      reconnection: false,
    });
    const internal = internalManager.socket(`/game-${gameid}`, {
      auth: {
        color: color,
      },
    });
    internal.on('move', (board) => {
      socket.emit('move', board);
    });
    internal.on('wait', (board) => {
      socket.emit('wait', board);
    });
    internal.on('take', (board) => {
      socket.emit('take', board);
    });
    internal.on('time', (time) => {
      socket.emit('time', time);
    });
    internal.on('history', (history) => {
      socket.emit('history', history);
    });
    internal.on('error', (error) => {
      socket.emit('error', error);
    });
    internal.on('draw?', () => {
      socket.emit('draw?');
    });
    internal.on('draw!', () => {
      socket.emit('draw!');
    });
    internal.on('message', (data) => {
      socket.emit('message', data);
    });
    internal.on('draw', (data, reason, notation) => {
      socket.emit('draw', data, reason, mode_id);
      if (mode_id !== 1) {
        pool.query('UPDATE games SET winner = $1, notation = $3 where game_id = $2', ['x', gameid, notation], (err, result) => {
          return socket.disconnect(true);
        });
      } else {
        pool.query(
          'SELECT (SELECT elo FROM users where uid = (SELECT wuid FROM games where game_id = $1)) as welo, (SELECT elo_visible FROM users where uid = (SELECT wuid FROM games where game_id = $1)) as welo_visible, (SELECT elo FROM users where uid = (SELECT buid FROM games where game_id = $1)) as belo, (SELECT elo_visible FROM users where uid = (SELECT buid FROM games where game_id = $1)) as belo_visible',
          [gameid],
          (err, result) => {
            if (err) {
              socket.emit('error', err.message);
              return socket.disconnect(true);
            }
            let welo = result.rows[0].welo;
            let belo = result.rows[0].belo;
            let welo_visible = result.rows[0].welo_visible;
            let belo_visible = result.rows[0].belo_visible;
            let newElo = elo.Elo(welo, belo);
            let newEloUnranked = elo.Elo(welo, belo, (kFactor = 40));
            let newWelo = Math.round(welo_visible ? newElo.w : newEloUnranked.w);
            let newBelo = Math.round(belo_visible ? newElo.b : newEloUnranked.b);
            pool.query(
              `UPDATE games SET winner = $1, welo = $2, belo = $3, notation = $5 WHERE game_id = $4`,
              ['x', newWelo, newBelo, gameid, notation],
              (err, result) => {
                if (err) {
                  socket.emit('error', err.message);
                }
                if (result.affectedRows === 0) {
                  socket.emit('error', 'Something went wrong');
                }
                pool.query(
                  `UPDATE users SET elo = $2 WHERE uid = (SELECT ${color}uid FROM games WHERE game_id = $1);`,
                  [gameid, color === 'w' ? newWelo : newBelo],
                  (err, result) => {
                    if (err) {
                      socket.emit('error', err.message);
                    }
                    if (result.affectedRows === 0) {
                      socket.emit('error', 'Something went wrong');
                    }
                    return socket.disconnect(true);
                  }
                );
              }
            );
          }
        );
      }
    });
    internal.on('lose', (data, reason) => {
      socket.emit('lose', data, reason, mode_id);
      socket.disconnect(true);
    });
    internal.on('win', (data, reason, notation) => {
      socket.emit('win', data, reason, mode_id);
      if (mode_id !== 1) {
        pool.query('UPDATE games SET winner = $1, notation = $3 WHERE game_id = $2', [color, gameid, notation], (err, result) => {
          return socket.disconnect(true);
        });
      } else {
        pool.query(
          'SELECT (SELECT elo FROM users where uid = (SELECT wuid FROM games where game_id = $1)) as welo, (SELECT elo_visible FROM users where uid = (SELECT wuid FROM games where game_id = $1)) as welo_visible, (SELECT elo FROM users where uid = (SELECT buid FROM games where game_id = $1)) as belo, (SELECT elo_visible FROM users where uid = (SELECT buid FROM games where game_id = $1)) as belo_visible',
          [gameid],
          (err, result) => {
            if (err) {
              socket.emit('error', err.message);
              return socket.disconnect(true);
            }
            let welo = result.rows[0].welo;
            let belo = result.rows[0].belo;
            let welo_visible = result.rows[0].welo_visible;
            let belo_visible = result.rows[0].belo_visible;
            let newElo = elo.Elo(welo, belo, (won = color));
            let newEloUnranked = elo.Elo(welo, belo, (won = color), (kFactor = 40));
            let newWelo = Math.round(welo_visible ? newElo.w : newEloUnranked.w);
            let newBelo = Math.round(belo_visible ? newElo.b : newEloUnranked.b);
            pool.query(
              `UPDATE games SET winner = $1, welo = $2, belo = $3, notation = $5 WHERE game_id = $4`,
              [color, newWelo, newBelo, gameid, notation],
              (err, result) => {
                if (err) {
                  socket.emit('error', err.message);
                }
                if (result.affectedRows === 0) {
                  socket.emit('error', 'Something went wrong');
                }
                pool.query(`UPDATE users SET elo = $2 WHERE uid = (SELECT wuid FROM games WHERE game_id = $1)`, [gameid, newWelo], (err, result) => {
                  if (err) {
                    socket.emit('error', err.message);
                  }
                  if (result.affectedRows === 0) {
                    socket.emit('error', 'Something went wrong');
                  }
                  pool.query(
                    `UPDATE users SET elo = $2 WHERE uid = (SELECT buid FROM games WHERE game_id = $1)`,
                    [gameid, newBelo],
                    (err, result) => {
                      if (err) {
                        socket.emit('error', err.message);
                      }
                      if (result.affectedRows === 0) {
                        socket.emit('error', 'Something went wrong');
                      }
                      return socket.disconnect(true);
                    }
                  );
                });
              }
            );
          }
        );
      }
    });
    socket.on('move', (move) => {
      internal.emit('move', move);
    });
    socket.on('take', (move) => {
      internal.emit('take', move);
    });
    socket.on('draw', (data) => {
      internal.emit('draw', data);
    });
    socket.on('draw!', (data) => {
      internal.emit('draw!', data);
    });
    socket.on('message', (data) => {
      internal.emit('message', data);
    });
    socket.on('lose', (data) => {
      internal.emit('lose', data);
    });
    socket.on('disconnect', (data) => {
      internal.disconnect();
    });
  });

  // ------------------------------ CHECK IF GAME EXISTS ------------------------------

  pool.query(
    "SELECT (SELECT uid from sessions where session_key = $1) as uid, wuid, buid, mode_id, wu.username as wusername, bu.username busername, wu.elo as wuelo, bu.elo as buelo, wu.elo_visible as welo_visible, bu.elo_visible as belo_visible, wu.country_code as wcountry, bu.country_code as bcountry, wp.image as wimage, bp.image as bimage FROM games JOIN users wu ON wuid = wu.uid JOIN users bu ON bu.uid = buid LEFT JOIN users_pictures wp ON wp.uid = wu.uid LEFT JOIN users_pictures bp ON bp.uid = bu.uid WHERE winner = 'playing' AND ( wuid = (SELECT uid from sessions where session_key = $1) OR buid = (SELECT uid from sessions where session_key = $1) ) AND game_id = $2",
    [session_key, gameid],
    (err, result) => {
      if (err) {
        socket.emit('connectionError', err.message);
        return socket.disconnect(true);
      }
      if (result.rows.length == 0) {
        socket.emit('connectionError', 'Game not found');
        return socket.disconnect(true);
      }
      mode_id = result.rows[0].mode_id;
      color = result.rows[0].wuid === result.rows[0].uid ? 'w' : 'b';
      socket.emit('color', color);
      let opponent = {
        uid: color === 'w' ? result.rows[0].buid : result.rows[0].wuid,
        username: color === 'w' ? result.rows[0].busername : result.rows[0].wusername,
        country_code: color === 'w' ? result.rows[0].bcountry : result.rows[0].wcountry,
        image: color === 'w' ? result.rows[0].bimage : result.rows[0].wimage,
      };
      if (color === 'w' ? result.rows[0].belo_visible : result.rows[0].welo_visible) {
        opponent.elo = color === 'w' ? result.rows[0].buelo : result.rows[0].wuelo;
      }
      socket.emit('opponent', opponent);
      gameFound();
    }
  );
});

process.on('uncaughtException', (err, origin) => {
  console.log(`Caught exception: ${err}\n` + `Exception origin: ${origin}`);
});

const port = process.env.PORT || 8080;
server.listen(port, () => console.log(`listening to port ${port}`));
