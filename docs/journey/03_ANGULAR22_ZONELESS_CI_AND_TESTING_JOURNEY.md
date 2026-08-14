# Angular 22 Modernization, Zoneless Architecture, Vitest & CI/CD - Engineering Journey

## 1. Overview & Objectives

Following the generation of the 8,695-word Concept dataset and the initial web application prototype, this phase focused on modernizing the entire frontend and engineering infrastructure to cutting-edge standards:

1. **Angular 22 & TypeScript 6**: Upgrading the application to Angular 22.1.2, TypeScript 6.0.3, and Node.js 24 LTS (Krypton).
2. **Pure Zoneless Architecture**: Eliminating `zone.js` runtime overhead with stabilized `provideZonelessChangeDetection()`.
3. **Reactive Signal Primitives**: Transitioning all components to Signal Inputs (`input.required()`, `input()`), Signal Outputs (`output()`), Signal Queries (`viewChild()`), and `@let` local template variables.
4. **Automated Unit Testing Suite (Vitest)**: Implementing a blazing-fast unit test suite using Vitest 4 and JSDOM (28/28 tests passing in ~3–4 seconds).
5. **Git History Scrubbing & Release Assets**: Purging large dataset blobs from Git history using **BFG Repo-Cleaner** and hosting datasets as official GitHub Release assets.
6. **Robust CI/CD & Dependabot Gates**: Establishing automated ESLint flat configuration, strict type checking (`tsc --noEmit`), PR verification workflows, and grouped Dependabot automated maintenance.

🔗 **Live Web Application**: [https://maxisoft-vibe.github.io/concept-cards/](https://maxisoft-vibe.github.io/concept-cards/)  
📦 **Official Dataset Release**: [https://github.com/maxisoft-vibe/concept-cards/releases/tag/data](https://github.com/maxisoft-vibe/concept-cards/releases/tag/data)

---

## 2. Angular Modernization & Zoneless Architecture

### ⚡ Pure Zoneless Change Detection
* **Zoneless Provider**: Configured `provideZonelessChangeDetection()` in `app.config.ts`.
* **Zero Runtime Polyfills**: Removed `zone.js` from `angular.json` build polyfills, completely eliminating `polyfills.js` and reducing the initial bundle transfer size by ~35 kB.
* **OnPush Everywhere**: Enforced `ChangeDetectionStrategy.OnPush` across all standalone components, relying entirely on Angular Signals (`signal()`, `computed()`, `effect()`) for precise, micro-targeted DOM updates.

### 🔄 Signal Inputs, Outputs & Queries
Components were refactored from legacy `@Input()`/`@Output()` decorators to native Signal functions:
* **`ConceptCardComponent`**:
  ```typescript
  card = input.required<ConceptCard>();
  selectedWord = input<ConceptWord | null>(null);
  activeMode = input<'generator' | 'explorer'>('generator');
  wordSelected = output<ConceptWord>();
  ```
* **`TrianglifyBackgroundComponent`**:
  ```typescript
  canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('bgCanvas');
  theme = input<string>('light');
  ```
* **Built-in Control Flow & `@let`**:
  All HTML templates were converted from structural directives (`*ngIf`, `*ngFor`) to native control flow syntax (`@if`, `@else`, `@for (word of words; track word.w)`, `@let theme = activeTheme()`, and `@empty`).

---

## 3. Vitest Test Suite Architecture

We integrated Vitest v4 with `@analogjs/vite-plugin-angular` and `jsdom` v30 to provide instantaneous, headless unit testing without requiring browser windows or Karma/Jasmine overhead.

```
web/
├── vitest.config.ts                      # Vite & AnalogJS Angular plugin config
└── src/
    ├── setup-vitest.ts                   # Zone-free test runner setup
    └── app/
        ├── services/
        │   ├── card-generator.service.spec.ts   # Mulberry32 determinism & 3-3-3 distribution (6 tests)
        │   ├── card-svg-exporter.service.spec.ts # Vector SVG rendering & XML escaping (5 tests)
        │   ├── card-history.service.spec.ts     # History stack navigation & seed routing (5 tests)
        │   ├── theme.service.spec.ts            # Light/Dark/Auto sync & persistence (5 tests)
        │   └── word-storage.service.spec.ts     # IndexedDB & network dataset loading (3 tests)
        ├── components/
        │   └── concept-card/concept-card.component.spec.ts # Signal Inputs & event emission (2 tests)
        └── app.component.spec.ts                # Application bootstrapping & layout (2 tests)
```

**Results**: **7 / 7 test files passed (28 / 28 unit tests)** executed in **3.02s** on CI.

---

## 4. Git History Sanitization & Release Asset Architecture

### 🧹 The Large File Challenge
Initial commits tracked large JSON datasets (`words_generated.json` at 3.25 MB, `cache_words_gen.json` at 4.54 MB, and compact payloads). To keep the repository lightweight and adhere to Git best practices:

1. **GitHub Release Publication**:
   Created official release tag `data` using `gh release create data` containing all dataset artifacts:
   * `words_generated.json` (Full 8,695-word dataset)
   * `cache_words_gen.json` (LLM raw generation cache)
   * `words_compact.json` (Compressed dictionary payload)
   * `words.json` (Web runtime dictionary)
2. **BFG Repo-Cleaner History Scrubbing**:
   Executed `bfg.jar --delete-files "{words_generated.json,words_compact.json,cache_words_gen.json*,words.json,*.bak}" .` followed by `git reflog expire` and aggressive garbage collection, shrinking the repository `.git` footprint.
3. **Automated CI Fetch**:
   Workflows dynamically fetch `words.json` from the release endpoint during build:
   ```yaml
   - name: Download dataset from release
     run: |
       mkdir -p web/public/data
       curl -fsSL https://github.com/maxisoft-vibe/concept-cards/releases/download/data/words.json -o web/public/data/words.json
   ```

---

## 5. CI/CD Modernization & Tooling

### 🚀 Node.js 24 LTS Runtime
* Upgraded CI workflows and local development environment to **Node.js 24 LTS (Krypton)** with **npm 11**.
* Leveraged native ESM execution and faster module resolution.

### 🛡️ Automated Quality Gates
* **ESLint Flat Config (`web/eslint.config.js`)**: Modern ESLint 10 + `@angular-eslint` flat configuration validating TypeScript and template accessibility rules.
* **Strict Type-Checking**: Integrated `tsc --noEmit` checks across application and spec configs before test and build stages.
* **Dual GitHub Actions Workflows**:
  * **`.github/workflows/deploy.yml`**: Full CI + GitHub Pages CD pipeline triggered on pushes to `main`.
  * **`.github/workflows/ci.yml`**: Dedicated PR Quality Gate testing branches prior to merging.

### 🤖 Dependabot Maintenance & Grouping
Configured `.github/dependabot.yml` with weekly automated scans and semantic grouping:
* `angular`: Grouped updates across `@angular/*` packages.
* `testing`: Grouped updates for `vitest`, `@analogjs/*`, and `jsdom`.
* `eslint`: Grouped updates for `@angular-eslint` and `typescript-eslint`.
* `github-actions`: Workflow actions tracking.
* `pip`: Python backend dependencies tracking.

### 📌 TypeScript 7 vs Angular 22 Toolchain Note
Dependabot proposed upgrading to TypeScript 7.0.2. However:
* Angular 22's compiler (`@angular/compiler-cli@22.1.2`) strictly requires `typescript: ">=6.0 <6.1"`.
* TypeScript 7.0 introduced a native Go compiler (`tsgo`) and deprecated the legacy programmatic API without a stable replacement (scheduled for TypeScript 7.1).
* The project correctly pinned `typescript: ~6.0.3` to ensure full stability with Angular 22.

---

## 6. Summary of Current Tech Stack

| Component | Technology | Version |
| :--- | :--- | :--- |
| **Framework** | Angular (Zoneless + Signals + OnPush) | `22.1.2` |
| **CLI & Build Tool** | Angular CLI & DevKit | `22.1.4` |
| **Language** | TypeScript | `6.0.3` |
| **Test Runner** | Vitest + AnalogJS + JSDOM | `4.1.10` / `30.0.1` |
| **Linter** | ESLint 10 + Angular ESLint | `22.1.0` |
| **Runtime** | Node.js (LTS Krypton) | `v24.19.0` |
| **Deployment** | GitHub Actions -> GitHub Pages | Automated |
