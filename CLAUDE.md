# Working in this harness

This repo tests the CopilotKit docs exactly as published. Code that a guide
shows is integrated verbatim; when it is broken, it stays broken and the defect
is recorded, not fixed. Gaps the guide leaves are filled from the guide's demo
code (the CopilotKit showcase, the Angular demo), never invented, and every
gap-fill is labelled where it lives.

## Showcase-only code

Integrate only the custom code a guide's examples need to work. When a guide's
code calls a helper, component or function that is specific to the CopilotKit
showcase's own setup — test plumbing, mock-LLM header forwarding, internal
diagnostics, deployment-specific defaults — and the feature works without it,
leave it out instead of copying it in.

- Do not copy showcase files that exist only to support that setup (for
  example `ApiKeyResolver`, `AimockHeaderPolicy` / `AimockHeaderContext`,
  `CvDiag` / `CvdiagBackend` and the CVDIAG schema/emitter).
- Where guide code calls such a helper, replace only that call with the
  smallest plain equivalent (for example a configuration read), and mark it
  `HARNESS DEVIATION` with the published lines quoted beside it.
- Say so on the route page and in the README's gap list.
- Keep a showcase helper only when the feature depends on it or the guide's
  code cannot be mounted without it — and say why where it is kept.
