// Experiment 1: "First Encounter"
// Wei Lai, Péter Rácz, Gareth Roberts (2020), Cognitive Science 44, e12832
//
// Phase structure:
//   1. Welcome + consent
//   2. Stage 1: Learning without aliens (passive exposure + forced-choice, 2 reps)
//   3. Alien familiarization (button-response identification task)
//   4. Stage 2: Learning with aliens (same structure, 2 reps)
//   5. Test: Suffix-selection task (old + novel words)
//   6. Test: Alien-selection task (old + novel words)
//   7. Debrief + data save

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Returns a random element from an array
function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Image tag helper — all images live in images/
function img(filename, cls = "") {
  return `<img src="images/${filename}" class="${cls}" alt="${filename}">`;
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIALISE jsPsych
// ─────────────────────────────────────────────────────────────────────────────

const jsPsych = initJsPsych({
  on_finish: function () {
    // Data is saved via jsPsychPipe; nothing extra needed here.
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PARTICIPANT SETUP
// ─────────────────────────────────────────────────────────────────────────────

const subject_id = jsPsych.randomization.randomID(10);
const filename = `exp1_${subject_id}.csv`;

// Randomly assign participant to condition
const condition = Math.random() < 0.5 ? "NoExposure" : "Exposure";

// Running point total (logged, not shown to participant)
let points = 0;

// ─────────────────────────────────────────────────────────────────────────────
// WELCOME + INSTRUCTIONS
// ─────────────────────────────────────────────────────────────────────────────

const welcome = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="instr-box">
      <h1>Alien Language Study</h1>
      <p>Welcome, and thank you for taking part in this study.</p>
      <p>In this experiment, you will learn a short <strong>alien language</strong>. You will first practise the words, then learn how different alien species use them.</p>
      <p>The study takes about <strong>50–60 minutes</strong>. Please make sure you are in a quiet place and will not be interrupted.</p>
      <p>Click <strong>Continue</strong> when you are ready to begin.</p>
    </div>`,
  choices: ["Continue"],
};

const instructions_stage1 = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="instr-box">
      <h2>Part 1: Learning the language</h2>
      <p>You will see alien words paired with pictures of objects.</p>
      <ul>
        <li>First, <strong>memorise</strong> each word and its meaning.</li>
        <li>Then you will be tested with <strong>multiple-choice questions</strong>. Choose the correct word for each picture.</li>
        <li>You will receive feedback after each answer.</li>
      </ul>
      <p>Click <strong>Start</strong> to begin.</p>
    </div>`,
  choices: ["Start"],
};

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 1: LEARNING WITHOUT ALIENS
// ─────────────────────────────────────────────────────────────────────────────
// The 14 words are divided into 7 sets of 4 (2 singular + 2 plural, distinct stems).
// For each set: passive exposure × 4, then forced-choice × 2 (plural only).
// The whole sequence is repeated once (2 total reps per word).
// Condition determines which suffix appears on plural words.

function getSuffix(word) {
  return condition === "Exposure"
    ? word.exposed_suffix
    : word.notexposed_suffix;
}

// Build 7 sets of 4 words (2 sing + 2 plur, distinct stems)
// We fix the sets here rather than randomising to ensure each set
// always has exactly 2 singular and 2 plural items with distinct stems.
function buildStage1Sets() {
  // Pair words into sets of 2; each pair will contribute 1 singular + 1 plural trial
  const wordsCopy = shuffle([...vocabulary]);
  const sets = [];
  for (let i = 0; i < wordsCopy.length; i += 4) {
    sets.push(wordsCopy.slice(i, i + 4));
  }
  return sets; // 7 sets × 4 words
}

function buildPassiveExposureTrial(word, isPlural, suffix, phase) {
  const imageFile = isPlural ? word.plural_image : word.singular_image;
  const displayWord = isPlural ? `${word.root}${suffix}` : word.root;
  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="trial-box">
        <div class="word-display">${displayWord}</div>
        ${img(imageFile, "stim-image")}
      </div>`,
    choices: ["Continue"],
    data: {
      task: "passive_exposure",
      phase: phase,
      word_root: word.root,
      is_plural: isPlural,
      suffix_shown: isPlural ? suffix : null,
      condition: condition,
      subject_id: subject_id,
    },
  };
}

function buildForcedChoiceTrial(word, suffix, phase) {
  // Forced-choice: stem identification only. Both options carry the same suffix
  // so NoExposure participants never see -nup in Stage 1. The foil differs
  // only in the stem (word.foil).
  const correctWord = `${word.root}${suffix}`;
  const foilWord = `${word.foil}${suffix}`;
  const options = shuffle([correctWord, foilWord]);
  const correctIndex = options.indexOf(correctWord);

  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="trial-box">
        ${img(word.plural_image, "stim-image")}
        <p class="instr-text">Which word matches this picture?</p>
      </div>`,
    choices: options,
    data: {
      task: "forced_choice",
      phase: phase,
      word_root: word.root,
      correct_word: correctWord,
      foil_word: foilWord,
      correct_index: correctIndex,
      condition: condition,
      subject_id: subject_id,
    },
    on_finish: function (data) {
      const isCorrect = data.response === correctIndex;
      data.correct = isCorrect;
      if (isCorrect) points++;
      data.points_total = points;
    },
  };
}

function buildFeedbackTrial(correctWord, phase) {
  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: function () {
      const lastTrial = jsPsych.data.get().last(1).values()[0];
      const wasCorrect = lastTrial.correct;
      return `
        <div class="trial-box feedback-box ${wasCorrect ? "feedback-correct" : "feedback-incorrect"}">
          <p>${wasCorrect ? "✓ Correct!" : "✗ Incorrect"}</p>
          <p>The correct answer was: <strong>${correctWord}</strong></p>
        </div>`;
    },
    choices: ["Continue"],
    trial_duration: 2000,
    data: {
      task: "feedback",
      phase: phase,
      condition: condition,
      subject_id: subject_id,
    },
  };
}

function buildStage1Timeline() {
  const timeline = [];

  // Two repetitions over the full word set
  for (let rep = 0; rep < 2; rep++) {
    const sets = buildStage1Sets();

    for (const wordSet of sets) {
      // Passive exposure: all 4 words (2 sing + 2 plur), randomised order
      const exposureTrials = [];
      for (const word of wordSet) {
        const suffix = getSuffix(word);
        // Singular
        exposureTrials.push(
          buildPassiveExposureTrial(word, false, null, "stage1"),
        );
        // Plural
        exposureTrials.push(
          buildPassiveExposureTrial(word, true, suffix, "stage1"),
        );
      }
      shuffle(exposureTrials).forEach((t) => timeline.push(t));

      // Forced-choice: pick 2 of the 4 words for testing (the plural forms)
      // foil suffix is the "other" suffix to what the word actually uses
      const fcWords = shuffle([...wordSet]).slice(0, 2);
      for (const word of fcWords) {
        const suffix = getSuffix(word);
        const correctWord = `${word.root}${suffix}`;
        timeline.push(buildForcedChoiceTrial(word, suffix, "stage1"));
        timeline.push(buildFeedbackTrial(correctWord, "stage1"));
      }
    }
  }

  return timeline;
}

// ─────────────────────────────────────────────────────────────────────────────
// ALIEN FAMILIARIZATION
// ─────────────────────────────────────────────────────────────────────────────

const alienIntro = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="instr-box">
      <h2>Meet the aliens</h2>
      <p>The language you have been learning is spoken by two alien species: <strong>Gulus</strong> and <strong>Norls</strong>.</p>
      <p>On the next screens you will see images of both species. Try to learn which is which!</p>
    </div>`,
  choices: ["Continue"],
  data: { task: "alien_intro", condition: condition, subject_id: subject_id },
};

// Show both species labelled
const alienShowGulu = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="trial-box">
      <p class="species-label gulu-label">This is a <strong>Gulu</strong></p>
      ${img("gulu_1.png", "alien-image")}
    </div>`,
  choices: ["Continue"],
  data: {
    task: "alien_show",
    species: "Gulu",
    condition: condition,
    subject_id: subject_id,
  },
};

const alienShowNorl = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="trial-box">
      <p class="species-label norl-label">This is a <strong>Norl</strong></p>
      ${img("norl_1.png", "alien-image")}
    </div>`,
  choices: ["Continue"],
  data: {
    task: "alien_show",
    species: "Norl",
    condition: condition,
    subject_id: subject_id,
  },
};

// Identification practice: show 4 aliens (2 Gulu, 2 Norl) one at a time,
// participant clicks the correct species name. Feedback given.
function buildAlienIDTrial(imageFile, correctSpecies) {
  const options = Math.random() < 0.5 ? ["Gulu", "Norl"] : ["Norl", "Gulu"];
  const correctIndex = options.indexOf(correctSpecies);
  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="trial-box">
        ${img(imageFile, "alien-image")}
        <p class="instr-text">Which species is this?</p>
      </div>`,
    choices: options,
    data: {
      task: "alien_id",
      image: imageFile,
      correct_species: correctSpecies,
      condition: condition,
      subject_id: subject_id,
    },
    on_finish: function (data) {
      data.correct = data.response === correctIndex;
    },
  };
}

function buildAlienIDFeedback(correctSpecies) {
  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: function () {
      const last = jsPsych.data.get().last(1).values()[0];
      return `
        <div class="trial-box feedback-box ${last.correct ? "feedback-correct" : "feedback-incorrect"}">
          <p>${last.correct ? "✓ Correct!" : `✗ That was a <strong>${correctSpecies}</strong>.`}</p>
        </div>`;
    },
    choices: ["Continue"],
    trial_duration: 1800,
    data: {
      task: "alien_id_feedback",
      condition: condition,
      subject_id: subject_id,
    },
  };
}

function buildAlienFamiliarization() {
  const trials = [alienIntro, alienShowGulu, alienShowNorl];

  // 2 Gulu, 2 Norl identification trials
  const idItems = shuffle([
    { image: "gulu_2.png", species: "Gulu" },
    { image: "gulu_3.png", species: "Gulu" },
    { image: "norl_2.png", species: "Norl" },
    { image: "norl_3.png", species: "Norl" },
  ]);

  for (const item of idItems) {
    trials.push(buildAlienIDTrial(item.image, item.species));
    trials.push(buildAlienIDFeedback(item.species));
  }

  return trials;
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 2: LEARNING WITH ALIENS
// ─────────────────────────────────────────────────────────────────────────────
// Same structure as Stage 1 but each trial is accompanied by an alien image.
// Words are split into sets of 8 (4 Gulu + 4 Norl), each set containing equal
// singular and plural forms and distinct stems within species.

const instructions_stage2 = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="instr-box">
      <h2>Part 2: Learning with aliens</h2>
      <p>Now you will continue learning the language, but this time you will also see which alien is speaking.</p>
      <ul>
        <li>Each word will appear alongside a picture of the alien who used it.</li>
        <li>You will still have <strong>multiple-choice questions</strong> with feedback.</li>
        <li>Pay attention to which aliens use which words!</li>
      </ul>
      <p>Click <strong>Start</strong> to begin.</p>
    </div>`,
  choices: ["Start"],
  data: {
    task: "instructions_stage2",
    condition: condition,
    subject_id: subject_id,
  },
};

function buildStage2Sets() {
  // 14 words → 7 sets of 4 (2 Gulu-assigned + 2 Norl-assigned per set)
  // We assign words to species deterministically (any split works since
  // the suffix each species uses per word is encoded in vocabulary).
  const shuffled = shuffle([...vocabulary]);
  const sets = [];
  for (let i = 0; i < shuffled.length; i += 4) {
    const wordGroup = shuffled.slice(i, i + 4);
    // Interleave Gulu and Norl: [w0→Gulu, w1→Norl, w2→Gulu, w3→Norl]
    const assigned = wordGroup.map((w, idx) => ({
      word: w,
      species: idx % 2 === 0 ? "Gulu" : "Norl",
    }));
    sets.push(assigned);
  }
  return sets;
}

function buildPassiveExposureTrial2(word, isPlural, suffix, species, phase) {
  const imageFile = isPlural ? word.plural_image : word.singular_image;
  const displayWord = isPlural ? `${word.root}${suffix}` : word.root;
  const alienImage = pick(aliens.find((a) => a.name === species).images);
  const labelClass = species === "Gulu" ? "gulu-label" : "norl-label";

  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="trial-box stage2-trial">
        <div class="alien-speaker">
          ${img(alienImage, "alien-small")}
          <span class="species-label ${labelClass}">${species}</span>
        </div>
        <div class="word-display">${displayWord}</div>
        ${img(imageFile, "stim-image")}
      </div>`,
    choices: ["Continue"],
    data: {
      task: "passive_exposure",
      phase: phase,
      word_root: word.root,
      species: species,
      is_plural: isPlural,
      suffix_shown: isPlural ? suffix : null,
      condition: condition,
      subject_id: subject_id,
    },
  };
}

function buildForcedChoiceTrial2(word, suffix, species, phase) {
  // Stem identification: foil carries the same suffix, differs only in stem.
  const correctWord = `${word.root}${suffix}`;
  const foilWord = `${word.foil}${suffix}`;
  const options = shuffle([correctWord, foilWord]);
  const correctIndex = options.indexOf(correctWord);
  const alienImage = pick(aliens.find((a) => a.name === species).images);
  const labelClass = species === "Gulu" ? "gulu-label" : "norl-label";

  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="trial-box stage2-trial">
        <div class="alien-speaker">
          ${img(alienImage, "alien-small")}
          <span class="species-label ${labelClass}">${species}</span>
        </div>
        ${img(word.plural_image, "stim-image")}
        <p class="instr-text">Which word did the ${species} use?</p>
      </div>`,
    choices: options,
    data: {
      task: "forced_choice",
      phase: phase,
      word_root: word.root,
      species: species,
      correct_word: correctWord,
      foil_word: foilWord,
      correct_index: correctIndex,
      condition: condition,
      subject_id: subject_id,
    },
    on_finish: function (data) {
      const isCorrect = data.response === correctIndex;
      data.correct = isCorrect;
      if (isCorrect) points++;
      data.points_total = points;
    },
  };
}

function buildStage2Timeline() {
  const timeline = [];

  for (let rep = 0; rep < 2; rep++) {
    const sets = buildStage2Sets();

    for (const wordSet of sets) {
      // Passive exposure: singular + plural for each assigned word (with alien)
      const exposureTrials = [];
      for (const { word, species } of wordSet) {
        const suffix = species === "Gulu" ? word.gulu_suffix : word.norl_suffix;
        exposureTrials.push(
          buildPassiveExposureTrial2(word, false, null, species, "stage2"),
        );
        exposureTrials.push(
          buildPassiveExposureTrial2(word, true, suffix, species, "stage2"),
        );
      }
      shuffle(exposureTrials).forEach((t) => timeline.push(t));

      // Forced-choice: 2 of the 4 words (plural only)
      const fcItems = shuffle([...wordSet]).slice(0, 2);
      for (const { word, species } of fcItems) {
        const suffix = species === "Gulu" ? word.gulu_suffix : word.norl_suffix;
        const correctWord = `${word.root}${suffix}`;
        timeline.push(buildForcedChoiceTrial2(word, suffix, species, "stage2"));
        timeline.push(buildFeedbackTrial(correctWord, "stage2"));
      }
    }
  }

  return timeline;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST PHASE
// ─────────────────────────────────────────────────────────────────────────────

const instructions_test = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="instr-box">
      <h2>Test</h2>
      <p>You have finished learning the language! Now we will test what you have learned.</p>
      <p>There are two short tasks. <strong>No feedback</strong> will be given this time — just answer as best you can.</p>
      <p>Some of the words may be ones you have not seen before. That is fine — use your best judgment.</p>
      <p>Click <strong>Continue</strong> to start the test.</p>
    </div>`,
  choices: ["Continue"],
  data: {
    task: "instructions_test",
    condition: condition,
    subject_id: subject_id,
  },
};

// ── SUFFIX-SELECTION TASK ──────────────────────────────────────────────────
// Participant sees an alien + a word (or novel singular + image) and chooses
// between a -dup and a -nup plural form.
// Old words: 14 × 2 species × 2 reps = 56 trials
// Novel words: 5 × 2 species × 2 reps = 20 trials
// Filler (singular or wrong-stem) trials: 34 (omitted here for brevity;
//   see paper p.11 — these tested singular identification, not suffix choice)

function buildSuffixSelectionTrial(word, species, isNovel, rep) {
  const alienImage = testAliens[species.toLowerCase()];
  const labelClass = species === "Gulu" ? "gulu-label" : "norl-label";

  let stimulusHTML;
  if (isNovel) {
    // Novel words: singular (labelled) on left, plural image with "?" on right
    stimulusHTML = `
      <div class="trial-box">
        <div class="alien-speaker">
          ${img(alienImage, "alien-small")}
          <span class="species-label ${labelClass}">${species}</span>
        </div>
        <div class="novel-word-pair">
          <div class="novel-word-item">
            ${img(word.singular_image, "stim-image")}
            <p class="word-display">${word.root}</p>
          </div>
          <div class="novel-word-item">
            ${img(word.plural_image, "stim-image")}
            <p class="word-display novel-unknown">?</p>
          </div>
        </div>
        <p class="instr-text">Which word would this ${species} use?</p>
      </div>`;
  } else {
    // Old words: show plural image directly (stem known from training)
    stimulusHTML = `
      <div class="trial-box">
        <div class="alien-speaker">
          ${img(alienImage, "alien-small")}
          <span class="species-label ${labelClass}">${species}</span>
        </div>
        ${img(word.plural_image, "stim-image")}
        <p class="instr-text">Which word would this ${species} use?</p>
      </div>`;
  }

  const options = shuffle([`${word.root}dup`, `${word.root}nup`]);
  const dupIndex = options.findIndex((o) => o.endsWith("dup"));
  const nupIndex = options.findIndex((o) => o.endsWith("nup"));

  // Ground truth suffix for this species
  const correctSuffix =
    species === "Gulu"
      ? isNovel
        ? "dup"
        : word.gulu_suffix
      : isNovel
        ? "nup"
        : word.norl_suffix; // novel words: Norls expected to use -nup

  const correctIndex = options.findIndex((o) => o.endsWith(correctSuffix));

  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: stimulusHTML,
    choices: options,
    data: {
      task: "suffix_selection",
      word_root: word.root,
      species: species,
      is_novel: isNovel,
      rep: rep,
      dup_button_index: dupIndex,
      nup_button_index: nupIndex,
      correct_suffix: correctSuffix,
      correct_index: correctIndex,
      condition: condition,
      subject_id: subject_id,
    },
    on_finish: function (data) {
      const chosen = options[data.response];
      data.chosen_suffix = chosen.endsWith("nup") ? "nup" : "dup";
      data.chose_nup = data.chosen_suffix === "nup" ? 1 : 0;
      data.correct = data.response === correctIndex;
    },
  };
}

function buildSuffixSelectionTimeline() {
  const trials = [];

  // Old words: 14 × 2 species × 2 reps
  for (let rep = 0; rep < 2; rep++) {
    const items = [];
    for (const word of vocabulary) {
      for (const species of ["Gulu", "Norl"]) {
        items.push({ word, species, isNovel: false, rep });
      }
    }
    shuffle(items).forEach(({ word, species, isNovel, rep: r }) => {
      trials.push(buildSuffixSelectionTrial(word, species, isNovel, r));
    });
  }

  // Novel words: 5 × 2 species × 2 reps
  for (let rep = 0; rep < 2; rep++) {
    const items = [];
    for (const word of test_novel_words) {
      for (const species of ["Gulu", "Norl"]) {
        items.push({ word, species, isNovel: true, rep });
      }
    }
    shuffle(items).forEach(({ word, species, isNovel, rep: r }) => {
      trials.push(buildSuffixSelectionTrial(word, species, isNovel, r));
    });
  }

  return shuffle(trials);
}

// ── ALIEN-SELECTION TASK ───────────────────────────────────────────────────
// Participant sees a plural word and picks which alien (Gulu or Norl)
// most likely said it.
// Old words: 14 × 2 suffixes = 28 trials
// Novel words: 5 × 2 suffixes = 10 trials
// Total: 38 trials

function buildAlienSelectionTrial(word, suffix, isNovel) {
  const displayWord = `${word.root}${suffix}`;
  const imageFile = word.plural_image;

  const options = Math.random() < 0.5 ? ["Gulu", "Norl"] : ["Norl", "Gulu"];
  const guluIndex = options.indexOf("Gulu");
  const norlIndex = options.indexOf("Norl");

  // Ground truth: -nup is only ever used by Norls; -dup can be either
  // (but paper codes "correct" as Norl for -nup, Gulu for -dup)
  const correctSpecies = suffix === "nup" ? "Norl" : "Gulu";
  const correctIndex = options.indexOf(correctSpecies);

  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="trial-box">
        <div class="alien-choices-header">
          <div class="alien-option">
            ${img(testAliens["norl"], "alien-medium")}
            <span class="species-label norl-label">Norl</span>
          </div>
          <div class="alien-option">
            ${img(testAliens["gulu"], "alien-medium")}
            <span class="species-label gulu-label">Gulu</span>
          </div>
        </div>
        <div class="word-display">${displayWord}</div>
        ${img(imageFile, "stim-image")}
        <p class="instr-text">Which alien most likely said this word?</p>
      </div>`,
    choices: options,
    data: {
      task: "alien_selection",
      word_root: word.root,
      suffix_shown: suffix,
      is_novel: isNovel,
      gulu_button_index: guluIndex,
      norl_button_index: norlIndex,
      correct_species: correctSpecies,
      correct_index: correctIndex,
      condition: condition,
      subject_id: subject_id,
    },
    on_finish: function (data) {
      const chosen = options[data.response];
      data.chosen_species = chosen;
      data.chose_norl = chosen === "Norl" ? 1 : 0;
      data.correct = data.response === correctIndex;
    },
  };
}

function buildAlienSelectionTimeline() {
  const trials = [];

  // Old words: 14 × 2 suffixes
  for (const word of vocabulary) {
    for (const suffix of ["dup", "nup"]) {
      trials.push(buildAlienSelectionTrial(word, suffix, false));
    }
  }

  // Novel words: 5 × 2 suffixes
  for (const word of test_novel_words) {
    for (const suffix of ["dup", "nup"]) {
      trials.push(buildAlienSelectionTrial(word, suffix, true));
    }
  }

  return shuffle(trials);
}

// ─────────────────────────────────────────────────────────────────────────────
// DEBRIEF + DATA SAVE
// ─────────────────────────────────────────────────────────────────────────────

const debrief = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="instr-box">
      <h2>You're done!</h2>
      <p>Thank you for completing this study.</p>
      <p>This experiment investigates how people learn associations between words and social groups in a new language.</p>
      <p>Your data is being saved. Please wait a moment before closing this window.</p>
    </div>`,
  choices: ["Save my data"],
  data: { task: "debrief", condition: condition, subject_id: subject_id },
};

const save_data = {
  type: jsPsychPipe,
  action: "save",
  experiment_id: "9JeF3mkj4UuR",
  filename: filename,
  data_string: () => jsPsych.data.get().csv(),
};

const end_screen = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="instr-box">
      <h2>All done</h2>
      <p>Your data has been saved. You may now close this window.</p>
      <p>If you have a completion code, please return to the study page now.</p>
    </div>`,
  choices: [], // no button — participant just closes the tab
};

// ─────────────────────────────────────────────────────────────────────────────
// BUILD + RUN TIMELINE
// ─────────────────────────────────────────────────────────────────────────────

const stage1 = buildStage1Timeline();
const alienFam = buildAlienFamiliarization();
const stage2 = buildStage2Timeline();
const suffixTask = buildSuffixSelectionTimeline();
const alienTask = buildAlienSelectionTimeline();

const timeline = [
  // welcome,
  // instructions_stage1,
  // ...stage1,
  // ...alienFam,
  // instructions_stage2,
  // ...stage2,
  instructions_test,
  ...suffixTask,
  ...alienTask,
  debrief,
  save_data,
  end_screen,
];

jsPsych.run(timeline);
