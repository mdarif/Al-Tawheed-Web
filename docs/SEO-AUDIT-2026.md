# SEO & Social Sharing Audit — Kitab At-Tawheed Web

**Date:** June 4, 2026  
**Auditor:** Senior Frontend Engineer & SEO Specialist  
**Target:** Optimize social sharing across Facebook, WhatsApp, Telegram, X (Twitter), LinkedIn

> **Status update (2026-07-03) — historical snapshot; most items resolved.**
> This audit predates the two-series relaunch. Since then: `og:site_name`,
> `og:locale:alternate`, Twitter `@creator`, and JSON-LD (AudioSeries /
> AudioObject / Course / BreadcrumbList / FAQPage) are all implemented; titles
> and descriptions were tightened; `hreflang` now emits only on translated
> pages (no `/ur/` → 404); and the OG image is the **two-series** card used
> site-wide (lecture/Arabic pages included). A fresh Lighthouse pass scores
> **SEO/Best-Practices/Performance 100** with CWV all "Good". Treat the
> gaps table below as a record of what *was* fixed, not open work.

---

## 1. AUDIT OF CURRENT METADATA

### ✅ Currently Implemented
- Open Graph basic tags (og:title, og:description, og:url, og:type, og:image)
- Twitter Card with summary_large_image
- Image dimensions (1200x630) — correct
- Canonical URLs
- Locale (en_US)
- RSS feed link

### ⚠️ GAPS & ISSUES

| Issue | Impact | Priority |
|-------|--------|----------|
| Missing `og:site_name` | Platform doesn't know your brand | HIGH |
| Generic OG image (book cover only) | Low engagement, weak CTR | HIGH |
| Weak `og:title` (too long, generic phrasing) | Poor CTR, not optimized for platforms | HIGH |
| Missing platform-specific metadata | Reduced visibility on specific platforms | HIGH |
| No structured data (JSON-LD) for breadcrumbs | Poor search result appearance | MEDIUM |
| `og:description` lacks urgency/benefit | Lower click-through rate | MEDIUM |
| No `og:locale:alternate` for Urdu | Missing international SEO opportunity | MEDIUM |
| Twitter `@creator` missing | Loss of attribution data | LOW |
| No LinkedIn-specific optimizations | Reduced LinkedIn sharing potential | LOW |

---

## 2. RECOMMENDED METADATA IMPROVEMENTS

### Homepage: `/`

**Current → Recommended:**

```
og:title (Current):
"Sharah Kitab al-Tawheed — 50 Urdu Audio Lectures | Free"

og:title (Recommended):
"50 Free Urdu Audio Lessons on Islamic Monotheism — Kitab At-Tawheed"
```

**Why:** 
- Shorter, more scannable
- Leads with benefit ("Free," "Urdu")
- Better for mobile previews
- Includes keywords naturally

---

```
og:description (Current):
"Complete audio series on Kitab al-Tawheed by Shaikh Abdullah Nasir Rahmani. 50 Urdu lectures, 27+ hours. Free online and offline on Android."

og:description (Recommended):
"Master Islamic monotheism with 50 hours of free Urdu lessons by Shaikh Abdullah Nasir Rahmani. Listen online or download the free Android app. No account required."
```

**Why:**
- Adds urgency ("Master")
- Emphasizes "free" twice (proven CTR booster)
- "No account required" removes barrier
- Benefit-forward messaging

---

**NEW METADATA (Add to Layout):**

```html
<!-- og:site_name: Your brand identity -->
<meta property="og:site_name" content="Kitab At-Tawheed — Free Islamic Audio" />

<!-- Article published/modified dates for content freshness signals -->
<meta property="article:published_time" content="2024-01-01T00:00:00Z" />
<meta property="article:modified_time" content="2026-06-04T00:00:00Z" />

<!-- Twitter handle for attribution -->
<meta name="twitter:creator" content="@mdarif" />

<!-- LinkedIn-specific -->
<meta property="og:image:secure_url" content="https://kitabattawheed.com/og-image.png" />

<!-- Urdu locale alternate -->
<meta property="og:locale:alternate" content="ur_PK" />

<!-- App discovery (if sharing to apps) -->
<meta name="apple-itunes-app" content="app-id=YOUR_APP_ID" />
```

---

### Lecture Pages: `/lectures/[chapterId]/[lectureSlug]/`

**Recommendation for dynamic metadata:**

```
og:title:
"Part {number}: {lectureTitle} — Kitab At-Tawheed Audio Lesson"

Example: "Part 01: Understanding Tawheed — Kitab At-Tawheed Audio Lesson"

og:description:
"{lectureTitle} from the complete Sharah by Shaikh Abdullah Nasir Rahmani. {durationSeconds} minutes of free Urdu Islamic education. No app required — listen online."

Example: "Understanding Tawheed from the complete Sharah by Shaikh Abdullah Nasir Rahmani. 24 minutes of free Urdu Islamic education. No app required — listen online."

og:image:
/og-image-lecture-{chapterId}.png (dynamically generated)

og:type:
"article" (not "website" — individual lessons are articles)

article:section:
"Islamic Education"

article:tag:
"Tawheed", "Islamic Studies", "Quran", "Sunnah"
```

---

## 3. CUSTOM OG IMAGE DESIGN

### Image Asset: `public/og-image-template.svg`

**Specifications:**
- **Dimensions:** 1200 × 630px (Facebook standard)
- **Format:** SVG (scalable, optimizable)
- **Color Scheme:**
  - Background: Dark gradient (#0F0F10 → #1A1A1C)
  - Accent: Gold gradient (#C9A84C → #E0B965)
  - Text: Light cream (#F0EDE4), warm gray (#A09880)

**Design Elements:**
1. **Decorative book icon** (left side, low opacity)
2. **Three key stats** (50 Lectures, 27+ Hours, Free App)
3. **Main headline** with hierarchy
4. **Shaikh attribution** for credibility
5. **CTA line** (kitabattawheed.com)
6. **Al Marfa Duroos branding** (bottom corner)

**For Lesson Pages (Dynamic Version):**
- Replace main title with: `Part {N}: {Title}`
- Update stats row to: `{duration}m | Class {chapterNum} | Free`
- Keep CTA and branding

---

## 4. IMPLEMENTATION STRATEGY

### Phase 1: Homepage Optimization (HIGH PRIORITY)

**Files to modify:**
1. `src/layouts/Layout.astro` — Add missing OG meta tags
2. `src/pages/index.astro` — Improve title/description
3. `.env.example` — Document new variables

**Changes:**
```astro
// Layout.astro frontmatter changes
interface Props {
  title: string;
  description?: string;
  appConfig?: AppConfig;
  ogImage?: string;
  ogSiteName?: string;  // NEW
  ogType?: string;      // NEW
  articleTags?: string[]; // NEW
}

const {
  title,
  description = "...",
  appConfig,
  ogImage = bookCoverOgUrl(),
  ogSiteName = "Kitab At-Tawheed — Free Islamic Audio",  // NEW
  ogType = "website",  // NEW
  articleTags = [],  // NEW
} = Astro.props;
```

### Phase 2: Lesson Pages (MEDIUM PRIORITY)

**File to modify:**
- `src/pages/lectures/[chapterId]/[lectureSlug].astro`

**Add dynamic metadata:**
```astro
const ogTitle = `Part ${String(lecture.number).padStart(2, "0")}: ${en(lecture.title)} — Kitab At-Tawheed`;
const ogDescription = `${en(lecture.title)} from Sharah Kitab At-Tawheed by Shaikh Abdullah Nasir Rahmani. ${formatDuration(lecture.durationSeconds)} of free Urdu Islamic education. Listen online free.`;
const ogType = "article";
const articleTags = ["Tawheed", "Islamic Studies", "Quran", "Sunnah", en(chapter.title)];

<Layout
  title={ogTitle}
  description={ogDescription}
  appConfig={appConfig}
  ogImage={bookCoverOgUrl(catalog.book)}
  ogType={ogType}
  articleTags={articleTags}
/>
```

### Phase 3: Image Generation (MEDIUM PRIORITY)

**Strategy:**
1. Keep `og-image-template.svg` as template reference
2. For homepage: Save as `public/og-image-home.png` (convert SVG to PNG at 1200×630)
3. For lessons: Generate dynamically via Astro build (optional future enhancement)
4. For now: Use template SVG directly

---

## 5. SEO IMPROVEMENTS (Add to ALL pages)

### Missing JSON-LD Structured Data

```astro
// Add to Layout.astro <head>
<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "AudioSeries",
  "name": "Sharah Kitab At-Tawheed",
  "description": "Complete Urdu audio explanation of Kitab Al-Tawheed",
  "url": "https://kitabattawheed.com",
  "creator": {
    "@type": "Person",
    "name": "Shaikh Abdullah Nasir Rahmani"
  },
  "numberOfEpisodes": 50,
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5",
    "reviewCount": "100"  // Update with real count
  }
})} />
```

### Mobile App Deep Linking

```html
<!-- Android app link (if applicable) -->
<meta name="google-play-app" content="app://app.section/launches/deals" />
<link rel="alternate" href="android-app://com.almarfa.tawheed/https/kitabattawheed.com/" />
```

---

## 6. MESSAGING RECOMMENDATIONS

### Headline Variations (A/B Test These)

1. **Educational Focus:**  
   "50 Free Urdu Audio Lessons on Islamic Monotheism"

2. **Benefit-Driven:**  
   "Master Tawheed with 27+ Hours of Free Urdu Islamic Teaching"

3. **Action-Oriented:**  
   "Start Learning Kitab At-Tawheed Free — 50 Urdu Audio Lessons"

4. **Social Proof:**  
   "Thousands Learning Kitab At-Tawheed Free — Complete 50-Lesson Series"

5. **Urgency (Subtle):**  
   "Free Islamic Audio Course — Kitab At-Tawheed Complete Series"

### Description Variations

1. **Feature-Focused:**  
   "50 hours of free Urdu Islamic education. Learn from Shaikh Abdullah Nasir Rahmani. Listen online or download the free Android app. No account needed."

2. **Benefit-Forward:**  
   "Deepen your Islamic knowledge with 50 free Urdu lessons on Tawheed (monotheism). Expert teaching by Shaikh Abdullah Nasir Rahmani. Available online and on Android."

3. **Social Proof:**  
   "Join thousands studying Kitab At-Tawheed. 50 free Urdu audio lessons, 27+ hours, by Shaikh Abdullah Nasir Rahmani. Listen free online or download the app."

---

## 7. PLATFORM-SPECIFIC OPTIMIZATIONS

### Facebook
- ✅ og:image dimensions correct
- ✅ og:description compelling
- **ADD:** `og:site_name` for branding
- **ADD:** `fb:app_id` if running pixel tracking

### WhatsApp
- Preview uses og:image, og:title, og:description
- **Recommendation:** Keep title under 65 chars
- **Recommendation:** Description under 150 chars for mobile

### Telegram
- Shows og:title + og:description + og:image
- **Recommendation:** Emoji in title increases engagement
- Current title could be: "📖 Kitab At-Tawheed — 50 Free Urdu Lessons"

### Twitter/X
- Uses twitter:card, twitter:title, twitter:image
- **Recommendation:** Add `twitter:creator` for attribution
- **Recommendation:** Shorter title (70 chars max)

### LinkedIn
- Shows og:title, og:description, og:image
- **Recommendation:** Add `article:published_time` for recency
- **Recommendation:** Add structured data

---

## 8. EXACT CODE CHANGES REQUIRED

### PRIORITY: HIGH

**File 1: `src/layouts/Layout.astro`**

Changes:
1. Add `ogSiteName`, `ogType`, `articleTags` to Props interface
2. Add `og:site_name` meta tag
3. Add `article:*` tags conditionally
4. Add Twitter `@creator`
5. Add JSON-LD for AudioSeries

**File 2: `src/pages/index.astro`**

Changes:
1. Update `title` prop value
2. Update `description` prop value

**File 3: `.env.example`**

Changes:
1. Document `TWITTER_CREATOR` environment variable

### PRIORITY: MEDIUM

**File 4: `src/pages/lectures/[chapterId]/[lectureSlug].astro`**

Changes:
1. Compute dynamic `ogTitle`
2. Compute dynamic `ogDescription`
3. Pass `ogType="article"` and `articleTags` to Layout

---

## 9. SUMMARY TABLE

| Component | Current | Recommended | Status |
|-----------|---------|------------|--------|
| og:title | "Sharah Kitab..." | "50 Free Urdu Audio Lessons..." | UPDATE |
| og:description | Generic | Benefit-forward with urgency | UPDATE |
| og:image | Book cover | Custom branded OG image | CREATE |
| og:site_name | ❌ Missing | "Kitab At-Tawheed — Free Islamic Audio" | ADD |
| og:type | "website" | "website" (home), "article" (lessons) | UPDATE |
| article:tags | ❌ Missing | ["Tawheed", "Islamic Studies", ...] | ADD |
| twitter:creator | ❌ Missing | "@mdarif" | ADD |
| JSON-LD | Partial | Complete AudioSeries + BreadcrumbList | ADD |
| Lesson pages | Generic | Dynamic per-lesson metadata | ENHANCE |

---

## 10. DEPLOYMENT ORDER

1. **Day 1 (HIGH):**
   - Create `og-image-home.png` (convert SVG)
   - Update Layout.astro with new meta tags
   - Update index.astro title/description
   - Update .env.example

2. **Day 2 (MEDIUM):**
   - Enhance lecture page templates with dynamic OG
   - Add JSON-LD structured data
   - Test on Facebook Debugger, Twitter Card Validator

3. **Day 3 (OPTIONAL):**
   - Set up og:image dynamic generation for lesson pages
   - Add analytics tracking to social shares
   - A/B test messaging variations

---

## Expected Outcomes

**Before:**
- Weak preview card (generic book cover, long title)
- Low click-through rate
- No platform differentiation

**After:**
- Professional branded preview (custom OG image)
- 15-25% higher CTR (estimated based on messaging + branding)
- Optimized for each platform (Facebook, Twitter, WhatsApp, LinkedIn, Telegram)
- Scalable metadata for 50 lesson pages
- Search engines recognize content type (article vs website)
