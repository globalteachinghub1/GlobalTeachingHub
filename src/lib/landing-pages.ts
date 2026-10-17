/**
 * Search landing pages: one page per search intent that the course pages
 * don't already cover (generic "online Quran classes", classes for kids,
 * female teachers, and courses that have no course record yet). Each page
 * targets its own keyword so it doesn't compete with /courses/<slug>.
 *
 * Like blog posts, these are written in English only; every locale's copy
 * canonicalizes to the English URL.
 */
export type LandingSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LandingPage = {
  slug: string;
  /** <title>; keep under ~60 characters. */
  metaTitle: string;
  /** Meta description; keep under ~160 characters. */
  metaDescription: string;
  /** Short name used in breadcrumbs and internal links. */
  name: string;
  h1: string;
  intro: string;
  sections: LandingSection[];
  faqs: { question: string; answer: string }[];
  /** Pages this one links on to, for internal linking. */
  related: { href: string; label: string }[];
  /** Emit Course structured data (for pages that describe a single course). */
  course?: { name: string; description: string; teaches: string[] };
};

/** Facts about the teaching team, shared by every landing page. */
export const TEACHER_HIGHLIGHTS = [
  "Hafiz and Qari Quran teachers",
  "Ijazah-certified reciters",
  "Dars-e-Nizami (Alim) graduates for Islamic Studies",
  "Female teachers available on request",
  "Every teacher specialises in the course they teach",
];

export const LANDING_PAGES: LandingPage[] = [
  {
    slug: "online-quran-classes",
    metaTitle: "Online Quran Classes with Qualified Teachers | Global Teaching Hub",
    metaDescription:
      "Live one-to-one online Quran classes for all ages: Noorani Qaida, Tajweed, translation and more with Hafiz, Qari and Ijazah-certified teachers. Free demo class.",
    name: "Online Quran Classes",
    h1: "Online Quran Classes for All Ages",
    intro:
      "Learn the Quran from home in live, one-to-one video lessons with qualified teachers. Whether you are starting with the Arabic letters or perfecting your recitation, your teacher builds every lesson around your level, your goals and your schedule.",
    sections: [
      {
        heading: "Choose the right Quran course",
        paragraphs: [
          "Every student starts at a different point, so we offer a clear path from first letters to fluent, correct recitation and understanding:",
        ],
        bullets: [
          "Noorani Qaida: recognise and join the Arabic letters and read with correct vowel marks. The ideal starting point for complete beginners and young children.",
          "Quran with Tajweed: recite with the correct pronunciation, articulation points and rules of Tajweed.",
          "Quran with Translation: understand what you recite, verse by verse, with the background of each surah.",
          "Islamic Studies: build faith, character and an understanding of Islamic life alongside your Quran lessons.",
        ],
      },
      {
        heading: "How our online Quran classes work",
        bullets: [
          "Live one-to-one lessons over video call. Your teacher focuses only on you.",
          "Flexible timings and lesson length, agreed with you to fit school, work and family life.",
          "Lesson recordings shared afterwards so you can revise at any time.",
          "Weekly progress reports, and a parent portal so families can follow each child's progress.",
          "A free demo class before you commit to anything.",
        ],
      },
      {
        heading: "Who can join?",
        paragraphs: [
          "Students of any age are welcome: young children, teenagers and adults, including complete beginners and those returning to the Quran after many years. All you need is a stable internet connection and a laptop, tablet or smartphone with a camera and microphone.",
        ],
      },
    ],
    faqs: [
      {
        question: "Do I need to read Arabic before joining?",
        answer:
          "No. Complete beginners start with Noorani Qaida, which teaches the Arabic letters, their sounds and how they join, before moving on to reading the Quran itself.",
      },
      {
        question: "Can I learn the Quran online at my own pace?",
        answer:
          "Yes. Because every class is one-to-one, your teacher moves at your pace, and you agree your class timings and lesson length with us.",
      },
      {
        question: "How much do online Quran classes cost?",
        answer:
          "Fees depend on the course, how many classes you take each week and your schedule. Book a free demo class and our team will share pricing that fits your goals.",
      },
    ],
    related: [
      { href: "/noorani-qaida-online", label: "Noorani Qaida online" },
      { href: "/courses/quran-with-tajweed", label: "Quran with Tajweed course" },
      { href: "/courses/quran-with-translation", label: "Quran with Translation course" },
      { href: "/online-quran-classes-for-kids", label: "Quran classes for kids" },
      { href: "/online-female-quran-teacher", label: "Female Quran teachers" },
    ],
  },
  {
    slug: "online-quran-classes-for-kids",
    metaTitle: "Online Quran Classes for Kids | Global Teaching Hub",
    metaDescription:
      "Live one-to-one online Quran classes for kids with patient, qualified teachers. Start with Noorani Qaida, then Tajweed. Female teachers available. Free demo class.",
    name: "Quran Classes for Kids",
    h1: "Online Quran Classes for Kids",
    intro:
      "Give your child a strong, confident start with the Quran. In live one-to-one lessons, a patient and qualified teacher guides your child from the Arabic letters to fluent recitation with Tajweed, at a pace that keeps them motivated.",
    sections: [
      {
        heading: "A clear learning path for children",
        bullets: [
          "Noorani Qaida: learning the Arabic letters, their sounds and vowel marks, step by step.",
          "Reading the Quran: moving from Qaida into reading verses smoothly and correctly.",
          "Tajweed: applying the rules of recitation so your child recites beautifully and accurately.",
          "Islamic Studies: age-appropriate lessons on faith, manners and Islamic life.",
        ],
      },
      {
        heading: "Why parents choose one-to-one classes",
        paragraphs: [
          "In a group, a child who is shy or struggling can easily fall behind. In a one-to-one class the teacher hears every letter your child reads, corrects mistakes before they become habits, and adjusts each lesson to your child's attention span and progress.",
        ],
        bullets: [
          "Female teachers available on request.",
          "Flexible class timings and lesson length around school and family routines.",
          "Lesson recordings to revise between classes.",
          "Weekly progress reports and a parent portal to follow your child's lessons.",
        ],
      },
      {
        heading: "Getting started",
        paragraphs: [
          "Book a free demo class. Your child meets their teacher, the teacher assesses their current level, and we recommend the right starting point, whether that is Noorani Qaida for a beginner or Tajweed for a child who already reads.",
        ],
      },
    ],
    faqs: [
      {
        question: "What age can my child start learning the Quran online?",
        answer:
          "We teach students of every age. Young children usually start with Noorani Qaida, and lesson length can be adjusted to suit their age.",
      },
      {
        question: "How will I know how my child is doing?",
        answer:
          "You receive weekly progress reports, and the parent portal lets you follow your child's lessons and progress at any time.",
      },
      {
        question: "Can my daughter have a female teacher?",
        answer: "Yes. Female teachers are available; just mention it when you book the free demo class.",
      },
    ],
    related: [
      { href: "/noorani-qaida-online", label: "Noorani Qaida online" },
      { href: "/courses/quran-with-tajweed", label: "Quran with Tajweed course" },
      { href: "/online-female-quran-teacher", label: "Female Quran teachers" },
      { href: "/blog/how-parents-can-help-children-learn-quran-online", label: "How parents can help children learn Quran online" },
    ],
  },
  {
    slug: "online-female-quran-teacher",
    metaTitle: "Online Female Quran Teacher for Sisters & Kids | Global Teaching Hub",
    metaDescription:
      "Learn Quran online with a qualified female teacher. Live one-to-one Noorani Qaida, Tajweed, translation and Islamic Studies classes for women and children.",
    name: "Female Quran Teachers",
    h1: "Learn Quran Online with a Female Teacher",
    intro:
      "Many sisters and parents of young girls prefer a female teacher, and we make that simple. Request a female teacher when you book, and learn in live, private, one-to-one lessons from home.",
    sections: [
      {
        heading: "Qualified female teachers",
        paragraphs: [
          "Like all our teachers, our female teachers specialise in the courses they teach. Our teaching team includes Hafiz and Qari teachers, Ijazah-certified reciters and Dars-e-Nizami (Alim) graduates, and lessons are taught at every level, from the first letters of Noorani Qaida to Tajweed and Quran translation.",
        ],
      },
      {
        heading: "Courses you can study",
        bullets: [
          "Noorani Qaida for beginners of any age",
          "Quran with Tajweed",
          "Quran with Translation",
          "Arabic Language",
          "Islamic Studies",
        ],
      },
      {
        heading: "Private, comfortable and flexible",
        bullets: [
          "One-to-one lessons: just you and your teacher.",
          "Class timings and lesson length agreed around your routine.",
          "Lesson recordings to revise between classes.",
          "Weekly progress reports.",
        ],
      },
    ],
    faqs: [
      {
        question: "How do I request a female Quran teacher?",
        answer:
          "Mention it when you book your free demo class, or contact us. We will match you with a female teacher for your course.",
      },
      {
        question: "Will my lessons be private?",
        answer: "Yes. Every class is one-to-one, so it is only you and your teacher in the lesson.",
      },
    ],
    related: [
      { href: "/online-quran-classes", label: "Online Quran classes" },
      { href: "/online-quran-classes-for-kids", label: "Quran classes for kids" },
      { href: "/courses/quran-with-tajweed", label: "Quran with Tajweed course" },
      { href: "/blog/how-to-choose-an-online-quran-teacher", label: "How to choose an online Quran teacher" },
    ],
  },
  {
    slug: "noorani-qaida-online",
    metaTitle: "Noorani Qaida Online Classes for Beginners | Global Teaching Hub",
    metaDescription:
      "Learn Noorani Qaida online in live one-to-one classes. Master the Arabic letters, vowel marks and joining rules: the first step to reading Quran. Kids and adults.",
    name: "Noorani Qaida Online",
    h1: "Noorani Qaida Online Classes",
    intro:
      "Noorani Qaida is the traditional first step to reading the Quran. In live one-to-one lessons, your teacher takes you through the Arabic letters, their sounds and the reading rules until you are ready to read the Quran itself, correctly and with confidence.",
    sections: [
      {
        heading: "What you will learn",
        bullets: [
          "The Arabic letters and their correct sounds (makharij)",
          "How letters change shape and join together",
          "Short vowels: fatha, kasra and damma",
          "Tanween, sukoon and shaddah",
          "Long vowels and basic madd (elongation)",
          "Reading joined words and short phrases fluently",
        ],
      },
      {
        heading: "Who is it for?",
        paragraphs: [
          "Noorani Qaida suits anyone who cannot yet read the Quran: young children starting their first lessons, and adults learning for the first time or rebuilding their reading from the basics. Because classes are one-to-one, the pace is set entirely by the student.",
        ],
      },
      {
        heading: "What comes next",
        paragraphs: [
          "Once you complete the Qaida, you move straight on to reading the Quran with Tajweed so there is no gap in your learning.",
        ],
      },
    ],
    faqs: [
      {
        question: "How long does it take to finish Noorani Qaida?",
        answer:
          "It depends on the student's age, practice and how many classes they take each week. Your teacher will give you a realistic estimate after the free demo class.",
      },
      {
        question: "Is Noorani Qaida only for children?",
        answer: "No. Adults who are learning to read the Quran for the first time start with Noorani Qaida too.",
      },
    ],
    related: [
      { href: "/courses/quran-with-tajweed", label: "Quran with Tajweed course" },
      { href: "/online-quran-classes-for-kids", label: "Quran classes for kids" },
      { href: "/online-quran-classes", label: "All online Quran classes" },
      { href: "/blog/what-is-noorani-qaida", label: "What is Noorani Qaida?" },
    ],
    course: {
      name: "Noorani Qaida",
      description:
        "Beginner course teaching the Arabic letters, vowel marks and joining rules needed to read the Quran.",
      teaches: ["Arabic letters", "Makharij", "Harakat", "Tanween", "Sukoon", "Shaddah", "Madd"],
    },
  },
  {
    slug: "online-computer-courses",
    metaTitle: "Online Computer Courses: MS Office & Programming | Global Teaching Hub",
    metaDescription:
      "Live one-to-one online computer courses for all ages: MS Word, PowerPoint and programming fundamentals with specialist teachers and flexible schedules.",
    name: "Online Computer Courses",
    h1: "Online Computer Courses",
    intro:
      "Build practical computer skills from the ground up in live one-to-one lessons. Start with everyday office tools like MS Word and PowerPoint, then move on to the fundamentals of programming, at a pace that suits you.",
    sections: [
      {
        heading: "What you can learn",
        bullets: [
          "MS Word: formatting documents, tables, images and professional layouts",
          "PowerPoint: creating clear, engaging presentations",
          "Programming languages: the fundamentals of coding and problem-solving",
        ],
      },
      {
        heading: "Who is it for?",
        paragraphs: [
          "Students of any age: school pupils who need computer skills for assignments and presentations, beginners who want to use a computer confidently, and anyone taking their first steps into programming.",
        ],
      },
      {
        heading: "How the classes work",
        bullets: [
          "Live one-to-one lessons with a teacher who specialises in computer courses.",
          "Flexible timings and lesson length.",
          "Lesson recordings to revise between classes.",
          "Weekly progress reports.",
        ],
      },
    ],
    faqs: [
      {
        question: "Do I need any software installed?",
        answer:
          "Your teacher will tell you what to install for your course before your first lesson. For office courses this is usually MS Word or PowerPoint.",
      },
      {
        question: "Can complete beginners join?",
        answer: "Yes. Lessons start from your current level, even if you have never used these tools before.",
      },
    ],
    related: [
      { href: "/blog/why-computer-skills-set-students-up-for-success", label: "Why computer skills set students up for success" },
      { href: "/courses", label: "All courses" },
    ],
    course: {
      name: "Computer Courses",
      description:
        "One-to-one online computer courses covering MS Word, PowerPoint and programming fundamentals.",
      teaches: ["MS Word", "PowerPoint", "Programming"],
    },
  },
];

export function getLandingPage(slug: string) {
  return LANDING_PAGES.find((page) => page.slug === slug);
}

/** Site-wide links to the landing pages; labels live in the "Landing" messages namespace. */
export const LANDING_LINKS = [
  { key: "onlineQuranClasses", href: "/online-quran-classes" },
  { key: "quranForKids", href: "/online-quran-classes-for-kids" },
  { key: "femaleTeacher", href: "/online-female-quran-teacher" },
  { key: "nooraniQaida", href: "/noorani-qaida-online" },
  { key: "computerCourses", href: "/online-computer-courses" },
] as const;
