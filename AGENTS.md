# Growth Rings v45 handoff

- This is the approved v45 application in the independent `Morii-si/growth-rings-workbench-v45` repository. The legacy `Morii-si/growth-rings-workbench` repository is a different publication. Do not substitute its source or pull its branch into this project.
- Read `README.md`, `RED_COWORK_IMPORT.md`, and `documentation/architecture.md` before changing deployment behavior.
- Reproduce the existing application by installing and building it. Preserve its current design, research content, local images, history and user data. Do not regenerate the application from the product description.
- The main flow is chat → generate board → quote a block → discuss → explicitly update board. Do not reintroduce the old draft page, pending-task workflow, proactive AI follow-up, direct-edit forms or deleted UI controls.
- This is a frontend-only demo with preset responses and browser-local storage. It needs no API keys, database, authentication backend or live AI service.
- Use Node.js 24 and `npm ci`; `npm test` runs the existing suite and `npm run build` produces `dist/`. Retain all local assets and third-party notices. Deploy only the static build output.
