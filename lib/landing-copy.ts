export const LANDING_SEO = {
  title: "DuesKo | Simple HOA & Condo Dues Collection",
  description:
    "DuesKo makes it simple for HOAs and condos to collect monthly dues, track who paid, share reminders, and prepare collection reports. Join the waitlist.",
} as const;

export const LANDING_HERO = {
  h1: "Collect HOA dues without the chasing.",
  subheadline:
    "DuesKo is being built to help homeowners associations and condo corporations collect monthly dues, track who has paid, share friendly reminders, and prepare collection reports for the board and AGA, without juggling spreadsheets, screenshots, and group chats.",
  primaryCta: "Join the Waitlist",
  secondaryCta: "See how it works",
} as const;

export const LANDING_PROBLEM = {
  heading: "Collecting dues shouldn't feel like a second job",
  intro: "If you're an HOA officer or treasurer, you probably know this routine:",
  cards: [
    {
      title: "Payments come from everywhere.",
      body: "Some homeowners send GCash, some do a bank transfer, some pay cash to the guard house or the admin office. Then you have to match each one to the right unit.",
    },
    {
      title: "Proof of payment gets buried.",
      body: "Screenshots get posted in the Viber group or Facebook group chat, mixed in with announcements, lost pets, and 'good morning' messages. Finding last month's proof of payment means a lot of scrolling.",
    },
    {
      title: "The spreadsheet is always behind.",
      body: "Someone has to update it by hand, every month, for every unit. One wrong cell and the totals don't match.",
    },
    {
      title: "Reminders are awkward.",
      body: "Nobody enjoys messaging neighbors one by one to follow up on unpaid dues.",
    },
    {
      title: "Reports take a whole weekend.",
      body: "Before every board meeting or general assembly, you have to pull together who paid, who's behind, and how much was collected.",
    },
  ],
  closing:
    "You volunteered to help your community, not to become a full-time collector. DuesKo is being built to make this part easier.",
} as const;

export const LANDING_HOW = {
  heading: "How it works",
  steps: [
    {
      title: "Set up your community.",
      body: "Add your HOA or condo, your units, and the monthly dues amount.",
    },
    {
      title: "Homeowners send proof of payment.",
      body: "They pay the way they already do (GCash, bank transfer or cash) and upload their proof from any phone browser. No app to download.",
    },
    {
      title: "Track, remind, and report.",
      body: "Approve proofs in one place, record cash payments by hand, see who has paid at a glance, send payment acknowledgments, and download a collection report for your board or AGA.",
    },
  ],
} as const;

export const LANDING_FEATURES = {
  heading: "What you get",
  items: [
    {
      title: "Proof of payment in one place",
      body: "no more scrolling the group chat.",
    },
    {
      title: "Officer approval",
      body: "approve or reject each proof, with a reason.",
    },
    {
      title: "Cash payment recording",
      body: "record cash by hand, so every balance stays in one place.",
    },
    {
      title: "Unit and homeowner list",
      body: "all your units and owners in one place.",
    },
    {
      title: "Monthly dues tracking",
      body: "paid, unpaid and partial, per unit, per month.",
    },
    {
      title: "Collection reports",
      body: "a CSV export for your board and AGA.",
    },
    {
      title: "Homeowner view",
      body: "each homeowner sees only their own history and balance, with a payment acknowledgment for each payment.",
    },
    {
      title: "Mobile-friendly",
      body: "works on the phone, where this already happens.",
    },
  ],
} as const;

export const LANDING_FAQ = {
  heading: "FAQ",
  items: [
    {
      question: "What is DuesKo?",
      answer:
        "A simple online tool being built to help HOAs and condo corporations collect monthly dues, track payments, share reminders, and prepare collection reports for the board and AGA.",
    },
    {
      question: "Who is it for?",
      answer:
        "HOA and condo officers, treasurers, property admins, and board members in the Philippines who handle monthly dues collection.",
    },
    {
      question: "Do homeowners need to download an app?",
      answer: "No. They use any phone browser.",
    },
    {
      question: "How do homeowners pay?",
      answer:
        "The way they already do: GCash, bank transfer or cash. They upload their proof of payment, and an officer approves it.",
    },
    {
      question: "Can we still accept cash payments?",
      answer:
        "Yes. The treasurer records cash payments by hand, so each resident's balance stays in one place.",
    },
    {
      question: "Will this replace our Viber or Facebook group?",
      answer:
        "No, keep your group for announcements and community chat. DuesKo just gives payments and records their own organized place.",
    },
    {
      question: "How much does it cost?",
      answer:
        "Pricing isn't final yet. Join the waitlist and we'll let you know as soon as details are ready.",
    },
    {
      question: "Does it handle tax requirements?",
      answer:
        "DuesKo is a tool for tracking dues collection and sending payment acknowledgments. Please consult your accountant or adviser for tax matters.",
    },
    {
      question: "When will it be available?",
      answer: "We're preparing for launch now. Join the waitlist to get updates.",
    },
  ],
} as const;

export const LANDING_WAITLIST = {
  heading: "Be one of the first communities to try DuesKo.",
  body: "We're building a simpler way for HOAs and condo corporations to handle monthly dues. Join the waitlist and we'll reach out when there's news.",
  microcopy: "No commitment. We'll only email you about DuesKo.",
  closedNote: "The waitlist opens soon. Check back shortly.",
  submit: "Join the Waitlist",
  consent:
    "I agree to DuesKo contacting me about the waitlist. See our Privacy Notice.",
} as const;

export function landingPublicText(): string {
  return [
    LANDING_SEO.title,
    LANDING_SEO.description,
    LANDING_HERO.h1,
    LANDING_HERO.subheadline,
    LANDING_HERO.primaryCta,
    LANDING_HERO.secondaryCta,
    LANDING_PROBLEM.heading,
    LANDING_PROBLEM.intro,
    ...LANDING_PROBLEM.cards.flatMap((card) => [card.title, card.body]),
    LANDING_PROBLEM.closing,
    LANDING_HOW.heading,
    ...LANDING_HOW.steps.flatMap((step) => [step.title, step.body]),
    LANDING_FEATURES.heading,
    ...LANDING_FEATURES.items.flatMap((item) => [item.title, item.body]),
    LANDING_FAQ.heading,
    ...LANDING_FAQ.items.flatMap((item) => [item.question, item.answer]),
    LANDING_WAITLIST.heading,
    LANDING_WAITLIST.body,
    LANDING_WAITLIST.microcopy,
    LANDING_WAITLIST.closedNote,
    LANDING_WAITLIST.submit,
    LANDING_WAITLIST.consent,
  ].join("\n");
}
