// Seeds blog categories, author profiles and starter posts (as drafts). Safe to re-run: existing slugs are skipped.
// Usage: node scripts/seedBlog.js [--dry-run]
import dotenv from "dotenv";
import mongoose from "mongoose";
import BlogAuthor from "../src/models/BlogAuthor.js";
import BlogCategory from "../src/models/BlogCategory.js";
import BlogPost from "../src/models/BlogPost.js";

dotenv.config();

const SITE = "https://gradenext.com";

const categories = [
  {
    name: "Math & Science Help",
    slug: "math-science",
    description:
      "Practical help for parents of kids in grades 1–8 who want to strengthen math and science skills — finding learning gaps, building confidence and making practice stick.",
    featuredImage: { url: `${SITE}/regular-teaser-kid.jpg`, alt: "Smiling student practicing math at a laptop" },
    order: 1,
  },
  {
    name: "Coding for Kids",
    slug: "coding-for-kids",
    description:
      "Guides for parents who want their kids to learn to code — choosing a first language, keeping motivation high and turning screen time into real projects.",
    featuredImage: { url: `${SITE}/coding-teaser-kid.jpg`, alt: "Girl celebrating while building a coding project on her laptop" },
    order: 2,
  },
  {
    name: "Parenting & Learning Tips",
    slug: "parenting-learning-tips",
    description:
      "Everyday advice for raising confident, independent learners — study habits, motivation, screen time and choosing the right after-school support.",
    featuredImage: { url: `${SITE}/how-it-works-step-2.jpg`, alt: "Parent and child reviewing a learning path together on a tablet" },
    order: 3,
  },
  {
    name: "GradeNext & Product",
    slug: "gradenext-product",
    description:
      "How GradeNext works — the free trial, plans, mentors, success stories and tips for getting the most out of AI-personalized practice with a real mentor.",
    featuredImage: { url: `${SITE}/hero-learning.jpg`, alt: "Student using the GradeNext learning dashboard on a laptop" },
    order: 4,
  },
];

const authors = [
  {
    name: "Shahid Mohammad, PhD",
    slug: "shahid-mohammad",
    role: "Founder & CEO",
    credentials: "Neuroscientist, 20+ years in child brain development",
    bio: "Shahid Mohammad is a neuroscientist with more than 20 years of experience in child brain development. He founded GradeNext to help every student achieve 100% and become a confident, independent learner, combining AI-personalized practice with real human mentors.",
    photo: { url: `${SITE}/founder-shahid.jpg`, alt: "Shahid Mohammad, PhD, Founder and CEO of GradeNext" },
    order: 1,
  },
  {
    name: "Rumee Shahid",
    slug: "rumee-shahid",
    role: "Strategic Officer · Mentor & Coach",
    credentials: "Master's in Human Science, 15+ years in education strategy",
    bio: "Rumee Shahid brings more than 15 years of education strategy experience to GradeNext. She coaches students in Mathematics, Science and Language Arts and helps them build confidence, discover their strengths and become motivated, independent learners.",
    photo: { url: `${SITE}/founder-rumee.jpg`, alt: "Rumee Shahid, Strategic Officer and mentor at GradeNext" },
    order: 2,
  },
  {
    name: "Ummiyah Nasim",
    slug: "ummiyah-nasim",
    role: "AI & Programming Mentor",
    credentials: "Engineering Manager, Mercari Japan",
    bio: "Ummiyah Nasim is an Engineering Manager at Mercari Japan and leads GradeNext's AI and programming learning path — from block coding to Python, web apps and AI agents. She mentors students through real projects with live feedback and code reviews.",
    photo: { url: `${SITE}/mentor-ummiyah.jpg`, alt: "Ummiyah Nasim, AI and programming mentor at GradeNext" },
    order: 3,
  },
  {
    name: "Naushad Ahamad",
    slug: "naushad-ahamad",
    role: "Web Development & AI Mentor",
    credentials: "Founder, Robust Softech · MBA in Data Science and AI",
    bio: "Naushad Ahamad is the founder of Robust Softech and holds an MBA specialized in Data Science and Artificial Intelligence. He brings real industry experience to mentoring, helping students build modern web products and use AI in practice.",
    photo: { url: `${SITE}/mentor-naushad.jpg`, alt: "Naushad Ahamad, web development and AI mentor at GradeNext" },
    order: 4,
  },
  {
    name: "Rahmatullah Ahmad",
    slug: "rahmatullah-ahmad",
    role: "Cloud & DevOps Mentor",
    credentials: "DevOps Engineer, Rakuten Japan",
    bio: "Rahmatullah Ahmad is a DevOps Engineer at Rakuten Japan. He helps GradeNext students take their projects from “works on my laptop” to reliable servers and real cloud deployments.",
    photo: { url: `${SITE}/mentor-rahmatullah.jpg`, alt: "Rahmatullah Ahmad, cloud and DevOps mentor at GradeNext" },
    order: 5,
  },
  {
    name: "Pranshu Mishra",
    slug: "pranshu-mishra",
    role: "AI & Programming Mentor",
    credentials: "B.Tech in AI & Mechatronics Engineering",
    bio: "Pranshu Mishra is an AI and programming specialist with a Bachelor of Technology in AI & Mechatronics Engineering. He makes AI and programming concepts easier to understand through hands-on projects, real-world examples and step-by-step problem-solving.",
    photo: { url: `${SITE}/mentor-pranshu.jpg`, alt: "Pranshu Mishra, AI and programming mentor at GradeNext" },
    order: 6,
  },
];

const posts = [
  {
    title: "How to Help a Child Who Is Behind in Math",
    slug: "how-to-help-child-behind-in-math",
    metaTitle: "How to Help a Child Who Is Behind in Math | GradeNext",
    metaDescription:
      "Is your child falling behind in math? Learn how to find the real gaps, rebuild confidence and set up a routine that helps kids in grades 1–8 catch up.",
    excerpt:
      "Practical steps to find your child’s real math gaps, rebuild confidence and catch up — without nightly battles over homework.",
    answerFirstSummary:
      "To help a child who is behind in math, first find the specific earlier skills they are missing — often place value, multiplication facts or fractions — instead of re-teaching only the current chapter. Then practice those gaps a little every day at the right difficulty and check progress weekly. Most children catch up faster than parents expect once practice targets the real gap and a patient adult explains the “why” behind each step.",
    author: "shahid-mohammad",
    category: "math-science",
    tags: ["Math", "Learning gaps", "Study habits"],
    funnelStage: "top",
    featuredImage: {
      url: `${SITE}/regular-teaser-kid.jpg`,
      alt: "Smiling student with headphones giving a thumbs up while practicing math at a laptop",
    },
    related: ["after-school-tutoring-cost", "how-gradenext-free-trial-works"],
    faq: [
      {
        question: "How long does it take a child to catch up in math?",
        answer:
          "It depends on how many foundational gaps there are. Many children close a single gap, such as multiplication facts, in a few weeks of short daily practice, while catching up a full grade level usually takes several months of consistent work.",
      },
      {
        question: "Should my child practice grade-level work or go back to earlier topics?",
        answer:
          "Start with the earlier topics that are causing the trouble, then return to grade-level work. Practicing the current chapter on top of a missing foundation usually leads to more frustration, not more progress.",
      },
      {
        question: "How much math practice per day is enough?",
        answer:
          "For most kids in grades 1–8, 15–20 focused minutes a day works better than one long session a week, because short, regular practice helps new skills stick.",
      },
    ],
    body: `## Why kids fall behind in math

Math is one of the few school subjects where almost every new idea depends on an older one. Multi-digit multiplication depends on place value. Adding fractions depends on multiplication. Solving equations depends on negative numbers and the order of operations. When one of those building blocks is shaky, the next topic feels impossible — even for a bright, hard-working child.

That is why “behind in math” rarely means a child can’t do math. It usually means there is a specific gap somewhere earlier in the chain that nobody has found yet.

### Common signs your child is falling behind

- Homework takes far longer than it should, or ends in tears
- Test scores drop even though your child says they “get it” in class
- They rely on finger counting or guessing for facts they should know quickly
- They avoid math, say they are “just bad at it,” or rush to finish
- The teacher mentions they are struggling to keep up with the class

## Step 1: Find the real gap, not just the current struggle

The most common mistake is re-teaching tonight’s homework over and over. If the real problem is two grades back, extra practice on the current chapter only adds frustration.

Instead, work backward. Ask your child to explain how they solve a problem out loud, and notice where the reasoning breaks down. The table below shows some typical connections between what a child struggles with now and the earlier skill that is often the cause.

| Struggling with | Often caused by a gap in |
| --- | --- |
| Multi-digit multiplication (grade 4) | Place value and multiplication facts (grades 2–3) |
| Adding and subtracting fractions (grades 4–5) | Equivalent fractions and multiplication |
| Ratios and percents (grades 6–7) | Fractions and division |
| Solving linear equations (grade 7) | Negative numbers (grade 6) and order of operations (grade 5) |

A short diagnostic or placement test can do this much faster than guesswork, because it checks each topic separately and shows exactly where understanding stops.

## Step 2: Practice little and often, at the right level

Once you know the gap, practice needs to sit in a sweet spot: hard enough to require effort, easy enough that your child succeeds most of the time. Work that is too easy is boring; work that is too hard teaches a child that math is something they fail at.

For most kids, 15–20 minutes a day beats a long weekend session. Short, frequent practice gives the brain repeated chances to retrieve a skill, which is what makes it stick. Revisiting a tricky concept a few days later — rather than practicing it once and moving on — is especially powerful.

## Step 3: Explain the “why,” not just the steps

Memorized steps fall apart under pressure. A child who knows *why* you line up place values, or *why* you need a common denominator, can rebuild the method when they forget it.

When your child gets stuck, try questions instead of answers:

- “What is this problem asking you to find?”
- “Can you draw it or show it with objects?”
- “What would a smaller, easier version of this problem look like?”

## Step 4: Protect your child’s confidence

Children who fall behind often decide they are “not a math person.” That belief can do more damage than the original gap. A few habits help:

- Praise effort and strategies, not speed
- Treat mistakes as information about what to practice next
- Point out progress with concrete examples: “Last week this took you ten minutes. Today it took three.”
- Keep sessions short and end on a problem your child can solve

## Step 5: Track progress every week

Catching up is easier when everyone can see it happening. A quick weekly check — a short quiz, a look at which problems are now easy, or a progress dashboard — shows whether the gap is closing and when it is time to move forward.

## When to get outside help

Home practice works well for small gaps, but it is worth getting extra support if your child is more than a grade level behind, math has become a daily source of conflict, or you are not sure where the gaps are.

Your options range from asking the teacher for suggestions to hiring a private tutor, enrolling at a learning center or using an online platform. If cost is part of the decision, our guide to [how much after-school tutoring costs](/blog/after-school-tutoring-cost) compares the typical options side by side.

GradeNext’s [online math tutoring for grades 1–8](/online-math-tutoring) starts with a placement test that finds your child’s level in each topic, then builds a personal learning path with adaptive daily practice and smart revisions. Plans with weekly live 1:1 tutor sessions add a mentor who explains the reasoning and keeps your child motivated. You can see how Math, Science and Language Arts fit together on the [Regular Subjects page](/regular).

## A simple weekly plan to start this week

1. **Day 1:** Watch your child solve a few problems out loud and note where they get stuck.
2. **Days 2–5:** Practice the earlier skill behind that gap for 15–20 minutes a day.
3. **Day 6:** Mix in a few problems from the current chapter to connect the skill to schoolwork.
4. **Day 7:** Do a short check-in, celebrate progress and decide what to practice next week.

Catching up in math is rarely about working harder. It is about working on the right thing, a little at a time, with someone who believes your child can do it.`,
  },
  {
    title: "How to Get Kids Interested in Coding (Ages 8–14)",
    slug: "how-to-get-kids-interested-in-coding",
    metaTitle: "How to Get Kids Interested in Coding (Ages 8–14)",
    metaDescription:
      "Want your child to love coding? Start with projects they care about, pick the right first language for their age and build small wins. A guide for ages 8–14.",
    excerpt:
      "Start with projects kids care about, choose the right first language for their age and build small wins that turn curiosity into a real skill.",
    answerFirstSummary:
      "The best way to get kids interested in coding is to start with something they already care about — a game, a story or an app idea — and let them build it in small, visible steps. Children around 8–10 usually do best with block-based coding, while many 11–14-year-olds are ready for Python and simple websites. A patient mentor and frequent small wins keep motivation high long enough for real skills to form.",
    author: "ummiyah-nasim",
    category: "coding-for-kids",
    tags: ["Coding", "Python", "Block coding"],
    funnelStage: "top",
    featuredImage: {
      url: `${SITE}/coding-teaser-kid.jpg`,
      alt: "Girl celebrating at her laptop while building a coding project",
    },
    related: ["how-gradenext-free-trial-works", "how-to-help-child-behind-in-math"],
    faq: [
      {
        question: "What is the best age for kids to start coding?",
        answer:
          "Many children can start around age 8 with block-based coding. From about 10–11, most are ready to move to a typed language like Python and build real projects.",
      },
      {
        question: "Should my child learn Scratch-style block coding or Python first?",
        answer:
          "For younger children or complete beginners, block coding builds logic without typing frustration. Older kids who read and type comfortably can often start directly with Python.",
      },
      {
        question: "How much time should kids spend coding each week?",
        answer:
          "Two or three focused sessions a week of 30–60 minutes each is plenty for most beginners. Consistency matters more than long sessions.",
      },
    ],
    body: `## Why coding is worth learning — even if your child never becomes a programmer

Coding teaches far more than a programming language. Every project asks a child to break a big problem into small steps, test an idea, notice what went wrong and try again. Those habits — clear thinking, persistence and creative problem-solving — carry into math, science and everyday life.

The challenge is getting past the first few weeks, when coding can feel like a pile of confusing rules. Kids who stick with it are almost always the ones who were building something they cared about from day one.

## Start with what your child already loves

Interest is the fuel. Before choosing a course or an app, notice what your child already spends time on:

- **Games:** build a simple catch game, a maze or a score-tracking challenge
- **Stories and art:** create an animated story or an interactive comic
- **Science and nature:** make a quiz, a weather tracker or a simple simulation
- **Friends and family:** design a birthday card animation or a trivia game to share
- **Big ideas:** sketch the app they wish existed, then build a tiny first version

When the project belongs to them, debugging stops feeling like a chore and starts feeling like solving a puzzle.

## Choose the right starting point for their age

There is no single right first language, but a child’s age and reading comfort make a big difference.

| Age | Good starting point | Example first project |
| --- | --- | --- |
| 8–10 | Block-based coding (drag-and-drop) | An animated story or a simple catch game |
| 10–12 | Python basics | A quiz or number-guessing game |
| 12–14 | Python projects or web development | A personal website or a small data dashboard |

These are guidelines, not rules. A confident 9-year-old may be ready for Python, and a 13-year-old beginner may enjoy a few weeks of blocks to build confidence first.

## Make it about projects, not lessons

Kids stay motivated when they can see and share what they made. A good rhythm is a short loop:

1. **Think:** decide what the next small feature should do
2. **Build:** write just enough code to try it
3. **Test:** run it and see what happens
4. **Fix:** find the bug, change one thing and test again

Real progress can be quick. One GradeNext student, Ava, built *Space Explorer* — an asteroid-dodging Python game with score tracking — in week two of her course. Seeing a working game that early is exactly the kind of win that keeps a child coming back.

## Celebrate small wins

Early coding is full of error messages, so wins need to be visible and frequent. Celebrate the first time a character moves, the first working loop and the first bug your child fixed on their own. Ask them to demo their project to the family — explaining how it works deepens their understanding and builds pride.

## Learning alone vs. learning with a mentor

Free tutorials are a great way to explore, but many kids stall when they hit a bug they can’t solve alone. That is where a mentor makes the biggest difference: someone who can look at your child’s exact code, explain what went wrong and nudge them toward the fix without simply giving the answer.

One-on-one sessions also move at your child’s pace. Fast learners aren’t held back, and kids who need more time aren’t left behind the way they can be in large group classes. GradeNext’s [online coding classes for kids](/online-coding-classes-for-kids) are taught 1:1, and our programming mentors include engineers who build software for a living at companies like Mercari and Rakuten.

## Common mistakes parents make (and what to do instead)

- **Pushing syntax too early:** let younger kids build logic with blocks before typing
- **Long sessions with no goal:** short sessions with one clear feature work better
- **Jumping between apps and courses:** stick with one path long enough to finish projects
- **Comparing to other kids:** compare your child to where they were last month
- **Fixing bugs for them:** ask questions that help them find the problem themselves

## Where to go next

If your child is curious, start small this week: pick one project idea from the list above and spend 30 minutes building the simplest possible version together.

When you are ready for a structured path, the [GradeNext Coding for Kids program](/coding) guides students from block coding to Python, web development and AI projects, with one-time course prices starting at $199. To see what learning with GradeNext looks like before you commit, read [how the GradeNext 14-day free trial works](/blog/how-gradenext-free-trial-works).

The goal isn’t to turn every child into a software engineer. It’s to help them discover that they can build things — and that when something breaks, they have what it takes to fix it.`,
  },
  {
    title: "How Much Does After-School Tutoring Cost in the US?",
    slug: "after-school-tutoring-cost",
    metaTitle: "After-School Tutoring Cost in the US: What Parents Pay",
    metaDescription:
      "What does after-school tutoring cost? Compare typical prices for private tutors, learning centers and online platforms, plus tips to get more for your money.",
    excerpt:
      "A plain-English guide to what private tutors, learning centers and online platforms typically cost — and how to choose the right fit for your budget.",
    answerFirstSummary:
      "After-school tutoring in the US typically ranges from about $10–$60 a month for self-paced online practice to roughly $150–$350 or more a month at in-person learning centers, while many private tutors charge about $40–$100+ per hour. The biggest cost drivers are how often your child gets live one-to-one time, whether you pay per subject and how much travel is involved. Figures vary widely by location and provider, so treat them as approximate starting points.",
    author: "rumee-shahid",
    category: "parenting-learning-tips",
    tags: ["Tutoring costs", "Learning centers", "Online tutoring"],
    funnelStage: "middle",
    featuredImage: {
      url: `${SITE}/how-it-works-step-2.jpg`,
      alt: "Parent and child reviewing a personalized learning path together on a tablet",
    },
    related: ["how-to-help-child-behind-in-math", "how-gradenext-free-trial-works"],
    faq: [
      {
        question: "Is online tutoring cheaper than a learning center?",
        answer:
          "Usually, yes. Online platforms don’t build center rent or travel into the price, and many cover several subjects for one monthly fee, while learning centers often charge per subject.",
      },
      {
        question: "How much should I budget for a math tutor?",
        answer:
          "Many families spend roughly $100–$400 a month on math help, depending on whether they choose online practice, weekly 1:1 sessions or an in-person center. Prices vary widely by location, so check current rates with each provider.",
      },
      {
        question: "Are cheaper tutoring options less effective?",
        answer:
          "Not necessarily. What matters most is practice at the right level, regular feedback and consistent time with a person who understands your child — not the price tag alone.",
      },
    ],
    body: `## The three main types of after-school tutoring

Most families end up choosing between three kinds of support. Each can work well — they simply trade off cost, flexibility and personal attention in different ways.

### Private tutors

A private tutor works one-to-one with your child, either at home, at a library or online. You get full attention and flexible scheduling, but you usually pay by the hour, and practice between sessions depends on the tutor.

### Learning centers

Learning centers run structured programs at a physical location, often with worksheets or a center curriculum and instructors who work with several students at once. Many families like the routine and the in-person setting, but fees are frequently charged per subject, and the drive and fixed hours add hidden costs.

### Online learning platforms

Online platforms range from self-paced practice apps to programs that combine adaptive practice with scheduled live sessions. They are usually the most affordable option per subject and the most flexible, since learning happens at home.

## Typical costs at a glance

The ranges below are approximate and meant as a starting point for comparison.

| Option | Typical cost (approximate) | What’s usually included |
| --- | --- | --- |
| Private tutor (in person or online) | About $40–$100+ per hour | One-to-one sessions; practice between sessions varies |
| In-person learning center | About $150–$350+ per month, often per subject | Scheduled center visits, shared instructors, center curriculum |
| Online platform (practice only) | About $10–$60 per month | Self-paced practice and progress tracking |
| Online platform with live 1:1 sessions | About $100–$200 per month | Adaptive practice plus scheduled one-to-one time |

*Pricing varies by location and provider; figures are approximate as of September 2026 — check each provider for current rates.*

## What actually drives the price

Two programs with similar names can cost very different amounts. These factors explain most of the gap:

- **Live one-to-one time:** hours with a real person are the most expensive part of any program
- **Per-subject pricing:** paying separately for math and reading can double your monthly cost
- **Travel and fixed schedules:** gas, drive time and waiting rooms don’t appear on the invoice, but they are real costs for busy families
- **Contract length and registration fees:** some programs require upfront fees or minimum commitments
- **Materials and assessments:** check whether workbooks, testing or progress reports cost extra

## How to compare options fairly

Monthly price alone can be misleading. A more useful comparison is: *what does my child actually get for the subjects they need?*

Start by listing the subjects your child needs help with, how much live time you want each week and how often they will practice in between. Then ask each provider what that exact setup costs. If your child needs help with both math and reading, a per-subject program doubles in price, while a multi-subject plan stays the same.

It also helps to ask how progress is measured. A program that shows you exactly which skills your child has mastered makes it much easier to judge whether the money is working.

## Where GradeNext fits

GradeNext is an online platform that combines AI-personalized practice with real mentors. The Basic plan is $49/month and covers Math, Science and Language Arts practice aligned to Common Core and state standards, with a progress dashboard for parents. The Pro plan is $99/month and adds one live 1:1 tutor session every week plus 24/7 live doubt support, and the Advanced plan is $199/month with three 1:1 sessions a week. Coding courses are separate one-time purchases starting at $199. You can compare everything on the [GradeNext pricing page](/pricing).

If you are weighing an in-person program, our side-by-side guides may help: [online tutoring vs a learning center](/online-tutoring-vs-learning-center), the [Kumon alternative comparison](/kumon-alternative) and the [Mathnasium alternative comparison](/mathnasium-alternative).

## Tips to get more value from any tutoring budget

- **Diagnose first:** a placement test or assessment prevents paying for help on the wrong topics
- **Favor consistency over intensity:** short daily practice plus weekly live time beats occasional long sessions
- **Ask for progress data:** you should be able to see what has improved each month
- **Use free trials:** a couple of weeks shows how your child responds before you commit
- **Match the program to the problem:** a child who is far behind needs different support than one who just needs practice

If your child is struggling with a specific subject, start by reading [how to help a child who is behind in math](/blog/how-to-help-child-behind-in-math) — finding the real gap first can make any tutoring budget go much further.

## Questions to ask before you sign up

Whatever option you are leaning toward, a short list of questions before you commit can save both money and frustration:

- **What exactly is included at this price?** Ask whether practice, live sessions, progress reports and materials are bundled or billed separately.
- **What happens if we need to pause or cancel?** Some contracts lock you in for a semester; others let you cancel anytime.
- **How is my child’s level actually determined?** A real placement test is a good sign; being placed by age or grade alone is not.
- **How will I know it’s working?** Ask what progress reporting looks like and how often you’ll see it.
- **Is there a free trial or trial class?** Trying before you buy is the fastest way to judge fit.

## A simple way to think about value

Instead of comparing prices in isolation, it helps to work out a rough cost per hour of real, personalized help your child receives — whether that is live tutor time, mentor feedback or meaningfully adapted practice. Two programs at very different monthly prices can end up close in value once you account for how much of that price actually goes toward attention on your specific child, rather than materials, facilities or group instruction spread across many students.

There is no single right answer for every family. A student who needs steady daily practice with occasional check-ins may do very well on a lower-cost online plan, while a child preparing for a specific exam under time pressure may need more frequent live sessions, even at a higher price. The best tutoring budget is the one matched to what your child actually needs right now — which is also why it is worth revisiting the decision every few months as those needs change.`,
  },
  {
    title: "How the GradeNext 14-Day Free Trial Works",
    slug: "how-gradenext-free-trial-works",
    metaTitle: "How the GradeNext 14-Day Free Trial Works",
    metaDescription:
      "See exactly how the GradeNext 14-day free trial works: no credit card, a placement test, personalized practice and live mentor sessions before you decide.",
    excerpt:
      "No credit card, no commitment: here’s what happens during each week of the GradeNext free trial and how to get the most out of it.",
    answerFirstSummary:
      "The GradeNext 14-day free trial gives your child the full plan experience — personalized practice, the parent progress dashboard and, on plans that include them, live 1:1 tutor sessions — with no credit card required. It starts with a short placement test that finds your child’s level in each subject. When the 14 days end, you pick a plan or simply don’t, and you can switch or cancel anytime.",
    author: "shahid-mohammad",
    category: "gradenext-product",
    tags: ["Free trial", "Getting started"],
    funnelStage: "bottom",
    featuredImage: {
      url: `${SITE}/hero-learning.jpg`,
      alt: "Student using the GradeNext adaptive learning dashboard on a laptop at home",
    },
    related: ["after-school-tutoring-cost", "how-to-get-kids-interested-in-coding"],
    faq: [
      {
        question: "Do I need a credit card for the free trial?",
        answer: "No. The GradeNext 14-day free trial doesn’t require a credit card.",
      },
      {
        question: "What happens when the trial ends?",
        answer:
          "You pick a plan — or don’t. No card is required for the trial, and you can switch or cancel anytime.",
      },
      {
        question: "Can my child try both academics and coding?",
        answer:
          "Yes. Many families combine a Regular Subjects plan with individual coding courses, and Advanced plan members get 10% off any programming course.",
      },
    ],
    body: `## What you need to get started

Starting the trial takes a few minutes. You will need:

- A parent email address to create your account
- A laptop, tablet or phone with a modern web browser
- About 20–30 quiet minutes for your child’s first session

You don’t need a credit card, and there is nothing to install — GradeNext works in any modern browser on laptops, iPads, Android tablets and phones.

## Day 1: The placement test

Every child starts with a short placement test. Instead of assuming your child is exactly at grade level, it checks their understanding topic by topic in each subject.

The results do two things. First, they show you where your child is strong and where the gaps are. Second, they let the AI build a personal learning path, so practice starts at the right level from the very first session — not too easy, not frustratingly hard.

## Week 1: Building a daily practice habit

During the first week, the goal is a simple routine. Short daily sessions of about 15–20 minutes work best for most kids in grades 1–8.

As your child practices, GradeNext adapts in real time. Questions get harder when your child is ready and slow down with more support when a concept isn’t clicking. Smart revisions bring back tricky topics a few days later, so skills stick instead of fading after the test.

Parents can follow along on the progress dashboard, which updates as your child works.

## Meeting a mentor

Practice is only half of GradeNext. On plans that include live sessions, your child is matched with a dedicated mentor for live 1:1 sessions scheduled around your family: one session a week on the Pro plan and three a week on the Advanced plan. Pro and Advanced students also get 24/7 live doubt support when a question comes up during homework.

Mentors explain the reasoning behind tricky problems, review mistakes and keep kids motivated. You can [meet the GradeNext mentors](/mentors) before your child’s first session.

## Week 2: Checking progress

By the second week, there is real information to look at. The parent dashboard shows weekly test results, strengths, gaps, streaks and — on plans with 1:1 sessions — mentor notes. This is a good moment to ask a few questions:

- Is my child practicing consistently?
- Which gaps have started to close?
- Does my child look forward to sessions with their mentor?
- Which plan fits the amount of live support we want?

## Choosing a plan after the trial

When the trial ends, you can choose the plan that fits your family, or simply stop.

| Plan | Price | Key features |
| --- | --- | --- |
| Basic | $49/month | Math, Science & Language Arts practice, Common Core + state syllabus, progress dashboard, email support |
| Pro | $99/month | Everything in Basic, one 1:1 tutor session every week, unlimited practice and tests, 24/7 live doubt support |
| Advanced | $199/month | Everything in Pro, three 1:1 tutor sessions every week, advanced analytics, competitive exam prep, dedicated success mentor, 10% off programming courses |

You can switch or cancel anytime, and full details are on the [GradeNext pricing page](/pricing). If you are comparing GradeNext with other options, our guide to [after-school tutoring costs](/blog/after-school-tutoring-cost) puts typical prices side by side.

Interested in coding too? Coding courses are separate one-time purchases starting at $199. Read [how to get kids interested in coding](/blog/how-to-get-kids-interested-in-coding) for tips on choosing the right first course.

## Tips to get the most from your free trial

1. **Do the placement test on day one** so practice is personalized immediately.
2. **Pick a regular practice time**, such as right after snack or before dinner.
3. **Keep sessions short** and stop while your child still feels successful.
4. **Check the dashboard twice a week** and celebrate specific progress together.
5. **Try a live mentor session** if your plan includes one, and ask your child how it felt.
6. **Decide with real data** — look at what changed over the two weeks before choosing a plan.

To understand the full learning loop in more detail, see [how GradeNext works](/how-it-works). The trial is designed so you can make the decision with your own child’s results in front of you, not a sales pitch.

## Frequently asked practical questions

**What if my child tries one session and doesn’t like it?** That’s useful information too. Try a different time of day, a shorter session length, or ask your child what felt hardest — sometimes a small change in routine makes a big difference in the second week.

**Can two siblings share one trial?** Each child needs their own account so the placement test and adaptive practice reflect their individual level. Contact GradeNext about family and sibling pricing once you’re ready to choose a plan.

**What devices does GradeNext work on?** Any modern browser — laptops, iPads, Android tablets and phones — so your child can practice wherever is most comfortable.

**Is there support if we get stuck setting up?** Yes, GradeNext offers support to help with account setup and any technical questions during the trial, so a slow start with sign-in details doesn’t eat into your two weeks.

## Making the most of a short trial period

Two weeks goes quickly, especially around a busy family schedule. Treat the trial less like a test you have to pass and more like a short pilot program: the goal is simply to gather enough real information — how your child responds to the practice, whether a mentor session helps, what the dashboard shows — to make a confident decision afterward. Most families find that the clearest signal isn’t how your child felt on day one, but whether they were willing to sit down for practice again on day seven without being asked twice.`,
  },
];

const wordCount = (text) => text.trim().split(/\s+/).length;

const report = () => {
  for (const post of posts) {
    console.log(
      `${post.slug}: metaTitle ${post.metaTitle.length} chars, metaDescription ${post.metaDescription.length} chars, body ${wordCount(post.body)} words`
    );
  }
};

const findOrCreate = async (Model, doc) => {
  const existing = await Model.findOne({ slug: doc.slug });
  if (existing) return { doc: existing, created: false };
  return { doc: await Model.create(doc), created: true };
};

const main = async () => {
  report();
  if (process.argv.includes("--dry-run")) return;

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 30000 });

  const categoryIds = {};
  for (const category of categories) {
    const { doc, created } = await findOrCreate(BlogCategory, category);
    categoryIds[category.slug] = doc._id;
    console.log(`${created ? "Created" : "Exists "} category ${category.slug}`);
  }

  const authorIds = {};
  for (const author of authors) {
    const { doc, created } = await findOrCreate(BlogAuthor, author);
    authorIds[author.slug] = doc._id;
    console.log(`${created ? "Created" : "Exists "} author ${author.slug}`);
  }

  const createdPosts = [];
  const postIds = {};
  for (const { related, author, category, ...post } of posts) {
    const { doc, created } = await findOrCreate(BlogPost, {
      ...post,
      author: authorIds[author],
      category: categoryIds[category],
      status: "draft",
    });
    postIds[post.slug] = doc._id;
    if (created) createdPosts.push({ doc, related });
    console.log(`${created ? "Created" : "Exists "} draft post ${post.slug}`);
  }

  for (const { doc, related } of createdPosts) {
    doc.relatedPosts = related.map((slug) => postIds[slug]).filter(Boolean);
    await doc.save();
  }

  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
