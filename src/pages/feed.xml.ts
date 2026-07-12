import type { APIRoute } from 'astro';
import {
  SITE_URL,
  getCatalog,
  en,
  chapterSlug,
  lectureSlug,
} from '../lib/catalog';

export const GET: APIRoute = async () => {
  const catalog = await getCatalog();
  const updated = catalog.book.catalogUpdatedAt ?? new Date().toISOString();
  const totalHours = Math.floor(catalog.book.totalDurationSeconds / 3600);
  const items = catalog.lectures.map((lecture) => {
    const chapter = catalog.chapters.find((c) => c.id === lecture.chapterId)!;
    const path = `/lectures/${chapterSlug(chapter.id)}/${lectureSlug(lecture)}/`;
    const url = new URL(path, SITE_URL).toString();
    return `
    <item>
      <title>${escapeXml(en(lecture.title))}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(`${en(lecture.title)} — ${en(chapter.title)}, Sharah Kitab at-Tawheed`)}</description>
      <enclosure url="${escapeXml(lecture.audioUrl)}" length="${lecture.fileSizeBytes}" type="audio/mpeg"/>
      <pubDate>${new Date(updated).toUTCString()}</pubDate>
    </item>`;
  });

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>${escapeXml(en(catalog.book.title))}</title>
    <link>${SITE_URL}/</link>
    <description>${escapeXml(`${catalog.book.lectureCount} Urdu Audio Lessons (Sharah Kitab at-Tawheed by Shaikh Abdullah Nasir Rahmani) • ${totalHours}+ Hours • Online & Offline. An Arabic series is also available in the app and at ${SITE_URL}/arabic/.`)}</description>
    <language>ur</language>
    <lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>
    <image>
      <url>${SITE_URL}/og-image.png</url>
      <title>${escapeXml(en(catalog.book.title))}</title>
      <link>${SITE_URL}/</link>
    </image>
    ${items.join('\n')}
  </channel>
</rss>`;

  return new Response(rss.trim(), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
