(() => {
  const SIZE = 20;
  const MINES = 80;
  const minefield = document.querySelector('#minefield');
  const status = document.querySelector('#game-status');
  const flagCount = document.querySelector('#flag-count');
  const newGameButton = document.querySelector('#new-game');
  const resetButton = document.querySelector('#game-reset');
  const timer = document.querySelector('#game-timer');
  const hintButton = document.querySelector('#hint-button');

  if (!minefield || !status || !flagCount || !newGameButton || !resetButton || !timer || !hintButton) return;

  let board;
  let started;
  let gameOver;
  let flags;
  let startedAt;
  let timerId;
  let hints;

  const indexOf = (row, col) => row * SIZE + col;
  const inBounds = (row, col) => row >= 0 && row < SIZE && col >= 0 && col < SIZE;
  const neighbors = (row, col) => {
    const cells = [];
    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
        if ((rowOffset || colOffset) && inBounds(row + rowOffset, col + colOffset)) {
          cells.push(board[indexOf(row + rowOffset, col + colOffset)]);
        }
      }
    }
    return cells;
  };

  const updateCounter = () => { flagCount.textContent = `지뢰 ${MINES - flags}`; };

  const updateTimer = () => {
    const elapsed = startedAt ? Math.min(999, Math.floor((Date.now() - startedAt) / 1000)) : 0;
    timer.textContent = `시간 ${String(elapsed).padStart(3, '0')}`;
  };

  const stopTimer = () => {
    window.clearInterval(timerId);
    timerId = undefined;
  };

  const updateHints = () => {
    hintButton.textContent = `힌트 ${hints}`;
    hintButton.disabled = hints === 0 || gameOver;
  };

  const placeMines = (safeIndex) => {
    const candidates = Array.from({ length: SIZE * SIZE }, (_, index) => index)
      .filter((index) => index !== safeIndex);
    for (let index = candidates.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [candidates[index], candidates[randomIndex]] = [candidates[randomIndex], candidates[index]];
    }
    candidates.slice(0, MINES).forEach((index) => { board[index].mine = true; });
    board.forEach((cell) => { cell.number = neighbors(cell.row, cell.col).filter((neighbor) => neighbor.mine).length; });
  };

  const renderCell = (cell) => {
    cell.element.classList.toggle('is-open', cell.open);
    cell.element.classList.toggle('is-flagged', cell.flagged);
    cell.element.classList.toggle('is-mine', gameOver && cell.mine);
    cell.element.textContent = cell.flagged ? '⚑' : (cell.open && cell.mine ? '✹' : (cell.open && cell.number ? cell.number : ''));
    if (cell.open && cell.number) cell.element.dataset.number = String(cell.number);
    else delete cell.element.dataset.number;
    cell.element.setAttribute('aria-label', cell.flagged ? '깃발 표시된 칸' : (cell.open ? (cell.mine ? '지뢰' : `${cell.number}개의 지뢰가 인접한 칸`) : '닫힌 칸'));
  };

  const reveal = (cell) => {
    if (gameOver || cell.flagged || cell.open) return;
    if (!started) {
      started = true;
      startedAt = Date.now();
      placeMines(cell.index);
      timerId = window.setInterval(updateTimer, 1000);
      status.textContent = '지뢰를 피해서 모든 안전한 칸을 여세요.';
    }
    cell.open = true;
    renderCell(cell);
    if (!cell.mine && cell.number === 0) neighbors(cell.row, cell.col).forEach(reveal);
    if (cell.mine) {
      gameOver = true;
      stopTimer();
      status.textContent = '지뢰를 밟았습니다. 새 게임으로 다시 시작하세요.';
      board.forEach(renderCell);
      updateHints();
    } else if (board.filter((item) => !item.mine && !item.open).length === 0) {
      gameOver = true;
      stopTimer();
      status.textContent = '축하합니다! 모든 안전한 칸을 열었습니다.';
      updateHints();
    }
  };

  const toggleFlag = (cell) => {
    if (gameOver || cell.open) return;
    if (!cell.flagged && flags >= MINES) return;
    cell.flagged = !cell.flagged;
    flags += cell.flagged ? 1 : -1;
    renderCell(cell);
    updateCounter();
  };

  const useHint = () => {
    if (gameOver || hints === 0) return;
    if (!started) {
      status.textContent = '첫 칸을 연 뒤 힌트를 사용할 수 있습니다.';
      return;
    }
    const candidates = board.filter((cell) => !cell.open && !cell.flagged && !cell.mine);
    if (!candidates.length) return;
    const cell = candidates[Math.floor(Math.random() * candidates.length)];
    hints -= 1;
    reveal(cell);
    if (!gameOver) status.textContent = `힌트를 사용했습니다. 남은 힌트 ${hints}회.`;
    updateHints();
  };

  const startGame = () => {
    board = Array.from({ length: SIZE * SIZE }, (_, index) => ({
      index, row: Math.floor(index / SIZE), col: index % SIZE, mine: false, number: 0, open: false, flagged: false, element: null,
    }));
    started = false;
    gameOver = false;
    flags = 0;
    hints = 3;
    startedAt = undefined;
    stopTimer();
    resetButton.textContent = '🙂';
    minefield.replaceChildren();
    board.forEach((cell) => {
      const element = document.createElement('button');
      element.className = 'mine-cell';
      element.type = 'button';
      element.setAttribute('role', 'gridcell');
      element.setAttribute('aria-label', '닫힌 칸');
      element.addEventListener('click', () => {
        if (cell.suppressClick) { cell.suppressClick = false; return; }
        reveal(cell);
      });
      element.addEventListener('contextmenu', (event) => { event.preventDefault(); toggleFlag(cell); });
      element.addEventListener('keydown', (event) => {
        if (event.key.toLowerCase() === 'f') { event.preventDefault(); toggleFlag(cell); }
      });
      let pressTimer;
      element.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'touch') {
          pressTimer = window.setTimeout(() => {
            cell.suppressClick = true;
            toggleFlag(cell);
          }, 500);
        }
      });
      element.addEventListener('pointerup', () => window.clearTimeout(pressTimer));
      element.addEventListener('pointerleave', () => window.clearTimeout(pressTimer));
      cell.element = element;
      minefield.append(element);
    });
    updateCounter();
    updateTimer();
    updateHints();
    status.textContent = '첫 칸을 열어 게임을 시작하세요.';
  };

  newGameButton.addEventListener('click', startGame);
  resetButton.addEventListener('click', startGame);
  hintButton.addEventListener('click', useHint);
  startGame();
})();
