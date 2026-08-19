import { Link } from "react-router-dom";
import { localizedPath, useI18n } from "../i18n";

export function LandingPage() {
  const { locale, t } = useI18n();
  const onboardingPath = localizedPath("/onboarding", locale);
  const samplePath = localizedPath("/archive?sample=1", locale);

  const principles = [
    {
      title: t.landing.persistentTitle,
      body: t.landing.persistentBody,
    },
    {
      title: t.landing.weatherTitle,
      body: t.landing.weatherBody,
    },
    {
      title: t.landing.reflectiveTitle,
      body: t.landing.reflectiveBody,
    },
  ];

  return (
    <div className="page landing-page">
      <section className="living-hero" aria-labelledby="landing-title">
        <div className="living-hero__art">
          <img
            src={`${import.meta.env.BASE_URL}brand/ninefold-world-tree-key-art.webp`}
            alt={t.landing.worldTreeDescription}
          />
        </div>
        <div className="container living-hero__content">
          <div>
            <p className="eyebrow">{t.landing.eyebrow}</p>
            <h1 id="landing-title">{t.landing.heroTitle}</h1>
            <p className="living-hero__lede">{t.landing.heroSupporting}</p>
            <div className="living-hero__actions">
              <Link className="button button--primary" to={onboardingPath}>
                {t.landing.primaryCta} <span aria-hidden="true">↗</span>
              </Link>
              <Link className="button button--secondary" to={samplePath}>
                {t.landing.secondaryCta}
              </Link>
            </div>
          </div>
          <p className="living-hero__promise">
            <strong>{t.landing.worldTreeLabel}</strong><br />
            {t.brand.promise}
          </p>
        </div>
      </section>

      <section className="living-principles container" aria-labelledby="living-principles-title">
        <div>
          <p className="eyebrow">{t.brand.definition}</p>
          <h2 id="living-principles-title">{t.brand.promise}</h2>
        </div>
        <div className="living-principles__list">
          {principles.map((principle, index) => (
            <article className="living-principles__item" key={principle.title}>
              <span aria-hidden="true">0{index + 1}</span>
              <div>
                <h3>{principle.title}</h3>
                <p>{principle.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="local-first-band" aria-labelledby="local-first-title">
        <div className="container local-first-band__inner">
          <div>
            <p className="eyebrow">{t.landing.localTitle}</p>
            <h2 id="local-first-title">{t.landing.noAccount}</h2>
            <p>{t.landing.localBody}</p>
          </div>
          <div>
            <p>{t.landing.privacyNote}</p>
            <p>{t.brand.safety}</p>
            <Link className="text-link" to={localizedPath("/about", locale)}>
              {t.navigation.method} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
