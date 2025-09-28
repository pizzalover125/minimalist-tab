function rollDice(sides = 6, count = 1) {
  if (sides < 2 || sides > 100) {
    showCommandResult("Invalid dice sides. Use 2-100 sides.");
    return;
  }

  if (count < 1 || count > 20) {
    showCommandResult("Invalid dice count. Use 1-20 dice.");
    return;
  }

  const rolls = [];
  let total = 0;

  for (let i = 0; i < count; i++) {
    const roll = Math.floor(Math.random() * sides) + 1;
    rolls.push(roll);
    total += roll;
  }

  if (count === 1) {
    showProbabilityResult(`🎲 Rolled a d${sides}: ${rolls[0]}`, "dice");
  } else {
    showProbabilityResult(
      `🎲 Rolled ${count}d${sides}: [${rolls.join(", ")}] = ${total}`,
      "dice"
    );
  }
}

function flipCoin(count = 1) {
  if (count < 1 || count > 50) {
    showCommandResult("Invalid coin count. Use 1-50 coins.");
    return;
  }

  const flips = [];
  let heads = 0;
  let tails = 0;

  for (let i = 0; i < count; i++) {
    const isHeads = Math.random() < 0.5;
    const result = isHeads ? "H" : "T";
    flips.push(result);

    if (isHeads) {
      heads++;
    } else {
      tails++;
    }
  }

  if (count === 1) {
    const result = flips[0] === "H" ? "Heads" : "Tails";
    showProbabilityResult(`🪙 ${result}`, "coin");
  } else {
    showProbabilityResult(
      `🪙 Flipped ${count} coins: [${flips.join(" ")}] (${heads}H, ${tails}T)`,
      "coin"
    );
  }
}

function drawCard(count = 1, jokers = false) {
  if (count < 1 || count > 52) {
    showCommandResult("Invalid card count. Use 1-52 cards.");
    return;
  }

  const suits = ["♠️", "♥️", "♦️", "♣️"];
  const suitNames = ["Spades", "Hearts", "Diamonds", "Clubs"];
  const ranks = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
  ];
  const rankNames = [
    "Ace",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "Jack",
    "Queen",
    "King",
  ];

  let deck = [];
  for (let suitIndex = 0; suitIndex < suits.length; suitIndex++) {
    for (let rankIndex = 0; rankIndex < ranks.length; rankIndex++) {
      deck.push({
        suit: suits[suitIndex],
        suitName: suitNames[suitIndex],
        rank: ranks[rankIndex],
        rankName: rankNames[rankIndex],
        display: `${ranks[rankIndex]}${suits[suitIndex]}`,
      });
    }
  }

  if (jokers) {
    deck.push({
      suit: "🃏",
      suitName: "Joker",
      rank: "Joker",
      rankName: "Joker",
      display: "🃏",
    });
    deck.push({
      suit: "🃏",
      suitName: "Joker",
      rank: "Joker",
      rankName: "Joker",
      display: "🃏",
    });
  }

  const drawnCards = [];
  const shuffledDeck = [...deck];

  for (let i = shuffledDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
  }

  for (let i = 0; i < count && i < shuffledDeck.length; i++) {
    drawnCards.push(shuffledDeck[i]);
  }

  if (count === 1) {
    const card = drawnCards[0];
    if (card.rank === "Joker") {
      showProbabilityResult(`🃏 Drew: ${card.display}`, "card");
    } else {
      showProbabilityResult(
        `🃏 Drew: ${card.rankName} of ${card.suitName} (${card.display})`,
        "card"
      );
    }
  } else {
    const cardDisplays = drawnCards.map((card) => card.display);
    showProbabilityResult(
      `🃏 Drew ${count} cards: [${cardDisplays.join(" ")}]`,
      "card"
    );
  }
}

function parseDiceNotation(notation) {
  const match = notation.toLowerCase().match(/^(\d+)?d(\d+)$/);
  if (!match) return null;

  const count = match[1] ? parseInt(match[1]) : 1;
  const sides = parseInt(match[2]);

  return { count, sides };
}
