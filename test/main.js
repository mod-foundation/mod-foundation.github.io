// Question Bank Storage
const questionBank = {};

// Shuffle Cards Storage
const shuffleCards = [];

// Rapid Fire Questions Storage
const rapidFireQuestions = [];

// Parse CSV data
function parseCSV(text) {
  const lines = text.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;

    const values = [];
    let current = '';
    let inQuotes = false;

    for (let char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }

  return data;
}

// Load questions from CSV file
async function loadQuestionBank() {
  try {
    const response = await fetch('./collateral/questions/question-bank.csv');
    const text = await response.text();

    // Parse CSV
    const data = parseCSV(text);

    // Parse and store questions by code
    // Expected CSV columns: category, round, question number, code, question, clue, answer, location bonus
    data.forEach(row => {
      const questionId = row['code'];
      if (questionId) {
        const clueFilename = row['clue'];
        const locationBonus = row['location bonus'] && row['location bonus'].trim().toLowerCase() === 'true';

        questionBank[questionId] = {
          question: row['question'],
          clueImage: clueFilename ? clueFilename.trim() : '', // Trim whitespace from filename
          answer: row['answer'],
          hasLocationBonus: locationBonus
        };

        // Log if clue image is present
        if (clueFilename) {
          console.log(`Question ${questionId}: Clue image = ${clueFilename.trim()}, Location bonus = ${locationBonus}`);
        }
      }
    });

    console.log('Question bank loaded:', questionBank);
  } catch (error) {
    console.error('Error loading question bank:', error);
  }
}

// Load shuffle cards from CSV file
async function loadShuffleCards() {
  try {
    const response = await fetch('./collateral/questions/city-shuffle.csv');
    const text = await response.text();

    // Parse CSV
    const data = parseCSV(text);

    // Store shuffle cards
    // Expected CSV columns: id, effect, detail, icon
    data.forEach(row => {
      if (row['id'] && row['effect']) {
        shuffleCards.push({
          id: row['id'],
          effect: row['effect'],
          detail: row['detail'],
          icon: row['icon'] || ''
        });
      }
    });

    console.log('Shuffle cards loaded:', shuffleCards);
  } catch (error) {
    console.error('Error loading shuffle cards:', error);
  }
}

// Load rapid fire questions from CSV file
async function loadRapidFireQuestions() {
  try {
    const response = await fetch('./collateral/questions/rapid-fire-bank.csv');
    const text = await response.text();

    // Parse CSV
    const data = parseCSV(text);

    // Store rapid fire questions
    // Expected CSV columns: id, no, bucket, question, answer
    data.forEach(row => {
      if (row['id'] && row['bucket'] && row['question']) {
        rapidFireQuestions.push({
          id: row['id'],
          no: row['no'],
          bucket: row['bucket'],
          question: row['question'],
          answer: row['answer']
        });
      }
    });

    console.log('Rapid fire questions loaded:', rapidFireQuestions);
  } catch (error) {
    console.error('Error loading rapid fire questions:', error);
  }
}

// Timer State
const timerState = {
  seconds: 25,
  intervalId: null,
  isRunning: false
};

// Game State
const gameState = {
  currentRound: 1, // Rounds 1-4 correspond to timeline columns, 5 is Rapid Fire
  currentTeam: null, // Index 0-4 for teams A-E, null means no team selected
  teams: [
    { id: 'team-a', name: 'Team A', score: 10 },
    { id: 'team-b', name: 'Team B', score: 10 },
    { id: 'team-c', name: 'Team C', score: 10 },
    { id: 'team-d', name: 'Team D', score: 10 },
    { id: 'team-e', name: 'Team E', score: 10 }
  ],
  answeredQuestions: new Set(),
  currentQuestionId: null,
  isFloorMode: false, // Tracks if question is open to the floor
  selectedTeamForFloor: null, // Tracks which team is selected during floor mode
  actionHistory: [], // Stack to track actions for undo
  turnsThisRound: 0, // Track how many turns have been taken this round
  currentClueImage: null, // Store current clue image path
  clueUsed: false, // Track if clue was used for current question
  selectedShuffleCard: null, // Store the selected shuffle card
  shuffleUsed: false, // Track if shuffle has been used for current question
  rapidFire: {
    active: false,
    currentBucket: null, // rb1-rb5 based on team
    currentTeamIndex: null,
    currentQuestionIndex: 0,
    questions: [],
    score: 0,
    waitingForTeamSelection: false
  }
};

// Save/Load Game Functions
function saveGame() {
  const saveData = {
    currentRound: gameState.currentRound,
    currentTeam: gameState.currentTeam,
    teams: gameState.teams,
    answeredQuestions: Array.from(gameState.answeredQuestions),
    turnsThisRound: gameState.turnsThisRound,
    timerSeconds: timerState.seconds,
    timestamp: new Date().toISOString()
  };

  localStorage.setItem('walkOnBengaluruSave', JSON.stringify(saveData));
  console.log('Game saved:', saveData);
  return true;
}

function loadGame() {
  const savedData = localStorage.getItem('walkOnBengaluruSave');
  if (!savedData) return false;

  try {
    const saveData = JSON.parse(savedData);

    gameState.currentRound = saveData.currentRound;
    gameState.currentTeam = saveData.currentTeam;
    gameState.teams = saveData.teams;
    gameState.answeredQuestions = new Set(saveData.answeredQuestions);
    gameState.turnsThisRound = saveData.turnsThisRound;
    timerState.seconds = saveData.timerSeconds || 25;

    // Restore team order in DOM
    restoreTeamOrder();

    console.log('Game loaded:', saveData);
    return true;
  } catch (error) {
    console.error('Error loading game:', error);
    return false;
  }
}

function restoreTeamOrder() {
  const container = document.getElementById('teams-counter-container');
  const teamItems = Array.from(container.querySelectorAll('.team-item'));

  // Create a map of team IDs to their DOM elements
  const teamElementMap = {};
  teamItems.forEach(item => {
    const teamLabel = item.querySelector('.team-label');
    if (teamLabel) {
      teamElementMap[teamLabel.id] = item;
    }
  });

  // Clear container
  container.innerHTML = '';

  // Re-append in correct order based on gameState.teams
  gameState.teams.forEach((team, index) => {
    const teamElement = teamElementMap[team.id];
    if (teamElement) {
      container.appendChild(teamElement);
      // Update order number
      const orderInput = teamElement.querySelector('.team-order-number');
      if (orderInput) {
        orderInput.value = index + 1;
      }
    }
  });
}

function hasSavedGame() {
  return localStorage.getItem('walkOnBengaluruSave') !== null;
}

function clearSavedGame() {
  localStorage.removeItem('walkOnBengaluruSave');
  console.log('Saved game cleared');
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async function() {

  // Load question bank on page load
  await loadQuestionBank();

  // Load shuffle cards on page load
  await loadShuffleCards();

  // Load rapid fire questions on page load
  await loadRapidFireQuestions();

  // Check if there's a saved game and show resume button
  if (hasSavedGame()) {
    document.getElementById('resumeGame');
  }

  // New Game Button Handler
  document.getElementById('newGame').addEventListener('click', function() {
    // Clear any saved game
    clearSavedGame();

    // Hide start screen
    document.getElementById('start-screen').classList.add('hidden');

    // Show game board
    document.getElementById('game-board').classList.remove('hidden');

    // Initialize game
    initializeGame();
  });

  // Resume Game Button Handler
  document.getElementById('resumeGame').addEventListener('click', function() {
    // Load saved game
    if (loadGame()) {
      // Hide start screen
      document.getElementById('start-screen').classList.add('hidden');

      // Show game board
      document.getElementById('game-board').classList.remove('hidden');

      // Initialize game with loaded state
      initializeGame();
    } else {
      alert('Failed to load saved game. Starting a new game.');
      document.getElementById('newGame').click();
    }
  });

  // Save Game Button Handler
  document.getElementById('save-game').addEventListener('click', function() {
    if (saveGame()) {
      // Visual feedback
      this.textContent = 'Saved!';
      setTimeout(() => {
        this.textContent = 'Save';
      }, 2000);
    }
  });

  // Timer Button Handlers
  document.getElementById('timer-start').addEventListener('click', function() {
    startTimer();
  });

  document.getElementById('timer-reset').addEventListener('click', function() {
    resetTimer();
  });

  // Timer Countdown Editable Handler
  const timerCountdown = document.getElementById('timer-countdown');

  // When user clicks on timer, select all text for easy editing
  timerCountdown.addEventListener('focus', function() {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(this);
    selection.removeAllRanges();
    selection.addRange(range);
  });

  // When user finishes editing, parse and update timer
  timerCountdown.addEventListener('blur', function() {
    parseAndUpdateTimer(this.textContent);
  });

  // Handle Enter key to blur and apply changes
  timerCountdown.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.blur();
    }
  });

  function parseAndUpdateTimer(timeString) {
    // Parse time string in format MM:SS or M:SS or just SS
    const parts = timeString.trim().split(':');
    let minutes = 0;
    let seconds = 0;

    if (parts.length === 2) {
      // MM:SS format
      minutes = parseInt(parts[0]) || 0;
      seconds = parseInt(parts[1]) || 0;
    } else if (parts.length === 1) {
      // Just seconds
      seconds = parseInt(parts[0]) || 0;
    }

    // Calculate total seconds
    const totalSeconds = (minutes * 60) + seconds;

    // Update timer state
    if (totalSeconds >= 0 && totalSeconds <= 5999) { // Max 99:59
      timerState.seconds = totalSeconds;
      updateTimerDisplay();
    } else {
      // Invalid input, reset to current value
      updateTimerDisplay();
    }
  }

  // Initialize Game
  function initializeGame() {
    // Initialize team scores in UI
    gameState.teams.forEach((team, index) => {
      const teamElement = document.getElementById(team.id);
      const scoreElement = teamElement.querySelector('.score');
      if (scoreElement) {
        scoreElement.textContent = team.score;
      }
    });

    updateRoundHighlight();
    enableTeamSelection(); // Enable team selection at start
    updateActiveColumns();
    updateTimerDisplay();
    initializeTeamOrderNumbers(); // Initialize order number inputs
  }

  // Team Order Number Functionality
  function initializeTeamOrderNumbers() {
    const orderInputs = document.querySelectorAll('.team-order-number');

    orderInputs.forEach(input => {
      input.addEventListener('change', function() {
        handleOrderChange(this);
      });

      // Prevent scrolling when focused
      input.addEventListener('wheel', function(e) {
        e.preventDefault();
      });

      // Select text on focus for easy editing
      input.addEventListener('focus', function() {
        this.select();
      });
    });
  }

  function handleOrderChange(input) {
    let newOrder = parseInt(input.value);

    // Get team ID from parent team-item
    const teamItem = input.closest('.team-item');
    const teamId = teamItem.dataset.teamId;

    // Validate input
    if (isNaN(newOrder) || newOrder < 1 || newOrder > 5) {
      // Reset to current position
      const currentPosition = getCurrentTeamPosition(teamId);
      input.value = currentPosition + 1;
      return;
    }

    // Convert to 0-based index
    const newPosition = newOrder - 1;
    const currentPosition = getCurrentTeamPosition(teamId);

    if (newPosition === currentPosition) {
      return; // No change
    }

    // Reorder teams
    reorderTeams(currentPosition, newPosition);

    // Update all order numbers
    updateAllOrderNumbers();

    // Save game
    saveGame();

    console.log('Teams reordered:', gameState.teams.map(t => t.name));
  }

  function getCurrentTeamPosition(teamId) {
    return gameState.teams.findIndex(team => team.id === teamId);
  }

  function reorderTeams(fromIndex, toIndex) {
    const container = document.getElementById('teams-counter-container');
    const teamItems = Array.from(container.querySelectorAll('.team-item'));

    // Reorder in gameState
    const movedTeam = gameState.teams.splice(fromIndex, 1)[0];
    gameState.teams.splice(toIndex, 0, movedTeam);

    // Reorder in DOM
    const movedItem = teamItems[fromIndex];
    container.removeChild(movedItem);

    if (toIndex >= teamItems.length - 1) {
      container.appendChild(movedItem);
    } else {
      const referenceItem = teamItems[toIndex];
      container.insertBefore(movedItem, referenceItem);
    }
  }

  function updateAllOrderNumbers() {
    const container = document.getElementById('teams-counter-container');
    const teamItems = Array.from(container.querySelectorAll('.team-item'));

    teamItems.forEach((item, index) => {
      const orderInput = item.querySelector('.team-order-number');
      orderInput.value = index + 1;
    });
  }

  // Enable team selection
  function enableTeamSelection() {
    document.querySelectorAll('.team-label').forEach((team, index) => {
      team.classList.add('selectable');
      team.style.cursor = 'pointer';
    });
  }

  // Timer Functions
  function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer-countdown');
    const minutes = Math.floor(timerState.seconds / 60);
    const seconds = timerState.seconds % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Add blinking effect when timer reaches 5 seconds or less
    if (timerState.seconds <= 5 && timerState.seconds >= 0) {
      timerDisplay.classList.add('timer-blink');
    } else {
      timerDisplay.classList.remove('timer-blink');
    }
  }

  function startTimer(customSeconds) {
    if (timerState.isRunning) return;

    // If custom seconds provided, set timer to that value first
    if (customSeconds !== undefined) {
      timerState.seconds = customSeconds;
      updateTimerDisplay();
    }

    timerState.isRunning = true;
    timerState.intervalId = setInterval(() => {
      if (timerState.seconds > 0) {
        timerState.seconds--;
        updateTimerDisplay();
      } else {
        // Timer reached 0, stop but keep blinking
        stopTimer();
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerState.intervalId) {
      clearInterval(timerState.intervalId);
      timerState.intervalId = null;
    }
    timerState.isRunning = false;
  }

  function resetTimer() {
    stopTimer();
    timerState.seconds = 25;
    updateTimerDisplay();
  }

  // Update Round Highlight in Timeline
  function updateRoundHighlight() {
    // Remove active class from all timeline buttons
    document.querySelectorAll('.timeline-button').forEach(btn => {
      btn.classList.remove('active');
    });

    // Add active class to current round button
    const roundButton = document.getElementById(`t${gameState.currentRound}`);
    if (roundButton) {
      roundButton.classList.add('active');
    }

    // Auto-save after round change
    saveGame();
  }

  // Update Team Highlight
  function updateTeamHighlight() {
    // Remove active class from all teams
    document.querySelectorAll('.team-label').forEach(team => {
      team.classList.remove('active-team');
    });

    // Add active class to current team if one is selected
    if (gameState.currentTeam !== null) {
      const currentTeamId = gameState.teams[gameState.currentTeam].id;
      const teamElement = document.getElementById(currentTeamId);
      if (teamElement) {
        teamElement.classList.add('active-team');
      }
    }
  }

  // Update Active Columns based on current round
  function updateActiveColumns() {
    const allTiles = document.querySelectorAll('.question-tile');
    const currentTimelineId = `t${gameState.currentRound}`;

    allTiles.forEach(tile => {
      const tileTimeline = tile.dataset.timeline;
      const tileId = tile.id;

      // Check if question is already answered
      if (gameState.answeredQuestions.has(tileId)) {
        tile.classList.add('answered');
        tile.style.pointerEvents = 'none';
      } else if (tileTimeline === currentTimelineId) {
        // Active column
        tile.classList.add('active-tile');
        tile.classList.remove('inactive-tile');
        tile.style.pointerEvents = 'auto';
      } else {
        // Inactive columns
        tile.classList.remove('active-tile');
        tile.classList.add('inactive-tile');
        tile.style.pointerEvents = 'none';
      }
    });
  }

  // Update Team Score Display
  function updateScore(teamIndex, points) {
    gameState.teams[teamIndex].score += points;
    const teamElement = document.getElementById(gameState.teams[teamIndex].id);
    const scoreElement = teamElement.querySelector('.score');
    if (scoreElement) {
      scoreElement.textContent = gameState.teams[teamIndex].score;
    }
    // Auto-save after score change
    saveGame();
  }

  // Move to Next Team
  function nextTeam() {
    gameState.currentTeam = (gameState.currentTeam + 1) % gameState.teams.length;
    gameState.turnsThisRound++;

    // Check if all teams have had a turn this round
    if (gameState.turnsThisRound >= gameState.teams.length) {
      // Move to next round
      if (gameState.currentRound < 5) {
        gameState.currentRound++;
        gameState.turnsThisRound = 0;
        updateRoundHighlight();
        updateActiveColumns();
      }
    }

    updateTeamHighlight();
  }

  // Save action to history
  function saveAction(action) {
    gameState.actionHistory.push(action);
  }

  // Team Selection Handlers - for selecting team before question
  document.querySelectorAll('.team-label').forEach((teamElement) => {
    teamElement.addEventListener('click', function() {
      // Find the actual index of this team in the current order
      const teamId = this.id;
      const actualIndex = gameState.teams.findIndex(team => team.id === teamId);

      if (actualIndex === -1) {
        console.error('Team not found:', teamId);
        return;
      }

      // In floor mode, different behavior
      if (gameState.isFloorMode) {
        // Deselect all teams
        document.querySelectorAll('.team-label').forEach(team => {
          team.classList.remove('selected-for-floor');
        });

        // Select this team
        this.classList.add('selected-for-floor');
        gameState.selectedTeamForFloor = actualIndex;
        return;
      }

      // Normal mode: select team for their turn
      // Select this team
      gameState.currentTeam = actualIndex;
      updateTeamHighlight();

      console.log(`Selected team: ${gameState.teams[actualIndex].name}`);
    });
  });

  // Question Tile Click Handler
  const tiles = document.querySelectorAll('.question-tile');
  tiles.forEach(function(tile) {
    tile.addEventListener('click', function() {
      // Only allow clicking if tile is active
      if (!this.classList.contains('active-tile')) {
        return;
      }

      // Check if a team is selected
      if (gameState.currentTeam === null) {
        alert('Please select a team first!');
        return;
      }

      // Get question data
      const category = this.dataset.category;
      const timeline = this.dataset.timeline;
      const question = this.dataset.question;
      const questionId = this.id;

      // Store current question
      gameState.currentQuestionId = questionId;

      // Get elements
      const questionGrid = document.getElementById('question-grid');
      const questionDisplay = document.getElementById('question-display');

      // Hide question grid
      questionGrid.classList.add('hidden');

      // Show question display
      questionDisplay.classList.remove('hidden');

      // Reset timer (timer will be started manually by clicking Start button)
      resetTimer();

      // Reset reveal states
      document.getElementById('qd-answer-content').classList.remove('revealed');

      // Reset clue state
      gameState.clueUsed = false;
      const clueButton = document.getElementById('show-clue');
      clueButton.classList.remove('clue-used');
      clueButton.disabled = false;
      document.getElementById('qd-clue-status').textContent = '';

      // Get question data from question bank
      const questionData = questionBank[questionId];

      if (questionData) {
        // Update question display with real data
        document.getElementById('qd-question-text').textContent = questionData.question;
        document.getElementById('qd-answer-text').textContent = questionData.answer;

        // Clear previous clue image from DOM to prevent old image from showing
        const clueImageElement = document.getElementById('clue-image');
        clueImageElement.src = '';
        clueImageElement.onerror = null;
        clueImageElement.onload = null;

        // Store clue image path
        if (questionData.clueImage) {
          gameState.currentClueImage = `./collateral/clues/${questionData.clueImage}`;
          console.log(`Clue image path set: ${gameState.currentClueImage}`);
        } else {
          gameState.currentClueImage = null;
          console.log('No clue image available for this question');
        }

        // Show/hide location badge based on hasLocationBonus
        const locationBadge = document.getElementById('qd-location-badge');
        if (questionData.hasLocationBonus) {
          locationBadge.classList.remove('hidden-row');
        } else {
          locationBadge.classList.add('hidden-row');
        }

        // Show/hide shuffle badge based on round (only show in t3 and t4)
        const shuffleBadge = document.getElementById('qd-shuffle-badge');
        if (timeline === 't3' || timeline === 't4') {
          shuffleBadge.classList.remove('hidden-row');
        } else {
          shuffleBadge.classList.add('hidden-row');
        }

        // Reset shuffle state for new question
        gameState.shuffleUsed = false;
        gameState.selectedShuffleCard = null;
        shuffleBadge.classList.remove('used');
        shuffleBadge.innerHTML = `
          <div class="qd-badge-icon"><img src="/collateral/png/1x/shuffle-card.png"></div>
        `;
      } else {
        // Fallback if question not found
        document.getElementById('qd-question-text').textContent = `Question ID: ${questionId}`;
        document.getElementById('qd-answer-text').textContent = 'Answer not available';
        gameState.currentClueImage = null;

        // Hide location badge
        document.getElementById('qd-location-badge').classList.add('hidden-row');

        // Hide shuffle badge
        document.getElementById('qd-shuffle-badge').classList.add('hidden-row');

        console.log(`Question not found in bank: ${questionId}`);
      }

      // Update badge text and icon based on category
   
      const categoryIcons = {
        'c': '/collateral/png/1x/culture-card.png',
        'u': '/collateral/png/1x/urban-card.png',
        'e': '/collateral/png/1x/ecology-card.png',
        'g': '/collateral/png/1x/governance-card.png'
      };

      document.getElementById('qd-question-icon').src = categoryIcons[category] || '/collateral/png/1x/culture-card.png';
    });
  });

  // Show Clue Button Handler
  document.getElementById('show-clue').addEventListener('click', function() {
    if (!gameState.clueUsed && gameState.currentClueImage) {
      // Deduct 5 points from current team
      const currentTeamIndex = gameState.currentTeam;
      updateScore(currentTeamIndex, -5);

      // Save action to history for undo
      saveAction({
        type: 'clue-used',
        teamIndex: currentTeamIndex,
        points: -5
      });

      // Mark clue as used
      gameState.clueUsed = true;
      this.classList.add('clue-used');
      this.disabled = true;
      document.getElementById('qd-clue-status').textContent = 'Clue used (-5 points)';

      // Show the clue image overlay
      const clueImageElement = document.getElementById('clue-image');
      clueImageElement.src = gameState.currentClueImage;

      // Add error handler for image loading
      clueImageElement.onerror = function() {
        console.error(`Failed to load clue image: ${gameState.currentClueImage}`);
        alert(`Unable to load clue image. Please check if the file exists at: ${gameState.currentClueImage}`);
      };

      clueImageElement.onload = function() {
        console.log(`Clue image loaded successfully: ${gameState.currentClueImage}`);
      };

      document.getElementById('clue-overlay').classList.remove('hidden');

      console.log(`Clue used: Deducted 5 points from ${gameState.teams[currentTeamIndex].name}. New score: ${gameState.teams[currentTeamIndex].score}`);
    } else if (!gameState.currentClueImage) {
      alert('No clue image available for this question');
      console.log('Clue button clicked but no clue image is set');
    }
  });

  // Close Clue Overlay Handler
  document.getElementById('close-clue').addEventListener('click', function() {
    document.getElementById('clue-overlay').classList.add('hidden');
  });

  // Click outside overlay to close
  document.getElementById('clue-overlay').addEventListener('click', function(e) {
    if (e.target === this) {
      this.classList.add('hidden');
    }
  });

  // Location Badge Click Handler - Opens location floor mode popup
  document.getElementById('qd-location-badge').addEventListener('click', function() {
    // Only allow if location badge is visible
    if (!this.classList.contains('hidden-row')) {
      openLocationPopup();
    }
  });

  // Location popup state
  const locationState = {
    selectedTeamId: null, // Store team ID instead of index
    selectedCluePoints: 0,
    totalDeduction: 0
  };

  // Helper function to get team index from team ID
  function getTeamIndexById(teamId) {
    return gameState.teams.findIndex(team => team.id === teamId);
  }

  function openLocationPopup() {
    // Reset location state
    locationState.selectedTeamId = null;
    locationState.selectedCluePoints = 0;
    locationState.totalDeduction = 0;

    // Reset UI
    document.querySelectorAll('.location-team-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelectorAll('.location-bid-btn').forEach(btn => btn.classList.remove('selected'));
    document.getElementById('location-team-selection').classList.remove('hidden');
    document.getElementById('location-bid-selection').classList.add('hidden');
    document.getElementById('location-result-selection').classList.add('hidden');

    // Show overlay
    document.getElementById('location-overlay').classList.remove('hidden');
  }

  // Close Location Overlay Handler
  document.getElementById('close-location').addEventListener('click', function() {
    document.getElementById('location-overlay').classList.add('hidden');
  });

  // Click outside overlay to close
  document.getElementById('location-overlay').addEventListener('click', function(e) {
    if (e.target === this) {
      this.classList.add('hidden');
    }
  });

  // Team Selection Handler
  document.querySelectorAll('.location-team-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      // Deselect all teams
      document.querySelectorAll('.location-team-btn').forEach(b => b.classList.remove('selected'));

      // Select this team
      this.classList.add('selected');
      locationState.selectedTeamId = this.dataset.teamId; // Store team ID, not index

      console.log(`Location bid: Selected team ${locationState.selectedTeamId}`);

      // Show clue selection
      document.getElementById('location-bid-selection').classList.remove('hidden');
    });
  });

  // Clue Level Selection Handler
  document.querySelectorAll('.location-bid-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      // Deselect all clue levels
      document.querySelectorAll('.location-bid-btn').forEach(b => b.classList.remove('selected'));

      // Select this clue level
      this.classList.add('selected');
      locationState.selectedCluePoints = parseInt(this.dataset.points);
      locationState.totalDeduction = locationState.selectedCluePoints;

      // Don't deduct points yet - wait for the answer
      console.log(`Location bid selected: ${locationState.selectedCluePoints} points at risk`);

      // Show result selection
      document.getElementById('location-result-selection').classList.remove('hidden');
    });
  });

  // Identified Button Handler
  document.getElementById('location-identified').addEventListener('click', function() {
    if (locationState.selectedTeamId !== null) {
      const teamIndex = getTeamIndexById(locationState.selectedTeamId);
      if (teamIndex !== -1) {
        // Add 40 points (no deduction for correct answer)
        updateScore(teamIndex, 40);

        // Save action for undo
        saveAction({
          type: 'location-identified',
          teamIndex: teamIndex,
          points: 40,
          clueDeduction: 0
        });

        console.log(`Location identified by ${gameState.teams[teamIndex].name}! +40 points`);
      }

      // Close popup
      document.getElementById('location-overlay').classList.add('hidden');
    }
  });

  // Wrong Button Handler
  document.getElementById('location-wrong').addEventListener('click', function() {
    if (locationState.selectedTeamId !== null) {
      const teamIndex = getTeamIndexById(locationState.selectedTeamId);
      if (teamIndex !== -1) {
        // Deduct the bid points for wrong answer
        updateScore(teamIndex, locationState.selectedCluePoints);

        // Save action for undo
        saveAction({
          type: 'location-wrong',
          teamIndex: teamIndex,
          points: locationState.selectedCluePoints,
          clueDeduction: locationState.selectedCluePoints
        });

        console.log(`Location wrong by ${gameState.teams[teamIndex].name}. ${locationState.selectedCluePoints} points deducted.`);
      }
    }

    // Close popup
    document.getElementById('location-overlay').classList.add('hidden');
  });

  // Shuffle Badge Click Handler
  document.getElementById('qd-shuffle-badge').addEventListener('click', function() {
    if (!this.classList.contains('hidden-row') && !gameState.shuffleUsed) {
      startShuffleAnimation();
    }
  });

  // Close Shuffle Overlay (keep for backward compatibility if needed)
  document.getElementById('close-shuffle').addEventListener('click', function() {
    document.getElementById('shuffle-overlay').classList.add('hidden');
  });

  // Start shuffle animation in badge area
  function startShuffleAnimation() {
    const shuffleBadge = document.getElementById('qd-shuffle-badge');

    // Create stack animation container
    const stackContainer = document.createElement('div');
    stackContainer.className = 'shuffle-badge-stack';

    // Create only 3 card elements for the stack animation (without showing content)
    for (let i = 1; i <= 3; i++) {
      const cardElement = document.createElement('div');
      cardElement.className = `shuffle-card stack-animation card-${i}`;
      stackContainer.appendChild(cardElement);
    }

    // Replace badge content with animation
    shuffleBadge.innerHTML = '';
    shuffleBadge.appendChild(stackContainer);

    // After 1 second, select and display random card
    setTimeout(() => {
      selectRandomShuffleCard();
    }, 1000);
  }

  function selectRandomShuffleCard() {
    // Select random card from shuffleCards array
    const randomIndex = Math.floor(Math.random() * shuffleCards.length);
    const selectedCard = shuffleCards[randomIndex];

    // Store selected card in game state
    gameState.selectedShuffleCard = selectedCard;
    gameState.shuffleUsed = true;

    console.log('Selected shuffle card:', selectedCard);

    // Show fullscreen animation first
    showFullscreenCardSelection(selectedCard);
  }

  function showFullscreenCardSelection(card) {
    // Create fullscreen overlay
    const overlay = document.createElement('div');
    overlay.className = 'shuffle-card-fullscreen-overlay';

    // Generate icon HTML if icon exists
    const iconHtml = card.icon
      ? `<img src="./collateral/shuffle-icons/${card.icon}" alt="${card.effect}" class="shuffle-icon">`
      : '';

    overlay.innerHTML = `
      <div class="shuffle-card-fullscreen-wrapper">
        <div class="shuffle-card-fullscreen">
          <div class="shuffle-card-fullscreen-content">

            <h3>${card.effect}</h3>
                        ${iconHtml}
            <p>${card.detail}</p>
          </div>
        </div>
      </div>
    `;

    // Append to body
    document.body.appendChild(overlay);

    // Trigger active state after a small delay for smooth animation
    setTimeout(() => {
      overlay.classList.add('active');
    }, 50);

    // Function to close the fullscreen card
    function closeFullscreenCard() {
      const cardElement = overlay.querySelector('.shuffle-card-fullscreen');
      cardElement.classList.add('shuffle-card-returning');

      // After return animation completes, remove overlay and show in badge
      setTimeout(() => {
        overlay.classList.remove('active');
        setTimeout(() => {
          document.body.removeChild(overlay);
          replaceShuffleBadgeWithCard();
        }, 300);
      }, 1000);
    }

    // Close when clicking on the overlay (outside the card)
    overlay.addEventListener('click', function(e) {
      // Only close if clicking on the overlay itself, not the card content
      if (e.target === overlay) {
        closeFullscreenCard();
      }
    });
  }

  function replaceShuffleBadgeWithCard() {
    const shuffleBadge = document.getElementById('qd-shuffle-badge');

    if (gameState.selectedShuffleCard) {
      // Replace badge content with card display
      const iconHtml = gameState.selectedShuffleCard.icon
        ? `<img src="./collateral/shuffle-icons/${gameState.selectedShuffleCard.icon}" alt="${gameState.selectedShuffleCard.effect}" class="shuffle-icon">`
        : '';

      shuffleBadge.innerHTML = `
        <div class="shuffle-card-display">
          ${iconHtml}
          <h3>${gameState.selectedShuffleCard.effect}</h3>
          <p>${gameState.selectedShuffleCard.detail}</p>
        </div>
      `;

      // Add click handler to toggle description
      const cardDisplay = shuffleBadge.querySelector('.shuffle-card-display');
      if (cardDisplay) {
        cardDisplay.addEventListener('click', function() {
          this.classList.toggle('show-description');
        });
      }

      // Mark as used
      shuffleBadge.classList.add('used');

      // Timer will be started manually by clicking Start button
    }
  }

  // Answer Content Click Handler - Reveal Answer
  document.getElementById('qd-answer-content').addEventListener('click', function() {
    this.classList.add('revealed');
  });

  // Correct Answer Handler
  document.getElementById('qd-correct').addEventListener('click', function() {
    // Reveal answer only
    document.getElementById('qd-answer-content').classList.add('revealed');

    if (gameState.isFloorMode) {
      // Floor mode: Award points to selected team
      if (gameState.selectedTeamForFloor !== null) {
        // Save action for undo
        saveAction({
          type: 'correct-floor',
          teamIndex: gameState.selectedTeamForFloor,
          points: 10,
          questionId: gameState.currentQuestionId,
          previousTeam: gameState.currentTeam,
          wasFloorMode: true,
          turnsThisRound: gameState.turnsThisRound
        });

        updateScore(gameState.selectedTeamForFloor, 10);

        // Mark question as answered
        if (gameState.currentQuestionId) {
          gameState.answeredQuestions.add(gameState.currentQuestionId);
        }

        // Exit floor mode
        exitFloorMode();

        // Reset timer
        resetTimer();

        // Move to next team (from original team, not the floor answerer)
       // nextTeam();
      }
    } else {
      // Normal mode: Award points to current team
      // Save action for undo
      saveAction({
        type: 'correct',
        teamIndex: gameState.currentTeam,
        points: 10,
        questionId: gameState.currentQuestionId,
        previousTeam: gameState.currentTeam,
        turnsThisRound: gameState.turnsThisRound
      });

      updateScore(gameState.currentTeam, 10);

      // Mark question as answered
      if (gameState.currentQuestionId) {
        gameState.answeredQuestions.add(gameState.currentQuestionId);
      }

      // Auto-save after question answered
      saveGame();

      // Reset timer
      resetTimer();

      // Move to next team
      //nextTeam();
    }
  });

  // Wrong Answer Handler
  document.getElementById('qd-wrong').addEventListener('click', function() {
    if (gameState.isFloorMode) {
      // Floor mode wrong answer: reveal answer and mark as answered
      document.getElementById('qd-answer-content').classList.add('revealed');

      // Save action for undo
      saveAction({
        type: 'wrong-floor',
        questionId: gameState.currentQuestionId,
        previousTeam: gameState.currentTeam,
        wasFloorMode: true,
        turnsThisRound: gameState.turnsThisRound
      });

      if (gameState.currentQuestionId) {
        gameState.answeredQuestions.add(gameState.currentQuestionId);
      }

      // Exit floor mode
      exitFloorMode();

      // Reset timer
      resetTimer();

      // Move to next team
     // nextTeam();
    } else {
      // Normal mode wrong answer: Open to floor WITHOUT revealing answer
      // Save action for undo
      saveAction({
        type: 'wrong',
        questionId: gameState.currentQuestionId,
        previousTeam: gameState.currentTeam,
        turnsThisRound: gameState.turnsThisRound
      });

      enterFloorMode();
    }
  });

  // Enter Floor Mode
  function enterFloorMode() {
    gameState.isFloorMode = true;
    gameState.selectedTeamForFloor = null;

    // Enable team selection
    document.querySelectorAll('.team-label').forEach((team, index) => {
      team.classList.add('selectable');
      team.style.cursor = 'pointer';
    });

    // Add visual indication
    document.getElementById('question-display').classList.add('floor-mode');

    // Show floor overlay popup
    document.getElementById('floor-overlay').classList.remove('hidden');
  }

  // Exit Floor Mode
  function exitFloorMode() {
    gameState.isFloorMode = false;
    gameState.selectedTeamForFloor = null;

    // Re-enable team selection (keep selectable for normal mode)
    document.querySelectorAll('.team-label').forEach(team => {
      team.classList.remove('selected-for-floor');
    });

    // Restore team completion visual states
    //updateTeamCompletionStates();

    // Remove visual indication
    document.getElementById('question-display').classList.remove('floor-mode');
  }

  // Return to Question Grid
  function returnToGrid() {
    // Exit floor mode if active
    if (gameState.isFloorMode) {
      exitFloorMode();
    }

    // Reset timer
    stopTimer();
    resetTimer();

    // Deselect team
    if (gameState.currentTeam !== null) {
      gameState.currentTeam = null;
      updateTeamHighlight();
    }

    document.getElementById('question-display').classList.add('hidden');
    document.getElementById('question-grid').classList.remove('hidden');
    updateActiveColumns();
  }

  // Back to Grid Button Handler
  document.getElementById('qd-back').addEventListener('click', function() {
    returnToGrid();
  });

  // Undo Button Handler
  document.getElementById('qd-undo').addEventListener('click', function() {
    if (gameState.actionHistory.length === 0) {
      return; // Nothing to undo
    }

    const lastAction = gameState.actionHistory.pop();

    // Restore team position
    gameState.currentTeam = lastAction.previousTeam;

    // Restore turns count and potentially round
    const turnDifference = gameState.turnsThisRound - lastAction.turnsThisRound;
    if (turnDifference > 0) {
      // We advanced, need to go back
      gameState.turnsThisRound = lastAction.turnsThisRound;

      // Check if we need to go back a round
      if (gameState.turnsThisRound < 0) {
        if (gameState.currentRound > 1) {
          gameState.currentRound--;
          gameState.turnsThisRound = gameState.teams.length - 1;
          updateRoundHighlight();
          updateActiveColumns();
        } else {
          gameState.turnsThisRound = 0;
        }
      }
    }

    // Undo the specific action
    if (lastAction.type === 'correct' || lastAction.type === 'correct-floor') {
      // Reverse the score change
      gameState.teams[lastAction.teamIndex].score -= lastAction.points;
      const teamElement = document.getElementById(gameState.teams[lastAction.teamIndex].id);
      const scoreElement = teamElement.querySelector('.score');
      if (scoreElement) {
        scoreElement.textContent = gameState.teams[lastAction.teamIndex].score;
      }

      // Un-mark question as answered
      if (lastAction.questionId) {
        gameState.answeredQuestions.delete(lastAction.questionId);
        updateActiveColumns();
      }
    } else if (lastAction.type === 'wrong' || lastAction.type === 'wrong-floor') {
      // Un-mark question as answered
      if (lastAction.questionId) {
        gameState.answeredQuestions.delete(lastAction.questionId);
        updateActiveColumns();
      }
    } else if (lastAction.type === 'clue-used') {
      // Reverse the clue usage
      gameState.teams[lastAction.teamIndex].score -= lastAction.points; // points is already -5, so subtracting adds it back
      const teamElement = document.getElementById(gameState.teams[lastAction.teamIndex].id);
      const scoreElement = teamElement.querySelector('.score');
      if (scoreElement) {
        scoreElement.textContent = gameState.teams[lastAction.teamIndex].score;
      }

      // Re-enable clue button
      gameState.clueUsed = false;
      const clueButton = document.getElementById('show-clue');
      clueButton.classList.remove('clue-used');
      clueButton.disabled = false;
      document.getElementById('qd-clue-status').textContent = '';
    } else if (lastAction.type === 'location-bid') {
      // Reverse the clue deduction
      gameState.teams[lastAction.teamIndex].score -= lastAction.points;
      const teamElement = document.getElementById(gameState.teams[lastAction.teamIndex].id);
      const scoreElement = teamElement.querySelector('.score');
      if (scoreElement) {
        scoreElement.textContent = gameState.teams[lastAction.teamIndex].score;
      }
    } else if (lastAction.type === 'location-identified') {
      // Reverse the identification (remove 40 points and restore clue deduction)
      gameState.teams[lastAction.teamIndex].score -= lastAction.points; // Remove the 40 points
      gameState.teams[lastAction.teamIndex].score -= lastAction.clueDeduction; // Restore the clue deduction
      const teamElement = document.getElementById(gameState.teams[lastAction.teamIndex].id);
      const scoreElement = teamElement.querySelector('.score');
      if (scoreElement) {
        scoreElement.textContent = gameState.teams[lastAction.teamIndex].score;
      }
    } else if (lastAction.type === 'location-wrong') {
      // Reverse only the clue deduction
      gameState.teams[lastAction.teamIndex].score -= lastAction.clueDeduction;
      const teamElement = document.getElementById(gameState.teams[lastAction.teamIndex].id);
      const scoreElement = teamElement.querySelector('.score');
      if (scoreElement) {
        scoreElement.textContent = gameState.teams[lastAction.teamIndex].score;
      }
    } else if (lastAction.type === 'manual-adjustment') {
      // Reverse manual score adjustment
      gameState.teams[lastAction.teamIndex].score -= lastAction.points;
      const teamElement = document.getElementById(gameState.teams[lastAction.teamIndex].id);
      const scoreElement = teamElement.querySelector('.score');
      if (scoreElement) {
        scoreElement.textContent = gameState.teams[lastAction.teamIndex].score;
      }
    }

    // Restore floor mode state
    if (lastAction.type === 'wrong') {
      // Wrong was clicked, we were in normal mode and entered floor mode
      // To undo: exit floor mode
      if (gameState.isFloorMode) {
        exitFloorMode();
      }
    }

    // Update UI
    updateTeamHighlight();
  });

  // Timeline Button Click Handlers (for round selection)
  document.querySelectorAll('.timeline-button').forEach((button, index) => {
    button.addEventListener('click', function() {
      const roundNum = index + 1;
      gameState.currentRound = roundNum;
      gameState.turnsThisRound = 0; // Reset turns when manually changing rounds
      updateRoundHighlight();
      updateActiveColumns();

      // Handle Rapid Fire (Round 5)
      if (roundNum === 5) {
        if (gameState.rapidFire.active) {
          closeRapidFireMode();
        } else {
          openRapidFireMode();
        }
      } else {
        // If switching to another round, close rapid fire if active
        if (gameState.rapidFire.active) {
          closeRapidFireMode();
        }
      }
    });
  });

  // Score Control Button Handlers
  document.querySelectorAll('.score-up').forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent triggering team selection in floor mode
      const teamId = this.dataset.teamId;
      const teamIndex = getTeamIndexById(teamId);

      if (teamIndex !== -1) {
        updateScore(teamIndex, 5);

        // Save action for undo
        saveAction({
          type: 'manual-adjustment',
          teamIndex: teamIndex,
          points: 5
        });

        console.log(`Manual +5 points to ${gameState.teams[teamIndex].name}`);
      }
    });
  });

  document.querySelectorAll('.score-down').forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent triggering team selection in floor mode
      const teamId = this.dataset.teamId;
      const teamIndex = getTeamIndexById(teamId);

      if (teamIndex !== -1) {
        updateScore(teamIndex, -5);

        // Save action for undo
        saveAction({
          type: 'manual-adjustment',
          teamIndex: teamIndex,
          points: -5
        });

        console.log(`Manual -5 points from ${gameState.teams[teamIndex].name}`);
      }
    });
  });

  // ===== RAPID FIRE FUNCTIONS =====

  function openRapidFireMode() {
    gameState.rapidFire.active = true;
    gameState.rapidFire.waitingForTeamSelection = true;

    // Show title screen and hide question grid
    document.getElementById('question-grid').classList.add('hidden');
    document.getElementById('rf-title-screen').classList.remove('hidden');

    // Enable team selection mode - make all team labels pulsate
    document.querySelectorAll('.team-label').forEach(team => {
      team.classList.add('rf-team-selection-mode');
    });
  }

  function closeRapidFireMode() {
    // Stop timer if running
    stopTimer();
    resetTimer();

    // Remove all rapid fire classes from team labels
    document.querySelectorAll('.team-label').forEach(team => {
      team.classList.remove('rf-active-team');
      team.classList.remove('rf-team-selection-mode');
    });

    // Hide all rapid fire screens
    document.getElementById('rf-title-screen').classList.add('hidden');
    document.getElementById('rf-question-screen').classList.add('hidden');
    document.getElementById('rf-score-screen').classList.add('hidden');

    // Show question grid
    document.getElementById('question-grid').classList.remove('hidden');

    // Reset rapid fire state
    gameState.rapidFire.active = false;
    gameState.rapidFire.currentBucket = null;
    gameState.rapidFire.currentTeamIndex = null;
    gameState.rapidFire.currentQuestionIndex = 0;
    gameState.rapidFire.questions = [];
    gameState.rapidFire.score = 0;
    gameState.rapidFire.waitingForTeamSelection = false;
  }

  function startRapidFire(teamIndex) {
    // Map team index to bucket (team-a -> rb1, team-b -> rb2, etc.)
    const bucketMap = ['rb1', 'rb2', 'rb3', 'rb4', 'rb5'];
    const bucket = bucketMap[teamIndex];

    // Get questions for this bucket (limit to first 5 questions)
    const bucketQuestions = rapidFireQuestions.filter(q => q.bucket === bucket).slice(0, 5);

    if (bucketQuestions.length === 0) {
      console.error(`No questions found for bucket ${bucket}`);
      return;
    }

    // Store rapid fire state
    gameState.rapidFire.currentBucket = bucket;
    gameState.rapidFire.currentTeamIndex = teamIndex;
    gameState.rapidFire.currentQuestionIndex = 0;
    gameState.rapidFire.questions = bucketQuestions;
    gameState.rapidFire.score = 0;
    gameState.rapidFire.waitingForTeamSelection = false;

    // Remove pulsating effect and active highlight from ALL teams first
    document.querySelectorAll('.team-label').forEach(team => {
      team.classList.remove('rf-team-selection-mode');
      team.classList.remove('rf-active-team');
    });

    // Then highlight only the selected team
    document.querySelectorAll('.team-label')[teamIndex].classList.add('rf-active-team');

    // Hide title screen, show question screen
    document.getElementById('rf-title-screen').classList.add('hidden');
    document.getElementById('rf-question-screen').classList.remove('hidden');

    // Set timer to 90 seconds (1:30) but don't start automatically
    // Timer will be started manually by clicking Start button
    timerState.seconds = 90;
    updateTimerDisplay();

    // Display first question
    displayRapidFireQuestion();
  }

  function displayRapidFireQuestion() {
    const qIndex = gameState.rapidFire.currentQuestionIndex;
    const questions = gameState.rapidFire.questions;

    if (qIndex >= questions.length) {
      // No more questions, show score
      showRapidFireScore();
      return;
    }

    const question = questions[qIndex];

    // Update counter
    document.getElementById('rf-question-counter').textContent = `${qIndex + 1}/${questions.length}`;

    // Update question content
    document.getElementById('rf-question-content').textContent = question.question;

    // Update answer content (hidden by default)
    const answerEl = document.getElementById('rf-answer-content');
    answerEl.textContent = question.answer;
    answerEl.classList.add('hidden');

    // Update navigation buttons
    document.getElementById('rf-prev').disabled = qIndex === 0;
    document.getElementById('rf-next').disabled = qIndex === questions.length - 1;
  }

  function showRapidFireScore() {
    // Stop timer
    stopTimer();
    resetTimer();

    // Hide question screen, show score screen
    document.getElementById('rf-question-screen').classList.add('hidden');
    document.getElementById('rf-score-screen').classList.remove('hidden');

    // Update score display
    const teamName = gameState.teams[gameState.rapidFire.currentTeamIndex].name;
    document.getElementById('rf-team-name').textContent = teamName;
    document.getElementById('rf-score-text').textContent = `Score: ${gameState.rapidFire.score}/5`;

    // Update team's actual score
    updateScore(gameState.rapidFire.currentTeamIndex, gameState.rapidFire.score);

    // Reset for next team selection - remove active highlight and add pulsating
    gameState.rapidFire.waitingForTeamSelection = true;
    document.querySelectorAll('.team-label').forEach(team => {
      team.classList.remove('rf-active-team');
      team.classList.add('rf-team-selection-mode');
    });
  }

  // Rapid Fire Event Handlers

  // Team label click during rapid fire
  document.querySelectorAll('.team-label').forEach((teamLabel) => {
    teamLabel.addEventListener('click', function() {
      if (gameState.rapidFire.active && gameState.rapidFire.waitingForTeamSelection) {
        const teamId = this.id; // Get team ID from the element's id attribute
        const teamIndex = getTeamIndexById(teamId);
        if (teamIndex !== -1) {
          startRapidFire(teamIndex);
          document.getElementById('rf-score-screen').classList.add('hidden');
        }
      }
    });
  });

  // Close button - return to title screen
  document.getElementById('rf-close').addEventListener('click', function() {
    stopTimer();
    resetTimer();
    document.getElementById('rf-question-screen').classList.add('hidden');
    document.getElementById('rf-title-screen').classList.remove('hidden');

    // Remove active team highlight
    document.querySelectorAll('.team-label').forEach(team => {
      team.classList.remove('rf-active-team');
    });

    // Reset to team selection mode
    gameState.rapidFire.waitingForTeamSelection = true;
    document.querySelectorAll('.team-label').forEach(team => {
      team.classList.add('rf-team-selection-mode');
    });
  });

  // Previous question button
  document.getElementById('rf-prev').addEventListener('click', function() {
    if (gameState.rapidFire.currentQuestionIndex > 0) {
      gameState.rapidFire.currentQuestionIndex--;
      displayRapidFireQuestion();
    }
  });

  // Next question button
  document.getElementById('rf-next').addEventListener('click', function() {
    if (gameState.rapidFire.currentQuestionIndex < gameState.rapidFire.questions.length - 1) {
      gameState.rapidFire.currentQuestionIndex++;
      displayRapidFireQuestion();
    }
  });

  // Correct answer button
  document.getElementById('rf-correct').addEventListener('click', function() {
    // Show answer
    document.getElementById('rf-answer-content').classList.remove('hidden');

    // Increment score
    gameState.rapidFire.score++;
  });

  // Wrong answer button
  document.getElementById('rf-wrong').addEventListener('click', function() {
    // Show answer
    document.getElementById('rf-answer-content').classList.remove('hidden');

    // Don't increment score
  });

  // End Round button - show score immediately
  document.getElementById('rf-end-round').addEventListener('click', function() {
    showRapidFireScore();
  });

  // Floor overlay - close when clicking outside
  document.getElementById('floor-overlay').addEventListener('click', function(e) {
    // Only close if clicking on the overlay itself, not the content
    if (e.target === this) {
      this.classList.add('hidden');
    }
  });

});

