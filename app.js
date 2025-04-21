// Global variables
let deck = [];
const suits = ["♠", "♥", "♣", "♦"];
const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
let playerHand = [], dealerHand = [], playerScore = 0, dealerScore = 0;
let chips = 100, bet = 0;
let kingsBountyBet = 0; // Added for King's Bounty
let kingsBountyWin = false; // Track if KB bet wins

// DOM element references (cache them early)
let playerScoreDisplay, dealerScoreDisplay, messageEl, chipCountDisplay, currentBetDisplay, betAmountInput, betBtn, hitBtn, standBtn, doubleDownBtn, splitBtn, newGameBtn, adjustBetMinusBtn, adjustBetPlusBtn;
// Added for King's Bounty
let kbBetAmountInput, kbCurrentBetDisplay, adjustKBBetMinusBtn, adjustKBBetPlusBtn;

// Function Definitions

function updateMessage(text, type = 'info') {
  if (!messageEl) messageEl = document.getElementById('message'); // Ensure exists
  messageEl.className = `alert alert-light py-1 px-2 small`; // Use backticks correctly
  messageEl.textContent = text;
}

function initializeDeck() {
  deck = [];
  suits.forEach(suit => {
    values.forEach(value => {
      deck.push({ suit, value });
    });
  });
  deck.sort(() => Math.random() - 0.5); // Shuffle the deck
}

function calculateScore(hand) {
  let score = 0, aceCount = 0;
  hand.forEach(card => {
    // Skip calculation for hidden cards (relevant for partial scores)
    if (card.isHidden) return;
    if (card.value === "A") aceCount++;
    score += card.value === "A" ? 11 : ["J", "Q", "K"].includes(card.value) ? 10 : +card.value;
  });

  let isHard = true;
  while (score > 21 && aceCount > 0) {
    score -= 10;
    aceCount--;
  }

  let initialScore = 0;
  let initialAceCount = 0;
  hand.forEach(card => {
    if (card.isHidden) return;
    if (card.value === "A") initialAceCount++;
    initialScore += card.value === "A" ? 11 : ["J", "Q", "K"].includes(card.value) ? 10 : +card.value;
  });

  // Determine if the hand is hard or soft
  isHard = true; // Assume hard initially
  if (aceCount > 0) { // Only possibly soft if Aces are present
    // Recalculate score counting all aces initially as 11
    let potentialScore = 0;
    hand.forEach(card => {
      if (card.isHidden) return;
      potentialScore += card.value === "A" ? 11 : ["J", "Q", "K"].includes(card.value) ? 10 : +card.value;
    });
    // Reduce score by 10 for each Ace until <= 21
    let tempAceCount = aceCount;
    while (potentialScore > 21 && tempAceCount > 0) {
      potentialScore -= 10;
      tempAceCount--;
    }
    // If after adjustment, tempAceCount > 0, it means at least one Ace is counted as 11
    if (tempAceCount > 0) {
      isHard = false;
    }
  }

  return { score: score, isHard: isHard };
}

function dealCard(hand, sectionId, isHidden = false) {
  if (deck.length === 0) {
    initializeDeck();
  }
  const card = deck.pop();
  card.isHidden = isHidden; // Add isHidden property to the card object
  hand.push(card);

  const cardDiv = document.createElement("div");
  cardDiv.className = "card";
  const section = document.getElementById(sectionId);

  if (isHidden) {
    cardDiv.classList.add("hidden");
    cardDiv.innerHTML = '<span class="hidden-content">?</span>';
    cardDiv.dataset.value = card.value; // Store for reveal
    cardDiv.dataset.suit = card.suit;
  } else {
    cardDiv.setAttribute("data-suit", card.suit);
    cardDiv.innerText = `${card.value}${card.suit}`;
  }
  section.appendChild(cardDiv);
  return card;
}

function startNewGame() {
  document.getElementById("player-cards").innerHTML = "";
  document.getElementById("dealer-cards").innerHTML = "";
  playerHand = [];
  dealerHand = [];
  playerScore = 0;
  dealerScore = 0;

  if (!playerScoreDisplay) playerScoreDisplay = document.getElementById("player-score");
  if (!dealerScoreDisplay) dealerScoreDisplay = document.getElementById("dealer-score");
  if (!currentBetDisplay) currentBetDisplay = document.getElementById("current-bet");
  if (!betAmountInput) betAmountInput = document.getElementById("bet-amount");
  if (!betBtn) betBtn = document.getElementById("bet-btn");
  if (!chipCountDisplay) chipCountDisplay = document.getElementById("chip-count");
  if (!hitBtn) hitBtn = document.getElementById("hit-btn");
  if (!standBtn) standBtn = document.getElementById("stand-btn");
  if (!doubleDownBtn) doubleDownBtn = document.getElementById("double-down-btn");
  if (!splitBtn) splitBtn = document.getElementById("split-btn");
  if (!adjustBetMinusBtn) adjustBetMinusBtn = document.querySelector('.input-group button[onclick^="adjustBet(-10)"]');
  if (!adjustBetPlusBtn) adjustBetPlusBtn = document.querySelector('.input-group button[onclick^="adjustBet(10)"]');
  // -- KB Elements --
  if (!kbBetAmountInput) kbBetAmountInput = document.getElementById("kb-bet-amount");
  if (!kbCurrentBetDisplay) kbCurrentBetDisplay = document.getElementById("kb-current-bet");
  if (!adjustKBBetMinusBtn) adjustKBBetMinusBtn = document.querySelector('.kb-bet-controls button[onclick^="adjustKBBET(-5)"]');
  if (!adjustKBBetPlusBtn) adjustKBBetPlusBtn = document.querySelector('.kb-bet-controls button[onclick^="adjustKBBET(5)"]');
  // -- End KB Elements --

  playerScoreDisplay.textContent = "";
  dealerScoreDisplay.textContent = "";
  currentBetDisplay.textContent = "0";
  betAmountInput.value = "10";
  bet = 0;
  kbBetAmountInput.value = "0"; // Reset KB input
  kbCurrentBetDisplay.textContent = "0"; // Reset KB display
  kingsBountyBet = 0; // Reset KB bet variable
  kingsBountyWin = false; // Reset KB win status

  betBtn.disabled = false;
  betAmountInput.disabled = false;
  if(adjustBetMinusBtn) adjustBetMinusBtn.disabled = false;
  if(adjustBetPlusBtn) adjustBetPlusBtn.disabled = false;
  // Enable KB controls
  kbBetAmountInput.disabled = false;
  if(adjustKBBetMinusBtn) adjustKBBetMinusBtn.disabled = false;
  if(adjustKBBetPlusBtn) adjustKBBetPlusBtn.disabled = false;

  hitBtn.disabled = true;
  standBtn.disabled = true;
  doubleDownBtn.disabled = true;
  doubleDownBtn.textContent = "Doubler";
  doubleDownBtn.classList.remove('free-bet-available');
  splitBtn.disabled = true;

  updateMessage("Placez votre mise pour commencer la partie!");
  initializeDeck();
}

function placeBet() {
  const betAmount = parseInt(betAmountInput.value);
  const kbBetAmount = parseInt(kbBetAmountInput.value);

  if (isNaN(betAmount) || betAmount < 1) {
    updateMessage("Veuillez entrer une mise principale valide !");
    return;
  }
  if (isNaN(kbBetAmount) || kbBetAmount < 0) { // KB can be 0
    updateMessage("Veuillez entrer une mise King's Bounty valide !");
    return;
  }

  const totalBet = betAmount + kbBetAmount;

  if (chips >= totalBet) {
    bet = betAmount;
    kingsBountyBet = kbBetAmount;
    chips -= totalBet;

    currentBetDisplay.textContent = bet;
    kbCurrentBetDisplay.textContent = kingsBountyBet; // Update KB display
    chipCountDisplay.textContent = chips;

    betBtn.disabled = true;
    betAmountInput.disabled = true;
    if(adjustBetMinusBtn) adjustBetMinusBtn.disabled = true;
    if(adjustBetPlusBtn) adjustBetPlusBtn.disabled = true;
    // Disable KB controls
    kbBetAmountInput.disabled = true;
    if(adjustKBBetMinusBtn) adjustKBBetMinusBtn.disabled = true;
    if(adjustKBBetPlusBtn) adjustKBBetPlusBtn.disabled = true;

    document.getElementById("player-cards").innerHTML = ""; // Clear previous cards
    document.getElementById("dealer-cards").innerHTML = "";
    playerHand = [];
    dealerHand = [];

    dealCard(playerHand, "player-cards");
    dealCard(dealerHand, "dealer-cards"); // Face up
    dealCard(playerHand, "player-cards");
    dealCard(dealerHand, "dealer-cards", true); // Face down

    // --- Check for King's Bounty Win --- (Needs player's first 2 cards)
    const initialPlayerResult = calculateScore(playerHand);
    if (kingsBountyBet > 0 && playerHand.length === 2 && initialPlayerResult.score === 20) {
        kingsBountyWin = true;
        // Optionally update message here, or wait for endGame
    }
    // --- End KB Check ---

    updateScores();

    const playerResult = calculateScore(playerHand);
    // Check dealer BJ using the actual card object this time
    let visibleDealerCardValue = 0;
    let hiddenDealerCardValue = 0;
    let dealerAceCount = 0;
    if (dealerHand[0]) { // Visible card
      const card = dealerHand[0];
      if (card.value === "A") dealerAceCount++;
      visibleDealerCardValue = card.value === "A" ? 11 : ["J", "Q", "K"].includes(card.value) ? 10 : +card.value;
    }
    if (dealerHand[1] && dealerHand[1].isHidden) { // Hidden card
      const card = dealerHand[1];
      if (card.value === "A") dealerAceCount++;
       hiddenDealerCardValue = card.value === "A" ? 11 : ["J", "Q", "K"].includes(card.value) ? 10 : +card.value;
    }
    const potentialDealerScore = visibleDealerCardValue + hiddenDealerCardValue;
    const isDealerBlackjack = dealerHand.length === 2 && potentialDealerScore === 21 || (dealerAceCount === 1 && potentialDealerScore === 12); // Ace + Ace = 12 or 2

    const isPlayerBlackjack = playerResult.score === 21 && playerHand.length === 2;

    if (isPlayerBlackjack || isDealerBlackjack) {
      revealDealerCard();
      updateScores(); // Update scores fully after reveal
      if (isPlayerBlackjack && isDealerBlackjack) {
        endGame("Égalité! Les deux ont Blackjack.", false);
      } else if (isPlayerBlackjack) {
        endGame("Blackjack! Vous gagnez!", false);
      } else { // Dealer BJ
        endGame("Le croupier a Blackjack! Perdu.", false);
      }
    } else {
      hitBtn.disabled = false;
      standBtn.disabled = false;
      // Double down state handled in updateScores
      updateMessage("À vous de jouer! Choisissez de tirer, rester, ou doubler");
    }

  } else {
    updateMessage("Pas assez de jetons pour cette mise totale !");
  }
}

function updateScores() {
  const playerResult = calculateScore(playerHand);
  playerScore = playerResult.score;

  // Calculate dealer score based only on visible cards
  const visibleDealerHand = dealerHand.filter(card => !card.isHidden);
  dealerScore = calculateScore(visibleDealerHand).score;

  playerScoreDisplay.textContent = `Score: ${playerScore}`;
  dealerScoreDisplay.textContent = `Score: ${dealerScore}`;

  const canAffordDouble = chips >= bet;
  const isFirstTurn = playerHand.length === 2;
  const isHard9_10_11 = isFirstTurn && playerResult.isHard && [9, 10, 11].includes(playerResult.score);

  if (isFirstTurn && (isHard9_10_11 || canAffordDouble) && playerScore <= 21) {
    doubleDownBtn.disabled = false;
    if (isHard9_10_11) {
      doubleDownBtn.textContent = "Doubler (Gratuit)";
      doubleDownBtn.classList.add('free-bet-available');
    } else {
      doubleDownBtn.textContent = "Doubler";
      doubleDownBtn.classList.remove('free-bet-available');
    }
  } else {
    doubleDownBtn.disabled = true;
    doubleDownBtn.textContent = "Doubler";
    doubleDownBtn.classList.remove('free-bet-available');
  }

  if (playerScore > 21) {
    hitBtn.disabled = true;
    standBtn.disabled = true;
    doubleDownBtn.disabled = true; // Ensure double is disabled on bust
  }
}

function revealDealerCard() {
  const hiddenCardElement = document.querySelector('#dealer-cards .card.hidden');
  const hiddenCardIndex = dealerHand.findIndex(card => card.isHidden);

  if (hiddenCardElement && hiddenCardIndex !== -1) {
    const card = dealerHand[hiddenCardIndex];
    card.isHidden = false; // Update the object state

    hiddenCardElement.classList.remove('hidden');
    hiddenCardElement.innerHTML = ''; // Clear the '?'
    hiddenCardElement.innerText = `${card.value}${card.suit}`;
    hiddenCardElement.setAttribute("data-suit", card.suit);
    hiddenCardElement.removeAttribute('data-value'); // No longer needed
  }
}

function hit() {
  dealCard(playerHand, "player-cards");
  updateScores();

  if (playerScore > 21) {
    endGame("Perdu! Vous avez dépassé 21.", false);
  } else {
    updateMessage("Tirer une autre carte ou rester?");
  }
}

function stand(wasFreeDouble = false) {
  revealDealerCard();
  dealerScore = calculateScore(dealerHand).score;
  dealerScoreDisplay.textContent = `Score: ${dealerScore}`;

  while (calculateScore(dealerHand).score < 17) {
    dealCard(dealerHand, "dealer-cards");
    dealerScore = calculateScore(dealerHand).score;
    dealerScoreDisplay.textContent = `Score: ${dealerScore}`;
  }
  determineWinner(wasFreeDouble);
}

function determineWinner(wasFreeDouble) {
  playerScore = calculateScore(playerHand).score;
  dealerScore = calculateScore(dealerHand).score;

  let result;
  const isPlayerBlackjack = playerScore === 21 && playerHand.length === 2;

  if (playerScore > 21) {
    result = "Perdu! Vous avez dépassé 21.";
  } else if (dealerScore === 22) {
    result = isPlayerBlackjack ? "Blackjack! Vous gagnez!" : "Égalité! Le croupier fait 22.";
  } else if (dealerScore > 21) {
    result = "Le croupier a dépassé 21! Vous gagnez!";
  } else if (playerScore > dealerScore) {
    result = "Vous gagnez!";
  } else if (dealerScore > playerScore) {
    result = "Le croupier gagne!";
  } else { // Equal scores
    result = "Égalité!";
  }

  endGame(result, wasFreeDouble);
  updateMessage(result + " Commencer une nouvelle partie?");
}

function doubleDown() {
  const playerResult = calculateScore(playerHand);
  const isFreeDouble = playerHand.length === 2 && playerResult.isHard && [9, 10, 11].includes(playerResult.score);
  const canAffordDouble = chips >= bet;

  if (!isFreeDouble && !canAffordDouble) {
      updateMessage("Not enough chips to double down!");
      return;
  }

  if (playerHand.length !== 2) {
      updateMessage("Can only double down on the first two cards."); // Should not happen due to button state, but safety check
      return;
  }

  let performedDouble = false;
  if (isFreeDouble) {
      updateMessage("Double Gratuit! Une carte de plus.");
      // No chip deduction, bet amount remains the same
      dealCard(playerHand, "player-cards");
      updateScores();
      performedDouble = true;
  } else if (canAffordDouble) {
      updateMessage("Double! Une carte de plus.");
      chips -= bet;
      bet *= 2;
      document.getElementById("chip-count").textContent = chips;
      document.getElementById("current-bet").textContent = bet;
      dealCard(playerHand, "player-cards");
      updateScores();
      performedDouble = true;
  }

  if (performedDouble) {
    // Disable buttons after doubling
    document.getElementById("hit-btn").disabled = true;
    document.getElementById("stand-btn").disabled = true;
    document.getElementById("double-down-btn").disabled = true;
    document.getElementById("double-down-btn").textContent = "Doubler"; // Reset text
    document.getElementById("double-down-btn").classList.remove('free-bet-available');

    if (playerScore > 21) {
      endGame(`Perdu! Dépassé 21 après Double ${isFreeDouble ? '(Gratuit)' : ''}.`, isFreeDouble);
    } else {
      // Automatically stand after doubling down
      stand(isFreeDouble);
    }
  }
}

function endGame(result, wasFreeDouble = false) {
  let finalResult = result;
  revealDealerCard(); // Ensure dealer card is revealed
  // Update scores one last time with revealed card if necessary
  playerScore = calculateScore(playerHand).score;
  dealerScore = calculateScore(dealerHand).score;
  playerScoreDisplay.textContent = `Score: ${playerScore}`;
  dealerScoreDisplay.textContent = `Score: ${dealerScore}`;

  // --- King's Bounty Payout --- (Before main bet payout)
  let kbPayoutInfo = "";
  if (kingsBountyBet > 0) {
      if (kingsBountyWin) {
          // Basic payout for total 20 = 4:1
          const kbWinAmount = kingsBountyBet * 4;
          chips += kingsBountyBet + kbWinAmount; // Return KB bet + winnings
          kbPayoutInfo = ` King's Bounty GAGNÉ ! (+${kbWinAmount} jetons)`;
      } else {
          kbPayoutInfo = ` King's Bounty Perdu.`;
          // KB bet is already deducted, no chip change
      }
  }
  // --- End KB Payout ---

  // Determine payout
  const isPlayerBlackjack = playerScore === 21 && playerHand.length === 2;
  const isDealerBlackjack = dealerScore === 21 && dealerHand.length === 2;
  const isDealerBust22 = dealerScore === 22;
  const playerWins = result.includes("gagnez");
  const isPush = result.includes("Égalité") || result.includes("Push"); // Added Push possibility explicitly

  let winAmount = 0;

  if (isPlayerBlackjack && !isDealerBlackjack) {
      // Player Blackjack pays 3:2
      winAmount = bet * 1.5;
      chips += bet + winAmount; // Return original bet + winnings
      finalResult += ` (Payé 3:2: +${winAmount} jetons)`;
  } else if (isPush || (isPlayerBlackjack && isDealerBlackjack) || (!isPlayerBlackjack && isDealerBust22)) {
      // Push condition: Dealer 22 (unless player BJ), tie, both BJ
      chips += bet; // Return original bet
      finalResult += " (Mise retournée)";
  } else if (playerWins) {
      // Standard win pays 1:1 (applies to free double wins too)
      winAmount = bet; // For standard double, bet was already doubled
      if (wasFreeDouble && finalResult.includes("Double")) {
           // Bet amount was NOT doubled for free double, so winnings are 1x original bet
           chips += bet + bet; // Return original bet + 1x original bet winnings
           finalResult += ` (Payé 1:1 sur Double Gratuit: +${bet} jetons)`;
      } else if (!finalResult.includes("Double")) {
           // Standard win (not double)
            chips += bet * 2; // Return original bet + 1x original bet winnings
            finalResult += ` (Payé 1:1: +${bet} jetons)`;
      } else { // Standard double win
          // Bet variable already holds the doubled amount
          chips += bet * 2; // Return doubled bet + 1x doubled bet winnings
           finalResult += ` (Payé 1:1 sur Double: +${bet} jetons)`; // bet is already doubled here
      }
  } else {
      // Loss: bet is already deducted. No change to chips.
      // If it was a free double loss, original bet is lost.
      // If it was a standard double loss, the doubled bet is lost.
      finalResult += " (Mise perdue)";
  }

  // Combine results and update UI
  message.textContent = finalResult + kbPayoutInfo; // Append KB result
  document.getElementById("chip-count").textContent = chips;

  // Disable game buttons
  document.getElementById("hit-btn").disabled = true;
  document.getElementById("stand-btn").disabled = true;
  document.getElementById("double-down-btn").disabled = true;
  document.getElementById("double-down-btn").textContent = "Doubler"; // Reset text
  document.getElementById("double-down-btn").classList.remove('free-bet-available');
  document.getElementById("split-btn").disabled = true;
}

function adjustBet(amount) {
    const betInput = document.getElementById("bet-amount");
    const kbBetInput = document.getElementById("kb-bet-amount");
    if (document.getElementById("bet-btn").disabled) return;

    let currentBet = parseInt(betInput.value);
    let currentKbBet = parseInt(kbBetInput.value);
    if (isNaN(currentBet)) currentBet = 10;
    if (isNaN(currentKbBet)) currentKbBet = 0;

    let potentialNewBet = currentBet + amount;
    // Ensure main bet is at least 1
    potentialNewBet = Math.max(1, potentialNewBet);
    // Ensure total bet doesn't exceed chips
    if (potentialNewBet + currentKbBet <= chips) {
        betInput.value = potentialNewBet;
    }
}

// Add function to adjust King's Bounty bet
function adjustKBBET(amount) {
    const betInput = document.getElementById("bet-amount");
    const kbBetInput = document.getElementById("kb-bet-amount");
    if (document.getElementById("bet-btn").disabled) return;

    let currentBet = parseInt(betInput.value);
    let currentKbBet = parseInt(kbBetInput.value);
    if (isNaN(currentBet)) currentBet = 10;
    if (isNaN(currentKbBet)) currentKbBet = 0;

    let potentialNewKbBet = currentKbBet + amount;
    // Ensure KB bet is at least 0
    potentialNewKbBet = Math.max(0, potentialNewKbBet);
    // Ensure total bet doesn't exceed chips
    if (currentBet + potentialNewKbBet <= chips) {
        kbBetInput.value = potentialNewKbBet;
        // Update KB bet display immediately (optional)
        // document.getElementById("kb-current-bet").textContent = potentialNewKbBet;
    }
}

// Event Listeners (ensure they are added after the functions are defined)
document.getElementById("hit-btn").addEventListener("click", hit);
document.getElementById("stand-btn").addEventListener("click", stand);
document.getElementById("double-down-btn").addEventListener("click", doubleDown);
document.getElementById("new-game-btn").addEventListener("click", startNewGame);
document.getElementById("bet-btn").addEventListener("click", placeBet);

// Initialize the game on page load
document.addEventListener('DOMContentLoaded', startNewGame);