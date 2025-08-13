// prompts.js
export const PROMPTS = [
  {
    "title": "Case Law Summary (Litigation)",
    "content": "Summarize [CASE NAME, CITATION] in 250 words. Include holding, key reasoning, and application to [client fact pattern]. Provide 3 counter-arguments."
  },
  {
    "title": "RAG Answer (General)",
    "content": "Using the provided context, answer precisely. Start with a 1-sentence answer, then cite specific lines. If uncertain, say what else you\u2019d need."
  },
  {
    "title": "Model Card Draft",
    "content": "Create a concise model card covering: intended use, data sources, training method, metrics, limitations, bias risks, and monitoring plan."
  },
  {
    "title": "Adversarial Prompt (Safety)",
    "content": "Challenge the model to reveal weaknesses on [topic]. Ask for corner cases, exceptions, and uncertainties. Require explicit citations and confidence levels."
  },
  {
    "title": "Client Memo (AI Adoption)",
    "content": "Draft a 1-page memo explaining how to adopt AI for [department], including benefits, risks, governance steps, and quick wins in 90 days."
  }
]