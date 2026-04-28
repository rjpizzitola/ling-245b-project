/*
FIRST LEARNING PHASE: Learning without aliens

Structure from paper:
- 14 root words
- each appears in:
    - singular form
    - plural form (suffix: either -nup or -dup)(this is what is manipulated in stage 1, whether participants see -nup at all)
- total = 28 words

Words are divided into:
- 7 sets of 4 words each
- each set must contain:
    - 2 singular words
    - 2 plural words
    - all different stems

For each set:
1. Passive exposure trials
   - show object/word pair
   - participant told to memorize and clicks CONTINUE

2. Forced-choice trials
   - show image
   - choose between:
        a) correct word
        b) foil word (same suffix, altered stem)

Then:
- all 7 sets completed
- entire process repeated once
*/

// ROOT WORDS
const rootWords = [
  "nesel",
  "laniz",
  "wumos",
  "maqub",
  "firot",
  "tugan",
  "wukin",
  "jemulok",
  "nuwik",
  "sehilod",
  "gequzis",
  "takoles",
  "falon",
  "hiwen",
];

/*
SUFFIX ASSIGNMENT

Paper does not specify which roots take -nup vs -dup in the first learning phase for the Exposure group.

For now:
- manually assign half to -nup and half to -dup
- this is the part that is manipulated between experimental groups, the nonExposure group will not see -nup at all. But I'm not sure how often/with which words the Exposure group sees it.
*/

const pluralSuffixMap = {
  nesel: "nup",
  laniz: "dup",
  wumos: "nup",
  maqub: "dup",
  firot: "nup",
  tugan: "dup",
  wukin: "nup",
  jemulok: "dup",
  nuwik: "nup",
  sehilod: "dup",
  gequzis: "nup",
  takoles: "dup",
  falon: "nup",
  hiwen: "dup",
};

/*
IMAGE MAPPING

The publication does not include images, so I will need to make them myself. I don't have time to do it right now though.
*/

const imageMap = {
  nesel: {
    singularImage: "images/nesel_singular_placeholder.png",
    pluralImage: "images/nesel_plural_placeholder.png",
  },

  laniz: {
    singularImage: "images/laniz_singular_placeholder.png",
    pluralImage: "images/laniz_plural_placeholder.png",
  },

  wumos: {
    singularImage: "images/wumos_singular_placeholder.png",
    pluralImage: "images/wumos_plural_placeholder.png",
  },

  maqub: {
    singularImage: "images/maqub_singular_placeholder.png",
    pluralImage: "images/maqub_plural_placeholder.png",
  },

  firot: {
    singularImage: "images/firot_singular_placeholder.png",
    pluralImage: "images/firot_plural_placeholder.png",
  },

  tugan: {
    singularImage: "images/tugan_singular_placeholder.png",
    pluralImage: "images/tugan_plural_placeholder.png",
  },

  wukin: {
    singularImage: "images/wukin_singular_placeholder.png",
    pluralImage: "images/wukin_plural_placeholder.png",
  },

  jemulok: {
    singularImage: "images/jemulok_singular_placeholder.png",
    pluralImage: "images/jemulok_plural_placeholder.png",
  },

  nuwik: {
    singularImage: "images/nuwik_singular_placeholder.png",
    pluralImage: "images/nuwik_plural_placeholder.png",
  },

  sehilod: {
    singularImage: "images/sehilod_singular_placeholder.png",
    pluralImage: "images/sehilod_plural_placeholder.png",
  },

  gequzis: {
    singularImage: "images/gequzis_singular_placeholder.png",
    pluralImage: "images/gequzis_plural_placeholder.png",
  },

  takoles: {
    singularImage: "images/takoles_singular_placeholder.png",
    pluralImage: "images/takoles_plural_placeholder.png",
  },

  falon: {
    singularImage: "images/falon_singular_placeholder.png",
    pluralImage: "images/falon_plural_placeholder.png",
  },

  hiwen: {
    singularImage: "images/hiwen_singular_placeholder.png",
    pluralImage: "images/hiwen_plural_placeholder.png",
  },
};

//BUILD SINGULAR + PLURAL FORMS
const lexicalItems = rootWords.map((root) => {
  const suffix = pluralSuffixMap[root];

  return {
    root: root,
    singular: root,
    plural: `${root}${suffix}`,
    pluralSuffix: suffix,

    singularImage: imageMap[root].singularImage,
    pluralImage: imageMap[root].pluralImage,
  };
});

/*
FIXED 7 WORD SETS

Each set contains:
- 2 singular
- 2 plural
- all different stems

Randomize set/word order later in experiment.js

I'm really not sure that this is the way to do it, but coding it up a different way feels challenging right now.
*/

const firstLearningSets = [
  [
    { root: "nesel", form: "singular" },
    { root: "laniz", form: "singular" },
    { root: "wumos", form: "plural" },
    { root: "maqub", form: "plural" },
  ],
  [
    { root: "firot", form: "singular" },
    { root: "tugan", form: "singular" },
    { root: "wukin", form: "plural" },
    { root: "jemulok", form: "plural" },
  ],
  [
    { root: "nuwik", form: "singular" },
    { root: "sehilod", form: "singular" },
    { root: "gequzis", form: "plural" },
    { root: "takoles", form: "plural" },
  ],
  [
    { root: "falon", form: "singular" },
    { root: "hiwen", form: "singular" },
    { root: "nesel", form: "plural" },
    { root: "laniz", form: "plural" },
  ],
  [
    { root: "wumos", form: "singular" },
    { root: "maqub", form: "singular" },
    { root: "firot", form: "plural" },
    { root: "tugan", form: "plural" },
  ],
  [
    { root: "wukin", form: "singular" },
    { root: "jemulok", form: "singular" },
    { root: "nuwik", form: "plural" },
    { root: "sehilod", form: "plural" },
  ],
  [
    { root: "gequzis", form: "singular" },
    { root: "takoles", form: "singular" },
    { root: "falon", form: "plural" },
    { root: "hiwen", form: "plural" },
  ],
];

// HELPERS
function getWordForm(root, formType) {
  const item = lexicalItems.find((item) => item.root === root);

  if (formType === "singular") {
    return item.singular;
  }

  if (formType === "plural") {
    return item.plural;
  }

  return null;
}

function getImageForm(root, formType) {
  const item = lexicalItems.find((item) => item.root === root);

  if (formType === "singular") {
    return item.singularImage;
  }

  if (formType === "plural") {
    return item.pluralImage;
  }

  return null;
}

/*
EXPORTS

For use in experiment.js

We haven't done it this way in class demos before, but this is the way I'm used to doing things at my Corporate Tech Jobs (cringe). And since I'm doing a ton of guesswork already I thought well, might as well do what I'm comfy with.

*/

const firstLearningStimuli = firstLearningSets.map((set) => {
  return set.map((item) => ({
    root: item.root,
    form: item.form,
    word: getWordForm(item.root, item.form),
    image: getImageForm(item.root, item.form),
  }));
});
