# Android Offline Standalone Application (Capacitor) & Target-First Architecture — Engineering Journey

## 1. Overview & Objectives

Following the establishment of the Angular 22 Zoneless web application and PWA offline infrastructure, this phase focused on delivering a standalone, high-performance native Android application while strictly preserving the **Target-First Web** architecture:

1. **Native Android Package without Bloat**: Embedding the Angular application into a native Android APK using **Capacitor 8**, achieving an ultra-lightweight binary size of **4.53 MB** (universal DEX bytecode across `arm64-v8a`, `armeabi-v7a`, `x86_64`, `x86`).
2. **Zero-Permission Architecture**: Eliminating `android.permission.INTERNET` and all other dangerous permissions from `AndroidManifest.xml`, ensuring 100 % private, air-gapped offline operation.
3. **Smart Platform Detection**: Dynamically distinguishing between Web/PWA and Native Android runtimes via `Capacitor.isNativePlatform()` to silence redundant web polling (`UpdateService`) and Service Worker registration in native context.
4. **Offline-Embedded Dataset**: Packaging the full curated dictionary of 6 175 words (`words.json`) directly into the APK assets (`assets/public/data/words.json`) for instant 0 ms local startup.
5. **Mobile-Native Sharing & Vector Export**: Upgrading card sharing and SVG exporting to leverage the native Android Share Sheet via the **Web Share API** (`navigator.share()`), with seamless desktop clipboard and blob download fallbacks.

---

## 2. Technical Architecture & Component Analysis

```
+-----------------------------------------------------------------------------------+
|                                Android Smartphone                                 |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                  Concept Cards APK (4.53 MB, Universal DEX)                 |  |
|  |                                                                             |  |
|  |  +---------------------------+       +-----------------------------------+  |  |
|  |  |    Capacitor Bridge       |       |       Bundled APK Assets          |  |  |
|  |  |  - No INTERNET permission |       |  (app/src/main/assets/public)     |  |  |
|  |  |  - AndroidScheme: https   |       |  - index.html, main-*.js, styles  |  |  |
|  |  |  - Hostname: localhost    |       |  - data/words.json (6 175 words)  |  |  |
|  |  +-------------+-------------+       +-----------------+-----------------+  |  |
|  |                |                                       |                    |  |
|  |                v                                       v                    |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  |                       Android System WebView                          |  |  |
|  |  |                     (Chromium Runtime Engine)                         |  |  |
|  |  |                                                                       |  |  |
|  |  |  - Angular 22 Zoneless Application (Signals + OnPush)                 |  |  |
|  |  |  - Local Asset Interception (https://localhost/...)                   |  |  |
|  |  |  - Local IndexedDB (Instant cache / fast reads)                       |  |  |
|  |  |  - Web Share API (Android native share sheet: WhatsApp, SMS, etc.)     |  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 3. Web-First Compatibility & Runtime Conditioning

To guarantee zero regression on GitHub Pages while delivering native efficiency, the codebase employs runtime capability checks rather than separate divergent codebases:

### ⚡ Service Worker Guard (`index.html`)
The Service Worker (`sw.js`) provides offline caching for browser clients. In the Android WebView, all files are pre-packaged in the APK. Registering a Service Worker is redundant and could cause cache synchronization issues between APK updates:
```html
<script>
  if ('serviceWorker' in navigator && (!window.Capacitor || !window.Capacitor.isNativePlatform())) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('./sw.js', { scope: './' });
    });
  }
</script>
```

### 🔇 Update Polling Bypass (`update.service.ts`)
On the web, `UpdateService` polls `app-version.json` every 15 minutes to detect GitHub Pages deployments. On Android, this is bypassed completely:
```typescript
export class UpdateService {
  readonly isNative = Capacitor.isNativePlatform();

  constructor() {
    // Only enable web polling & Service Worker listeners on web browsers
    if (this.isBrowser && !this.isNative) {
      this.initUpdateListeners();
    }
  }

  async checkForUpdates(force = false): Promise<boolean> {
    if (!this.isBrowser || this.isNative || this.isChecking()) {
      return false;
    }
    // ...
  }
}
```

---

## 4. Mobile Enhancements: Universal Sharing & SVG Export

### 🔗 Public Canonical Link Sharing
When running inside the Android container, `window.location.href` resolves to `https://localhost/#<seed>`. Sharing `localhost` would be useless for remote recipients. The sharing logic now constructs the canonical public URL:
```typescript
const publicUrl = `https://maxisoft-vibe.github.io/concept-cards/#${card.id}`;

if (typeof navigator !== 'undefined' && navigator.share) {
  await navigator.share({
    title: `Carte Concept #${card.id}`,
    text: `Découvre cette carte Concept (#${card.id}) !`,
    url: publicUrl
  });
}
```

### 📥 Véritable "Enregistrer sous..." Android via Storage Access Framework (SAF)
- **Plugin Natif `SaveFilePlugin` (`Intent.ACTION_CREATE_DOCUMENT`)** : Déclenche l'interface système native de sélection de dossier / enregistrement de document Android.
- L'utilisateur peut naviguer dans l'arborescence de son appareil (Téléchargements, Documents, Carte SD, Drive), renommer le fichier et appuyer sur **"Enregistrer"**. Le flux SVG est écrit directement sans requérir aucune permission dangereuse.
- **Séparation Copier / Partager** :
  - Le bouton **📋 Copier** copie directement et instantanément l'URL publique canonique dans le presse-papier (`navigator.clipboard`).
  - Le bouton **🔗 Partager** ouvre la feuille de partage native (`Share.share`).

### 💾 Persistance de l'Historique (128 cartes max) via Android Preferences
- **Architecture SharedPreferences (`@capacitor/preferences`)** : En mode natif Android uniquement, la pile d'historique des cartes générées (jusqu'à 128 cartes) et la position courante sont automatiquement persistées lors de chaque tirage ou navigation.
- **Restauration au démarrage** : Lorsque l'application Android est rouverte, elle recharge immédiatement la dernière carte consultée et restaure toute la pile de cartes précédentes/suivantes (0 ms).
- **Zéro impact Web** : Sur GitHub Pages (navigateur web), l'historique reste purement en session et synchronisé avec les paramètres d'URL, sans encombrer le stockage.

### 🎨 Suite d'Icônes Adaptatives Haute Définition
Génération automatisée des 117 ressources graphiques Android (icônes adaptatives rondes/carrées, foreground, background, splash screens light/dark mode sur toutes les densités `ldpi`, `mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi` et `mipmap-anydpi-v26`) basées sur le design de marque Concept.

---

## 5. Android Project Configuration & Build Metrics

| Metric / Parameter | Value |
| :--- | :--- |
| **Package ID / App ID** | `com.maxisoft.concept` |
| **App Name** | `Concept Cards` |
| **Capacitor Version** | `8.x` |
| **Min SDK / Target SDK** | `24 (Android 7.0)` / `36 (Android 16)` |
| **Java / JDK Version** | `Eclipse Adoptium OpenJDK 21` |
| **Debug APK Output** | `web/android/app/build/outputs/apk/debug/app-debug.apk` |
| **APK Binary Size** | **4.53 MB** |
| **Network Permissions** | **0** (`android.permission.INTERNET` removed) |
| **Local Dataset Size** | **460 KB** (6 175 words, JSON embedded) |

---

## 6. Automated GitHub Actions Release Pipeline (`release-android.yml`)

A dedicated workflow [`.github/workflows/release-android.yml`](../../.github/workflows/release-android.yml) automates APK production builds and release asset distribution:

* **Triggers**: Automatic on Git tags matching `v*` (e.g. `git tag v1.3.0 && git push origin v1.3.0`) or manual via `workflow_dispatch`.
* **JDK 21 & Gradle Pipeline**: Compiles signed release APK (`assembleRelease`).
* **SLSA Build Provenance Attestation**: Signs the APK artifact checksums with Sigstore / `actions/attest-build-provenance@v2`.
* **Automatic GitHub Release**: Attaches `concept-cards-vX.Y.Z.apk` and its `.sha256` checksum to the release with auto-generated release notes.

---

## 7. Build Commands & Local Tooling

```bash
# 1. Build Angular web application & synchronize Android assets
npm run cap:sync

# 2. Open project in Android Studio (optional)
npm run cap:open

# 3. Compile Android Debug / Release APK via Gradle (from web/android)
.\gradlew.bat assembleDebug
.\gradlew.bat assembleRelease
```
