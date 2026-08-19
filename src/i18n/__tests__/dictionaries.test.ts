import { dictionaries, en, zhCN } from "..";
import { ZH_SEMANTIC_LABELS } from "../../domain";

function leafKeys(value: unknown, prefix = ""): string[] {
  if (typeof value === "string") return [prefix];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => leafKeys(item, `${prefix}.${index}`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) =>
      leafKeys(item, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [];
}

function leafStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(leafStrings);
  if (value && typeof value === "object") return Object.values(value).flatMap(leafStrings);
  return [];
}

describe("translation dictionaries", () => {
  it("has exact leaf-key parity in English and Simplified Chinese", () => {
    expect(leafKeys(zhCN).sort()).toEqual(leafKeys(en).sort());
  });

  it("contains no empty user-visible values", () => {
    Object.values(dictionaries).forEach((dictionary) => {
      expect(leafStrings(dictionary).every((value) => value.trim().length > 0)).toBe(true);
    });
  });

  it("locks the official product, World Tree and core experience terms", () => {
    expect(zhCN.brand.productName).toBe("九境生息");
    expect(zhCN.brand.worldTree).toBe("九境之树");
    expect(zhCN.brand.campaignLine).toBe("一树九境，因你而生。");
    expect(zhCN.brand.promise).toBe("回来片刻，留下一点生长。");
    expect(zhCN.terms).toEqual({
      path: "心径",
      livingLandscape: "内在风景",
      livingView: "生长景观",
      memoryView: "每日记忆",
      dailySigil: "今日印记",
      arrive: "归来",
      attune: "感知",
      tend: "照料",
      grow: "生长",
      reflect: "回望",
      rest: "停留",
      growth: "生长",
      method: "原理",
      reframe: "换个角度看",
      nourish: "滋养",
      release: "放下",
      protect: "守护",
      open: "敞开",
      observe: "观照",
      howTodayTookShape: "今天如何成形",
      restWithLandscape: "在这片风景中停留",
      enterLandscape: "进入你的风景",
      nothingLost: "你离开的日子里，没有什么因此失去。",
    });
    expect(zhCN.navigation.today).toBe("今日");
    expect(zhCN.navigation.growth).toBe("生长");
    expect(zhCN.navigation.method).toBe("原理");
    expect(zhCN.today.stages).toEqual({
      arrive: "归来",
      attune: "感知",
      tend: "照料",
      grow: "生长",
      reflect: "回望",
      rest: "停留",
    });
    expect(zhCN.result.dailySigil).toBe("今日印记");
    expect(zhCN.growth.livingView).toBe("生长景观");
    expect(zhCN.growth.memoryView).toBe("每日记忆");
    expect(zhCN.today.reflect.viewAnotherAngle).toBe("换个角度看");
  });

  it("locks all Path and care-action names", () => {
    expect(Object.values(zhCN.paths).map((path) => path.name)).toEqual([
      "启程",
      "联结",
      "表达",
      "构筑",
      "流动",
      "养护",
      "沉思",
      "凝成",
      "归一",
    ]);
    expect(Object.values(zhCN.careActions).map((action) => action.name)).toEqual([
      "滋养",
      "放下",
      "守护",
      "敞开",
      "观照",
    ]);
  });

  it("uses the canonical Chinese semantic palette in dictionary and reflection copy", () => {
    expect(zhCN.symbols.colours).toEqual(ZH_SEMANTIC_LABELS.colours);
    expect(zhCN.symbols.forms).toEqual(ZH_SEMANTIC_LABELS.forms);
  });

  it("does not contain forbidden alternative Chinese product names", () => {
    const chineseCopy = JSON.stringify(zhCN);
    ["九度时空", "九度空间", "九境生灵", "九重生灵"].forEach((variant) => {
      expect(chineseCopy).not.toContain(variant);
    });
  });
});
