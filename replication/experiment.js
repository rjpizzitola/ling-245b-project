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
  show_progress_bar: true,
  on_finish: function () {
    // data saved via jsPsychPipe in the timeline, so no need to do anything here
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// CONSENT FORM TEXT
// ─────────────────────────────────────────────────────────────────────────────

const consent_trial = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `<div class="consent-text" style="max-height: 60vh; overflow-y: auto; padding-right: 8px;"> <h2>Consent Agreement</h2>
    <p> Please read this consent agreement carefully before deciding whether to participate in this experiment. </p> 
    <p> <strong>Description:</strong> You are invited to participate in a research study about language and language learning. The purpose of the research is to understand how people learn new words. This research will be conducted through the Prolific platform, including participants from the US, UK, and Canada. If you decide to participate in this research, you will learn and use new words. </p> 
    <p> <strong>Time Involvement:</strong> The task will last the amount of time advertised on Prolific. You are free to withdraw from the study at any time. </p> 
    <p> <strong>Risks and Benefits:</strong> Study data will be stored securely, in compliance with Stanford University standards, minimizing the risk of confidentiality breach. This study advances our scientific understanding of how people learn new languages. We cannot and do not guarantee or promise that you will receive any benefits from this study. </p> 
    <p> <strong>Compensation:</strong> You will receive payment in the amount advertised on Prolific. If you do not complete this study, you will receive prorated payment based on the time that you have spent. Additionally, you may be eligible for bonus payments as described in the instructions. </p> 
    <p> <strong>Participant's Rights:</strong> If you have read this form and have decided to participate in this project, please understand your participation is voluntary and you have the right to withdraw your consent or discontinue participation at any time without penalty or loss of benefits to which you are otherwise entitled. The alternative is not to participate. You have the right to refuse to answer particular questions. The results of this research study may be presented at scientific or professional meetings or published in scientific journals. Your individual privacy will be maintained in all published and written data resulting from the study. In accordance with scientific norms, the data from this study may be used or shared with other researchers for future research (after removing personally identifying information) without additional consent from you. </p> 
    <p> <strong>Contact Information:</strong> If you have any questions, concerns or complaints about this research, its procedures, risks and benefits, contact the Protocol Director, Robert Hawkins (<a href="mailto:rdhawkins@stanford.edu">rdhawkins@stanford.edu</a>, 217-549-6923). </p> 
    <p> <strong>Independant Contact:</strong> If you are not satisfied with how this study is being conducted, or if you have any concerns, complaints, or general questions about the research or your rights as a participant, please contact the Stanford Institutional Review Board (IRB) to speak to someone independent of the research team at 650-723-2480 or toll free at 1-866-680-2906, or email at irbnonmed@stanford.edu. You can also write to the Stanford IRB, Stanford University, 1705 El Camino Real, Palo Alto, CA 94306. Please save or print a copy of this page for your records. </p> 
    <p> <strong>If you agree to participate in this research, please click "I agree"</strong> </p></br> </div>`,
  choices: ["I agree", "I do not agree"],
  button_html: function (choice, choice_index) {
    const buttonClass =
      choice_index === 0 ? "consent-button agree" : "consent-button disagree";
    return `<button class="${buttonClass}">${choice}</button>`;
  },
  data: {
    trial_type: "consent",
  },
  on_finish: function (data) {
    // Record consent response
    // response is the index of the button clicked (0 = "I agree", 1 = "I do not agree")
    data.consent_response = data.response === 0 ? "agree" : "disagree";
    data.consent_timestamp = new Date().toISOString();

    // If participant does not agree, end experiment
    if (data.response === 1) {
      // "I do not agree" is the second button (index 1)
      jsPsych.endExperiment(`
        <div class="instruction-text">
          <h2>Thank you</h2>
          <p>You have chosen not to participate. Thank you for your time.</p>
        </div>
      `);
    }
  },
};

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
      <p>The study takes about <strong>40–50 minutes</strong>. Please make sure you are in a quiet place and will not be interrupted.</p>
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
// The 14 words (28 forms, counting singualr and plural) are divided into 7 sets of 4 (2 singular + 2 plural, distinct stems).
// For each set: passive exposure × 4, then forced-choice × 4 (all words).
// The whole sequence is repeated once (2 total reps per word).
// Condition determines which suffix appears on plural words.

function getSuffix(word) {
  return condition === "Exposure"
    ? word.exposed_suffix
    : word.notexposed_suffix;
}

function buildStage1Sets() {
  // Step 1: Create all 28 forms (14 roots × 2 forms)
  const allForms = [];
  for (const word of vocabulary) {
    allForms.push({ word, isPlural: false });
    allForms.push({ word, isPlural: true });
  }

  let tries = 0;
  const maxTries = 1000;
  let bestSets = null;

  // Step 2: Try to divide into 7 sets of 4, each with 2 singular, 2 plural, 4 distinct roots
  while (tries < maxTries) {
    tries++;
    const pool = shuffle([...allForms]);
    const sets = [];
    let success = true;
    for (let s = 0; s < 7; s++) {
      // Try to pick 4 forms: 2 singular, 2 plural, all distinct roots
      let set = [];
      let usedRoots = new Set();
      let singulars = pool.filter(
        (f) => !f.isPlural && !usedRoots.has(f.word.root),
      );
      let plurals = pool.filter(
        (f) => f.isPlural && !usedRoots.has(f.word.root),
      );
      if (singulars.length < 2 || plurals.length < 2) {
        success = false;
        break;
      }
      // Pick 2 singulars
      const s1 = singulars[0];
      usedRoots.add(s1.word.root);
      const s2 = singulars.find((f) => !usedRoots.has(f.word.root));
      if (!s2) {
        success = false;
        break;
      }
      usedRoots.add(s2.word.root);
      // Pick 2 plurals
      const p1 = plurals.find((f) => !usedRoots.has(f.word.root));
      if (!p1) {
        success = false;
        break;
      }
      usedRoots.add(p1.word.root);
      const p2 = plurals.find((f) => !usedRoots.has(f.word.root));
      if (!p2) {
        success = false;
        break;
      }
      usedRoots.add(p2.word.root);
      set = [s1, s2, p1, p2];
      // Remove these forms from pool
      for (const f of set) {
        const idx = pool.findIndex(
          (ff) => ff.word.root === f.word.root && ff.isPlural === f.isPlural,
        );
        if (idx !== -1) pool.splice(idx, 1);
      }
      sets.push(shuffle(set));
    }
    if (success && pool.length === 0) {
      bestSets = sets;
      break;
    }
  }
  if (!bestSets) {
    throw new Error(
      "Could not partition forms into 7 valid sets after many tries.",
    );
  }
  return shuffle(bestSets);
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

function buildForcedChoiceTrial(word, suffix, isPlural, phase) {
  // Stem identification: both options carry the same suffix (or none for singular),
  // differing only in the stem. NoExposure participants never see -nup in Stage 1.
  const correctWord = isPlural ? `${word.root}${suffix}` : word.root;
  const foilWord = isPlural ? `${word.foil}${suffix}` : word.foil;
  const imageFile = isPlural ? word.plural_image : word.singular_image;
  const options = shuffle([correctWord, foilWord]);
  const correctIndex = options.indexOf(correctWord);

  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="trial-box">
        ${img(imageFile, "stim-image")}
        <p class="instr-text">Which word matches this picture?</p>
      </div>`,
    choices: options,
    data: {
      task: "forced_choice",
      phase: phase,
      word_root: word.root,
      is_plural: isPlural,
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

  // 2 reps * 7 sets * 4 words * 2 trial types (exposure + forced-choice) = 112 trials (plus feedback).
  // matches paper specifications
  for (let rep = 0; rep < 2; rep++) {
    const sets = buildStage1Sets();

    for (const wordSet of sets) {
      // Passive exposure: 4 trials (one assigned form per word), shuffled
      const exposureTrials = wordSet.map(({ word, isPlural }) => {
        const suffix = getSuffix(word);
        return buildPassiveExposureTrial(
          word,
          isPlural,
          isPlural ? suffix : null,
          "stage1",
        );
      });
      shuffle(exposureTrials).forEach((t) => timeline.push(t));

      // Forced-choice: 4 trials (same form assignments), reshuffled independently
      for (const { word, isPlural } of shuffle([...wordSet])) {
        const suffix = getSuffix(word);
        const correctWord = isPlural ? `${word.root}${suffix}` : word.root;
        timeline.push(buildForcedChoiceTrial(word, suffix, isPlural, "stage1"));
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

// Build stage 2 sets, same idea as stage 1 but now with species dimension added
function buildSpeciesSets(species) {
  const allForms = [];
  for (const word of vocabulary) {
    allForms.push({ word, isPlural: false, species });
    allForms.push({ word, isPlural: true, species });
  }

  let tries = 0;
  const maxTries = 1000;

  while (tries < maxTries) {
    tries++;
    const pool = shuffle([...allForms]);
    const sets = [];
    let success = true;

    for (let s = 0; s < 7; s++) {
      const usedRoots = new Set();

      const singulars = pool.filter(
        (f) => !f.isPlural && !usedRoots.has(f.word.root),
      );
      if (singulars.length < 2) {
        success = false;
        break;
      }
      const s1 = singulars[0];
      usedRoots.add(s1.word.root);
      const s2 = singulars.find((f) => !usedRoots.has(f.word.root));
      if (!s2) {
        success = false;
        break;
      }
      usedRoots.add(s2.word.root);

      const plurals = pool.filter(
        (f) => f.isPlural && !usedRoots.has(f.word.root),
      );
      if (plurals.length < 2) {
        success = false;
        break;
      }
      const p1 = plurals[0];
      usedRoots.add(p1.word.root);
      const p2 = plurals.find((f) => !usedRoots.has(f.word.root));
      if (!p2) {
        success = false;
        break;
      }

      const set = [s1, s2, p1, p2];
      for (const f of set) {
        const idx = pool.findIndex(
          (ff) => ff.word.root === f.word.root && ff.isPlural === f.isPlural,
        );
        if (idx !== -1) pool.splice(idx, 1);
      }
      sets.push(shuffle(set));
    }

    if (success && pool.length === 0) return shuffle(sets);
  }

  throw new Error(
    `buildSpeciesSets(${species}): could not partition after ${maxTries} tries.`,
  );
}

function buildStage2Sets() {
  // Build 7 valid sets of 4 independently for Gulu and Norl, then zip them together.
  // Each combined set has 8 items: 4 Gulu (2 singular + 2 plural, distinct roots) +
  // 4 Norl (2 singular + 2 plural, distinct roots).
  // Roots are not required to be unique across species within the same combined set.
  const guluSets = buildSpeciesSets("Gulu");
  const norlSets = buildSpeciesSets("Norl");
  return guluSets.map((guluSet, i) => shuffle([...guluSet, ...norlSets[i]]));
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
        <div class="stage2-pair">
          <div class="stage2-item">
            ${img(alienImage, "stim-image")}
            <span class="species-label ${labelClass}">${species}</span>
          </div>
          <div class="stage2-item">
            ${img(imageFile, "stim-image")}
            <div class="word-display">${displayWord}</div>
          </div>
        </div>
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

function buildForcedChoiceTrial2(word, suffix, isPlural, species, phase) {
  // Stem identification: foil carries the same suffix (or none for singular),
  // differing only in stem. Alien speaker is shown alongside the image.
  const correctWord = isPlural ? `${word.root}${suffix}` : word.root;
  const foilWord = isPlural ? `${word.foil}${suffix}` : word.foil;
  const imageFile = isPlural ? word.plural_image : word.singular_image;
  const options = shuffle([correctWord, foilWord]);
  const correctIndex = options.indexOf(correctWord);
  const alienImage = pick(aliens.find((a) => a.name === species).images);
  const labelClass = species === "Gulu" ? "gulu-label" : "norl-label";

  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div class="trial-box stage2-trial">
        <div class="stage2-pair">
          <div class="stage2-item">
            ${img(alienImage, "stim-image")}
            <span class="species-label ${labelClass}">${species}</span>
          </div>
          <div class="stage2-item">
            ${img(imageFile, "stim-image")}
            <p class="instr-text">Which word did the ${species} use?</p>
          </div>
        </div>
      </div>`,
    choices: options,
    data: {
      task: "forced_choice",
      phase: phase,
      word_root: word.root,
      is_plural: isPlural,
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

  // Each combined set has 8 trials (4 Gulu + 4 Norl).
  // Per rep: ~7 sets × (8 exposure + 8 FC) = ~112 trials.
  // 2 reps × ~112 = ~224 trials total.
  // Sets are re-randomised each rep (new greedy draws for both species).
  for (let rep = 0; rep < 2; rep++) {
    const sets = buildStage2Sets();

    for (const wordSet of sets) {
      // Passive exposure: 8 trials (4 Gulu + 4 Norl), shuffled together
      const exposureTrials = wordSet.map(({ word, isPlural, species }) => {
        const suffix = species === "Gulu" ? word.gulu_suffix : word.norl_suffix;
        return buildPassiveExposureTrial2(
          word,
          isPlural,
          isPlural ? suffix : null,
          species,
          "stage2",
        );
      });
      shuffle(exposureTrials).forEach((t) => timeline.push(t));

      // Forced-choice: 8 trials (4 Gulu + 4 Norl), reshuffled independently
      for (const { word, isPlural, species } of shuffle([...wordSet])) {
        const suffix = species === "Gulu" ? word.gulu_suffix : word.norl_suffix;
        const correctWord = isPlural ? `${word.root}${suffix}` : word.root;
        timeline.push(
          buildForcedChoiceTrial2(word, suffix, isPlural, species, "stage2"),
        );
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
      <p>There are two short tasks. In the first, you'll see an alien and an image, and you'll select which word you think that alien would use. In the second, you'll see an image and a word, and you'll select which alien you think said that word.</p>
      </p><strong>No feedback</strong> will be given this time, just answer as best you can.</p>
      <p>Some of the words may be ones you have not seen before. That is fine, use your best judgment.</p>
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

function buildSuffixSelectionTrial(word, species, isNovel, rep) {
  const alienImage = testAliens[species.toLowerCase()];
  const labelClass = species === "Gulu" ? "gulu-label" : "norl-label";

  let stimulusHTML;
  if (isNovel) {
    // Novel words: singular (labelled) on left, plural image with "?" on right
    stimulusHTML = `
      <div class="trial-box">
        <div class="stage2-pair">
          <div class="stage2-item">
            ${img(alienImage, "stim-image")}
            <span class="species-label ${labelClass}">${species}</span>
          </div>
          <div class="stage2-item">
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
          </div>
        </div>
        <p class="instr-text">Which word would this ${species} use?</p>
      </div>`;
  } else {
    // Old words: show plural image directly (stem known from training)
    stimulusHTML = `
      <div class="trial-box">
        <div class="stage2-pair">
          <div class="stage2-item">
            ${img(alienImage, "stim-image")}
            <span class="species-label ${labelClass}">${species}</span>
          </div>
          <div class="stage2-item">
            ${img(word.plural_image, "stim-image")}
          </div>
        </div>
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

  const options = ["Gulu", "Norl"];
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
            ${img(testAliens["gulu"], "alien-medium")}
            <span class="species-label gulu-label">Gulu</span>
          </div>
          <div class="alien-option">
            ${img(testAliens["norl"], "alien-medium")}
            <span class="species-label norl-label">Norl</span>
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
// DATA SAVE + END SCREEn
// ─────────────────────────────────────────────────────────────────────────────

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
      <h2>You're done!</h2>
      <p>Thank you for completing this study. Your data has been saved.</p>
      <p>Your completion code is: CWZA9TKT</p>
      <p>You may now close this window.</p>
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
  consent_trial,
  welcome,
  instructions_stage1,
  ...stage1,
  ...alienFam,
  instructions_stage2,
  ...stage2,
  instructions_test,
  ...suffixTask,
  ...alienTask,
  save_data,
  end_screen,
];

jsPsych.run(timeline);
