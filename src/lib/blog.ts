export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  /** Paragraphs; an entry starting with "## " is rendered as a subheading. */
  content: string[];
  /** Page linked from the end of the post, for internal linking. */
  related?: { href: string; label: string };
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
    related: { href: "/courses/quran-with-tajweed", label: "Explore our Quran with Tajweed course" },
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
    related: { href: "/online-computer-courses", label: "Explore our online computer courses" },
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
    related: { href: "/online-quran-classes", label: "See our online Quran classes" },
  },
  {
    slug: "how-to-learn-quran-with-tajweed-online",
    title: "How to Learn Quran with Tajweed Online: A Step-by-Step Guide",
    excerpt:
      "What Tajweed is, the order to learn it in, and how live one-to-one online classes help you recite correctly from home.",
    date: "2026-10-17",
    content: [
      "Tajweed is the set of rules for reciting the Quran correctly: pronouncing each letter from its proper point of articulation, giving it its proper qualities, and applying the rules for how letters affect one another. Learning it online is now one of the most practical ways to study, because a qualified teacher can listen to you and correct you in real time, wherever you live.",
      "## Step 1: Make sure you can read the Arabic letters",
      "Tajweed builds on reading. If you cannot yet read Arabic script confidently, start with Noorani Qaida, which teaches the letters, their sounds, the vowel marks and how letters join. Trying to learn Tajweed rules before you can read smoothly usually slows students down.",
      "## Step 2: Learn the articulation points (makharij)",
      "Each Arabic letter is pronounced from a specific place in the throat, tongue, lips or nasal passage. Many common mistakes, such as confusing letters that sound alike to non-Arabic speakers, are fixed by learning exactly where each letter comes from. This is where live feedback from a teacher matters most, because it is very hard to hear your own mistakes.",
      "## Step 3: Learn the core rules one at a time",
      "Most students learn the rules in a fairly standard order. First come the rules of Noon Saakinah and Tanween: Izhar (clear pronunciation), Idgham (merging), Iqlab (changing to a meem sound) and Ikhfa (concealment). Next are the rules of Meem Saakinah, including Ikhfa Shafawi and Idgham Shafawi. Then Qalqalah, the slight echoing sound on the letters qaf, taa, baa, jeem and daal when they carry a sukoon. Finally, the types of Madd (elongation) and how long each one is held.",
      "Learning one rule, practising it in real verses, and only then moving on works far better than memorising a list of rules all at once.",
      "## Step 4: Practise daily and get regular correction",
      "Short daily practice beats one long weekly session. Listen to a qualified reciter, recite the same passage yourself, and record it so you can compare. Then bring it to your teacher, who can catch small errors before they become habits.",
      "## Why one-to-one online classes work well for Tajweed",
      "In a one-to-one class your teacher hears every letter you recite. Lessons move at your pace, class timings and length are arranged around your routine, and lesson recordings let you revise between classes. At Global Teaching Hub, Tajweed is taught by Hafiz and Qari teachers, including Ijazah-certified reciters, and female teachers are available on request.",
    ],
    related: { href: "/courses/quran-with-tajweed", label: "Explore our Quran with Tajweed course" },
  },
  {
    slug: "difference-between-tajweed-and-quran-recitation",
    title: "What Is the Difference Between Tajweed and Quran Recitation?",
    excerpt:
      "Recitation, Tajweed, Tarteel and Qira'at are related but not the same. Here is what each one means and why it matters for learners.",
    date: "2026-10-17",
    content: [
      "Students often use the words \"recitation\" and \"Tajweed\" interchangeably, but they describe different things. Understanding the difference helps you choose the right course and set realistic goals.",
      "## Recitation (Tilawah)",
      "Tilawah simply means reciting the Quran aloud. Anyone who reads the Quran is reciting it, whether they read slowly letter by letter or fluently. Recitation describes the act of reading; on its own it says nothing about how accurately the rules are applied.",
      "## Tajweed",
      "Tajweed comes from an Arabic root meaning \"to make better\" or \"to do well\". It is the science of reciting correctly: articulating each letter from its proper point (makhraj), giving letters their characteristics (sifaat), and applying rules such as Idgham, Ikhfa, Qalqalah and Madd. Tajweed is what turns reading into correct recitation.",
      "## Tarteel",
      "Tarteel means reciting in a measured, unhurried way, with care and reflection. The Quran itself instructs believers to recite it with tarteel (Surah Al-Muzzammil, 73:4). Tarteel describes the manner and pace of recitation, and it includes applying Tajweed.",
      "## Qira'at",
      "Qira'at are the different authentic, transmitted modes of reciting the Quran, each traced back through chains of teachers. Most students learn one mode, most commonly Hafs 'an 'Asim, and studying other Qira'at is an advanced specialisation.",
      "## Which should you learn first?",
      "For most learners the path is: learn to read with Noorani Qaida, then learn Tajweed while reciting regularly, and let tarteel develop naturally as accuracy and confidence grow. A qualified teacher, ideally one with Ijazah, can show you where you are on that path and what to focus on next.",
    ],
    related: { href: "/courses/quran-with-tajweed", label: "Start our Quran with Tajweed course" },
  },
  {
    slug: "how-to-choose-an-online-quran-teacher",
    title: "How to Choose an Online Quran Teacher: 7 Things to Check",
    excerpt:
      "Qualifications, teaching style, scheduling and more: a practical checklist for students and parents choosing an online Quran teacher.",
    date: "2026-10-17",
    content: [
      "A good teacher makes more difference to your progress than any app or book. Whether you are choosing for yourself or for your child, these are the things worth checking before you commit.",
      "## 1. Qualifications in Quran recitation",
      "Ask what qualifies the teacher to teach. Common qualifications include being a Hafiz (having memorised the Quran), a Qari (a trained reciter), holding an Ijazah (a certified chain of transmission in recitation) or being a graduate of Dars-e-Nizami (the Alim course). For Tajweed in particular, a teacher with Ijazah has had their own recitation checked and certified.",
      "## 2. Specialisation in what you want to learn",
      "Teaching a young child Noorani Qaida, correcting an adult's Tajweed and teaching Quran translation are different skills. Look for a teacher who specialises in the course you need.",
      "## 3. One-to-one attention",
      "In group classes, a teacher cannot listen closely to every student's recitation. One-to-one lessons mean every mistake is heard and corrected.",
      "## 4. A free trial class",
      "A demo class lets you judge the teacher's patience, clarity and connection with the student before paying anything. For children, watch whether your child is comfortable and engaged.",
      "## 5. Flexible scheduling",
      "Consistency matters more than intensity. Choose a teacher whose availability fits your routine so you can keep classes going week after week.",
      "## 6. Progress tracking",
      "Ask how progress is reported. Regular progress reports, and for children a way for parents to follow lessons, keep everyone accountable.",
      "## 7. A female teacher, if you prefer one",
      "Many sisters and parents of girls prefer a female teacher. Check that this is genuinely available before you sign up.",
      "## How Global Teaching Hub matches teachers",
      "Our team includes Hafiz and Qari teachers, Ijazah-certified reciters and Dars-e-Nizami graduates, each specialising in the courses they teach. Female teachers are available on request, every class is one-to-one, and you can start with a free demo class.",
    ],
    related: { href: "/online-quran-classes", label: "See our online Quran classes" },
  },
  {
    slug: "benefits-of-one-to-one-online-arabic-classes",
    title: "6 Benefits of One-to-One Online Arabic Classes",
    excerpt:
      "Why learning Arabic one-to-one, online, helps you speak, read and write with confidence faster than a crowded classroom.",
    date: "2026-10-17",
    content: [
      "Arabic opens the door to understanding the Quran directly, to communicating with millions of speakers and to a rich literary tradition. How you learn it makes a big difference to how quickly you progress.",
      "## 1. Pronunciation is corrected as you speak",
      "Arabic has sounds that do not exist in many other languages. In a one-to-one class your teacher hears every word and corrects your pronunciation immediately, before mistakes become fixed.",
      "## 2. You speak far more",
      "In a group class, each student may only speak for a few minutes. One-to-one, most of the lesson is spent with you speaking, reading and responding, which is how fluency is built.",
      "## 3. Lessons follow your goals",
      "Some students want spoken Arabic for travel or family, others want to read and write, and many want to understand the language of the Quran. Your teacher builds the lessons around your goal rather than a fixed group syllabus.",
      "## 4. The pace is yours",
      "If grammar takes a little longer to click, your teacher can slow down; if you are moving quickly, nobody holds you back.",
      "## 5. Flexible timings from anywhere",
      "Online classes remove travel time, and lessons can be arranged around school, work and family commitments, which makes it much easier to study consistently.",
      "## 6. Easy revision",
      "Lesson recordings let you revisit vocabulary and grammar explanations between classes, and regular progress reports show how far you have come.",
      "## Getting started",
      "Our Arabic Language course covers spoken and written Arabic, from the alphabet and pronunciation to grammar. Book a free demo class and your teacher will assess your level and recommend where to begin.",
    ],
    related: { href: "/courses/arabic-language", label: "Explore our Arabic Language course" },
  },
  {
    slug: "how-parents-can-help-children-learn-quran-online",
    title: "How Parents Can Help Children Learn Quran Online",
    excerpt:
      "Simple routines and habits that help children stay motivated and make steady progress in their online Quran classes.",
    date: "2026-10-17",
    content: [
      "Online Quran classes give children one-to-one attention from a qualified teacher, but what happens between lessons matters just as much. Parents play a big part in a child's progress, even if they cannot read Arabic themselves.",
      "## Set up a calm, consistent learning space",
      "Choose a quiet spot with a stable internet connection, good lighting and a device with a working camera and microphone. Using the same place and time for every class helps children settle into the lesson quickly.",
      "## Keep a regular schedule",
      "Children thrive on routine. Fix class times that work with school and family life, and treat them as seriously as any other lesson.",
      "## Encourage short daily practice",
      "Ten to fifteen minutes of revision on non-class days builds more confidence than a long session once a week. Lesson recordings help here: your child can listen back to their teacher's explanations.",
      "## Listen and praise effort",
      "Ask your child to recite what they learned today. You do not need to correct them; your attention and encouragement are motivating on their own. Praise effort and consistency, not just speed.",
      "## Follow progress with the teacher",
      "Read the weekly progress reports and check with the teacher what your child should practise. If your child is struggling or losing interest, the teacher can adjust the pace or lesson length.",
      "## Be a role model",
      "Children copy what they see. Reading or listening to the Quran yourself, even briefly, shows them that it is a valued part of family life.",
      "## Choosing the right class",
      "At Global Teaching Hub, children of any age can start with Noorani Qaida and move on to Tajweed, taught one-to-one. Female teachers are available on request, and parents can follow progress through the parent portal.",
    ],
    related: { href: "/online-quran-classes-for-kids", label: "See our Quran classes for kids" },
  },
  {
    slug: "what-is-noorani-qaida",
    title: "What Is Noorani Qaida and Why Start with It?",
    excerpt:
      "Noorani Qaida is the traditional first step to reading the Quran. Here is what it covers and why beginners of every age start with it.",
    date: "2026-10-17",
    content: [
      "Noorani Qaida is a beginner's primer for reading Arabic script, used for generations to prepare students to read the Quran. It is named after its compiler, Sheikh Noor Muhammad Ludhianvi, and is widely used across South Asia and beyond.",
      "## What Noorani Qaida covers",
      "The Qaida moves step by step from single letters to fluent reading. It starts with the individual Arabic letters and their correct sounds, then compound letters and how letters change shape when they join. It introduces the short vowels (fatha, kasra and damma), tanween, long vowels and the basics of madd, and then sukoon and shaddah. By the end, students are reading complete words and phrases, many of them taken from the Quran itself.",
      "## Why it is the best starting point",
      "Because the Qaida introduces one concept at a time, students build a solid foundation without being overwhelmed. Many basic Tajweed habits, such as correct letter sounds and elongation, are introduced along the way, so students who complete it move into reading the Quran with Tajweed much more smoothly.",
      "## Is it only for children?",
      "No. Noorani Qaida is for anyone who cannot yet read the Quran, including adults learning for the first time and those who want to rebuild their reading from the basics. In a one-to-one class, the teacher adjusts the pace to the student's age and progress.",
      "## How long does it take?",
      "It varies with age, practice and the number of classes each week. Rather than rushing, the goal is to read each lesson accurately before moving on.",
    ],
    related: { href: "/noorani-qaida-online", label: "Learn Noorani Qaida online with us" },
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
