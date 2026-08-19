export const SUPPORTED_LOCALES = ["en", "zh-CN"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];
export type Language = "en" | "zh";
export type PathNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type CareAction = "nourish" | "release" | "protect" | "open" | "observe";
export type DateFormatStyle = "long" | "short" | "monthDay" | "weekday" | "numeric";
export type DateInput = Date | string | number;

export interface PathTranslation {
  name: string;
  keywords: string;
  constructive: string;
  tension: string;
  growth: string;
}

export interface CareActionTranslation {
  name: string;
  meaning: string;
  effect: string;
}

export interface MethodSectionTranslation {
  title: string;
  body: string;
}

export interface TranslationDictionary {
  brand: {
    productName: string;
    englishName: string;
    worldTree: string;
    campaignLine: string;
    definition: string;
    promise: string;
    safety: string;
  };
  terms: {
    path: string;
    livingLandscape: string;
    livingView: string;
    memoryView: string;
    dailySigil: string;
    arrive: string;
    attune: string;
    tend: string;
    grow: string;
    reflect: string;
    rest: string;
    growth: string;
    method: string;
    reframe: string;
    nourish: string;
    release: string;
    protect: string;
    open: string;
    observe: string;
    howTodayTookShape: string;
    restWithLandscape: string;
    enterLandscape: string;
    nothingLost: string;
  };
  language: {
    switcherLabel: string;
    chinese: string;
    english: string;
    changeToChinese: string;
    changeToEnglish: string;
  };
  navigation: {
    label: string;
    home: string;
    today: string;
    growth: string;
    method: string;
    skipToContent: string;
  };
  common: {
    back: string;
    next: string;
    continue: string;
    save: string;
    cancel: string;
    close: string;
    exit: string;
    confirm: string;
    optional: string;
    required: string;
    sample: string;
    today: string;
    original: string;
    alternate: string;
    loading: string;
    remove: string;
    retry: string;
    expand: string;
    collapse: string;
    selected: string;
    notSelected: string;
  };
  landing: {
    eyebrow: string;
    heroTitle: string;
    heroSupporting: string;
    primaryCta: string;
    secondaryCta: string;
    worldTreeLabel: string;
    worldTreeDescription: string;
    persistentTitle: string;
    persistentBody: string;
    weatherTitle: string;
    weatherBody: string;
    localTitle: string;
    localBody: string;
    reflectiveTitle: string;
    reflectiveBody: string;
    formulaAriaLabel: string;
    formulaPath: string;
    formulaState: string;
    formulaCare: string;
    formulaMemory: string;
    noAccount: string;
    privacyNote: string;
  };
  onboarding: {
    eyebrow: string;
    newTitle: string;
    editTitle: string;
    progressLabel: string;
    stepOf: string;
    steps: {
      name: string;
      path: string;
      lenses: string;
      planting: string;
    };
    name: {
      eyebrow: string;
      title: string;
      intro: string;
      label: string;
      placeholder: string;
      counter: string;
      privacy: string;
    };
    path: {
      eyebrow: string;
      title: string;
      intro: string;
      explanation: string;
      groupLabel: string;
      constructiveLabel: string;
      tensionLabel: string;
      growthLabel: string;
      chooseError: string;
    };
    lenses: {
      eyebrow: string;
      title: string;
      intro: string;
      zodiacLabel: string;
      zodiacPlaceholder: string;
      zodiacHelp: string;
      orientation: string;
      approach: string;
      processing: string;
      pace: string;
      internal: string;
      neutral: string;
      external: string;
      structured: string;
      exploratory: string;
      analytical: string;
      intuitive: string;
      stable: string;
      adaptive: string;
    };
    planting: {
      eyebrow: string;
      title: string;
      intro: string;
      selectedPath: string;
      optionalLenses: string;
      privacy: string;
      cta: string;
      updateCta: string;
    };
  };
  paths: Record<PathNumber, PathTranslation>;
  zodiac: {
    aries: string;
    taurus: string;
    gemini: string;
    cancer: string;
    leo: string;
    virgo: string;
    libra: string;
    scorpio: string;
    sagittarius: string;
    capricorn: string;
    aquarius: string;
    pisces: string;
  };
  today: {
    pageTitle: string;
    stagesLabel: string;
    stages: {
      arrive: string;
      attune: string;
      tend: string;
      grow: string;
      reflect: string;
      rest: string;
    };
    arrive: {
      welcomeNamed: string;
      welcomeNeutral: string;
      invitation: string;
      yesterdayTrace: string;
      noPreviousTrace: string;
      cta: string;
    };
    attune: {
      eyebrow: string;
      titleNamed: string;
      titleNeutral: string;
      intro: string;
      skyLabel: string;
      skyDescription: string;
      inward: string;
      outward: string;
      clouded: string;
      clear: string;
      lightPointLabel: string;
      keyboardHelp: string;
      energy: string;
      energyQuestion: string;
      clarity: string;
      clarityQuestion: string;
      connection: string;
      connectionQuestion: string;
      focus: string;
      focusQuestion: string;
      note: string;
      notePlaceholder: string;
      notePrivacy: string;
      incompleteError: string;
      continueCta: string;
    };
    tend: {
      eyebrow: string;
      title: string;
      intro: string;
      groupLabel: string;
      noRecommendation: string;
      chooseError: string;
      growCta: string;
    };
    grow: {
      eyebrow: string;
      title: string;
      settlingWeather: string;
      revealingSigil: string;
      joiningLandscape: string;
      complete: string;
      reducedMotion: string;
    };
    reflect: {
      eyebrow: string;
      title: string;
      actionLabel: string;
      questionLabel: string;
      detailsSummary: string;
      viewAnotherAngle: string;
      reframeUsed: string;
      reframeExplanation: string;
      originalView: string;
      alternateView: string;
      differentNotBetter: string;
    };
    rest: {
      eyebrow: string;
      title: string;
      intro: string;
      thirtySeconds: string;
      oneMinute: string;
      openEnded: string;
      begin: string;
      exit: string;
      exitAriaLabel: string;
      timeRemaining: string;
      openEndedStatus: string;
      reducedMotionStatus: string;
    };
  };
  attunement: {
    energyLevels: readonly [string, string, string, string, string];
    clarityLevels: readonly [string, string, string, string, string];
    connections: {
      inward: { label: string; detail: string };
      balanced: { label: string; detail: string };
      outward: { label: string; detail: string };
    };
    focuses: {
      work: string;
      study: string;
      relationships: string;
      creativity: string;
      self: string;
    };
  };
  careActions: Record<CareAction, CareActionTranslation>;
  landscape: {
    attunementField: {
      legend: string;
      introduction: string;
      energy: string;
      energyHint: string;
      clarity: string;
      clarityHint: string;
      connection: string;
      connectionHint: string;
      focus: string;
      focusHint: string;
      note: string;
      noteHint: string;
      private: string;
      noteCount: string;
      ratingLabels: readonly [string, string, string, string, string];
      options: {
        inward: string;
        balanced: string;
        outward: string;
        work: string;
        study: string;
        relationships: string;
        creativity: string;
        self: string;
      };
    };
    careActionPicker: {
      title: string;
      prompt: string;
      actions: Record<CareAction, {
        label: string;
        detail: string;
        symbol: string;
      }>;
    };
    restMode: {
      eyebrow: string;
      title: string;
      description: string;
      duration: string;
      thirtySeconds: string;
      oneMinute: string;
      fiveMinutes: string;
      openEnded: string;
      start: string;
      mute: string;
      unmute: string;
      volume: string;
      exit: string;
      activeStatus: string;
      growthStatus: string;
      completeTitle: string;
      close: string;
      escape: string;
      complete: string;
      openTimerLabel: string;
    };
    livingLandscape: {
      title: string;
      descriptionSingular: string;
      descriptionPlural: string;
      times: {
        morning: string;
        day: string;
        evening: string;
        night: string;
      };
      weather: {
        rain: string;
        clouded: string;
        sunlight: string;
        softLight: string;
      };
    };
  };
  symbols: {
    colours: {
      Indigo: string;
      Amber: string;
      Teal: string;
      Rose: string;
      Moss: string;
      Cobalt: string;
      Violet: string;
      Coral: string;
      Slate: string;
      Pearl: string;
      Ochre: string;
      Crimson: string;
    };
    forms: {
      circle: string;
      triangle: string;
      square: string;
      pentagon: string;
      hexagon: string;
      diamond: string;
      ring: string;
      star: string;
      spiral: string;
    };
    directions: {
      inward: string;
      outward: string;
      ascending: string;
      descending: string;
      balanced: string;
      rotating: string;
    };
    symmetries: {
      radial: string;
      bilateral: string;
      rotational: string;
      asymmetric: string;
    };
  };
  result: {
    dailySigil: string;
    symbolicTheme: string;
    generatedSymbols: string;
    number: string;
    colour: string;
    form: string;
    direction: string;
    path: string;
    careAction: string;
    weather: string;
    scores: string;
    evidence: string;
    tension: string;
    opportunity: string;
    action: string;
    question: string;
    reflectionMode: string;
    localEngine: string;
    basedOn: string;
    privateNoteExcluded: string;
    downloadSigil: string;
    sigilTitle: string;
    sigilDescription: string;
  };
  scores: {
    clarity: string;
    momentum: string;
    tension: string;
    outOfNine: string;
    dailyAriaLabel: string;
    weeklyAriaLabel: string;
    descriptions: {
      dailyClarity: string;
      dailyMomentum: string;
      dailyTension: string;
      weeklyClarity: string;
      weeklyMomentum: string;
      weeklyTension: string;
    };
  };
  growth: {
    eyebrow: string;
    title: string;
    intro: string;
    viewLabel: string;
    livingView: string;
    memoryView: string;
    livingDescription: string;
    memoryDescription: string;
    emptyEyebrow: string;
    emptyTitle: string;
    emptyBody: string;
    createToday: string;
    loadSample: string;
    sampleWeek: string;
    sampleEntry: string;
    recentActivity: string;
    recentEntries: string;
    visibleDays: string;
    dayLayer: string;
    weeklySummary: string;
    weeklyReflection: string;
    noticeLabel: string;
    downloadWeek: string;
    downloadedWeek: string;
    downloadFailed: string;
    removeSample: string;
    removeSampleTitle: string;
    removeSampleDescription: string;
    loadConflictTitle: string;
    loadConflictDescription: string;
    loadBesideReal: string;
    alreadyLoaded: string;
    sampleLoaded: string;
    sampleRemoved: string;
    noLayers: string;
    visibleLayerDescription: string;
    historicalDetail: string;
    closeHistorical: string;
    reframeStatus: string;
    feedbackStatus: string;
  };
  archive: {
    dateListSeparator: string;
    inlineSeparator: string;
    emptyWeekLength: string;
    originalAndAlternate: string;
    historicalDetailAriaLabel: string;
    downloadFilename: string;
    weekly: {
      emptyTheme: string;
      emptyObservation: string;
      emptyInvitation: string;
      theme: string;
      directionObservation: string;
      repeatedFormsObservation: string;
      variedFormsObservation: string;
      steadyObservation: string;
      movedObservation: string;
      movementUp: string;
      movementDown: string;
      invitation: string;
      valueJoiner: string;
    };
  };
  method: {
    eyebrow: string;
    title: string;
    intro: string;
    sections: {
      whatIs: MethodSectionTranslation;
      landscape: MethodSectionTranslation;
      shapesToday: MethodSectionTranslation;
      deterministic: MethodSectionTranslation;
      path: MethodSectionTranslation;
      sigils: MethodSectionTranslation;
      reframe: MethodSectionTranslation;
      boundaries: MethodSectionTranslation;
      data: MethodSectionTranslation;
      future: MethodSectionTranslation;
    };
    formulaTitle: string;
    formula: {
      path: string;
      state: string;
      care: string;
      trace: string;
      time: string;
      language: string;
    };
    privacyEyebrow: string;
    privacyTitle: string;
    privacyBody: string;
    privateNoteBody: string;
    clearData: string;
    noData: string;
    limitsEyebrow: string;
    limitsTitle: string;
    limitsBody: string;
  };
  share: {
    eyebrow: string;
    title: string;
    downloadSvg: string;
    copyCaption: string;
    share: string;
    copyToShare: string;
    preview: string;
    nativeTitle: string;
    downloaded: string;
    downloadFailed: string;
    copied: string;
    copyUnavailable: string;
    shareOpened: string;
  };
  feedback: {
    eyebrow: string;
    title: string;
    useful: string;
    tooGeneric: string;
    tooNegative: string;
    didNotMatch: string;
    saved: string;
    saveFailed: string;
  };
  transparency: {
    eyebrow: string;
    summary: string;
    body: string;
    reflectionMode: string;
    generator: string;
    dictionary: string;
    localDate: string;
    version: string;
    seed: string;
    original: string;
    reframed: string;
    seedNote: string;
  };
  storage: {
    unavailable: string;
    corrupt: string;
    readFailed: string;
    writeFailed: string;
    migrationComplete: string;
    migrationFailed: string;
    clearTitle: string;
    clearDescription: string;
    clearConfirm: string;
    clearSuccess: string;
  };
  errors: {
    boundaryTitle: string;
    boundaryBody: string;
    reload: string;
    notFoundEyebrow: string;
    notFoundTitle: string;
    notFoundBody: string;
    returnHome: string;
    patternUnavailable: string;
    generic: string;
  };
  accessibility: {
    worldTreeTitle: string;
    worldTreeDescription: string;
    dailySigilTitle: string;
    dailySigilDescription: string;
    weeklyCompositionTitle: string;
    weeklyCompositionDescription: string;
    restModeLabel: string;
    closeDialog: string;
  };
}

export type FormatDate = (input: DateInput, style?: DateFormatStyle) => string;

export interface I18nValue {
  locale: Locale;
  language: Language;
  t: TranslationDictionary;
  setLocale: (locale: Locale) => void;
  formatDate: FormatDate;
}
