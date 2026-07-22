import React, { useState } from "react";
import { useNuxeraLanguage } from "../hooks/useNuxeraLanguage";
import { buildEmptyProjectBuilderAnswers, getMissingRequiredProjectBuilderFields, getProjectBuilderCopy, getProjectBuilderQuestions, getRubricFallbackLabel } from "../applicant/projectBuilder";
import { nuxeraProjectBuilderAPI } from "../../services/api";

function EntityMatchBanner({ entityMatch, copy }) {
  return (
    <section className="nuxera-project-builder-entity" aria-label={copy.entityMatchTitle}>
      <h3>{copy.entityMatchTitle}</h3>
      <p>
        <strong>{entityMatch.entityLabel}</strong> / {entityMatch.sectorLabel}
        {entityMatch.approvalThreshold != null && ` — ${copy.mandatoryLabel} score ${entityMatch.approvalThreshold}+`}
      </p>
      <small>{copy.entityMatchNote}</small>
    </section>
  );
}

function RequiredDocumentsList({ documents, copy }) {
  return (
    <section className="nuxera-project-builder-documents" aria-label={copy.requiredDocumentsTitle}>
      <h3>{copy.requiredDocumentsTitle}</h3>
      <ul>
        {documents.map((doc) => (
          <li key={doc.code}>
            <strong>{doc.name}</strong> — {doc.mandatory ? copy.mandatoryLabel : copy.optionalLabel}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SectionCard({ section, copy, language }) {
  const label = section.label || getRubricFallbackLabel(section.rubricId, language);
  return (
    <article className="nuxera-project-builder-section">
      <header>
        <h4>{label}</h4>
        <span>{section.source === "ai-generated" ? `${copy.aiLabel} (${section.provider})` : copy.templateLabel}</span>
      </header>
      <p>{section.content}</p>
      {section.missingStructure?.length > 0 && (
        <p className="nuxera-project-builder-missing">
          <strong>{copy.missingLabel}:</strong> {section.missingStructure.join(", ")}
        </p>
      )}
      {section.redFlagsToWatch?.length > 0 && (
        <p className="nuxera-project-builder-redflags">
          <strong>{copy.redFlagsLabel}:</strong> {section.redFlagsToWatch.join(", ")}
        </p>
      )}
    </article>
  );
}

function ScopePanel({ scope, copy }) {
  return (
    <section className="nuxera-project-builder-scope" aria-label={copy.scopeTitle}>
      <h3>{copy.scopeTitle}</h3>
      <div>
        <strong>{copy.scopeAgentsDo}</strong>
        <ul>{scope.agentsDraftOnly.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
      <div>
        <strong>{copy.scopeAgentsDoNot}</strong>
        <ul>{scope.agentsDoNotDo.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
      <div>
        <strong>{copy.scopeHumanReview}</strong>
        <ul>{scope.humanMustReview.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
    </section>
  );
}

export default function ProjectBuilderAssistant() {
  const { language } = useNuxeraLanguage();
  const copy = getProjectBuilderCopy(language);
  const questions = getProjectBuilderQuestions(language);

  const [expanded, setExpanded] = useState(false);
  const [answers, setAnswers] = useState(buildEmptyProjectBuilderAnswers());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const missingRequired = getMissingRequiredProjectBuilderFields(answers, language);

  function handleFieldChange(id, value) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (missingRequired.length > 0) return;

    setLoading(true);
    setError(null);
    try {
      const { data } = await nuxeraProjectBuilderAPI.draft(answers, language);
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!expanded) {
    return (
      <section className="nuxera-project-builder nuxera-project-builder-collapsed" aria-label={copy.title}>
        <div>
          <h2>{copy.title}</h2>
          <p>{copy.intro}</p>
        </div>
        <button type="button" onClick={() => setExpanded(true)}>{copy.startButton}</button>
      </section>
    );
  }

  return (
    <section className="nuxera-project-builder" aria-labelledby="nuxera-project-builder-title">
      <header>
        <h2 id="nuxera-project-builder-title">{copy.title}</h2>
        <p>{copy.intro}</p>
        <button type="button" onClick={() => setExpanded(false)}>{copy.continueButton}</button>
      </header>

      <form onSubmit={handleSubmit} className="nuxera-project-builder-form">
        {questions.map((question) => (
          <label key={question.id} className="nuxera-project-builder-field">
            <span>{question.label}{question.required ? " *" : ""}</span>
            <textarea
              value={answers[question.id]}
              placeholder={question.placeholder}
              onChange={(event) => handleFieldChange(question.id, event.target.value)}
              rows={["useOfFunds", "advantage", "knownRisks"].includes(question.id) ? 2 : 1}
            />
          </label>
        ))}

        {missingRequired.length > 0 && (
          <p className="nuxera-project-builder-hint" role="status">
            {missingRequired.join(", ")}
          </p>
        )}

        <button type="submit" disabled={loading || missingRequired.length > 0}>
          {loading ? copy.loading : copy.submitButton}
        </button>
      </form>

      {error && <p className="nuxera-project-builder-error" role="alert">{error}</p>}

      {result && (
        <div className="nuxera-project-builder-result">
          <EntityMatchBanner entityMatch={result.entityMatch} copy={copy} />
          <RequiredDocumentsList documents={result.entityMatch.requiredDocuments} copy={copy} />

          <h3>{copy.sectionsTitle}</h3>
          {result.sections.map((section) => (
            <SectionCard key={section.rubricId} section={section} copy={copy} language={language} />
          ))}

          <ScopePanel scope={result.scope} copy={copy} />

          <small className="nuxera-project-builder-disclaimer">{copy.disclaimer}</small>
        </div>
      )}
    </section>
  );
}
