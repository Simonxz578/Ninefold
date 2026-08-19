import { Link } from "react-router-dom";
import { localizedPath, useI18n } from "../i18n";

export function NotFoundPage() {
  const { locale, t } = useI18n();

  return (
    <div className="page state-page state-page--living container">
      <p className="eyebrow">{t.errors.notFoundEyebrow}</p>
      <h1>{t.errors.notFoundTitle}</h1>
      <p>{t.errors.notFoundBody}</p>
      <Link className="button button--primary" to={localizedPath("/", locale)}>
        {t.errors.returnHome}
      </Link>
    </div>
  );
}
