import { getVersion } from "./daily";
import { formatReflectionForLocale, ZH_SEMANTIC_LABELS } from "./reflectionLocale";
import type { DailyEntry, LandscapeLocale, PatternVariant, Profile } from "./types";

export function buildShareCaption(
  profile: Pick<Profile, "pathNumber">,
  entry: DailyEntry,
  variant: PatternVariant = entry.activeVariant,
): string {
  const version = getVersion(entry, variant);
  const configuration = version.configuration;
  // Deliberately references only symbolic output; profile IDs and check-in notes never enter the caption.
  return [
    "My Ninefold pattern today:",
    `Path ${profile.pathNumber} · Number ${configuration.dailyNumber} · ${configuration.primaryColor} · ${configuration.form[0]?.toUpperCase()}${configuration.form.slice(1)}`,
    `Theme: ${version.reflection.theme}`,
  ].join("\n");
}

/**
 * Builds the locale-safe caption without changing or regenerating the stored
 * deterministic PatternConfiguration. `pathName` is presentation copy supplied
 * by the active dictionary; no profile identifier or private check-in note is
 * read into the result.
 */
export function buildLocalizedShareCaption(
  profile: Pick<Profile, "pathNumber">,
  entry: DailyEntry,
  locale: LandscapeLocale,
  pathName: string,
  variant: PatternVariant = entry.activeVariant,
): string {
  const version = getVersion(entry, variant);
  const reflection = formatReflectionForLocale({
    path: version.configuration.pathNumber,
    checkIn: entry.checkIn,
    configuration: version.configuration,
  }, locale);

  if (locale === "zh-CN") {
    const configuration = version.configuration;
    return [
      "我的九境生息今日印记：",
      `心径 ${pathName} · 数字 ${configuration.dailyNumber} · ${ZH_SEMANTIC_LABELS.colours[configuration.primaryColor]} · ${ZH_SEMANTIC_LABELS.forms[configuration.form]}`,
      `回望：${reflection.theme}`,
    ].join("\n");
  }

  const localizedEntry: DailyEntry = variant === "reframe" && entry.reframe
    ? { ...entry, reframe: { ...entry.reframe, reflection } }
    : { ...entry, original: { ...entry.original, reflection } };
  return buildShareCaption(profile, localizedEntry, variant);
}

export interface ShareEnvironment {
  navigator?: {
    share?: (data: { title: string; text: string }) => Promise<void>;
    clipboard?: { writeText(text: string): Promise<void> };
  };
}

export type ShareResult = "shared" | "copied" | "unavailable" | "cancelled";

export async function shareOrCopyCaption(
  caption: string,
  environment: ShareEnvironment = globalThis as ShareEnvironment,
): Promise<ShareResult> {
  if (environment.navigator?.share) {
    try {
      await environment.navigator.share({ title: "My Ninefold pattern", text: caption });
      return "shared";
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        error.name === "AbortError"
      ) {
        return "cancelled";
      }
    }
  }
  try {
    if (environment.navigator?.clipboard) {
      await environment.navigator.clipboard.writeText(caption);
      return "copied";
    }
    return "unavailable";
  } catch {
    return "unavailable";
  }
}
