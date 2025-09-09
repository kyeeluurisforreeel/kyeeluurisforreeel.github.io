import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getDatabase, ref, set, get, onValue, update, push } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyAQP69YyTZQVLS9oJmSDbE5OeRq2gADhjM",
  authDomain: "chess-cshollll.firebaseapp.com",
  databaseURL: "https://chess-cshollll-default-rtdb.firebaseio.com",
  projectId: "chess-cshollll",
  storageBucket: "chess-cshollll.firebasestorage.app",
  messagingSenderId: "968075449164",
  appId: "1:968075449164:web:96f32adbb019730e74f5e9",
  measurementId: "G-8YB2Z9VJXQ"
};


const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export async function createMatch(code, fen, playerId) {
  await set(ref(db, `matches/${code}`), {
    fen,
    turn: 'w',
    players: { white: playerId, black: null },
    moves: [],
    status: 'waiting'
  });
}

export async function joinMatch(code, playerId) {
  const matchRef = ref(db, `matches/${code}`);
  const snapshot = await get(matchRef);
  if (!snapshot.exists()) throw new Error('Match not found');
  const data = snapshot.val();

  const players = data.players || {};
  if (players.white === playerId || players.black === playerId) return data;
  if (!players.white) {
    await update(matchRef, { 'players/white': playerId, status: 'playing' });
    players.white = playerId;
  } else if (!players.black) {
    await update(matchRef, { 'players/black': playerId, status: 'playing' });
    players.black = playerId;
  } else {
    throw new Error('Match full');
  }
  return { ...data, players };
}

export function onMatchUpdates(code, callback) {
  const matchRef = ref(db, `matches/${code}`);
  onValue(matchRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback(snapshot.val());
  });
}

export async function submitMove(code, fen, turn, san) {
  const matchRef = ref(db, `matches/${code}`);
  const snapshot = await get(matchRef);
  const data = snapshot.val() || {};
  const moves = data.moves || [];
  moves.push(san);
  await update(matchRef, { fen, turn, moves, status: 'playing' });
}

export async function setResigned(code, winnerColor) {
  const matchRef = ref(db, `matches/${code}`);
  await update(matchRef, { status: 'ended', winner: winnerColor });
}
