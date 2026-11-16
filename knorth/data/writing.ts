// Articles and research shown on /work. Each section appears on the page as soon as its list has an
// entry, and stays hidden while it's empty.
export type Writing = {
  title: string;
  /** where it can be read: a full URL, or a file in /public such as "/papers/psometric.pdf" */
  href: string;
  /** publication, conference, school or site, e.g. "Medium" or "Cavite State University" */
  where?: string;
  /** e.g. "Mar 2026" */
  date?: string;
  /** one or two sentences on what it covers */
  summary?: string;
};

export const articles: Writing[] = [];

export const research: Writing[] = [];
