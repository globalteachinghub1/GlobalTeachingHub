export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  content: string[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "5-tips-to-improve-quran-recitation-with-tajweed",
    title: "5 Tips to Improve Your Quran Recitation with Tajweed",
    excerpt:
      "Simple, practical habits that help students recite the Quran more confidently and correctly.",
    date: "2026-06-02",
    content: [
      "Learning Tajweed can feel overwhelming at first, but small, consistent habits make a big difference over time.",
      "1. Listen before you recite. Hearing a qualified reciter helps train your ear to recognize correct pronunciation before you attempt it yourself.",
      "2. Practice daily, even briefly. Ten focused minutes a day builds more consistency than one long session a week.",
      "3. Learn the rules alongside practice. Understanding why a rule applies makes it easier to remember and apply naturally.",
      "4. Record yourself. Listening back helps you catch mistakes you might not notice while reciting.",
      "5. Get regular feedback from a qualified teacher. A teacher can catch subtle errors early, before they become habits.",
      "Our Quran with Tajweed classes pair students one-to-one with experienced teachers who guide you through Tajweed, Translation, and Tafseer at your own pace.",
    ],
  },
  {
    slug: "why-computer-skills-set-students-up-for-success",
    title: "Why Learning Computer Skills Early Sets Students Up for Success",
    excerpt:
      "From MS Office to programming basics, practical computer skills open doors for students of all ages.",
    date: "2026-06-16",
    content: [
      "Computer literacy is no longer optional — it's a foundational skill that supports success in school, work, and everyday life.",
      "Tools like MS Word and PowerPoint are used constantly for assignments, presentations, and projects, and students who are comfortable with them save time and reduce stress.",
      "Beyond office tools, an early introduction to programming builds problem-solving skills and logical thinking that carry over into other subjects like math and science.",
      "Our Computer Courses are designed to build these skills step by step, starting from the basics of MS Word and PowerPoint and progressing into programming languages at a pace that suits each student.",
    ],
  },
  {
    slug: "how-one-to-one-online-classes-help-students-learn-faster",
    title: "How One-to-One Online Classes Help Students Learn Faster",
    excerpt:
      "Personalized attention means lessons move at your pace, not the pace of a crowded classroom.",
    date: "2026-07-01",
    content: [
      "In a one-to-one class, every minute of instruction is focused entirely on you — there's no waiting for the rest of a group to catch up, and no hesitation to ask a question.",
      "Teachers can adapt their pace and explanations in real time based on how a student is responding, which helps concepts click faster and stick longer.",
      "It also means flexible scheduling: classes can be arranged around a student's routine rather than fitting a student into a fixed timetable.",
      "This personalized approach is at the core of how Global Teaching Hub teaches, whether it's Quran with Tajweed or Computer Courses.",
    ],
  },
];

export function getBlogPostBySlug(slug: string) {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function formatPostDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(date)
  );
}
