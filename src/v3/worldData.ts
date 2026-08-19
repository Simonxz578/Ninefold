import { createSeededPrng, type PathNumber, type ZodiacSign } from "../domain";

export type CloudArchetype = "high" | "layered" | "soft" | "flowing";

export interface ZodiacPoint {
  x: number;
  y: number;
  r?: number;
}

export interface ZodiacMotif {
  glyph: string;
  points: readonly ZodiacPoint[];
  links: readonly (readonly [number, number])[];
}

/**
 * Original symbolic coordinate motifs. They are intentionally illustrative,
 * not reconstructions of the astronomical constellations.
 */
export const ZODIAC_MOTIFS: Readonly<Record<ZodiacSign, ZodiacMotif>> = {
  aries: {
    glyph: "♈",
    points: [
      { x: 470, y: 184 }, { x: 526, y: 126, r: 2.8 }, { x: 600, y: 146 },
      { x: 674, y: 126, r: 2.8 }, { x: 730, y: 184 }, { x: 600, y: 226, r: 2.2 },
    ],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5]],
  },
  taurus: {
    glyph: "♉",
    points: [
      { x: 430, y: 116 }, { x: 512, y: 168 }, { x: 600, y: 232, r: 2.8 },
      { x: 688, y: 168 }, { x: 770, y: 116 }, { x: 600, y: 286 },
    ],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5]],
  },
  gemini: {
    glyph: "♊",
    points: [
      { x: 512, y: 104, r: 2.5 }, { x: 516, y: 180 }, { x: 510, y: 262, r: 2.4 },
      { x: 688, y: 104, r: 2.5 }, { x: 684, y: 180 }, { x: 690, y: 262, r: 2.4 },
      { x: 600, y: 142 }, { x: 600, y: 226 },
    ],
    links: [[0, 1], [1, 2], [3, 4], [4, 5], [0, 6], [3, 6], [2, 7], [5, 7]],
  },
  cancer: {
    glyph: "♋",
    points: [
      { x: 454, y: 190 }, { x: 520, y: 132, r: 2.6 }, { x: 602, y: 166 },
      { x: 676, y: 118 }, { x: 742, y: 176, r: 2.6 }, { x: 654, y: 236 },
      { x: 542, y: 242 },
    ],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0]],
  },
  leo: {
    glyph: "♌",
    points: [
      { x: 444, y: 234 }, { x: 500, y: 160 }, { x: 574, y: 112, r: 2.8 },
      { x: 648, y: 132 }, { x: 714, y: 188, r: 2.5 }, { x: 764, y: 254 },
      { x: 674, y: 270 }, { x: 600, y: 222 },
    ],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 3]],
  },
  virgo: {
    glyph: "♍",
    points: [
      { x: 418, y: 144 }, { x: 486, y: 190 }, { x: 554, y: 134, r: 2.6 },
      { x: 612, y: 212 }, { x: 684, y: 156 }, { x: 758, y: 216, r: 2.8 },
      { x: 686, y: 274 }, { x: 578, y: 282 },
    ],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 3]],
  },
  libra: {
    glyph: "♎",
    points: [
      { x: 444, y: 240 }, { x: 510, y: 170 }, { x: 600, y: 116, r: 3 },
      { x: 690, y: 170 }, { x: 756, y: 240 }, { x: 600, y: 238, r: 2.2 },
      { x: 522, y: 288 }, { x: 678, y: 288 },
    ],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [3, 5], [5, 6], [5, 7]],
  },
  scorpio: {
    glyph: "♏",
    points: [
      { x: 408, y: 128 }, { x: 468, y: 178 }, { x: 530, y: 132 },
      { x: 584, y: 202, r: 2.7 }, { x: 642, y: 164 }, { x: 706, y: 222 },
      { x: 772, y: 180 }, { x: 746, y: 274, r: 2.5 }, { x: 676, y: 292 },
    ],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]],
  },
  sagittarius: {
    glyph: "♐",
    points: [
      { x: 438, y: 270 }, { x: 514, y: 210 }, { x: 588, y: 148, r: 2.8 },
      { x: 680, y: 106, r: 2.5 }, { x: 750, y: 136 }, { x: 704, y: 202 },
      { x: 608, y: 230 }, { x: 548, y: 294 },
    ],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [5, 6], [6, 7], [1, 6]],
  },
  capricorn: {
    glyph: "♑",
    points: [
      { x: 426, y: 174 }, { x: 494, y: 112, r: 2.5 }, { x: 558, y: 180 },
      { x: 624, y: 132 }, { x: 706, y: 172, r: 2.8 }, { x: 758, y: 244 },
      { x: 666, y: 286 }, { x: 566, y: 252 }, { x: 486, y: 278 },
    ],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 2]],
  },
  aquarius: {
    glyph: "♒",
    points: [
      { x: 410, y: 142 }, { x: 488, y: 188 }, { x: 558, y: 132, r: 2.6 },
      { x: 630, y: 178 }, { x: 704, y: 124 }, { x: 786, y: 170, r: 2.6 },
      { x: 440, y: 246 }, { x: 520, y: 284 }, { x: 600, y: 234 },
      { x: 680, y: 278 }, { x: 760, y: 232 },
    ],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [6, 7], [7, 8], [8, 9], [9, 10]],
  },
  pisces: {
    glyph: "♓",
    points: [
      { x: 420, y: 170 }, { x: 484, y: 112, r: 2.7 }, { x: 548, y: 172 },
      { x: 600, y: 222, r: 2.4 }, { x: 652, y: 172 }, { x: 716, y: 112, r: 2.7 },
      { x: 780, y: 170 }, { x: 716, y: 252 }, { x: 652, y: 292 },
      { x: 548, y: 292 }, { x: 484, y: 252 },
    ],
    links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 3], [3, 9], [9, 10], [10, 0]],
  },
};

export interface CloudDefinition {
  name: Readonly<{ en: string; zh: string }>;
  paths: readonly string[];
  opacity: number;
  speedFactor: number;
}

export const CLOUD_ARCHETYPES: Readonly<Record<CloudArchetype, CloudDefinition>> = {
  high: {
    name: { en: "High veils", zh: "高空薄云" },
    paths: [
      "M80 150C210 118 318 126 448 150C322 148 208 169 80 150Z",
      "M690 104C826 82 956 96 1126 128C948 118 822 132 690 104Z",
    ],
    opacity: 0.5,
    speedFactor: 0.72,
  },
  layered: {
    name: { en: "Layered horizons", zh: "层叠横云" },
    paths: [
      "M42 132C154 104 286 108 398 134C286 147 158 149 42 132Z",
      "M356 190C508 160 682 164 814 194C650 205 500 210 356 190Z",
      "M778 116C912 92 1058 104 1192 138C1042 142 908 143 778 116Z",
    ],
    opacity: 0.58,
    speedFactor: 0.9,
  },
  soft: {
    name: { en: "Soft billows", zh: "柔软积云" },
    paths: [
      "M70 192C96 132 158 126 190 162C214 104 302 104 326 164C378 142 432 180 422 222H84C62 220 55 208 70 192Z",
      "M714 150C738 104 798 100 830 132C866 72 958 90 966 150C1018 128 1080 170 1060 210H726C704 204 700 176 714 150Z",
    ],
    opacity: 0.72,
    speedFactor: 1.08,
  },
  flowing: {
    name: { en: "Wind-drawn", zh: "风绘流云" },
    paths: [
      "M34 188C198 106 352 126 520 166C350 150 208 214 34 188Z",
      "M522 112C692 64 860 84 1038 150C856 112 710 158 522 112Z",
      "M730 220C894 176 1030 194 1192 246C1022 218 892 258 730 220Z",
    ],
    opacity: 0.52,
    speedFactor: 1.28,
  },
};

export interface TerrainDetail {
  d: string;
  kind: "line" | "fill";
}

export interface WorldTerrain {
  name: Readonly<{ en: string; zh: string }>;
  farRidge: string;
  water: string;
  nearLand: string;
  details: readonly TerrainDetail[];
}

export const WORLD_TERRAINS: Readonly<Record<PathNumber, WorldTerrain>> = {
  1: {
    name: { en: "Rising meadow", zh: "向阳原野" },
    farRidge: "M0 450C170 388 322 410 450 430C580 450 716 396 842 378C968 360 1082 392 1200 420V540H0Z",
    water: "M0 510C232 484 382 516 568 500C770 482 944 494 1200 520V720H0Z",
    nearLand: "M0 602C178 556 340 570 488 594C648 620 810 572 970 560C1062 554 1134 574 1200 600V720H0Z",
    details: [{ kind: "line", d: "M600 592C560 624 536 666 520 720M600 592C632 634 650 674 660 720" }],
  },
  2: {
    name: { en: "Meeting waters", zh: "双流相会" },
    farRidge: "M0 438C168 388 318 392 454 440C520 462 562 470 600 470C638 470 680 462 746 440C884 392 1034 388 1200 438V540H0Z",
    water: "M0 492C222 474 410 498 560 526L600 570L640 526C790 498 978 474 1200 492V720H0Z",
    nearLand: "M0 586C200 548 390 556 552 596L600 632L648 596C810 556 1000 548 1200 586V720H0Z",
    details: [{ kind: "line", d: "M244 520C370 528 474 558 600 632M956 520C830 528 726 558 600 632" }],
  },
  3: {
    name: { en: "Open bloom field", zh: "舒展花原" },
    farRidge: "M0 448C126 422 214 388 312 420C404 452 478 406 572 420C676 438 738 392 842 412C956 434 1062 402 1200 436V540H0Z",
    water: "M0 516C210 498 418 520 596 508C778 496 982 500 1200 522V720H0Z",
    nearLand: "M0 576C138 546 256 570 374 590C486 610 566 580 672 574C812 566 932 600 1200 578V720H0Z",
    details: [
      { kind: "fill", d: "M174 618l9-18 9 18-9 9ZM298 650l7-14 7 14-7 7ZM916 622l9-18 9 18-9 9ZM1042 658l7-14 7 14-7 7Z" },
    ],
  },
  4: {
    name: { en: "Terraced garden", zh: "层台园地" },
    farRidge: "M0 444H230V408H430V378H770V408H970V444H1200V540H0Z",
    water: "M0 518H1200V720H0Z",
    nearLand: "M0 618H250V588H430V558H770V588H950V618H1200V720H0Z",
    details: [{ kind: "line", d: "M0 618H250M250 588H430M430 558H770M770 588H950M950 618H1200" }],
  },
  5: {
    name: { en: "Wind and water", zh: "风水流岸" },
    farRidge: "M0 430C210 452 326 352 518 400C700 446 846 334 1200 390V540H0Z",
    water: "M0 512C170 474 316 544 470 510C646 470 756 548 936 508C1048 482 1128 492 1200 510V720H0Z",
    nearLand: "M0 586C202 542 356 642 548 586C704 540 874 606 1200 566V720H0Z",
    details: [{ kind: "line", d: "M30 534C210 500 340 566 500 532M720 544C882 510 1030 544 1170 520" }],
  },
  6: {
    name: { en: "Sheltered grove", zh: "环抱林湾" },
    farRidge: "M0 404C168 350 300 382 402 430C500 476 700 476 798 430C900 382 1032 350 1200 404V540H0Z",
    water: "M0 506C238 492 388 514 494 544C558 562 642 562 706 544C812 514 962 492 1200 506V720H0Z",
    nearLand: "M0 566C190 524 382 540 486 590C552 622 648 622 714 590C818 540 1010 524 1200 566V720H0Z",
    details: [{ kind: "line", d: "M328 574C410 526 482 520 548 548M872 574C790 526 718 520 652 548" }],
  },
  7: {
    name: { en: "Reflecting island", zh: "镜湖静岛" },
    farRidge: "M0 438C190 382 368 410 512 442C674 478 846 390 1200 430V520H0Z",
    water: "M0 484C240 462 410 492 600 484C790 476 960 462 1200 488V720H0Z",
    nearLand: "M0 650C170 630 316 638 438 652C490 590 710 590 762 652C884 638 1030 630 1200 650V720H0Z",
    details: [{ kind: "line", d: "M430 626C520 608 680 608 770 626M392 674C508 654 692 654 808 674" }],
  },
  8: {
    name: { en: "Crystal highland", zh: "晶岩高地" },
    farRidge: "M0 450L170 338L300 430L468 286L600 420L744 308L888 432L1040 350L1200 448V540H0Z",
    water: "M0 520L240 500L430 530L600 502L790 532L990 498L1200 522V720H0Z",
    nearLand: "M0 608L168 562L322 620L486 544L600 590L728 548L890 618L1042 560L1200 610V720H0Z",
    details: [{ kind: "line", d: "M486 544L548 612L600 590L660 620L728 548M168 562L224 628M1042 560L986 628" }],
  },
  9: {
    name: { en: "Seasonal basin", zh: "四时环境" },
    farRidge: "M0 432C220 362 394 414 486 446C548 468 652 468 714 446C806 414 980 362 1200 432V540H0Z",
    water: "M0 502C230 480 382 516 480 546C548 566 652 566 720 546C818 516 970 480 1200 502V720H0Z",
    nearLand: "M0 590C210 548 384 572 476 620C540 652 660 652 724 620C816 572 990 548 1200 590V720H0Z",
    details: [
      { kind: "line", d: "M392 606C438 548 522 520 600 520C678 520 762 548 808 606M430 646C480 612 532 598 600 598C668 598 720 612 770 646" },
    ],
  },
};

/**
 * Fine V3-only branchlets that give each shared trunk grammar the visual mass
 * of a mature bare tree. They deliberately leave V2's TREE_GEOMETRY intact.
 */
export const V3_TREE_BRANCHLETS: Readonly<Record<PathNumber, readonly string[]>> = {
  1: [
    "M502 302c-31-2-58-18-78-42",
    "M502 302c-12-28-15-54-7-82",
    "M678 249c32-7 61-25 84-52",
    "M678 249c8-28 9-52 2-75",
    "M557 204c-27-12-49-31-64-57",
    "M557 204c4-25 13-49 29-71",
    "M633 167c20-19 33-42 38-70",
  ],
  2: [
    "M424 278c-32-2-63-17-88-44",
    "M424 278c-12-25-15-49-7-72",
    "M776 278c32-2 63-17 88-44",
    "M776 278c12-25 15-49 7-72",
    "M457 236c-27-13-52-34-74-63",
    "M457 236c-5-26 0-50 15-73",
    "M743 236c27-13 52-34 74-63",
    "M743 236c5-26 0-50-15-73",
  ],
  3: [
    "M430 262c-34-1-66-17-94-47",
    "M430 262c-10-31-8-59 5-85",
    "M767 248c35-3 68-21 96-53",
    "M767 248c9-31 6-59-8-85",
    "M431 288c-35 7-70 1-102-18",
    "M772 271c35 6 70-1 102-21",
    "M555 176c-21-19-34-43-39-71",
    "M653 172c22-19 36-43 42-71",
    "M512 316c-30-9-55-25-75-48",
    "M690 310c30-10 55-26 75-50",
  ],
  4: [
    "M454 458l-38-32",
    "M454 458l-36 19",
    "M746 458l38-32",
    "M746 458l36 19",
    "M480 388l-35-37",
    "M720 388l35-37",
    "M512 318l-31-40",
    "M688 318l31-40",
    "M542 248l-25-39",
    "M658 248l25-39",
  ],
  5: [
    "M830 399c35 4 69-4 101-25",
    "M830 399c21-20 35-43 41-68",
    "M817 314c34-4 66-18 94-43",
    "M817 314c16-25 23-51 19-78",
    "M780 210c28-10 54-27 75-51",
    "M780 210c10-25 12-50 5-75",
    "M516 235c-26-10-49-28-66-52",
    "M516 235c-2-25 5-48 20-69",
    "M444 404c-31 4-62-3-91-22",
    "M700 286c30-4 58-16 83-36",
  ],
  6: [
    "M346 371c-35 3-69-6-99-27",
    "M346 371c-21-23-31-48-31-75",
    "M851 371c35 3 69-6 99-27",
    "M851 371c21-23 31-48 31-75",
    "M389 322c-31-4-59-18-83-41",
    "M389 322c-14-25-18-50-11-75",
    "M807 322c31-4 59-18 83-41",
    "M807 322c14-25 18-50 11-75",
    "M472 264c-25-16-44-38-56-64",
    "M725 264c25-16 44-38 56-64",
  ],
  7: [
    "M430 312c-34-4-63-19-84-43",
    "M430 312c-15-28-18-56-10-84",
    "M488 352c-37-2-72-15-101-38",
    "M755 315c35-5 66-20 89-45",
    "M755 315c15-29 18-57 9-85",
    "M710 347c37-3 71-17 100-41",
    "M545 248c-28-15-50-37-64-64",
    "M545 248c-4-29 3-55 21-78",
    "M653 254c28-15 50-37 64-64",
    "M653 254c4-29-3-55-21-78",
    "M574 290c-24-19-39-42-45-69",
    "M638 299c25-18 42-41 49-68",
  ],
  8: [
    "M492 398l-46-34-38 8",
    "M492 398l-24-48 12-34",
    "M704 357l47-32 38 10",
    "M704 357l25-47-10-35",
    "M534 286l-35-35-32 4",
    "M534 286l-15-48 16-31",
    "M665 221l34-36 32 3",
    "M665 221l15-47-15-31",
  ],
  9: [
    "M420 287c-35-2-67-18-94-45",
    "M420 287c-11-30-10-58 3-84",
    "M779 287c35-2 67-18 94-45",
    "M779 287c11-30 10-58-3-84",
    "M443 308c-32 3-63-7-90-29",
    "M756 308c32 3 63-7 90-29",
    "M559 201c-24-17-40-39-48-66",
    "M653 172c24-18 40-41 47-68",
    "M520 370c-31-7-58-21-81-43",
    "M680 370c31-7 58-21 81-43",
  ],
};

export interface LeafAnchor {
  x: number;
  y: number;
  angle: number;
}

export const LEAF_ANCHORS: Readonly<Record<PathNumber, readonly LeafAnchor[]>> = {
  1: [{ x: 502, y: 302, angle: -48 }, { x: 526, y: 338, angle: -36 }, { x: 558, y: 204, angle: -16 }, { x: 634, y: 168, angle: 14 }, { x: 678, y: 248, angle: 38 }, { x: 650, y: 304, angle: 28 }, { x: 548, y: 376, angle: -30 }, { x: 646, y: 354, angle: 30 }, { x: 584, y: 274, angle: -8 }, { x: 614, y: 224, angle: 10 }],
  2: [{ x: 424, y: 278, angle: -52 }, { x: 468, y: 304, angle: -38 }, { x: 458, y: 236, angle: -50 }, { x: 776, y: 278, angle: 52 }, { x: 732, y: 304, angle: 38 }, { x: 742, y: 236, angle: 50 }, { x: 566, y: 350, angle: -18 }, { x: 634, y: 350, angle: 18 }, { x: 520, y: 326, angle: -26 }, { x: 680, y: 326, angle: 26 }],
  3: [{ x: 430, y: 262, angle: -58 }, { x: 480, y: 282, angle: -44 }, { x: 557, y: 204, angle: -12 }, { x: 653, y: 172, angle: 12 }, { x: 720, y: 256, angle: 44 }, { x: 772, y: 272, angle: 58 }, { x: 432, y: 288, angle: -62 }, { x: 768, y: 272, angle: 62 }, { x: 510, y: 330, angle: -30 }, { x: 690, y: 330, angle: 30 }],
  4: [{ x: 454, y: 458, angle: -80 }, { x: 746, y: 458, angle: 80 }, { x: 480, y: 388, angle: -76 }, { x: 720, y: 388, angle: 76 }, { x: 512, y: 318, angle: -70 }, { x: 688, y: 318, angle: 70 }, { x: 542, y: 248, angle: -66 }, { x: 658, y: 248, angle: 66 }, { x: 530, y: 350, angle: -72 }, { x: 670, y: 350, angle: 72 }],
  5: [{ x: 830, y: 399, angle: 68 }, { x: 780, y: 386, angle: 56 }, { x: 817, y: 314, angle: 62 }, { x: 760, y: 332, angle: 52 }, { x: 516, y: 235, angle: -44 }, { x: 780, y: 210, angle: 58 }, { x: 444, y: 404, angle: -64 }, { x: 520, y: 422, angle: -44 }, { x: 700, y: 286, angle: 44 }, { x: 620, y: 340, angle: 20 }],
  6: [{ x: 346, y: 371, angle: -70 }, { x: 420, y: 352, angle: -54 }, { x: 389, y: 322, angle: -62 }, { x: 851, y: 371, angle: 70 }, { x: 780, y: 352, angle: 54 }, { x: 807, y: 322, angle: 62 }, { x: 472, y: 264, angle: -44 }, { x: 728, y: 264, angle: 44 }, { x: 520, y: 374, angle: -28 }, { x: 680, y: 374, angle: 28 }],
  7: [{ x: 430, y: 312, angle: -54 }, { x: 486, y: 346, angle: -38 }, { x: 545, y: 248, angle: -18 }, { x: 653, y: 254, angle: 18 }, { x: 755, y: 315, angle: 48 }, { x: 710, y: 344, angle: 36 }, { x: 560, y: 290, angle: -12 }, { x: 646, y: 306, angle: 12 }, { x: 512, y: 390, angle: -34 }, { x: 690, y: 386, angle: 34 }],
  8: [{ x: 492, y: 398, angle: -58 }, { x: 564, y: 386, angle: -30 }, { x: 704, y: 357, angle: 56 }, { x: 627, y: 353, angle: 28 }, { x: 534, y: 286, angle: -48 }, { x: 588, y: 294, angle: -20 }, { x: 665, y: 221, angle: 44 }, { x: 617, y: 233, angle: 16 }, { x: 514, y: 315, angle: -52 }, { x: 684, y: 272, angle: 50 }],
  9: [{ x: 420, y: 287, angle: -60 }, { x: 474, y: 322, angle: -44 }, { x: 559, y: 201, angle: -18 }, { x: 653, y: 172, angle: 18 }, { x: 779, y: 287, angle: 60 }, { x: 726, y: 322, angle: 44 }, { x: 443, y: 308, angle: -56 }, { x: 757, y: 308, angle: 56 }, { x: 520, y: 370, angle: -30 }, { x: 680, y: 370, angle: 30 }],
};

export interface LeafPlacement extends LeafAnchor {
  scale: number;
  flip: boolean;
}

/** Stable across renders, reloads, dates and locale changes for a profile seed. */
export function getLeafPlacement(
  path: PathNumber,
  leafIndex: number,
  stableSeed = `ninefold-path-${path}`,
): LeafPlacement {
  if (!Number.isInteger(leafIndex) || leafIndex < 0) {
    throw new RangeError("Leaf index must be a non-negative integer.");
  }
  const anchors = LEAF_ANCHORS[path];
  const anchor = anchors[leafIndex % anchors.length] as LeafAnchor;
  const cluster = Math.floor(leafIndex / anchors.length);
  const random = createSeededPrng(`${stableSeed}:leaf:${leafIndex}`);
  const radius = cluster === 0 ? 0 : Math.min(4 + cluster * 3, 18);
  const theta = random.float(-Math.PI, Math.PI);
  return {
    x: anchor.x + Math.cos(theta) * radius,
    y: anchor.y + Math.sin(theta) * radius * 0.65,
    angle: anchor.angle + random.float(-10, 10),
    scale: random.float(0.62, 0.9),
    flip: random.boolean(),
  };
}
