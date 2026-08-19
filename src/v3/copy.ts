import type { Locale, PathNumber } from "../i18n";

export const V3_CLOUD_ARCHETYPE_IDS = ["thin", "layered", "soft", "flowing"] as const;
export type V3CloudArchetypeId = (typeof V3_CLOUD_ARCHETYPE_IDS)[number];

export const V3_ZODIAC_IDS = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
] as const;
export type V3ZodiacId = (typeof V3_ZODIAC_IDS)[number];

export const V3_PREFERENCE_QUESTION_IDS = ["ei", "sn", "tf", "jp"] as const;
export type V3PreferenceQuestionId = (typeof V3_PREFERENCE_QUESTION_IDS)[number];

export const V3_PERSONALITY_DIMENSION_IDS = ["E", "I", "S", "N", "T", "F", "J", "P"] as const;
export type V3PersonalityDimensionId = (typeof V3_PERSONALITY_DIMENSION_IDS)[number];

export const V3_STATE_CELL_IDS = [
  "low-low",
  "low-mid",
  "low-high",
  "mid-low",
  "mid-mid",
  "mid-high",
  "high-low",
  "high-mid",
  "high-high",
] as const;
export type V3StateCellId = (typeof V3_STATE_CELL_IDS)[number];

export const V3_KEYWORD_IDS = [
  "pause",
  "clarity",
  "grounding",
  "gentleness",
  "connection",
  "focus",
  "momentum",
  "openness",
  "balance",
] as const;
export type V3KeywordId = (typeof V3_KEYWORD_IDS)[number];

export const V3_FAVOUR_IDS = [
  "one-small-thing",
  "quiet-time",
  "gentle-company",
  "tidy-a-corner",
  "slow-walk",
  "write-it-down",
  "finish-one-thing",
  "ask-for-help",
  "leave-margin",
  "make-something",
  "rest-early",
  "simple-rhythm",
] as const;
export type V3FavourId = (typeof V3_FAVOUR_IDS)[number];

export const V3_EASE_OFF_IDS = [
  "new-commitments",
  "too-many-starts",
  "forced-answers",
  "comparison",
  "overexplaining",
  "rushing",
  "perfection",
  "heavy-conversations",
  "late-plans",
] as const;
export type V3EaseOffId = (typeof V3_EASE_OFF_IDS)[number];

export const V3_ADVICE_IDS = [
  "i-low-energy",
  "e-low-energy",
  "s-low-mood",
  "n-low-mood",
  "t-overloaded",
  "f-overloaded",
  "j-uncertain",
  "p-scattered",
  "balanced-momentum",
] as const;
export type V3AdviceId = (typeof V3_ADVICE_IDS)[number];

export type V3AmbientModeId = "ocean" | "rain";
export type V3DurationSeconds = 60 | 300;

interface V3ChoiceCopy {
  name: string;
  description: string;
}

interface V3PreferenceOptionCopy {
  value: V3PersonalityDimensionId;
  label: string;
}

interface V3PreferenceQuestionCopy {
  question: string;
  options: readonly [V3PreferenceOptionCopy, V3PreferenceOptionCopy];
}

interface V3ScaleCopy {
  question: string;
  groupLabel: string;
  lowAnchor: string;
  middleAnchor: string;
  highAnchor: string;
  valueLabel: string;
}

interface V3StateFragmentCopy {
  summary: string;
  visualDescription: string;
}

export interface V3Copy {
  brand: {
    lockup: string;
    productName: string;
    englishName: string;
    homeLabel: string;
    promise: string;
  };
  navigation: {
    label: string;
    home: string;
    today: string;
    growth: string;
    about: string;
    preferences: string;
    skipToContent: string;
    openMenu: string;
    closeMenu: string;
  };
  language: {
    label: string;
    chinese: string;
    english: string;
    switchToChinese: string;
    switchToEnglish: string;
  };
  common: {
    back: string;
    continue: string;
    confirm: string;
    cancel: string;
    close: string;
    save: string;
    edit: string;
    optional: string;
    selected: string;
    of: string;
  };
  builder: {
    pageTitle: string;
    openingLine: string;
    progressLabel: string;
    birthDate: {
      question: string;
      supporting: string;
      monthLabel: string;
      monthPlaceholder: string;
      dayLabel: string;
      dayPlaceholder: string;
      confirm: string;
      discovered: string;
      change: string;
    };
    zodiac: Readonly<Record<V3ZodiacId, { name: string; glyph: string }>>;
    clouds: {
      question: string;
      supporting: string;
      groupLabel: string;
      previewLabel: string;
      selectedAnnouncement: string;
      continue: string;
      options: Readonly<Record<V3CloudArchetypeId, V3ChoiceCopy>>;
    };
    worlds: {
      question: string;
      supporting: string;
      groupLabel: string;
      previewLabel: string;
      selectedAnnouncement: string;
      confirm: string;
      options: Readonly<Record<PathNumber, V3ChoiceCopy>>;
    };
    seed: {
      title: string;
      body: string;
      description: string;
    };
    firstBreathing: {
      eyebrow: string;
      title: string;
      body: string;
      soundQuestion: string;
      ocean: string;
      rain: string;
      begin: string;
      skip: string;
      skipLabel: string;
      progressLabel: string;
      timeRemaining: string;
      reducedMotion: string;
      completeTitle: string;
      completeBody: string;
      zeroLeaves: string;
    };
  };
  nickname: {
    eyebrow: string;
    question: string;
    supporting: string;
    label: string;
    placeholder: string;
    characterCount: string;
    localOnly: string;
    skip: string;
    continue: string;
    welcomeNamed: string;
    welcomeNeutral: string;
    rooted: string;
  };
  preferences: {
    eyebrow: string;
    title: string;
    intro: string;
    questionOf: string;
    groupLabel: string;
    questions: Readonly<Record<V3PreferenceQuestionId, V3PreferenceQuestionCopy>>;
    resultEyebrow: string;
    closestTo: string;
    resultNote: string;
    continue: string;
  };
  daily: {
    pageTitle: string;
    greetingNamed: string;
    greetingNeutral: string;
    invitation: string;
    mood: V3ScaleCopy;
    energy: V3ScaleCopy;
    continue: string;
    saved: string;
    update: string;
    updated: string;
  };
  reading: {
    pageTitle: string;
    baselineHeading: string;
    stateHeading: string;
    symbolicHeading: string;
    suitedHeading: string;
    keyword: string;
    favour: string;
    easeOff: string;
    symbolicNote: string;
  };
  session: {
    eyebrow: string;
    title: string;
    intro: string;
    durationLabel: string;
    oneMinute: string;
    fiveMinutes: string;
    soundLabel: string;
    ocean: string;
    oceanDescription: string;
    rain: string;
    rainDescription: string;
    begin: string;
    mute: string;
    unmute: string;
    volume: string;
    exit: string;
    exitHint: string;
    progressLabel: string;
    timeRemaining: string;
    completeTitle: string;
    leafGrown: string;
    completeBody: string;
    returnToWorld: string;
    endedEarly: string;
    noLeaf: string;
  };
  growth: {
    pageTitle: string;
    eyebrow: string;
    title: string;
    intro: string;
    treeHeading: string;
    leafCount: string;
    sessionCount: string;
    totalMinutes: string;
    recentSessions: string;
    noSessionsTitle: string;
    noSessionsBody: string;
    oneLeafMeaning: string;
    noStreaks: string;
  };
  about: {
    pageTitle: string;
    eyebrow: string;
    title: string;
    intro: string;
    truthsHeading: string;
    truthClaims: readonly string[];
    privacyHeading: string;
    privacyBody: string;
    boundariesHeading: string;
    boundariesBody: string;
    clearHeading: string;
    clearBody: string;
    clearAction: string;
    clearConfirmTitle: string;
    clearConfirmBody: string;
    clearConfirmAction: string;
  };
  preferenceSettings: {
    pageTitle: string;
    eyebrow: string;
    title: string;
    intro: string;
    current: string;
    revisit: string;
    save: string;
    saved: string;
  };
  errors: {
    invalidDate: string;
    incompleteDate: string;
    chooseCloud: string;
    chooseWorld: string;
    choosePreference: string;
    chooseMood: string;
    chooseEnergy: string;
    missingProfile: string;
    storageUnavailable: string;
    storageRead: string;
    storageWrite: string;
    corruptData: string;
    audioUnavailable: string;
    sessionInterrupted: string;
    generic: string;
  };
  accessibility: {
    worldScene: string;
    emptySky: string;
    zodiacMotif: string;
    cloudPreview: string;
    worldPreview: string;
    seed: string;
    bareTree: string;
    treeWithLeaves: string;
    leafCount: string;
    birthDialog: string;
    breathingDialog: string;
    closeDialog: string;
    selectedOption: string;
    scaleInstructions: string;
    currentStep: string;
    progress: string;
    audioControls: string;
  };
  semantics: {
    keywords: Readonly<Record<V3KeywordId, string>>;
    favour: Readonly<Record<V3FavourId, string>>;
    easeOff: Readonly<Record<V3EaseOffId, string>>;
    advice: Readonly<Record<V3AdviceId, string>>;
    states: Readonly<Record<V3StateCellId, V3StateFragmentCopy>>;
    personalityDimensions: Readonly<Record<V3PersonalityDimensionId, string>>;
  };
}

export const V3_COPY: Readonly<Record<Locale, V3Copy>> = {
  en: {
    brand: {
      lockup: "九境生息 · Ninefold",
      productName: "Ninefold",
      englishName: "Ninefold",
      homeLabel: "Ninefold home",
      promise: "Return for a moment. Leave a little growth.",
    },
    navigation: {
      label: "Primary navigation",
      home: "Home",
      today: "Today",
      growth: "Growth",
      about: "About",
      preferences: "Preferences",
      skipToContent: "Skip to content",
      openMenu: "Open navigation",
      closeMenu: "Close navigation",
    },
    language: {
      label: "Choose language",
      chinese: "中文",
      english: "EN",
      switchToChinese: "Switch to Simplified Chinese",
      switchToEnglish: "Switch to English",
    },
    common: {
      back: "Back",
      continue: "Continue",
      confirm: "Confirm",
      cancel: "Cancel",
      close: "Close",
      save: "Save",
      edit: "Edit",
      optional: "Optional",
      selected: "Selected",
      of: "of",
    },
    builder: {
      pageTitle: "Create my Ninefold",
      openingLine: "Begin with an empty sky.",
      progressLabel: "World-building progress",
      birthDate: {
        question: "What day were you born?",
        supporting: "Month and day are enough. No year is needed.",
        monthLabel: "Birth month",
        monthPlaceholder: "Month",
        dayLabel: "Birth day",
        dayPlaceholder: "Day",
        confirm: "Place my stars",
        discovered: "{glyph} {sign} has appeared in your sky.",
        change: "Change birth day",
      },
      zodiac: {
        aries: { name: "Aries", glyph: "♈" },
        taurus: { name: "Taurus", glyph: "♉" },
        gemini: { name: "Gemini", glyph: "♊" },
        cancer: { name: "Cancer", glyph: "♋" },
        leo: { name: "Leo", glyph: "♌" },
        virgo: { name: "Virgo", glyph: "♍" },
        libra: { name: "Libra", glyph: "♎" },
        scorpio: { name: "Scorpio", glyph: "♏" },
        sagittarius: { name: "Sagittarius", glyph: "♐" },
        capricorn: { name: "Capricorn", glyph: "♑" },
        aquarius: { name: "Aquarius", glyph: "♒" },
        pisces: { name: "Pisces", glyph: "♓" },
      },
      clouds: {
        question: "What kind of clouds belong in your sky?",
        supporting: "Try each one. Your sky changes as you choose.",
        groupLabel: "Choose a cloud form",
        previewLabel: "Preview {cloud} in my sky",
        selectedAnnouncement: "{cloud} now belongs to your sky.",
        continue: "Keep these clouds",
        options: {
          thin: { name: "Feather clouds", description: "High, fine lines that leave the horizon open." },
          layered: { name: "Layered clouds", description: "Long quiet bands resting across the sky." },
          soft: { name: "Soft clouds", description: "Rounded forms with a gentle, full presence." },
          flowing: { name: "Wind-drawn clouds", description: "Loose trails that carry movement through the scene." },
        },
      },
      worlds: {
        question: "Which world feels like yours?",
        supporting: "Each world holds a different tree, land and horizon.",
        groupLabel: "Choose one of nine worlds",
        previewLabel: "Preview {world}",
        selectedAnnouncement: "{world} is taking shape.",
        confirm: "Plant a seed here",
        options: {
          1: { name: "Dawn Ridge", description: "An ascending tree on land that opens toward first light." },
          2: { name: "Confluence Meadow", description: "Meeting branches beside two gentle currents." },
          3: { name: "Windvoice Hill", description: "Expressive branches rising from a resonant slope." },
          4: { name: "Stone Terrace", description: "A steady crown rooted in patient layers of earth." },
          5: { name: "Riverbend", description: "A flexible tree following the shape of moving water." },
          6: { name: "Sheltering Grove", description: "Protective branches gathered around fertile ground." },
          7: { name: "Quiet Mirror", description: "An inward tree reflected in a still, spacious lake." },
          8: { name: "Far Horizon", description: "A clear trunk reaching toward a wide illuminated distance." },
          9: { name: "Returning Plain", description: "Many branches resolving into one balanced whole." },
        },
      },
      seed: {
        title: "Your world is ready for its first breath.",
        body: "The land will remain. For now, only a small seed marks where your tree will grow.",
        description: "A small seed resting at the future tree’s roots.",
      },
      firstBreathing: {
        eyebrow: "First Breathing · 1 minute",
        title: "Stay with it as it grows.",
        body: "Choose one sound. The seed will become your bare tree over one quiet minute.",
        soundQuestion: "What should accompany this first breath?",
        ocean: "Ocean",
        rain: "Rain",
        begin: "Begin",
        skip: "Skip animation",
        skipLabel: "Skip the tree-birth animation and continue with the same bare tree",
        progressLabel: "Tree-birth progress",
        timeRemaining: "{seconds} seconds remain",
        reducedMotion: "The tree will appear through a brief, gentle reveal.",
        completeTitle: "Your tree has taken root.",
        completeBody: "Its branches are here. Leaves will come from the moments you complete later.",
        zeroLeaves: "Bare tree · 0 leaves",
      },
    },
    nickname: {
      eyebrow: "A place to return to",
      question: "What should this Ninefold call you?",
      supporting: "A short nickname is enough.",
      label: "Nickname",
      placeholder: "How you would like to be called",
      characterCount: "{count} of {limit} characters",
      localOnly: "Kept only in this browser.",
      skip: "Continue without a name",
      continue: "Enter my Ninefold",
      welcomeNamed: "{name}, welcome to your Ninefold.",
      welcomeNeutral: "Welcome to your Ninefold.",
      rooted: "Your tree has taken root.",
    },
    preferences: {
      eyebrow: "A little about your preferences",
      title: "A little about how you tend to move through the world.",
      intro: "Four quick choices.",
      questionOf: "Question {current} of 4",
      groupLabel: "Choose the answer that feels closer",
      questions: {
        ei: {
          question: "After a long day, where do you usually recover your energy?",
          options: [
            { value: "E", label: "Being with people, talking it out" },
            { value: "I", label: "Having time alone, thinking quietly" },
          ],
        },
        sn: {
          question: "When something is unfamiliar, what do you notice first?",
          options: [
            { value: "S", label: "Facts, details, what is concretely happening" },
            { value: "N", label: "Patterns, connections, what else might be possible" },
          ],
        },
        tf: {
          question: "When making an important decision, what do you consider first?",
          options: [
            { value: "T", label: "Logic, consistency and trade-offs" },
            { value: "F", label: "Values, relationships and how people are affected" },
          ],
        },
        jp: {
          question: "When things are still undecided, which feels more comfortable?",
          options: [
            { value: "J", label: "Settle a direction and move with a plan" },
            { value: "P", label: "Keep options open and adjust as you go" },
          ],
        },
      },
      resultEyebrow: "Your preference pattern",
      closestTo: "Your four-dimensional preferences are closest to {code}",
      resultNote: "This is a lightweight reflection, not an official MBTI assessment.",
      continue: "See how I am today",
    },
    daily: {
      pageTitle: "Today in my Ninefold",
      greetingNamed: "Welcome back, {name}.",
      greetingNeutral: "Welcome back.",
      invitation: "How are you today?",
      mood: {
        question: "How does your mood feel right now?",
        groupLabel: "Mood from 1 to 9",
        lowAnchor: "1 · very low",
        middleAnchor: "5 · neutral",
        highAnchor: "9 · very good",
        valueLabel: "Mood {value} of 9",
      },
      energy: {
        question: "How much energy do you have right now?",
        groupLabel: "Energy from 1 to 9",
        lowAnchor: "1 · almost empty",
        middleAnchor: "5 · moderate",
        highAnchor: "9 · very energised",
        valueLabel: "Energy {value} of 9",
      },
      continue: "See today’s reading",
      saved: "Today’s check-in is saved in this browser.",
      update: "Update today’s check-in",
      updated: "Today’s reading has been updated.",
    },
    reading: {
      pageTitle: "Today’s reading",
      baselineHeading: "Your baseline",
      stateHeading: "Today’s state",
      symbolicHeading: "Ninefold reading",
      suitedHeading: "What may suit you today",
      keyword: "Keyword",
      favour: "Favour",
      easeOff: "Ease off",
      symbolicNote: "A symbolic reflection for entertainment—not an objective prediction.",
    },
    session: {
      eyebrow: "Leave a moment",
      title: "Breathe with your world.",
      intro: "Complete either duration and exactly one new leaf will grow.",
      durationLabel: "Choose a duration",
      oneMinute: "Breathe for 1 minute",
      fiveMinutes: "Breathe for 5 minutes",
      soundLabel: "Choose a soundscape",
      ocean: "Ocean",
      oceanDescription: "Slow, low waves with room between them.",
      rain: "Rain",
      rainDescription: "A soft rain bed with a light surface texture.",
      begin: "Begin breathing",
      mute: "Mute",
      unmute: "Unmute",
      volume: "Ambient volume",
      exit: "Leave session",
      exitHint: "Press Escape at any time to leave safely.",
      progressLabel: "Breathing-session progress",
      timeRemaining: "{time} remaining",
      completeTitle: "A new leaf has grown.",
      leafGrown: "+1 leaf",
      completeBody: "This leaf marks one pause you completed here.",
      returnToWorld: "Return to my world",
      endedEarly: "You left the session early.",
      noLeaf: "No leaf was added. Nothing else was lost.",
    },
    growth: {
      pageTitle: "Growth",
      eyebrow: "What the tree remembers",
      title: "Every leaf began with a pause.",
      intro: "Your world grows only when a breathing session reaches its end.",
      treeHeading: "Your Ninefold tree",
      leafCount: "Persistent leaves · {count}",
      sessionCount: "Completed sessions · {count}",
      totalMinutes: "Breathing minutes · {minutes}",
      recentSessions: "Recent sessions",
      noSessionsTitle: "The branches are ready.",
      noSessionsBody: "Complete your first daily breathing session to grow one small leaf.",
      oneLeafMeaning: "One completed session always grows one leaf, whether it lasts one minute or five.",
      noStreaks: "No streaks, missed-day penalties, ranks or coins.",
    },
    about: {
      pageTitle: "About Ninefold",
      eyebrow: "Method and boundaries",
      title: "A local, symbolic practice of noticing.",
      intro: "Ninefold turns a few choices and self-reported feelings into one persistent illustrated world.",
      truthsHeading: "How it works",
      truthClaims: [
        "Your month and day derive a symbolic Western tropical zodiac sign.",
        "Zodiac star motifs are original symbols, not an exact reconstruction of the birth sky.",
        "Cloud and world prototypes are aesthetic choices.",
        "Four preference questions support lightweight self-exploration; they are not an official MBTI assessment.",
        "Mood and energy are your own 1–9 self-reports.",
        "Daily readings are generated deterministically on this device. No remote AI model is called.",
        "Data stays in this browser. Ninefold has no account, analytics, cookies or cloud sync.",
        "The experience is reflective and non-clinical; it does not diagnose or replace professional care.",
        "Each completed breathing session grows exactly one leaf.",
        "There are no streak penalties, coins, ranks or missed-day decay.",
      ],
      privacyHeading: "Local by design",
      privacyBody: "Your nickname, choices, check-ins, readings and session history remain in this browser.",
      boundariesHeading: "A reflection, not a verdict",
      boundariesBody: "Zodiac and preference language are symbolic prompts. Daily guidance stays low-stakes and does not predict objective outcomes.",
      clearHeading: "Reset this Ninefold",
      clearBody: "This removes V3 world and session data only. Earlier Ninefold versions and unrelated website data remain untouched.",
      clearAction: "Clear my V3 data",
      clearConfirmTitle: "Clear this Ninefold world?",
      clearConfirmBody: "Your V3 profile, world, check-ins, readings and leaves will be removed from this browser. This cannot be undone.",
      clearConfirmAction: "Clear V3 data",
    },
    preferenceSettings: {
      pageTitle: "Preferences",
      eyebrow: "Your stable tendency",
      title: "Revisit my preferences",
      intro: "Choose again if your earlier answers no longer feel close. This does not change your tree or its leaves.",
      current: "Current preference code: {code}",
      revisit: "Answer the four questions again",
      save: "Save preferences",
      saved: "Your preferences have been updated.",
    },
    errors: {
      invalidDate: "Choose a real month and day. February 29 is welcome.",
      incompleteDate: "Choose both a month and a day.",
      chooseCloud: "Choose a cloud form to continue.",
      chooseWorld: "Choose a world to plant your seed.",
      choosePreference: "Choose the answer that feels closer before continuing.",
      chooseMood: "Choose how your mood feels from 1 to 9.",
      chooseEnergy: "Choose how much energy you have from 1 to 9.",
      missingProfile: "Create your Ninefold world before opening this page.",
      storageUnavailable: "Browser storage is unavailable. You can continue, but this world may not survive a refresh.",
      storageRead: "Some V3 data could not be read. Ninefold is using safe fallback values.",
      storageWrite: "This change could not be saved. The current screen remains usable.",
      corruptData: "Invalid V3 data was ignored safely. Earlier Ninefold data was not changed.",
      audioUnavailable: "Ambient sound is unavailable in this browser. The visual session can continue in silence.",
      sessionInterrupted: "The session ended before completion, so no leaf was added.",
      generic: "That action did not complete. Try again.",
    },
    accessibility: {
      worldScene: "Your persistent Ninefold world",
      emptySky: "An open sky waiting for its first star pattern, clouds and land.",
      zodiacMotif: "A symbolic {sign} star motif in the sky.",
      cloudPreview: "The sky with {cloud}.",
      worldPreview: "{world}: {description}",
      seed: "A small seed rests where the future tree will grow.",
      bareTree: "A rooted bare tree with branches and no leaves.",
      treeWithLeaves: "Persistent leaves on the same rooted tree: {count}.",
      leafCount: "Leaves grown from completed breathing sessions: {count}.",
      birthDialog: "First breathing and tree birth",
      breathingDialog: "Breathing session",
      closeDialog: "Close dialog",
      selectedOption: "{option}, selected",
      scaleInstructions: "Choose one value from 1 through 9 with the arrow keys or by tapping a number.",
      currentStep: "Current world-building stage: {stage}",
      progress: "{percent} percent complete",
      audioControls: "Ambient-sound controls",
    },
    semantics: {
      keywords: {
        pause: "pause",
        clarity: "clarity",
        grounding: "grounding",
        gentleness: "gentleness",
        connection: "connection",
        focus: "focus",
        momentum: "momentum",
        openness: "openness",
        balance: "balance",
      },
      favour: {
        "one-small-thing": "finish one small thing",
        "quiet-time": "take a quiet moment alone",
        "gentle-company": "spend time with someone easy to be around",
        "tidy-a-corner": "tidy one small corner",
        "slow-walk": "take a slow walk",
        "write-it-down": "write down what matters",
        "finish-one-thing": "finish before starting something new",
        "ask-for-help": "ask for practical help",
        "leave-margin": "leave room between commitments",
        "make-something": "make something without judging it",
        "rest-early": "let the day end a little earlier",
        "simple-rhythm": "keep a simple, familiar rhythm",
      },
      easeOff: {
        "new-commitments": "adding new commitments",
        "too-many-starts": "starting many things at once",
        "forced-answers": "forcing an answer too soon",
        comparison: "measuring today against someone else",
        overexplaining: "explaining more than the moment needs",
        rushing: "turning every task into urgency",
        perfection: "waiting for perfect conditions",
        "heavy-conversations": "taking on a demanding conversation without room",
        "late-plans": "filling the end of the day with plans",
      },
      advice: {
        "i-low-energy": "Explain a little less today and keep one stretch of time undisturbed.",
        "e-low-energy": "You do not need a serious conversation; gentle company may cost less than carrying the day alone.",
        "s-low-mood": "Choose one concrete thing you can see, touch and finish without much effort.",
        "n-low-mood": "Leave one possibility open, but give it a small next step so it does not become another demand.",
        "t-overloaded": "Reduce the number of decisions in front of you and use one clear criterion for the next one.",
        "f-overloaded": "Notice which feelings are yours to hold and which can remain with the people they belong to.",
        "j-uncertain": "Give today one modest plan, then let the rest stay undecided.",
        "p-scattered": "Keep your options, but choose one place to begin before opening another.",
        "balanced-momentum": "Use the energy that is here without spending tomorrow’s reserve.",
      },
      states: {
        "low-low": { summary: "Mood and energy both feel low. Fewer demands may fit today better than forcing a lift.", visualDescription: "A quiet, mist-softened world with slow movement and gentle light." },
        "low-mid": { summary: "Mood is low while some energy remains. Give that energy one kind, bounded direction.", visualDescription: "Soft light beneath a muted horizon with measured movement." },
        "low-high": { summary: "Energy is high while mood is low. Movement may help, provided it does not become pressure.", visualDescription: "A cooler sky with lively wind and clear moving water." },
        "mid-low": { summary: "Mood is steady and energy is limited. A simple rhythm may be enough.", visualDescription: "An even sky with still leaves and a calm, open horizon." },
        "mid-mid": { summary: "Mood and energy are both near the middle. You have room to notice before choosing a direction.", visualDescription: "Balanced daylight, light cloud drift and an open horizon." },
        "mid-high": { summary: "Energy is available and mood is steady. One focused action can carry the day well.", visualDescription: "Clear moving air with warm reflected light and active water." },
        "high-low": { summary: "Mood feels bright while energy is quiet. Enjoy what is here without turning it into a task.", visualDescription: "Warm light held in a peaceful world with very gentle motion." },
        "high-mid": { summary: "Mood is bright and energy is present. Connection or making may feel especially natural.", visualDescription: "Warm open light, soft cloud motion and a responsive landscape." },
        "high-high": { summary: "Mood and energy are both high. Give the momentum a clear shape and leave some margin.", visualDescription: "A luminous, clear world with lively but restrained natural motion." },
      },
      personalityDimensions: {
        E: "You often restore energy through interaction and thinking aloud.",
        I: "You often restore energy through solitude and quiet reflection.",
        S: "You tend to begin with concrete facts, details and present reality.",
        N: "You tend to notice patterns, connections and future possibilities.",
        T: "You often weigh logic, consistency and trade-offs first.",
        F: "You often include values, relationships and human impact first.",
        J: "You tend to feel steadier once a direction and structure are clear.",
        P: "You tend to feel freer when options can remain open and adaptable.",
      },
    },
  },
  "zh-CN": {
    brand: {
      lockup: "九境生息 · Ninefold",
      productName: "九境生息",
      englishName: "Ninefold",
      homeLabel: "九境生息首页",
      promise: "回来片刻，留下一点生长。",
    },
    navigation: {
      label: "主导航",
      home: "首页",
      today: "今日",
      growth: "生长",
      about: "原理",
      preferences: "偏好",
      skipToContent: "跳至主要内容",
      openMenu: "打开导航",
      closeMenu: "关闭导航",
    },
    language: {
      label: "选择语言",
      chinese: "中文",
      english: "EN",
      switchToChinese: "切换至简体中文",
      switchToEnglish: "切换至英文",
    },
    common: {
      back: "返回",
      continue: "继续",
      confirm: "确认",
      cancel: "取消",
      close: "关闭",
      save: "保存",
      edit: "修改",
      optional: "选填",
      selected: "已选择",
      of: "/",
    },
    builder: {
      pageTitle: "造出我的九境",
      openingLine: "从一片天空开始。",
      progressLabel: "九境生成进度",
      birthDate: {
        question: "你出生在哪一天？",
        supporting: "只需要月和日，不需要年份。",
        monthLabel: "出生月份",
        monthPlaceholder: "月",
        dayLabel: "出生日期",
        dayPlaceholder: "日",
        confirm: "让星辰出现",
        discovered: "{glyph} {sign} 已经出现在你的天空里。",
        change: "修改出生日期",
      },
      zodiac: {
        aries: { name: "白羊座", glyph: "♈" },
        taurus: { name: "金牛座", glyph: "♉" },
        gemini: { name: "双子座", glyph: "♊" },
        cancer: { name: "巨蟹座", glyph: "♋" },
        leo: { name: "狮子座", glyph: "♌" },
        virgo: { name: "处女座", glyph: "♍" },
        libra: { name: "天秤座", glyph: "♎" },
        scorpio: { name: "天蝎座", glyph: "♏" },
        sagittarius: { name: "射手座", glyph: "♐" },
        capricorn: { name: "摩羯座", glyph: "♑" },
        aquarius: { name: "水瓶座", glyph: "♒" },
        pisces: { name: "双鱼座", glyph: "♓" },
      },
      clouds: {
        question: "你的天空里，会飘着怎样的云？",
        supporting: "可以逐一试试。每次选择，天空都会立刻改变。",
        groupLabel: "选择一种云的形态",
        previewLabel: "在天空中预览{cloud}",
        selectedAnnouncement: "{cloud}已经留在你的天空里。",
        continue: "留下这片云",
        options: {
          thin: { name: "羽云", description: "高而轻的细线，让地平线保持开阔。" },
          layered: { name: "叠云", description: "安静舒展的长层，横卧在天空之间。" },
          soft: { name: "绒云", description: "圆润饱满，却不遮住光。" },
          flowing: { name: "流云", description: "被风牵引的松散云迹，为风景带来流动。" },
        },
      },
      worlds: {
        question: "哪一片世界更像你的？",
        supporting: "每片世界都有不同的树形、土地与远方。",
        groupLabel: "从九片世界中选择一片",
        previewLabel: "预览{world}",
        selectedAnnouncement: "{world}正在成形。",
        confirm: "在这里种下一颗种子",
        options: {
          1: { name: "曙光岭", description: "向上舒展的树，立在迎向晨光的坡地。" },
          2: { name: "汇流原", description: "相遇的枝桠，生长在两道缓流之间。" },
          3: { name: "风语丘", description: "富于表达的枝条，从有回声的山丘升起。" },
          4: { name: "石阶地", description: "稳定的树冠，扎根于层层沉静的土地。" },
          5: { name: "流湾", description: "柔韧的树，顺着水流的曲线生长。" },
          6: { name: "护生谷", description: "环抱般的枝桠，守着丰沃而安静的土壤。" },
          7: { name: "静镜湖", description: "向内生长的树，在开阔静水中留下倒影。" },
          8: { name: "远照原", description: "清晰的树干，伸向辽阔而明亮的远方。" },
          9: { name: "归一野", description: "多向伸展的枝条，最终汇成平衡的整体。" },
        },
      },
      seed: {
        title: "你的九境，正等着第一次生息。",
        body: "土地会留在这里。此刻，只有一颗小小的种子，标记未来树木生长的位置。",
        description: "一颗小种子，静静落在未来树根的位置。",
      },
      firstBreathing: {
        eyebrow: "第一次生息 · 1分钟",
        title: "静静看着它长出来。",
        body: "选择一种声音。用安静的一分钟，让种子长成你的无叶之树。",
        soundQuestion: "第一次生息，由什么声音陪伴？",
        ocean: "海浪",
        rain: "雨声",
        begin: "开始生息",
        skip: "跳过动画",
        skipLabel: "跳过树木诞生动画，并进入完全相同的无叶之树状态",
        progressLabel: "树木诞生进度",
        timeRemaining: "还剩{seconds}秒",
        reducedMotion: "树会通过一次短暂、柔和的显现完成生长。",
        completeTitle: "你的树已经生根。",
        completeBody: "枝桠已经长成。之后完成的每次生息，都会留下一片叶子。",
        zeroLeaves: "无叶之树 · 0片叶子",
      },
    },
    nickname: {
      eyebrow: "一处可以归来的地方",
      question: "这片九境，该怎么称呼你？",
      supporting: "一个简短的称呼就够了。",
      label: "称呼",
      placeholder: "你希望这里怎样称呼你",
      characterCount: "已输入{count}/{limit}个字符",
      localOnly: "只保存在这个浏览器里。",
      skip: "不填写称呼，继续",
      continue: "进入我的九境",
      welcomeNamed: "{name}，欢迎来到你的九境。",
      welcomeNeutral: "欢迎来到你的九境。",
      rooted: "你的树已经生根。",
    },
    preferences: {
      eyebrow: "认识一下你的偏好",
      title: "认识一下你通常怎样感受和行动。",
      intro: "只需要四个选择。",
      questionOf: "第{current}题，共4题",
      groupLabel: "选择更接近你的答案",
      questions: {
        ei: {
          question: "忙完一天，你通常从哪里恢复能量？",
          options: [
            { value: "E", label: "和人互动、说出来" },
            { value: "I", label: "一个人待着、慢慢想" },
          ],
        },
        sn: {
          question: "面对一件陌生的事，你通常先注意什么？",
          options: [
            { value: "S", label: "事实、细节、实际发生了什么" },
            { value: "N", label: "规律、联系、还有什么可能" },
          ],
        },
        tf: {
          question: "做重要决定时，你通常先看什么？",
          options: [
            { value: "T", label: "逻辑、一致性和利弊" },
            { value: "F", label: "价值、关系和人的感受" },
          ],
        },
        jp: {
          question: "面对还没确定的事情，哪种状态让你更舒服？",
          options: [
            { value: "J", label: "早点定下来，按计划推进" },
            { value: "P", label: "先保留选择，边走边调整" },
          ],
        },
      },
      resultEyebrow: "你的偏好倾向",
      closestTo: "你的四维偏好更接近 {code}",
      resultNote: "这是一次轻量的自我观察，不是正式的 MBTI 测评。",
      continue: "看看今天的自己",
    },
    daily: {
      pageTitle: "今日九境",
      greetingNamed: "{name}，欢迎回来。",
      greetingNeutral: "欢迎回来。",
      invitation: "今天怎么样？",
      mood: {
        question: "此刻的心情怎么样？",
        groupLabel: "心情，1至9",
        lowAnchor: "1 · 很低落",
        middleAnchor: "5 · 普通",
        highAnchor: "9 · 很好",
        valueLabel: "心情9分中的{value}分",
      },
      energy: {
        question: "此刻还有多少能量？",
        groupLabel: "能量，1至9",
        lowAnchor: "1 · 几乎没电",
        middleAnchor: "5 · 普通",
        highAnchor: "9 · 很有能量",
        valueLabel: "能量9分中的{value}分",
      },
      continue: "看看今日解读",
      saved: "今天的感受已保存在这个浏览器里。",
      update: "更新今天的感受",
      updated: "今日解读已经更新。",
    },
    reading: {
      pageTitle: "今日解读",
      baselineHeading: "你的底色",
      stateHeading: "今日状态",
      symbolicHeading: "九境解读",
      suitedHeading: "今天可能更适合你的是",
      keyword: "今日关键词",
      favour: "宜",
      easeOff: "不宜",
      symbolicNote: "这是一则用于自我观察的象征性内容，不是对未来的客观预测。",
    },
    session: {
      eyebrow: "留下一点时间",
      title: "和你的九境一起生息。",
      intro: "完成任一时长，都会恰好长出一片新叶。",
      durationLabel: "选择时长",
      oneMinute: "生息1分钟",
      fiveMinutes: "生息5分钟",
      soundLabel: "选择环境声音",
      ocean: "海浪",
      oceanDescription: "低缓的潮汐，浪与浪之间留有空间。",
      rain: "雨声",
      rainDescription: "柔和的雨幕，带一点轻盈的表面质感。",
      begin: "开始生息",
      mute: "静音",
      unmute: "打开声音",
      volume: "环境音量",
      exit: "离开生息",
      exitHint: "随时按 Escape 键安全离开。",
      progressLabel: "生息进度",
      timeRemaining: "还剩{time}",
      completeTitle: "一片新叶长出来了。",
      leafGrown: "+1片叶子",
      completeBody: "这片叶子，记住了你在这里完整停留的一次。",
      returnToWorld: "回到我的九境",
      endedEarly: "你提前离开了这次生息。",
      noLeaf: "没有增加叶子，其他一切也都没有失去。",
    },
    growth: {
      pageTitle: "生长",
      eyebrow: "这棵树记得的事",
      title: "每一片叶子，都来自一次完整的停留。",
      intro: "只有当生息走到结束，你的九境才会长出一片新叶。",
      treeHeading: "你的九境之树",
      leafCount: "{count}片叶子",
      sessionCount: "完成{count}次生息",
      totalMinutes: "累计生息{minutes}分钟",
      recentSessions: "最近的生息",
      noSessionsTitle: "枝桠已经准备好了。",
      noSessionsBody: "完成第一次日常生息，就会长出一片小小的新叶。",
      oneLeafMeaning: "无论1分钟还是5分钟，每次完整生息都只长出一片叶子。",
      noStreaks: "没有连续打卡、断签惩罚、排名或金币。",
    },
    about: {
      pageTitle: "关于九境生息",
      eyebrow: "原理与边界",
      title: "一种在本地生成的象征性自我观察。",
      intro: "九境生息把少量选择与自我感受，变成一片持续存在的插画世界。",
      truthsHeading: "它如何运作",
      truthClaims: [
        "出生月日会对应一个象征性的西方热带黄道星座。",
        "星座星图是项目原创的象征图案，并非真实出生星空的精确复原。",
        "云与世界原型只是审美选择。",
        "四个偏好问题用于轻量自我探索，不是正式的 MBTI 测评。",
        "心情和能量来自你自己填写的1至9分。",
        "每日解读在设备上确定性生成，不会调用远程 AI 模型。",
        "数据只保存在这个浏览器里；没有账号、分析、Cookie 或云同步。",
        "这里提供非临床的自我观察，不作诊断，也不能替代专业照护。",
        "每次完整生息都会恰好长出一片叶子。",
        "没有连续打卡惩罚、金币、排名或错过日期后的衰减。",
      ],
      privacyHeading: "从设计上保持本地",
      privacyBody: "你的称呼、选择、每日感受、解读与生息记录都留在这个浏览器里。",
      boundariesHeading: "是一种回望，不是定论",
      boundariesBody: "星座与偏好只是象征性的提示。每日建议保持低风险，也不会声称能够客观预测未来。",
      clearHeading: "重置这片九境",
      clearBody: "只移除 V3 的世界与生息数据。早期 Ninefold 版本及其他网站数据不会受到影响。",
      clearAction: "清除我的 V3 数据",
      clearConfirmTitle: "清除这片九境？",
      clearConfirmBody: "这将从浏览器中移除你的 V3 资料、世界、每日感受、解读与叶子，且无法撤销。",
      clearConfirmAction: "清除 V3 数据",
    },
    preferenceSettings: {
      pageTitle: "偏好",
      eyebrow: "你的稳定倾向",
      title: "重新设置我的偏好",
      intro: "如果之前的选择不再贴近你，可以重新回答。树与已经长出的叶子不会改变。",
      current: "当前偏好代码：{code}",
      revisit: "重新回答四个问题",
      save: "保存偏好",
      saved: "你的偏好已经更新。",
    },
    errors: {
      invalidDate: "请选择真实存在的月和日，2月29日也可以。",
      incompleteDate: "请同时选择月份和日期。",
      chooseCloud: "选择一种云的形态后再继续。",
      chooseWorld: "选择一片世界，种下你的种子。",
      choosePreference: "先选择更接近你的答案，再继续。",
      chooseMood: "请选择1至9之间的心情分值。",
      chooseEnergy: "请选择1至9之间的能量分值。",
      missingProfile: "请先造出自己的九境，再进入这个页面。",
      storageUnavailable: "浏览器本地存储当前不可用。你仍可继续，但刷新后这片九境可能无法保留。",
      storageRead: "部分 V3 数据无法读取，九境生息正在使用安全的备用值。",
      storageWrite: "这次更改暂时无法保存，当前页面仍可继续使用。",
      corruptData: "无效的 V3 数据已被安全忽略，早期 Ninefold 数据没有被改动。",
      audioUnavailable: "当前浏览器无法播放环境声。视觉生息仍可在静音状态下继续。",
      sessionInterrupted: "生息没有完成，因此没有增加叶子。",
      generic: "刚才的操作没有完成，请再试一次。",
    },
    accessibility: {
      worldScene: "你的持久九境世界",
      emptySky: "一片开阔的天空，正等待星图、云与土地出现。",
      zodiacMotif: "天空中的象征性{sign}星图。",
      cloudPreview: "天空中出现{cloud}。",
      worldPreview: "{world}：{description}",
      seed: "一颗小种子落在未来树木生长的位置。",
      bareTree: "一棵已经生根、枝桠完整、尚无叶子的树。",
      treeWithLeaves: "同一棵树上已经保留了{count}片叶子。",
      leafCount: "通过完整生息长出的{count}片叶子。",
      birthDialog: "第一次生息与树木诞生",
      breathingDialog: "生息模式",
      closeDialog: "关闭对话框",
      selectedOption: "{option}，已选择",
      scaleInstructions: "可用方向键或点按数字，在1至9之间选择一个值。",
      currentStep: "当前造境阶段：{stage}",
      progress: "已完成{percent}%",
      audioControls: "环境声音控制",
    },
    semantics: {
      keywords: {
        pause: "停留",
        clarity: "清明",
        grounding: "落地",
        gentleness: "温和",
        connection: "联结",
        focus: "专注",
        momentum: "推进",
        openness: "敞开",
        balance: "平衡",
      },
      favour: {
        "one-small-thing": "完成一件很小的事",
        "quiet-time": "独处片刻",
        "gentle-company": "和相处轻松的人待一会儿",
        "tidy-a-corner": "整理一个小角落",
        "slow-walk": "慢慢走一段路",
        "write-it-down": "把重要的事写下来",
        "finish-one-thing": "先完成一件，再开始下一件",
        "ask-for-help": "寻求一点实际帮助",
        "leave-margin": "在安排之间留出空白",
        "make-something": "不作评判地做一点东西",
        "rest-early": "让今天稍早一点结束",
        "simple-rhythm": "保持简单熟悉的节奏",
      },
      easeOff: {
        "new-commitments": "临时增加承诺",
        "too-many-starts": "同时开始很多事情",
        "forced-answers": "逼自己立刻得到答案",
        comparison: "拿今天的自己与别人比较",
        overexplaining: "为每件事解释太多",
        rushing: "把所有事情都变得紧迫",
        perfection: "等待完美条件",
        "heavy-conversations": "在没有余力时承担沉重对话",
        "late-plans": "把一天的结尾也塞满安排",
      },
      advice: {
        "i-low-energy": "今天可以少解释一点，给自己留一段不被打扰的时间。",
        "e-low-energy": "不一定要谈重要的事；和让你舒服的人待一会儿，可能比独自消耗更适合今天。",
        "s-low-mood": "选择一件看得见、摸得到，也不需要太多力气就能完成的小事。",
        "n-low-mood": "可以保留一种可能，但为它安排一个很小的下一步，别让它变成新的负担。",
        "t-overloaded": "减少眼前需要决定的事情，用一个清楚的标准处理下一件就好。",
        "f-overloaded": "留意哪些感受需要自己照顾，哪些可以留给它原本的主人。",
        "j-uncertain": "只为今天定一个小计划，其余的暂时不必确定。",
        "p-scattered": "可以保留选择，但先从一个地方开始，再打开下一件事。",
        "balanced-momentum": "使用今天已有的能量，同时给明天留一点余地。",
      },
      states: {
        "low-low": { summary: "今天心情和能量都偏低。减少需要回应的事情，可能比逼自己振作更合适。", visualDescription: "雾气柔和、移动缓慢、光线安静的世界。" },
        "low-mid": { summary: "心情偏低，但仍有一些能量。可以把它交给一件温和而有边界的事。", visualDescription: "柔光落在收敛的地平线上，风景以克制的节奏移动。" },
        "low-high": { summary: "心情偏低，能量却很充足。适当活动可能有帮助，只要它不变成压力。", visualDescription: "偏凉的天空里有活跃的风，水面清晰流动。" },
        "mid-low": { summary: "心情平稳，能量有限。维持简单的节奏，已经足够。", visualDescription: "均匀的天空、安静的树叶与开阔平和的远方。" },
        "mid-mid": { summary: "心情和能量都在中间。你有空间先看一看，再决定方向。", visualDescription: "平衡的日光、轻缓的云与开阔的地平线。" },
        "mid-high": { summary: "能量充足，心情平稳。把注意力放在一件事上，今天会走得更顺。", visualDescription: "清晰流动的空气、温暖反光与更有活力的水面。" },
        "high-low": { summary: "心情明亮，能量安静。享受此刻就好，不必把它变成任务。", visualDescription: "温暖光线停留在平静世界里，只有很轻的移动。" },
        "high-mid": { summary: "心情明亮，也有一些能量。联结或创造可能会自然发生。", visualDescription: "开阔暖光、柔和云动与会回应你的风景。" },
        "high-high": { summary: "心情和能量都很高。给这股动力一个清楚的形状，也留下一点余地。", visualDescription: "明亮清澈的世界，自然运动活跃但不过度。" },
      },
      personalityDimensions: {
        E: "你往往通过与人互动、边说边想来恢复能量。",
        I: "你往往通过独处与安静整理来恢复能量。",
        S: "你通常先看具体事实、细节与眼前真实发生的事。",
        N: "你通常先注意规律、联系与未来的可能。",
        T: "你做判断时，往往先衡量逻辑、一致性与利弊。",
        F: "你做判断时，往往先把价值、关系与人的处境放进来。",
        J: "方向和结构变得清楚后，你通常会感觉更安定。",
        P: "选择仍可保持开放和调整时，你通常会感觉更自在。",
      },
    },
  },
};

export function getV3Copy(locale: Locale): V3Copy {
  return V3_COPY[locale];
}
