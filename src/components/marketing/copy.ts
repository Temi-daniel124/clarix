/**
 * The landing page's words, verbatim from the round-2 landing board (spec §11.1), in one place.
 *
 * Every section component renders its copy from here, so `copy.test.ts` can hold the whole page
 * to the copy rules at once: no single-employer wording (D032), no testimonial and no invented
 * proof (spec §1 anti-goals). The FAQ answers are the board's, word for word.
 */

/**
 * Fills `{name}` placeholders. Templates stay plain strings, so `copy.test.ts`, which reads this
 * module as JSON, still checks their wording.
 */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

export const BUILT_FOR_LABEL = "Made for";
export const BUILT_FOR_REGION = "Made for every kind of cooperative";

export const BUILT_FOR = [
  "Staff cooperatives",
  "Market & trader associations",
  "Thrift & credit societies",
  "Farmers' cooperatives",
  "Church & mosque cooperatives",
  "Estate & alumni groups",
] as const;

export const REPAYMENT_INTRO = {
  heading: "A repayment, from bank transfer to statement.",
  body: "Money never moves through Clarix. Members pay the cooperative's account as they always have, and Clarix keeps every record straight.",
} as const;

export type RepaymentStep = { title: string; body: string };

export const REPAYMENT_STEPS: readonly RepaymentStep[] = [
  {
    title: "The member pays and attaches the receipt",
    body: "A transfer, a POS slip or a cash deposit. A photo or PDF is enough.",
  },
  {
    title: "The treasurer checks it against the bank alert",
    body: "One tap to confirm, or send it back with a reason the member can read.",
  },
  {
    title: "Every balance updates at once",
    body: "Her loan, her limit, the cooperative's books and her next statement.",
  },
];

/** The small product pictures at the foot of each step card. */
export const REPAYMENT_SAMPLES = {
  stepPrefix: "Step {n}: ",
  receiptFile: "receipt-nov.jpg",
  receiptMeta: "{amount} · paid 18 Nov",
  waiting: "Waiting",
  confirm: "Confirm",
  sendBack: "Send back",
  loanLeft: "Loan left",
} as const;

export const ROLES_HEADING = "One record that everyone in the cooperative trusts.";

export type Role = {
  label: string;
  title: string;
  body: string;
  photo: { src: string; alt: string; position: string; credit: string };
};

// The board drew these with the first three hero photos. Each role has its own photo here so the
// section does not repeat the carousel a scroll later, and so the two section photos chosen for
// the page (market.jpg, members.jpg) are the ones that appear. Credits: public/images/landing/CREDITS.md.
export const ROLES: readonly Role[] = [
  {
    label: "Members",
    title: "Know where you stand in every cooperative",
    body: "Balances, what you can still borrow, and a statement whenever you want one. Free, always.",
    photo: {
      src: "/images/landing/market.jpg",
      alt: "A tomato and pepper seller arranging produce at Bodija Market, Ibadan",
      position: "50% 35%",
      credit: "Tunde Buremo",
    },
  },
  {
    label: "Treasurers and officers",
    title: "Confirm, don't retype",
    body: "Bring your roster in from Excel, confirm receipts in a tap, and record a month of contributions from one bank export.",
    photo: {
      src: "/images/landing/treasurer.jpg",
      alt: "A man smiling at his laptop in an office",
      position: "40% 40%",
      credit: "David Olubaji",
    },
  },
  {
    label: "Admins and executives",
    title: "Approve with the whole picture",
    body: "Each request shows what the member already owes everywhere, so the answer is quick and fair.",
    photo: {
      src: "/images/landing/members.jpg",
      alt: "Three women sitting together and talking",
      position: "50% 30%",
      credit: "Iwaria",
    },
  },
];

export const CROSS_CHECK = {
  eyebrow: "The cross-cooperative check",
  heading: "See what a member owes everywhere, without seeing anyone else's books.",
  body: "A member in three cooperatives has one income and one limit. Clarix adds up their monthly repayments across every cooperative on Clarix and shows your committee one figure. Other cooperatives' savings, balances and members stay private.",
  request: "Amaka Obi · ₦300,000 over 12 months",
  verdict: "Fits her limit",
  figureSuffix: "still free a month",
  legend: {
    committed: "Already committed",
    request: "This request",
    available: "Still free",
  },
  meterLabel:
    "Amaka's limit of {limit}: committed across her cooperatives, this request, and what is still free",
  footnote:
    "Her limit comes from six months of bank statements. For salaried members it comes from a payslip and the 33.3% legal cap.",
} as const;

export const STATEMENTS = {
  eyebrow: "Statements, reports and exports",
  heading: "Documents that look as official as they are.",
  points: [
    "Member statements, watermarked with your cooperative's name and a verification code",
    "Savings register, loan book, arrears and monthly collections",
    "An AGM pack in one click, as PDF or Excel",
  ],
} as const;

/** The sample statement in the statements preview. A picture of a statement, not real data. */
export const STATEMENT_SAMPLE = {
  label:
    "A sample member statement for Amaka Obi at Ikeja Traders Thrift, 1 June to 30 November 2026, watermarked with the Clarix stamp and a verification code",
  title: "Member statement",
  period: "1 Jun to 30 Nov 2026",
  member: "Amaka Obi",
  memberLine: " · Ikeja Traders Thrift · No. ITT-0142",
  columns: { date: "Date", savings: "Savings", loan: "Loan left" },
  rows: [
    { entry: "2 Sep · Saved ₦10,000", savings: 182_000, loan: 250_000 },
    { entry: "30 Sep · Repaid ₦35,000", savings: 182_000, loan: 215_000 },
    { entry: "3 Oct · Saved ₦10,000", savings: 192_000, loan: 215_000 },
    { entry: "31 Oct · Repaid ₦35,000", savings: 192_000, loan: 180_000 },
    { entry: "4 Nov · Saved ₦20,000", savings: 212_000, loan: 180_000 },
  ],
  verification: "Verification code 8KQ2-71XD",
  page: "Page 1 of 1",
} as const;

export const PRICING = {
  eyebrow: "Pricing",
  heading: "Free for 60 days. Then pay only for members who use it.",
  body: "₦150 for each member who saved, borrowed or repaid that month. Names that sit quietly on your roster cost nothing, and members never pay.",
  monthly: "Monthly",
  yearly: "Yearly · 2 months free",
  membersLabel: "Members active in a typical month",
  billMonthly: "Your bill each month",
  billYearly: "Your bill each year",
  cta: "Start your 60-day free trial",
  cycleGroup: "Billing cycle",
  fewer: "{step} fewer members",
  more: "{step} more members",
  noteMinimum: "The smallest bill is {minimum} a month.",
  noteMonthly: "{members} members × {price}",
  noteYearly: "{monthly} a month, with two months free",
} as const;

export type FaqItem = { question: string; answer: string };

export const FAQ_HEADING = "Questions people actually ask";

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: "Does Clarix hold or move our money?",
    answer:
      "No. Members pay your cooperative's own bank account exactly as they do today. Clarix records the payment, the treasurer confirms it, and every balance updates.",
  },
  {
    question: "Our members are not salaried. Does Clarix still work?",
    answer:
      "Yes. Each member's limit can come from a payslip, from three to six months of bank statements, or from a figure your officer confirms. One cooperative can have both kinds of member.",
  },
  {
    question: "Can another cooperative see our members or balances?",
    answer:
      "No. When a loan is checked, Clarix shows only one combined monthly figure for what the member owes elsewhere. Nothing else crosses between cooperatives.",
  },
  {
    question: "What happens when the free trial ends?",
    answer:
      "You get a quiet reminder 14 days before, and a 14-day grace period after. If you do not subscribe, Clarix becomes read-only: nothing is deleted, and you and your members can still view and export every record.",
  },
  {
    question: "We keep our records in Excel. How do we start?",
    answer:
      "Upload the spreadsheet. Clarix matches the columns, shows you anything that needs a second look, and invites each member to join.",
  },
];

/**
 * The billing questions for /pricing (spec §11.1 Pricing). The trial answer is the landing FAQ's,
 * word for word, so the two pages can never describe the end of the trial differently (D037).
 */
export const BILLING_FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: "What counts as an active member?",
    answer:
      "A member who saved, borrowed or repaid during the month. Anyone who did none of those that month is not counted, however long they have been on your roster.",
  },
  FAQ_ITEMS[3],
  {
    question: "Can we pay yearly?",
    answer:
      "Yes. A yearly bill is twelve months for the price of ten, worked out from the members active in a typical month.",
  },
  {
    question: "Do members pay anything?",
    answer:
      "No. Clarix is free for members, always. Only the cooperative is billed, and only for the members who were active that month.",
  },
  {
    question: "Do we need a card to start the trial?",
    answer:
      "No. The 60-day trial starts without a card, and nothing is charged until you choose to subscribe.",
  },
];

export const BILLING_FAQ_HEADING = "Billing questions";

/** /pricing (spec §11.1 Pricing; D037). Its one primary is the final card's. */
export const PRICING_PAGE = {
  metaTitle: "Pricing",
  metaDescription:
    "₦150 for each member who saved, borrowed or repaid that month, with a ₦5,000 monthly minimum. Free for 60 days, members never pay, and your records stay yours to view and export.",
  eyebrow: "Pricing",
  heading: "One price, only for members who use it",
  body: "₦150 a month for each member who saved, borrowed or repaid. The smallest bill is ₦5,000 a month, there are no tiers to choose between, and members never pay.",
  ticks: ["Free for 60 days", "No card needed", "Members always free"],
  termsHeading: "How billing works, from the first day.",
  termsBody:
    "No surprises at the end of the trial, and no point at which your records are held back from you.",
  terms: [
    {
      term: "What counts as active",
      when: "Each month",
      detail:
        "A member who saved, borrowed or repaid that month. Names that sit quietly on your roster cost nothing.",
    },
    {
      term: "The free trial",
      when: "60 days",
      detail:
        "Every feature, for your whole cooperative, from the day you sign up. We remind you 14 days before it ends.",
    },
    {
      term: "The grace period",
      when: "14 days",
      detail:
        "If the trial ends before you subscribe, everything keeps working for 14 more days while you decide.",
    },
    {
      term: "After that, read-only",
      when: "Until you subscribe",
      detail:
        "Nothing is deleted; you and your members can still view and export every record. Recording new entries waits until you subscribe.",
    },
  ],
} as const;

export type JoinStep = { title: string; body: string };

/** /for-members (spec §11.1 For members, §11.4; D038). Its one primary is "Find your cooperative". */
export const FOR_MEMBERS_PAGE = {
  metaTitle: "For members",
  metaDescription:
    "See your savings, loans and what you can still borrow in every cooperative you belong to. Join with a payslip or bank statements. Free, always.",
  eyebrow: "For members",
  heading: "Every cooperative you belong to, in one place",
  body: "Your savings, your loans and what you can still borrow, across every cooperative you belong to. Salaried or not, joining takes a few minutes.",
  cta: "Find your cooperative",
  ctaHref: "/signup?as=member",
  signIn: "I already have an account",
  ticks: ["Free, always", "Salaried or not", "Your documents stay private"],
  photoAlt: "A tomato and pepper seller arranging produce at Bodija Market, Ibadan",
  preview: {
    label:
      "A member's home screen: ₦100,863 she can still take on each month, ₦60,975 already committed against a ₦161,838 limit, and her savings in three cooperatives",
    figureLabel: "You can still take on each month",
    committed: "Committed",
    limit: "Limit",
    source: "From 6 months of bank statements · confirmed 2 Nov",
    cooperativesTitle: "Your cooperatives",
    savings: "Savings",
    loan: "Loan",
    cooperatives: [
      { initials: "IT", name: "Ikeja Traders Thrift", savings: 212_000, loan: true },
      { initials: "UM", name: "Unity Market Women", savings: 148_500, loan: true },
      { initials: "OF", name: "Ogun Farmers Credit", savings: 64_000, loan: false },
    ],
  },
  stepsHeading: "How to join",
  stepsBody:
    "Your cooperative approves you, as it always has. Clarix just means doing it once, from your phone.",
  stepPrefix: "Step {n}: ",
  steps: [
    {
      title: "Find your cooperative",
      body: "Search by name, open the invitation link your cooperative sent, or scan its QR code.",
    },
    {
      title: "Add your income evidence",
      body: "A payslip if you earn a salary, or 3 to 6 months of bank statements if you don't. You can also give a figure your cooperative confirms.",
    },
    {
      title: "Get approved by your cooperative",
      body: "An officer checks your details and approves you. You can look around while you wait.",
    },
  ] satisfies JoinStep[],
  stepSamples: {
    search: "Ikeja Traders",
    searchLabel: "Search cooperatives",
    result: "Ikeja Traders Thrift",
    resultMeta: "Thrift & credit · Lagos",
    file: "statement-jun-nov.pdf",
    fileMeta: "6 months found",
    privacy: "Only the people deciding a loan you apply for can open it.",
    application: "Your application is with Ikeja Traders Thrift",
    waiting: "Awaiting approval",
  },
  seeHeading: "What you see once you're in",
  seeBody: "The same figures your cooperative sees about you, and nothing about anyone else.",
  see: [
    {
      title: "Every balance, every cooperative",
      body: "Savings and loans in each cooperative you belong to, side by side, current as of today.",
    },
    {
      title: "What you can still borrow",
      body: "One limit across all your cooperatives, and where it comes from: your payslip, your bank statements or a figure your cooperative confirmed.",
    },
    {
      title: "Repayments with a receipt",
      body: "Pay your cooperative's own account as you always have, then attach the receipt. Clarix never holds or moves your money.",
    },
    {
      title: "A statement whenever you want one",
      body: "Download a statement for any cooperative, watermarked and ready to show anyone who asks.",
    },
  ],
  privacyHeading: "Who can see your documents",
  privacyBody:
    "Only the people deciding a loan you apply for, its cooperative's administrators and the officers allowed to approve loans, can open your payslip or bank statements, and only while it waits for a decision. Other cooperatives never see your records, only one combined figure for what you already repay each month.",
  privacyLink: "Read the privacy notice",
  freeHeading: "Free, always.",
  freeBody:
    "Members never pay for Clarix: no subscription, no card, nothing at all. Your cooperative looks after the platform.",
} as const;

export const FINAL_CTA = {
  heading: "Set up your cooperative this afternoon.",
  body: "Import your member list from Excel, add your loan products, and invite your treasurer. Free for 60 days.",
  primary: "Start your free trial",
  secondary: "Book a walkthrough",
} as const;

/** The one line on the sign-in and sign-up panel, for members and staff alike. */
export const AUTH_PANEL_LINE =
  "One limit across every cooperative you belong to, so a loan is checked against what is actually left.";

export const FOOTER = {
  home: "Clarix home",
  nav: "Footer",
  privacy: "Privacy",
  help: "Help",
  contact: "Contact",
  copyright: "© 2026 Clarix",
  photos: "Photos:",
} as const;

export type PhotoCredit = { name: string; label: string; href: string };

/**
 * Every photograph on the page, hero carousel first, in the order they appear. Each links to its
 * Unsplash photo page (public/images/landing/CREDITS.md), the attribution Unsplash asks for.
 */
export const PHOTO_CREDITS: readonly PhotoCredit[] = (
  [
    ["Adeniji Abdullahi", "_MExu0l-sCM"],
    ["David Olubaji", "wT-xJyLHcNA"],
    ["Abraham George", "0Ftgn7-a4dc"],
    ["Francis Odeyemi", "r2fZ65O6lWY"],
    ["Tunde Buremo", "cnVn4Gg4b00"],
    ["Iwaria", "GLLeZ59t3bA"],
  ] as const
).map(([name, id]) => ({
  name,
  label: `${name} on Unsplash`,
  href: `https://unsplash.com/photos/${id}`,
}));
