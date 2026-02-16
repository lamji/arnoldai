export const KAISER_BASE_KNOWLEDGE = `
# Kaiser International Healthgroup, Inc. Knowledge Base

OVERVIEW:
Kaiser International Healthgroup, Inc. is a registered healthcare provider and HMO in the Philippines. It focuses on long-term healthcare, financial security, and healthcare planning.

MISSION:
Providing long-term and short-term healthcare benefits. Helping individuals build financial security for future medical needs, especially for retirement.

TARGET MARKET:
Corporate accounts, Group plans, Family plans, Individual accounts, Senior care (61+).

PRODUCTS:
1. Short-Term Care: Annual exams, preventive services, immediate coverage, diagnostic services.
2. Long-Term Care: Combines HMO, health savings, and investments. Features include coverage beyond HMO limits, savings with interest, non-utilization return of payment, and life/disability insurance.

PHILOSOPHY:
A second layer of coverage beyond employer HMOs. Plans remain valid even after employment ends. Encourages long-term saving.

IMPORTANT:
- Not related to U.S. Kaiser Permanente.
- Operates in the Philippines.
- Partners with IMG (International Marketing Group).

IMG (INTERNATIONAL MARKETING GROUP):
IMG is a financial services marketing company in the Philippines focused on financial literacy and distribution. It operates on a membership-based model, providing access to financial education and products from partner institutions (like Kaiser). It is NOT a bank or insurance company itself.
`;

export const ARNOLD_KNOWLEDGE = [
  {
    topic: "Kaiser International Healthgroup Overview",
    content: "Kaiser is a Philippine-based HMO and healthcare provider focused on long-term health and financial security. It is SEC-registered and DOH-accredited."
  },
  {
    topic: "Product: Long-Term Healthcare",
    content: "Kaiser's flagship product combining HMO coverage, health savings, and investment. It provides coverage even after retirement and includes a return of payment feature for non-utilization."
  },
  {
    topic: "Product: Short-Term Healthcare",
    content: "Provides immediate medical coverage, annual physical exams, and preventive services via a health card system."
  },
  {
    topic: "HSA (Health Savings Account)",
    content: "HSAs are tax-advantaged savings accounts for people with high-deductible health plans. Contributions are tax-deductible, growth is tax-free, and withdrawals for qualified medical expenses are tax-free."
  },
  {
    topic: "Tax Optimization - Capital Gains",
    content: "Long-term capital gains tax rates apply to assets held for more than a year. Harvesting losses can offset up to $3,000 of ordinary income per year."
  },
  {
    topic: "Geographic Scope",
    content: "Kaiser International Healthgroup operates exclusively in the Philippines and is headquartered in Makati City. It is distinct from the US-based Kaiser Permanente."
  },
  {
    topic: "IMG Overview",
    content: "International Marketing Group (IMG) is a financial distribution and education platform with a mission to 'leave no family behind' by bringing the secrets of the wealthy to all."
  },
  {
    topic: "IMG & Mutual Funds",
    content: "IMG does not sell mutual funds directly. All mutual funds are distributed through its partner, Rampver Financials."
  },
  {
    topic: "IMG Financial 101",
    content: "Promotes building a 'Proper Financial Foundation' which prioritizes Healthcare and Protection before moving to Debt Management and Investments."
  },
  {
    topic: "IMG How It Works",
    content: "Operates on a membership system where associates are independent business owners who earn through personal commissions, team overrides, and renewals."
  },
  {
    topic: "Joining IMG",
    content: "The process involves: 1. Referral by a sponsor, 2. Attending an orientation, 3. Paying a one-time membership fee, and 4. Completing accreditation/licensing (if wanting to sell products)."
  },
  {
    topic: "IMG & Licensing",
    content: "To sell regulated financial products through IMG, associates must pass required licensing exams and comply with Philippine regulatory bodies (SEC, Insurance Commission)."
  },
  {
    topic: "IMG Concepts",
    content: "IMG promotes concepts like BTID (Buy Term, Invest the Difference), wealth building, asset accumulation, and the 'Proper Financial Foundation' strategy."
  },
  {
    topic: "Kaiser 3-in-1 Plan Definition",
    content: "A hybrid financial product combining Healthcare, Life Insurance, and Investment. It is a 20-year program with a 7-year paying period."
  },
  {
    topic: "Kaiser 3-in-1: Healthcare",
    content: "Includes hospitalization, annual physical exams, dental, and medical network access. Covers expenses while building a long-term fund."
  },
  {
    topic: "Kaiser 3-in-1: Life Insurance",
    content: "Provides Term Life, AD&D, and Waiver of Premium for permanent disability to protect beneficiaries."
  },
  {
    topic: "Kaiser 3-in-1: Investment",
    content: "Builds a health fund where unused benefits accumulate with interest and bonuses, reaching maturity at Year 20 for retirement or medical needs."
  },
  {
    topic: "Kaiser 3-in-1 Timeline",
    content: "Years 1-7 (Paying Period): Active coverage. Years 8-20 (Growth Period): No payments, fund grows. Year 20 (Maturity): Payout of accumulated benefits."
  },
  {
    topic: "Direct Registration Link",
    content: "The official direct registration link to start an IMG membership or get a Kaiser quote is: https://img.com.ph/quote/UKHB/?agentcode=193214ph"
  }
];

export function retrieveKnowledge(query: string): string {
  const lowQuery = query.toLowerCase();
  
  // Combine base knowledge with specific facts
  let combinedKnowledge = KAISER_BASE_KNOWLEDGE + "\n\nSPECIFIC FACTS:\n";
  
  const relevantFacts = ARNOLD_KNOWLEDGE.filter(fact => 
    fact.topic.toLowerCase().includes(lowQuery) || 
    fact.content.toLowerCase().includes(lowQuery)
  );

  if (relevantFacts.length > 0) {
    combinedKnowledge += relevantFacts.map(f => `[${f.topic}]: ${f.content}`).join("\n\n");
  } else {
    combinedKnowledge += "No specific facts found for this query, relying on base knowledge.";
  }

  return combinedKnowledge;
}
