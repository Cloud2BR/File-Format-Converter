# File Format Converter

Atlanta, USA

[![GitHub](https://img.shields.io/badge/--181717?logo=github&logoColor=ffffff)](https://github.com/)
[Cloud2BR OSS - Learning Hub](https://github.com/Cloud2BR-MSFTLearningHub)

Last updated: 2026-08-24

----------

> A free, private, **in-browser** file format converter deployed to GitHub Pages. Upload a file, pick a target format, click convert, and download the result. Every conversion runs locally in your browser — files are never uploaded to a server.

## Live app

The project is deployed to GitHub Pages via GitHub Actions, with two environments driven by the `main` and `test` branches:

| Branch | Environment | Description                                                 | URL                                                                                                                                              |
| ------ | ----------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `main` | Production  | Stable release served at the site root.                     | [File Converter](https://cloud2br.github.io/File-Format-Converter/)
| `test` | Staging     | Preview of in-progress work served under the `/test/` path. | [File Converter Test](https://cloud2br.github.io/File-Format-Converter/test/) |

## Supported conversions

| From           | To                                                   |
| -------------- | ---------------------------------------------------- |
| Markdown       | HTML, PDF, Word (`.docx`), PowerPoint (`.pptx`)      |
| Word (`.docx`) | HTML, Markdown, PDF                                  |
| PDF            | Images (per page + ZIP of all pages), extracted text |
| HTML           | Markdown, PDF                                        |
| Plain text     | Markdown, HTML, PDF, PowerPoint                      |
| CSV            | JSON                                                 |
| JSON           | CSV                                                  |
| JPG, PNG, WebP | JPG, PNG, WebP, or a compressed ZIP with the image in its original format |

Every supported upload also has a **Compress file size** mode that downloads a
ZIP. JPG, PNG, and WebP use native image compression before the image is placed
in the archive with its original extension. Markdown, Word, PDF, HTML, text,
CSV, JSON, and PowerPoint are compressed losslessly into a ZIP that contains
the original file with its name and format unchanged.

> [!NOTE]
> PDF → images renders each page to PNG. You can preview and save pages individually, and also download a ZIP containing every page.
>
> Images have two modes: **Convert format** changes between JPG, PNG, and WebP,
> while **Compress file size** keeps the original format inside the downloaded
> ZIP. Choose maximum quality, balanced, or smallest-file ranges, or provide a
> target size in KB or MB.
> Target-size matching is best effort and can reduce image dimensions when quality
> reduction alone is insufficient. PNG remains lossless; convert it to JPG or WebP
> when a specific smaller target is required.
>
> Lossless ZIP compression cannot guarantee a target size. Formats that are already
> compressed internally, including PDF, Word, and PowerPoint, may not become
> significantly smaller.

## How it works

The app is a single-page **React + TypeScript** project built with **Vite**. A small conversion engine (`src/converters/`) maps each input format to its available targets and runs the matching browser library:

- `marked` — Markdown → HTML
- `mammoth` — Word → HTML
- `turndown` — HTML → Markdown
- `docx` — Markdown/text → Word
- `pdfjs-dist` — PDF rendering and text extraction
- `pptxgenjs` — slides from headings
- `papaparse` — CSV ↔ JSON
- `html2pdf.js` — HTML → PDF
- `jszip` / `file-saver` — packaging and downloads

## Local development

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check and produce the production bundle in dist/
npm run preview  # serve the built bundle locally
```

## Deployment

`.github/workflows/deploy-pages.yml` builds the app and deploys it to GitHub  
Pages on pushes to `main` and on manual runs. Pushes to `test` trigger an automatic  
dispatch of the same workflow on `main` (to satisfy `github-pages` environment protection rules).  
Both environments ship in a single  
Pages artifact:

- `main` → built with base `/File-Format-Converter/` → served at the site root `/`.
- `test` → built with base `/File-Format-Converter/test/` → served at `/test/`.

Smart refresh behavior:

- Push to `test` → refreshes `/test/` first, while production (`/`) is reused from cache when possible.
- Push to `main` → refreshes production (`/`) first, while `/test/` is reused from cache when possible.

## Repository automation

This repo keeps the organization's standard pipelines:

| Workflow                                          | Trigger                                 | What it does                                                                                                                                                                          |
| ------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/deploy-pages.yml`              | Push to `main` / `test` and manual runs | Deploys from protected `main` only; `test` pushes auto-dispatch a `main` run in test-refresh mode. Rebuild priority is branch-aware (`test` -> `/test/`, `main` -> `/`).            |
| `.github/workflows/cleanup-deployments.yml`       | After Pages deploy success, daily schedule, and manual runs | Keeps only the two newest deployment records in the `github-pages` environment and prunes older ones.                                                                                |
| `.github/workflows/validate_and_fix_markdown.yml` | Pull requests to `main`                 | Runs `markdownlint`, auto-fixes Markdown style issues when possible, validates the required header block for every tracked Markdown file, and pushes any fixes back to the PR branch. |
| `.github/workflows/update-md-date.yml`            | Pull requests to `main`                 | Looks at the full PR diff, updates the `Last updated:` line inside the standard Markdown header block for changed Markdown files, and pushes the result back to the PR branch.        |
| `.github/workflows/validate_and_fix_notebook.yml` | Pull requests to `main`                 | Validates Jupyter notebooks, normalizes widget metadata when needed, and commits notebook-format fixes back to the PR branch.                                                         |
| `.github/workflows/use-visitor-counter.yml`       | Pull requests to `main` and manual runs | Runs the vendored visitor-counter script stored in this repo to refresh Markdown counter badges and `metrics.json`, then commits the updated repository traffic data.                 |

![Total views](https://img.shields.io/badge/Total%20views-40-limegreen)

Refresh Date: 2026-04-07
