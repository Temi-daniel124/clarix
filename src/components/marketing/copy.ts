/**
 * The landing page's words, verbatim from the round-2 landing board (spec §11.1), in one place.
 *
 * Every section component renders its copy from here, so `copy.test.ts` can hold the whole page
 * to the copy rules at once: no single-employer wording (D032), no testimonial and no invented
 * proof (spec §1 anti-goals). The FAQ answers are the board's, word for word.
 */

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

export const FINAL_CTA = {
  heading: "Set up your cooperative this afternoon.",
  body: "Import your member list from Excel, add your loan products, and invite your treasurer. Free for 60 days.",
  primary: "Start your free trial",
  secondary: "Book a walkthrough",
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
