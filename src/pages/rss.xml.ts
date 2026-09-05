import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

/**
 * Hand-rolled rather than pulling in @astrojs/rss.
 *
 * The feed is thirty lines of string building. A dependency for that would be
 * a dependency the colophon has to justify, on a site whose argument is that
 * it does not ship what it does not need.
 */

const escape = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL('https://continuumstudios.co');
  const notes = (await getCollection('notes', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.published.getTime() - a.data.published.getTime(),
  );

  const items = notes
    .map((note) => {
      const url = new URL(`/notes/${note.id}`, base).href;
      return [
        '    <item>',
        `      <title>${escape(note.data.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <description>${escape(note.data.description)}</description>`,
        `      <category>${escape(note.data.topic)}</category>`,
        `      <pubDate>${note.data.published.toUTCString()}</pubDate>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    '    <title>Continuum Studios notes</title>',
    `    <link>${base.href}</link>`,
    '    <description>Writing on commissioning, design and the engineering underneath it.</description>',
    '    <language>en-gb</language>',
    `    <atom:link href="${new URL('/rss.xml', base).href}" rel="self" type="application/rss+xml" />`,
    items,
    '  </channel>',
    '</rss>',
  ].join('\n');

  return new Response(xml, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
};
