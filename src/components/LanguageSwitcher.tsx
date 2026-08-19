import { useI18n, type Locale } from "../i18n";

const languageOptions: ReadonlyArray<{
  locale: Locale;
  label: "chinese" | "english";
  lang: string;
  ariaLabel: "changeToChinese" | "changeToEnglish";
}> = [
  { locale: "zh-CN", label: "chinese", lang: "zh-CN", ariaLabel: "changeToChinese" },
  { locale: "en", label: "english", lang: "en", ariaLabel: "changeToEnglish" },
];

function segmentClassName(active: boolean): string {
  const classNames = ["language-switcher__segment"];
  if (active) classNames.push("is-active");
  return classNames.join(" ");
}

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="language-switcher" role="group" aria-label={t.language.switcherLabel}>
      {languageOptions.map((option, index) => {
        const active = option.locale === locale;
        return (
          <span className="language-switcher__item" key={option.locale}>
            {index > 0 && <span className="language-switcher__separator" aria-hidden="true">|</span>}
            <button
              className={segmentClassName(active)}
              type="button"
              lang={option.lang}
              aria-label={t.language[option.ariaLabel]}
              aria-pressed={active}
              onClick={() => setLocale(option.locale)}
            >
              {t.language[option.label]}
            </button>
          </span>
        );
      })}
    </div>
  );
}
