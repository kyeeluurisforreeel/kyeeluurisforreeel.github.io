import { createMatch, joinMatch, onMatchUpdates, submitMove, setResigned } from './firebase.js';

const playerIdKey = 'fc_player_id_v1';
let playerId = localStorage.getItem(playerIdKey);
if (!playerId) { playerId = crypto.randomUUID(); localStorage.setItem(playerIdKey, playerId); }

const chess = new Chess();
let board = null;
let currentMatch = null;
let yourColor = null;
let matchTime = 5; // default minutes

// Elements
const showCreate = document.getElementById('showCreate');
const showJoin = document.getElementById('showJoin');
const createUI = document.getElementById('createUI');
const joinUI = document.getElementById('joinUI');
const boardContainer = document.getElementById('boardContainer');
const createBtn = document.getElementById('createBtn');
const joinBtn = document.getElementById('joinBtn');
const colorSelect = document.getElementById('colorSelect');
const timeInput = document.getElementById('timeInput');
const codeInput = document.getElementById('codeInput');
const matchCodeEl = document.getElementById('matchCode');
const yourColorEl = document.getElementById('yourColor');
const turnDisplay = document.getElementById('turnDisplay');
const statusText = document.getElementById('statusText');
const matchStatusEl = document.getElementById('matchStatus');
const moveListEl = document.getElementById('moveList');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const resignBtn = document.getElementById('resignBtn');

function generateCode() { return Math.floor(100000 + Math.random() * 900000).toString(); }

function showMenu(create=false, join=false) {
  createUI.classList.toggle('hidden', !create);
  joinUI.classList.toggle('hidden', !join);
  boardContainer.classList.add('hidden');
}

showCreate.addEventListener('click', () => showMenu(true, false));
showJoin.addEventListener('click', () => showMenu(false, true));

function setupBoard() {
  if (board) return;
  board = Chessboard('board', {
    draggable: true,
    position: 'start',
    onDragStart: (src, piece) => {
      if (!currentMatch) return false;
      const color = piece[0] === 'w' ? 'w' : 'b';
      if (color !== yourColor) return false;
      if (chess.turn() !== yourColor) return false;
    },
    onDrop: async (source, target) => {
      const move = chess.move({ from: source, to: target, promotion: 'q' });
      if (!move) return 'snapback';
      if (!currentMatch) return 'snapback';
      if (yourColor !== move.color) return 'snapback';
      await submitMove(currentMatch, chess.fen(), chess.turn(), move.san);
      updateUIFromState();
    },
    onSnapEnd: () => { board.position(chess.fen()); }
  });
}

function updateUIFromState(matchData) {
  matchCodeEl.textContent = currentMatch || '—';
  yourColorEl.textContent = yourColor === 'w' ? 'White' : yourColor === 'b' ? 'Black' : '—';
  turnDisplay.textContent = chess.turn() === 'w' ? 'White' : 'Black';
  matchStatusEl.textContent = matchData?.status || '—';
  statusText.textContent = currentMatch ? `Connected to ${currentMatch}` : 'Not connected';
  moveListEl.innerHTML = '';
  const moves = (matchData && matchData.moves) || [];
  moves.forEach((m) => {
    const li = document.createElement('li'); li.textContent = m; moveListEl.appendChild(li);
  });
}

createBtn.addEventListener('click', async () => {
  try {
    const chosenColor = colorSelect.value;
    matchTime = parseInt(timeInput.value) || 5;
    setupBoard();
    const code = generateCode();
    currentMatch = code;
    yourColor = chosenColor;
    chess.reset();
    board.position('start');
    await createMatch(code, chess.fen(), playerId);
    matchCodeEl.textContent = code;
    yourColorEl.textContent = yourColor === 'w' ? 'White' : 'Black';
    statusText.textContent = `Waiting for opponent...`;
    boardContainer.classList.remove('hidden');
    startListening(code);
  } catch(e){ alert(e.message || e); }
});

joinBtn.addEventListener('click', async () => {
  const code = (codeInput.value || '').trim();
  if (!code) return alert('Enter a match code');
  try {
    setupBoard();
    const data = await joinMatch(code, playerId);
    currentMatch = code;
    const players = data.players || {};
    yourColor = players.white === playerId ? 'w' : 'b';
    chess.load(data.fen || 'start');
    board.position(chess.fen());
    boardContainer.classList.remove('hidden');
    updateUIFromState(data);
    startListening(code);
    statusText.textContent = `Joined ${code}`;
  } catch(e){ alert(e.message || e); }
});

copyLinkBtn.addEventListener('click', () => {
  if (!currentMatch) return alert('No match to copy');
  const url = `${location.origin}${location.pathname}?code=${currentMatch}`;
  navigator.clipboard.writeText(url).then(()=>alert('Match link copied'));
});

resignBtn.addEventListener('click', async () => {
  if (!currentMatch) return;
  const winner = yourColor === 'w' ? 'b' : 'w';
  await setResigned(currentMatch, winner);
  alert('You resigned');
});

function startListening(code) {
  if (!code) return;
  onMatchUpdates(code, (data) => {
    if (!data) { statusText.textContent = 'Match deleted'; return; }
    if (data.fen !== chess.fen()) { chess.load(data.fen); if(board) board.position(chess.fen()); }
    updateUIFromState(data);
  });
}

window.addEventListener('load', () => {
  setupBoard();
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  if (code) { codeInput.value = code; joinBtn.click(); }
});
