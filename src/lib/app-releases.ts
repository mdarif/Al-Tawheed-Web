/**
 * User-facing app release highlights for the website.
 * Curated from https://github.com/mdarif/Al-Tawheed/releases — features only.
 * Update when shipping a new app version (before refreshing screenshots).
 */
export interface AppRelease {
  version: string;
  date: string;
  highlights: string[];
}

export const APP_RELEASES: AppRelease[] = [
  {
    version: "2.3.0",
    date: "July 2026",
    highlights: [
      "New Arabic series — the complete Kitab at-Tawheed explained in Arabic by Shaikh Salih al-Fawzan, with the full Arabic text of the book in a new Book tab",
      "Choose your series when you open the app, and switch series or language anytime from Settings",
      "Faster loading and smoother offline downloads",
      "Bug fixes and refinements",
    ],
  },
  {
    version: "2.2.0",
    date: "June 2026",
    highlights: [
      "Study Mode has its own tab — check class progress anytime from the bottom navigation",
      "Redesigned Study screen with a clearer class-by-class dashboard",
      "Home shows your overall progress across all 50 lectures",
      "Downloads grouped in a quick-action card on Home for offline prep",
      "Refreshed Al Marfa Duroos branding throughout the app",
    ],
  },
  {
    version: "2.1.1",
    date: "June 2026",
    highlights: [
      "Download individual lectures or full chapters for offline listening",
      "Offline Library — see what is saved and how much storage you are using",
      "Wi-Fi-only downloads to protect mobile data",
      "Background download progress notifications",
      "Home suggests the next parts to download before you go offline",
    ],
  },
  {
    version: "2.0.2",
    date: "June 2026",
    highlights: [
      "Complete audio experience — 50 lectures across 15 classes",
      "Background playback with lock-screen controls",
      "Study Mode for guided, class-by-class learning",
      "Continue Listening and per-lecture progress tracking",
      "Bookmarks to save lectures for later",
      "Daily Benefit — a rotating reminder on Home",
      "Urdu and Roman Urdu interface",
      "Light, dark, and system theme",
      "Variable playback speed (0.75× to 2×)",
    ],
  },
];

export const APP_RELEASES_URL =
  "https://github.com/mdarif/Al-Tawheed/releases";
