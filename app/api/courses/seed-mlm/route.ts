import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface Question {
  text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
}

interface CourseInput {
  title: string
  description: string
  category: string
  subcategory: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  duration_minutes: number
  is_featured: boolean
  thumbnail: string
  questions: Question[]
}

const MLM_COURSES: CourseInput[] = [
  // COMPLIANCE (5)
  {
    title: 'FTC MLM Rule Compliance Essentials',
    description: 'Understand the FTC MLM Rule and Section 5 of the FTC Act. Learn what distinguishes a legal direct sales business from an illegal pyramid scheme, including red flags to avoid.',
    category: 'Compliance', subcategory: 'FTC & Legal', difficulty: 'Beginner', duration_minutes: 30, is_featured: true, thumbnail: '⚖️',
    questions: [
      { text: 'Under the FTC MLM Rule, which characteristic most distinguishes a legal MLM from a pyramid scheme?', option_a: 'Revenue primarily from real product sales to end consumers', option_b: 'Having more than 500 distributors', option_c: 'Offering a money-back guarantee', option_d: 'Operating in multiple countries', correct_answer: 'A' },
      { text: 'Section 5 of the FTC Act prohibits:', option_a: 'Unfair or deceptive acts or practices in commerce', option_b: 'All forms of direct selling', option_c: 'Recruiting more than 10 people per year', option_d: 'Paying commissions on product sales', correct_answer: 'A' },
      { text: 'Which of the following is a red flag that a business may be operating as an illegal pyramid scheme?', option_a: 'Emphasis on recruiting over product sales to real customers', option_b: 'Charging a starter kit fee under $100', option_c: 'Requiring monthly autoship enrollment', option_d: 'Offering tiered commission structures', correct_answer: 'A' },
    ],
  },
  {
    title: 'Income Disclosure & Earnings Claims Training',
    description: 'How to read and present income disclosure statements. Covers all-in expenses, median vs. average earnings, prohibited claim types, and mandatory disclaimers required by FTC guidance.',
    category: 'Compliance', subcategory: 'FTC & Legal', difficulty: 'Beginner', duration_minutes: 25, is_featured: true, thumbnail: '📊',
    questions: [
      { text: 'When sharing income potential with a prospect, FTC guidance requires you to:', option_a: 'Show the income disclosure statement with results typical for most distributors', option_b: 'Only share your personal highest-earning month', option_c: 'Describe the theoretical maximum payout', option_d: 'Focus on top earner stories to motivate', correct_answer: 'A' },
      { text: 'What does the median income figure in an IDS represent?', option_a: 'The midpoint value where half of earners make more and half make less', option_b: 'The average of all distributor incomes', option_c: 'The income of the top 10% of earners', option_d: 'The minimum guaranteed income', correct_answer: 'A' },
      { text: 'Which earnings claim is prohibited under FTC guidance?', option_a: '"You can easily replace your full-time income in 90 days"', option_b: '"Results are not typical; see our income disclosure statement"', option_c: '"Most distributors earn modest supplemental income"', option_d: '"Your actual results will depend on your effort and time invested"', correct_answer: 'A' },
    ],
  },
  {
    title: 'Product Claims & Substantiation',
    description: 'What reps may and may not say about products. Covers health claim rules, testimonial requirements, social media compliance, and FDA/FTC overlap for product marketing.',
    category: 'Compliance', subcategory: 'Product Compliance', difficulty: 'Intermediate', duration_minutes: 20, is_featured: true, thumbnail: '🔬',
    questions: [
      { text: 'Before making a health claim about a product, a distributor must:', option_a: 'Only repeat claims that are substantiated by the company with competent evidence', option_b: 'Obtain personal FDA approval', option_c: 'Collect at least 10 customer testimonials', option_d: 'Have a doctor sign off on the claim', correct_answer: 'A' },
      { text: 'Under FTC testimonial guidelines, when a customer gives a product testimonial, you must:', option_a: 'Disclose whether the result is typical or add a disclaimer', option_b: 'Pay them a referral fee', option_c: 'Get written permission to use their name', option_d: 'Have them sign a waiver of liability', correct_answer: 'A' },
      { text: 'Which statement about a wellness product is compliant?', option_a: '"This product supports general wellness as part of a healthy lifestyle"', option_b: '"This product cures inflammation and prevents cancer"', option_c: '"Doctors recommend this as a treatment for arthritis"', option_d: '"FDA has approved this for weight loss"', correct_answer: 'A' },
    ],
  },
  {
    title: 'Recruiting Compliance & Pre-Enrollment Disclosures',
    description: 'What must be disclosed before recruiting a new distributor. Covers written vs. verbal disclosures, income potential caveats, expense transparency, and documentation requirements.',
    category: 'Compliance', subcategory: 'FTC & Legal', difficulty: 'Beginner', duration_minutes: 30, is_featured: true, thumbnail: '📋',
    questions: [
      { text: 'Before enrolling a new distributor, FTC guidance recommends disclosing:', option_a: 'Realistic income expectations and all required startup costs', option_b: 'Only the upside potential to keep them motivated', option_c: 'The income of the top 1% of earners', option_d: 'Compensation plan details without mentioning expenses', correct_answer: 'A' },
      { text: 'Which expense must be disclosed to a prospective recruit?', option_a: 'Monthly autoship or minimum order requirements needed for commission eligibility', option_b: 'Only the initial enrollment kit cost', option_c: 'The cost of optional training events', option_d: 'Taxes on commissions earned', correct_answer: 'A' },
      { text: 'Why is written documentation of pre-enrollment disclosures important?', option_a: 'It creates a record that compliance requirements were met if investigated', option_b: 'It is required by the IRS for tax purposes', option_c: 'It automatically qualifies the recruit for a fast-start bonus', option_d: 'It replaces the need for a signed distributor agreement', correct_answer: 'A' },
    ],
  },
  {
    title: 'Record Keeping & Audit Trail Management',
    description: 'What to retain: contracts, income statements, receipts, training materials, and disclaimers. Covers retention periods, digital vs. paper records, and how to survive a regulatory audit.',
    category: 'Compliance', subcategory: 'Operations', difficulty: 'Intermediate', duration_minutes: 20, is_featured: true, thumbnail: '🗂️',
    questions: [
      { text: 'How long should a distributor typically retain income-related documents for tax and compliance purposes?', option_a: 'At least 3–7 years, per IRS and FTC best practices', option_b: 'Only the current year', option_c: '6 months after earning the income', option_d: 'Until the distributor agreement expires', correct_answer: 'A' },
      { text: 'Which types of records are most critical to retain for a regulatory audit?', option_a: 'Contracts, income disclosures, product claim records, and training materials', option_b: 'Only financial statements and tax filings', option_c: 'Social media posts and email newsletters', option_d: 'Customer names and phone numbers', correct_answer: 'A' },
      { text: 'Digital records are considered acceptable for audit purposes when they are:', option_a: 'Stored in a secure, retrievable format and backed up regularly', option_b: 'Printed and signed annually', option_c: 'Kept exclusively on a personal device', option_d: 'Shared only with your upline sponsor', correct_answer: 'A' },
    ],
  },

  // PRODUCT KNOWLEDGE (5)
  {
    title: 'Product Mastery Fundamentals',
    description: 'Full product line overview including ingredient education, use cases, pricing tiers, and how each product addresses customer needs. Build the knowledge base for confident demos.',
    category: 'Product Knowledge', subcategory: 'Core Products', difficulty: 'Beginner', duration_minutes: 45, is_featured: false, thumbnail: '🧴',
    questions: [
      { text: 'When learning a new product line, which knowledge area is most important for building customer trust?', option_a: 'Understanding how each product solves a specific customer problem', option_b: 'Memorizing every ingredient by chemical name', option_c: 'Knowing the retail price of every SKU', option_d: 'Tracking the product launch history', correct_answer: 'A' },
      { text: 'How should you handle a product question you cannot answer on the spot?', option_a: 'Acknowledge the question, note it, and follow up with accurate information', option_b: 'Guess based on similar products you know', option_c: 'Tell the customer the product does everything', option_d: 'Redirect the conversation to a different product', correct_answer: 'A' },
      { text: 'When comparing your product to a competitor, you should:', option_a: 'Focus on your product\'s benefits without making unsubstantiated claims about competitors', option_b: 'Always claim your product is superior in every way', option_c: 'Avoid any comparison as it may confuse the customer', option_d: 'Repeat whatever your upline has said about competitors', correct_answer: 'A' },
    ],
  },
  {
    title: 'Demo Script Bootcamp',
    description: 'Master the product demonstration. Opening hooks, feature-to-benefit translation, handling product questions mid-demo, and the closing sequence. Includes downloadable demo scripts.',
    category: 'Product Knowledge', subcategory: 'Sales Demos', difficulty: 'Beginner', duration_minutes: 60, is_featured: false, thumbnail: '🎙️',
    questions: [
      { text: 'The most effective opening hook for a product demo should:', option_a: 'Connect to a pain point or desire the customer has already expressed', option_b: 'Start with the product price to set expectations', option_c: 'Lead with your personal income from selling the product', option_d: 'List all product certifications and awards', correct_answer: 'A' },
      { text: 'Feature-to-benefit translation means:', option_a: 'Explaining what a feature does and why it matters to the specific customer', option_b: 'Converting metric measurements to imperial', option_c: 'Translating product names into different languages', option_d: 'Matching product features to competitor claims', correct_answer: 'A' },
      { text: 'When a customer asks a difficult question mid-demo, the best response is:', option_a: 'Pause, acknowledge the question, answer honestly, then return to the demo flow', option_b: 'Skip it and keep moving to maintain momentum', option_c: 'Tell them to hold all questions until the end', option_d: 'Refer them to the product website for answers', correct_answer: 'A' },
    ],
  },
  {
    title: 'Ingredient & Efficacy Deep Dive',
    description: 'The science behind product formulations. Clinical studies, bioavailability, competitive comparison, and how to explain efficacy without making unsubstantiated claims.',
    category: 'Product Knowledge', subcategory: 'Core Products', difficulty: 'Intermediate', duration_minutes: 40, is_featured: false, thumbnail: '⚗️',
    questions: [
      { text: 'Bioavailability refers to:', option_a: 'How much of a substance is absorbed and available for use by the body', option_b: 'The shelf life of a product after opening', option_c: 'Whether a product is available in stores', option_d: 'The environmental sustainability of ingredients', correct_answer: 'A' },
      { text: 'When discussing clinical studies with customers, you should:', option_a: 'Cite only studies that are peer-reviewed and share results accurately', option_b: 'Summarize studies in the most favorable way possible', option_c: 'Reference all studies found on social media', option_d: 'Avoid mentioning studies to prevent setting expectations', correct_answer: 'A' },
      { text: 'Explaining efficacy without unsubstantiated claims means:', option_a: 'Using language like "supports" and "may help" rather than "cures" or "treats"', option_b: 'Avoiding any discussion of what the product does', option_c: 'Only sharing testimonials from medical professionals', option_d: 'Limiting your explanation to ingredient names only', correct_answer: 'A' },
    ],
  },
  {
    title: 'Advanced Product FAQ & Troubleshooting',
    description: 'Handle the toughest product questions with confidence. Covers common objections, skin type matching, allergy considerations, and when to escalate to support.',
    category: 'Product Knowledge', subcategory: 'Customer Support', difficulty: 'Intermediate', duration_minutes: 30, is_featured: false, thumbnail: '❓',
    questions: [
      { text: 'When a customer reports an adverse reaction to a product, you should first:', option_a: 'Recommend they stop using the product and contact customer support', option_b: 'Suggest they use less product and continue', option_c: 'Reassure them it is normal and wait 30 days', option_d: 'Tell them to consult a neighbor who uses the product', correct_answer: 'A' },
      { text: 'When recommending products for sensitive skin, the safest approach is to:', option_a: 'Ask about known allergies, skin conditions, and current skincare routine before recommending', option_b: 'Recommend the bestselling product for all skin types', option_c: 'Tell customers to try all products and see which works', option_d: 'Skip the recommendation and let them choose themselves', correct_answer: 'A' },
      { text: 'An issue should be escalated to official customer support when:', option_a: 'It involves a health concern, safety issue, or complaint you cannot resolve with your knowledge', option_b: 'A customer asks about ingredients you haven\'t studied yet', option_c: 'A customer wants a discount you cannot authorize', option_d: 'Any time a customer expresses dissatisfaction', correct_answer: 'A' },
    ],
  },
  {
    title: 'Visual Demo Skills (Video Practice)',
    description: 'Record your demo, study top performers, and iterate. Covers camera presence, lighting, pacing, and making product demos work for short-form video and live presentations.',
    category: 'Product Knowledge', subcategory: 'Sales Demos', difficulty: 'Advanced', duration_minutes: 45, is_featured: false, thumbnail: '🎬',
    questions: [
      { text: 'The most important lighting principle for professional-looking video demos is:', option_a: 'Having a key light source in front of your face, not behind you', option_b: 'Using only natural sunlight at midday', option_c: 'Keeping all lights off and using screen glow', option_d: 'Placing the camera lens directly in front of a window', correct_answer: 'A' },
      { text: 'In short-form video demos, the hook must appear:', option_a: 'Within the first 2–3 seconds to prevent scroll-past', option_b: 'After a 10-second introduction', option_c: 'At the midpoint of the video', option_d: 'At the very end as a call to action', correct_answer: 'A' },
      { text: 'Reviewing recordings of your own demos is valuable because:', option_a: 'You can identify specific habits and pacing issues that are invisible while performing', option_b: 'It allows you to share the video immediately on social media', option_c: 'It counts as practice even without recording new material', option_d: 'It replaces the need to study top performers', correct_answer: 'A' },
    ],
  },

  // SALES SKILLS (5)
  {
    title: 'Prospecting Fundamentals',
    description: 'Build a sustainable lead pipeline. Covers warm vs. cold outreach, qualifying conversations, permission-based prospecting, and building a contact database from your existing network.',
    category: 'Sales Skills', subcategory: 'Lead Generation', difficulty: 'Beginner', duration_minutes: 40, is_featured: false, thumbnail: '🎯',
    questions: [
      { text: 'Permission-based prospecting means:', option_a: 'Getting a prospect\'s agreement to have a business conversation before pitching', option_b: 'Obtaining legal permission to market in a territory', option_c: 'Getting your upline\'s approval before contacting someone', option_d: 'Using only social media platforms that allow business posts', correct_answer: 'A' },
      { text: 'When building your initial contact list, which group is typically highest priority?', option_a: 'Warm contacts who already know and trust you', option_b: 'Random social media followers with large audiences', option_c: 'Business professionals you\'ve never interacted with', option_d: 'Leads purchased from a third-party database', correct_answer: 'A' },
      { text: 'A qualifying conversation helps you determine:', option_a: 'Whether a prospect has a problem your product or opportunity can solve', option_b: 'If the prospect has enough money to buy your highest package', option_c: 'How many people the prospect can recruit', option_d: 'Whether the prospect has heard of your company before', correct_answer: 'A' },
    ],
  },
  {
    title: 'Objection Handling Mastery',
    description: 'Master the 12 most common objections: no time, no money, I\'ll think about it, my spouse needs to agree, and more. Response scripts, reframing techniques, and when to let go.',
    category: 'Sales Skills', subcategory: 'Closing', difficulty: 'Intermediate', duration_minutes: 50, is_featured: false, thumbnail: '🛡️',
    questions: [
      { text: 'When a prospect says "I don\'t have time," the best first step is to:', option_a: 'Ask how much time they currently spend on activities they\'d trade for more income', option_b: 'Immediately offer to do all the work for them', option_c: 'Tell them the business only takes 5 minutes a day', option_d: 'Move on to the next prospect', correct_answer: 'A' },
      { text: 'When a prospect says "I need to think about it," you should:', option_a: 'Ask what specific question or concern would help them decide', option_b: 'Give them a week and then follow up once', option_c: 'Assume they are not interested and stop following up', option_d: 'Immediately lower the price to create urgency', correct_answer: 'A' },
      { text: 'Knowing when to let go of a prospect is important because:', option_a: 'Respecting a clear "no" preserves the relationship and your reputation', option_b: 'It means you have failed and should seek new training', option_c: 'All objections can eventually be overcome with enough follow-up', option_d: 'It is required by FTC regulations after three contacts', correct_answer: 'A' },
    ],
  },
  {
    title: 'The 3-Way Call System',
    description: 'How and when to use 3-way calls to validate your business opportunity. Covers sponsor positioning, new rep confidence-building, call structure, and scheduling logistics.',
    category: 'Sales Skills', subcategory: 'Recruiting', difficulty: 'Intermediate', duration_minutes: 35, is_featured: false, thumbnail: '📞',
    questions: [
      { text: 'The primary purpose of a 3-way call with a sponsor is to:', option_a: 'Lend credibility to the business opportunity through a third-party validation', option_b: 'Have the sponsor do all the selling for you', option_c: 'Introduce your prospect to company leadership', option_d: 'Record the call for training purposes', correct_answer: 'A' },
      { text: 'When positioning your sponsor on a 3-way call, you should:', option_a: 'Briefly introduce their relevant success or experience before bringing them in', option_b: 'Let the sponsor introduce themselves without any setup', option_c: 'Apologize for the extra person on the call', option_d: 'Wait until after the call to tell your prospect who they spoke with', correct_answer: 'A' },
      { text: 'A new rep benefits most from 3-way calls because:', option_a: 'It allows them to present opportunities while still building confidence and knowledge', option_b: 'It means they never have to learn how to present on their own', option_c: 'It counts as double activity toward rank advancement', option_d: 'It is required during the first month of enrollment', correct_answer: 'A' },
    ],
  },
  {
    title: 'Follow-Up Cadence & Pipeline Management',
    description: 'Never lose a warm lead again. Multi-touch follow-up strategy, timing between contacts, compliant email/message templates, and when to re-approach someone who said no.',
    category: 'Sales Skills', subcategory: 'Lead Generation', difficulty: 'Intermediate', duration_minutes: 30, is_featured: false, thumbnail: '🔄',
    questions: [
      { text: 'A multi-touch follow-up strategy is effective because:', option_a: 'Most people need multiple points of contact before making a buying decision', option_b: 'More contacts always equal more sales', option_c: 'It keeps your name top of mind without providing any value', option_d: 'It is required for compliance with the direct sales code', correct_answer: 'A' },
      { text: 'When re-approaching someone who previously said no, the best timing is:', option_a: 'After a meaningful change in their circumstances or a significant amount of time has passed', option_b: 'Every week until they say yes', option_c: 'Immediately after the rejection to catch them off guard', option_d: 'Never — a no is always permanent', correct_answer: 'A' },
      { text: 'Compliant messaging templates help because they:', option_a: 'Ensure your outreach avoids income claims and prohibited language', option_b: 'Guarantee higher response rates', option_c: 'Replace the need for personalization', option_d: 'Automatically qualify prospects before you speak with them', correct_answer: 'A' },
    ],
  },
  {
    title: 'Closing & Enrollment Techniques',
    description: 'Assumptive closes, trial closes, and removing final objections. How to enroll with excitement, handle last-minute hesitation, and set the new rep up for early wins.',
    category: 'Sales Skills', subcategory: 'Closing', difficulty: 'Advanced', duration_minutes: 40, is_featured: false, thumbnail: '🤝',
    questions: [
      { text: 'An assumptive close works by:', option_a: 'Proceeding as if the decision is already made, which reduces friction for the prospect', option_b: 'Assuming the prospect will say no and preparing a rebuttal', option_c: 'Skipping the closing step and moving straight to onboarding', option_d: 'Making assumptions about what package the prospect can afford', correct_answer: 'A' },
      { text: 'A trial close is most useful for:', option_a: 'Testing the prospect\'s readiness before attempting a full close', option_b: 'Offering a free trial of the product', option_c: 'Closing a sale on the first contact', option_d: 'Getting a commitment on a smaller item before the main offer', correct_answer: 'A' },
      { text: 'Setting a new rep up for early wins after enrollment is important because:', option_a: 'Early momentum builds confidence and significantly improves long-term retention', option_b: 'Company policy requires a sale within the first week', option_c: 'It guarantees they will reach the highest rank', option_d: 'It unlocks their access to the back office system', correct_answer: 'A' },
    ],
  },

  // RECRUITING (5)
  {
    title: 'The Business Opportunity Presentation',
    description: 'A compliant, compelling business opportunity presentation. Hook, overview, income potential (with required disclaimers), fast-start bonus walk-through, and clear next steps.',
    category: 'Recruiting', subcategory: 'Opportunity Presentation', difficulty: 'Beginner', duration_minutes: 45, is_featured: false, thumbnail: '💼',
    questions: [
      { text: 'Which element must always accompany any income potential figures in a business opportunity presentation?', option_a: 'A disclaimer stating results are not typical and linking to the income disclosure statement', option_b: 'A comparison to traditional employment income', option_c: 'A signed agreement from the presenter', option_d: 'The company\'s annual revenue figures', correct_answer: 'A' },
      { text: 'The hook of a business opportunity presentation should:', option_a: 'Connect to the prospect\'s personal goals or financial situation', option_b: 'Open with company history going back to the founding', option_c: 'Lead with the most complex part of the compensation plan', option_d: 'Start by asking for a financial commitment', correct_answer: 'A' },
      { text: 'Clear next steps at the end of a presentation are important because:', option_a: 'They give an interested prospect a specific action to take rather than leaving them uncertain', option_b: 'They legally obligate the prospect to follow through', option_c: 'They replace the need for a follow-up conversation', option_d: 'They count toward your activity metrics for rank advancement', correct_answer: 'A' },
    ],
  },
  {
    title: '1-on-1 Meeting Framework',
    description: 'The complete 1-on-1 structure: pre-meeting mindset, active listening, need discovery, tailored opportunity presentation, and handling stalls without pressure.',
    category: 'Recruiting', subcategory: 'Opportunity Presentation', difficulty: 'Intermediate', duration_minutes: 35, is_featured: false, thumbnail: '👥',
    questions: [
      { text: 'Need discovery in a 1-on-1 meeting means:', option_a: 'Asking questions to understand what the prospect actually wants before presenting solutions', option_b: 'Identifying whether the prospect has enough money to enroll', option_c: 'Finding out who else in their network might be interested', option_d: 'Determining how many hours they can work each week', correct_answer: 'A' },
      { text: 'Active listening during a 1-on-1 meeting involves:', option_a: 'Giving full attention, reflecting back what you heard, and asking follow-up questions', option_b: 'Preparing your rebuttal while the prospect speaks', option_c: 'Taking detailed notes without making eye contact', option_d: 'Summarizing the prospect\'s points only at the end', correct_answer: 'A' },
      { text: 'When a prospect stalls during a 1-on-1, the pressure-free approach is to:', option_a: 'Ask an open-ended question about what would help them feel confident moving forward', option_b: 'Offer a time-limited discount to create urgency', option_c: 'End the meeting and schedule a follow-up for the next day', option_d: 'Involve your sponsor immediately to rescue the conversation', correct_answer: 'A' },
    ],
  },
  {
    title: 'Team Culture & Downline Development',
    description: 'Build a team that stays. Coaching styles, recognition systems, conflict resolution, retention strategies, and how to create a culture people want to be part of.',
    category: 'Recruiting', subcategory: 'Leadership', difficulty: 'Advanced', duration_minutes: 50, is_featured: false, thumbnail: '🌱',
    questions: [
      { text: 'Which factor most consistently predicts downline retention in MLM organizations?', option_a: 'A sense of belonging, recognition, and regular coaching support', option_b: 'The size of the fast-start bonus offered at enrollment', option_c: 'The number of products available in the catalog', option_d: 'The rank of the person who recruited them', correct_answer: 'A' },
      { text: 'Effective recognition systems in a team culture should:', option_a: 'Celebrate both big milestones and small wins to keep all members engaged', option_b: 'Focus exclusively on top earners to set aspirational standards', option_c: 'Remain private to avoid creating envy among team members', option_d: 'Be reserved for members who hit rank advancement targets', correct_answer: 'A' },
      { text: 'When conflict arises within a team, a leader should first:', option_a: 'Listen to all parties individually before drawing conclusions or taking action', option_b: 'Immediately remove the most recently enrolled member', option_c: 'Announce a team policy change in the group chat', option_d: 'Escalate to company support before speaking with team members', correct_answer: 'A' },
    ],
  },
  {
    title: 'Duplication: Building Trainable Systems',
    description: 'What makes something duplicatable. How to simplify your process so a brand-new rep can copy it immediately. Create simple systems, training materials, and onboarding flows.',
    category: 'Recruiting', subcategory: 'Systems', difficulty: 'Intermediate', duration_minutes: 40, is_featured: false, thumbnail: '🔁',
    questions: [
      { text: 'A process is considered duplicatable when:', option_a: 'A brand-new distributor with no experience can execute it correctly after brief training', option_b: 'It uses advanced sales techniques that require years of practice', option_c: 'It has been used by the top earner in the company', option_d: 'It is described in the company\'s official policy document', correct_answer: 'A' },
      { text: 'The greatest barrier to duplication in most MLM teams is:', option_a: 'Overly complex systems that require too much skill to replicate', option_b: 'Team members who are too enthusiastic', option_c: 'Products that are too high quality to demonstrate easily', option_d: 'Compensation plans that pay too generously', correct_answer: 'A' },
      { text: 'When creating a simple onboarding flow, you should prioritize:', option_a: 'The 3–5 most impactful actions that generate results in the first 30 days', option_b: 'Comprehensive training on every company system before any sales activity', option_c: 'Having new reps shadow you for 90 days before acting independently', option_d: 'Providing access to every training resource simultaneously', correct_answer: 'A' },
    ],
  },
  {
    title: 'Recruiting for Retention',
    description: 'Hire for fit, not desperation. How to qualify recruits, set realistic expectations, onboard with quality, and prevent the dropout spiral that kills teams.',
    category: 'Recruiting', subcategory: 'Systems', difficulty: 'Advanced', duration_minutes: 30, is_featured: false, thumbnail: '🔒',
    questions: [
      { text: 'Recruiting for fit rather than desperation means:', option_a: 'Enrolling people who are genuinely aligned with the products and business model', option_b: 'Only recruiting people who already have sales experience', option_c: 'Avoiding recruiting anyone in financial difficulty', option_d: 'Selecting recruits based on the size of their social network', correct_answer: 'A' },
      { text: 'The dropout spiral typically begins when:', option_a: 'New recruits fail to make money quickly due to unrealistic expectations set at enrollment', option_b: 'A team reaches more than 50 active members', option_c: 'Company raises product prices without warning', option_d: 'A leader promotes to a higher rank and becomes less available', correct_answer: 'A' },
      { text: 'Setting realistic expectations at enrollment primarily benefits:', option_a: 'Both the new rep (who plans appropriately) and the leader (who retains active members longer)', option_b: 'Only the company by reducing refund requests', option_c: 'Only the new rep by preparing them for challenges', option_d: 'The upline by qualifying for a larger recruitment bonus', correct_answer: 'A' },
    ],
  },

  // OPERATIONS (5)
  {
    title: 'Back Office Navigation & Account Setup',
    description: 'Full tour of the back office dashboard. Account settings, payment methods, order history, affiliate links, autoship enrollment, and where to find important reports.',
    category: 'Operations', subcategory: 'Systems', difficulty: 'Beginner', duration_minutes: 30, is_featured: false, thumbnail: '💻',
    questions: [
      { text: 'Your unique affiliate link in the back office is important because:', option_a: 'It tracks sales and enrollments directly to your account for commission credit', option_b: 'It is required to log into the system', option_c: 'It grants access to wholesale pricing for your customers', option_d: 'It must be shared with the company before each order', correct_answer: 'A' },
      { text: 'Where should a distributor look to verify a commission payment was received correctly?', option_a: 'The earnings or commission report section of the back office', option_b: 'Their personal bank statement only', option_c: 'The company\'s public social media announcement page', option_d: 'Their sponsor\'s back office', correct_answer: 'A' },
      { text: 'Setting up two-factor authentication on your back office account is recommended because:', option_a: 'It protects your commission earnings and personal data from unauthorized access', option_b: 'It is required to qualify for rank advancement', option_c: 'It doubles your commission rate', option_d: 'It unlocks exclusive product pricing', correct_answer: 'A' },
    ],
  },
  {
    title: 'Autoship & Subscription Programs',
    description: 'How autoship works, why it matters for commission qualification, how to enroll customers, manage modifications and cancellations, and the cost implications of lapsing.',
    category: 'Operations', subcategory: 'Ordering', difficulty: 'Beginner', duration_minutes: 25, is_featured: false, thumbnail: '📦',
    questions: [
      { text: 'Autoship is important for commission qualification because:', option_a: 'It generates the monthly volume often required to remain active and eligible for commissions', option_b: 'It automatically increases your rank each month', option_c: 'It reduces the retail price of products you purchase', option_d: 'It is mandatory for all distributors regardless of activity', correct_answer: 'A' },
      { text: 'When helping a customer enroll in autoship, you should make sure they understand:', option_a: 'The billing cycle, modification options, and how to cancel if needed', option_b: 'Only the discount they receive vs. retail pricing', option_c: 'That autoship cannot be changed once enrolled', option_d: 'That they will receive a surprise product selection each month', correct_answer: 'A' },
      { text: 'Allowing your autoship to lapse may result in:', option_a: 'Loss of commission eligibility until the minimum volume requirement is met again', option_b: 'Automatic termination of your distributor agreement', option_c: 'A fee charged by the company', option_d: 'Forfeiture of all downline commissions permanently', correct_answer: 'A' },
    ],
  },
  {
    title: 'Ordering, Inventory & Logistics',
    description: 'Wholesale vs. retail ordering, minimum order thresholds, estimated shipping times, inventory best practices, and how to avoid over-ordering (inventory loading).',
    category: 'Operations', subcategory: 'Ordering', difficulty: 'Beginner', duration_minutes: 35, is_featured: false, thumbnail: '🚚',
    questions: [
      { text: 'Inventory loading is a compliance concern because:', option_a: 'Buying more product than you can realistically sell inflates volume numbers and may indicate a pyramid structure', option_b: 'It is prohibited by shipping regulations', option_c: 'It prevents customers from accessing the product', option_d: 'It triggers an audit of your commission payments', correct_answer: 'A' },
      { text: 'Wholesale pricing is available to distributors because:', option_a: 'They take on the responsibility of retail sales and customer relationships', option_b: 'They have completed a mandatory training program', option_c: 'They have a written agreement with each customer', option_d: 'The company subsidizes distributor costs from recruiting fees', correct_answer: 'A' },
      { text: 'Before placing a large inventory order, a distributor should:', option_a: 'Assess existing customer demand and only order what is needed to fulfill confirmed orders', option_b: 'Check if the company is offering a bulk discount that month', option_c: 'Get approval from their upline sponsor', option_d: 'Confirm the order with the company\'s compliance department', correct_answer: 'A' },
    ],
  },
  {
    title: 'Returns, Refunds & Warranty Claims',
    description: 'Navigate returns and refunds professionally. Return windows, condition requirements, the 30-day buyback policy, refund processing timelines, and escalation procedures.',
    category: 'Operations', subcategory: 'Customer Service', difficulty: 'Beginner', duration_minutes: 20, is_featured: false, thumbnail: '↩️',
    questions: [
      { text: 'The FTC requires MLM companies to have a buyback policy because:', option_a: 'It protects distributors who exit the business from being stuck with unsold inventory', option_b: 'It is required for tax purposes', option_c: 'It allows the company to recycle returned products', option_d: 'It is required by state corporation laws', correct_answer: 'A' },
      { text: 'When processing a customer return, you should:', option_a: 'Follow the company\'s official return policy and document the transaction', option_b: 'Issue a personal refund from your own account to avoid company involvement', option_c: 'Require the customer to ship the product at their own expense regardless of reason', option_d: 'Offer an exchange before mentioning a refund is possible', correct_answer: 'A' },
      { text: 'Return processing timelines matter because:', option_a: 'Customers who receive timely refunds are more likely to try the product again or return as customers', option_b: 'Slow refunds count against your distributor performance metrics', option_c: 'The company charges a fee for returns processed after 48 hours', option_d: 'Timely returns improve your rank advancement score', correct_answer: 'A' },
    ],
  },
  {
    title: 'Reading Your Compensation Statement',
    description: 'Decode your monthly earnings statement. Commission tiers, bonus line items, volume calculations, tax withholding, 1099 preparation, and why your statement may differ from projections.',
    category: 'Operations', subcategory: 'Compensation', difficulty: 'Intermediate', duration_minutes: 30, is_featured: false, thumbnail: '💰',
    questions: [
      { text: 'Distributors receive a 1099 form when they earn over $600 in a year because:', option_a: 'They are considered independent contractors, responsible for their own taxes', option_b: 'The company withholds taxes and must report the amount withheld', option_c: 'It is required by the company\'s refund policy', option_d: 'It qualifies them for a tax credit from the IRS', correct_answer: 'A' },
      { text: 'If your actual commission statement differs from your projected earnings, you should first:', option_a: 'Compare your actual volume and active downline count against the compensation plan requirements', option_b: 'Contact the company immediately and demand an audit', option_c: 'Assume a system error and ignore the discrepancy', option_d: 'Ask your upline to explain without reviewing your own records', correct_answer: 'A' },
      { text: 'Volume calculations on a compensation statement typically include:', option_a: 'Personal volume (PV) and organizational volume (OV or GV) from your team', option_b: 'Only your personal product purchases', option_c: 'The number of new recruits enrolled that month', option_d: 'Your total social media follower count', correct_answer: 'A' },
    ],
  },

  // SOCIAL MEDIA (5)
  {
    title: 'Compliant Social Media Strategy',
    description: 'Platform rules + FTC disclosure requirements. Avoiding unsubstantiated claims, proper hashtag use (#ad, #partner), tone guidelines, and how to grow without violating platform policies.',
    category: 'Social Media', subcategory: 'Strategy', difficulty: 'Beginner', duration_minutes: 40, is_featured: false, thumbnail: '📱',
    questions: [
      { text: 'FTC disclosure for sponsored or affiliate content requires that:', option_a: 'The material connection to the brand is clearly disclosed in a way that is hard to miss', option_b: 'You use the hashtag #ad only in the last position of a caption', option_c: 'Disclosure is only necessary for posts that mention price', option_d: 'Disclosure is optional if you genuinely like the product', correct_answer: 'A' },
      { text: 'Proper hashtag disclosure means:', option_a: 'Using #ad or #sponsored prominently where viewers will see it before engaging', option_b: 'Adding #ad after 20 other hashtags where it is unlikely to be read', option_c: 'Using only the brand\'s official hashtag', option_d: 'Disclosing in a pinned comment rather than the post itself', correct_answer: 'A' },
      { text: 'Which type of social media post is most likely to violate platform terms of service?', option_a: 'A post making income claims without disclosures and encouraging others to "message me"', option_b: 'A before-and-after product photo with a compliant disclaimer', option_c: 'A story poll asking followers what products interest them', option_d: 'A pinned post linking to an income disclosure statement', correct_answer: 'A' },
    ],
  },
  {
    title: 'Instagram Story Selling & Reels',
    description: 'Hook-driven storytelling for Instagram. Behind-the-scenes content, product features, story polls and questions, Reel structure for maximum reach, and compliant call-to-action placement.',
    category: 'Social Media', subcategory: 'Content Creation', difficulty: 'Intermediate', duration_minutes: 35, is_featured: false, thumbnail: '📸',
    questions: [
      { text: 'Story polls and question stickers are valuable for selling because:', option_a: 'They create engagement and reveal what your audience actually wants to learn more about', option_b: 'They automatically increase your follower count', option_c: 'They are exempt from FTC disclosure requirements', option_d: 'They allow you to directly charge for product recommendations', correct_answer: 'A' },
      { text: 'A high-performing Instagram Reel for product promotion typically:', option_a: 'Hooks viewers in the first 2 seconds, delivers value, and ends with a clear CTA', option_b: 'Shows the full 60-second product catalog', option_c: 'Features only text graphics without video footage', option_d: 'Begins with a 10-second logo animation', correct_answer: 'A' },
      { text: 'Behind-the-scenes content is effective for MLM businesses because:', option_a: 'It builds authentic connection and trust by showing the real person and process', option_b: 'It is automatically featured in Instagram\'s Explore section', option_c: 'It counts double toward your activity metrics', option_d: 'It eliminates the need for product demos', correct_answer: 'A' },
    ],
  },
  {
    title: 'Facebook Group Community Building',
    description: 'Build a community people actually want to join. Group setup, community guidelines, engagement cadence, resource pinning, moderator best practices, and how to run live events.',
    category: 'Social Media', subcategory: 'Community', difficulty: 'Intermediate', duration_minutes: 35, is_featured: false, thumbnail: '👥',
    questions: [
      { text: 'Clear community guidelines in a Facebook group are important because:', option_a: 'They set expectations and reduce spam, conflict, and off-topic posting that erodes engagement', option_b: 'Facebook requires them for all business-related groups', option_c: 'They allow you to charge membership fees', option_d: 'They exempt your group from platform advertising policies', correct_answer: 'A' },
      { text: 'An effective engagement cadence for a community group means:', option_a: 'Posting valuable content consistently on a predictable schedule members can anticipate', option_b: 'Posting as many times per day as possible to stay visible', option_c: 'Only posting when you have a product promotion to share', option_d: 'Letting members drive all content without admin input', correct_answer: 'A' },
      { text: 'Facebook Live events in a community group are valuable because:', option_a: 'They increase reach, create urgency, and allow real-time interaction with your audience', option_b: 'They are promoted by Facebook to all users automatically', option_c: 'They eliminate the need for follow-up after the event', option_d: 'Live video is exempt from FTC content requirements', correct_answer: 'A' },
    ],
  },
  {
    title: 'TikTok & Short-Form Video Under 60 Seconds',
    description: 'Master TikTok for your business. How to hook viewers in the first 2 seconds, trending sounds/challenges, compliance notes for short-form, and building a consistent brand presence.',
    category: 'Social Media', subcategory: 'Content Creation', difficulty: 'Intermediate', duration_minutes: 30, is_featured: false, thumbnail: '🎵',
    questions: [
      { text: 'Trending sounds on TikTok are useful for business content because:', option_a: 'The algorithm favors content using trending audio, increasing organic reach', option_b: 'They are copyright-free and can be used in all marketing materials', option_c: 'They eliminate the need for spoken narration', option_d: 'Using them guarantees a viral video', correct_answer: 'A' },
      { text: 'Which TikTok compliance concern is most important for MLM distributors?', option_a: 'Income claims in video captions or spoken narration that are not accompanied by required disclosures', option_b: 'Video length exceeding 60 seconds for any business content', option_c: 'Using hashtags that include the company name', option_d: 'Posting more than once per day', correct_answer: 'A' },
      { text: 'Building a consistent brand presence on TikTok means:', option_a: 'Using a recognizable visual style, tone, and content theme across your videos', option_b: 'Only posting content that directly promotes products for sale', option_c: 'Matching your competitors\' content exactly to stay relevant', option_d: 'Deleting old videos to keep only your most popular content', correct_answer: 'A' },
    ],
  },
  {
    title: 'LinkedIn Professional Positioning',
    description: 'Build authority on LinkedIn. Personal brand positioning, thought leadership content, growing your professional network, and prospecting on LinkedIn without being spammy.',
    category: 'Social Media', subcategory: 'Personal Brand', difficulty: 'Advanced', duration_minutes: 30, is_featured: false, thumbnail: '💼',
    questions: [
      { text: 'Thought leadership content on LinkedIn is effective because:', option_a: 'It builds credibility and attracts inbound interest without direct pitching', option_b: 'LinkedIn automatically promotes it to your competitors', option_c: 'It is exempt from FTC sponsored content requirements', option_d: 'It replaces the need for any sales conversations', correct_answer: 'A' },
      { text: 'Non-spammy prospecting on LinkedIn involves:', option_a: 'Building a relationship through engagement before introducing a business context', option_b: 'Sending the same message template to 500 new connections per week', option_c: 'Pitching your opportunity in your connection request message', option_d: 'Only connecting with people who follow your posts first', correct_answer: 'A' },
      { text: 'Your LinkedIn headline should primarily:', option_a: 'Describe the specific value you provide or problem you solve for your target audience', option_b: 'List your current rank in the MLM compensation plan', option_c: 'Include your company name and product line', option_d: 'Match your resume objective from when you sought traditional employment', correct_answer: 'A' },
    ],
  },

  // LEADERSHIP (5)
  {
    title: 'Leadership Fundamentals for Emerging Leaders',
    description: 'Transition from rep to leader. Coaching vs. directing, giving feedback that motivates, conflict resolution, time management as a team builder, and your first 30 days as a new leader.',
    category: 'Leadership', subcategory: 'Coaching', difficulty: 'Intermediate', duration_minutes: 50, is_featured: false, thumbnail: '⭐',
    questions: [
      { text: 'The primary difference between coaching and directing a team member is:', option_a: 'Coaching draws out the member\'s own solutions; directing tells them what to do', option_b: 'Coaching is only for new reps; directing is for experienced members', option_c: 'Directing creates better results in all situations', option_d: 'Coaching requires a formal certification', correct_answer: 'A' },
      { text: 'Feedback that motivates team members typically:', option_a: 'Acknowledges specific strengths before addressing areas for growth', option_b: 'Focuses exclusively on what needs to improve', option_c: 'Is delivered only in group settings to maximize reach', option_d: 'Is withheld until the monthly team call', correct_answer: 'A' },
      { text: 'In your first 30 days as a new leader, the highest-value activity is:', option_a: 'Connecting individually with each team member to understand their goals and challenges', option_b: 'Hosting as many group events as possible', option_c: 'Immediately restructuring all team systems', option_d: 'Focusing entirely on your own rank advancement goals', correct_answer: 'A' },
    ],
  },
  {
    title: 'Understanding Rank Advancement',
    description: 'Rank structure, volume requirements for each level, timeline strategies, and the bonuses waiting at each rank. Includes a rank advancement calculator walkthrough.',
    category: 'Leadership', subcategory: 'Compensation', difficulty: 'Beginner', duration_minutes: 40, is_featured: false, thumbnail: '🏆',
    questions: [
      { text: 'Most rank advancement requirements are based on:', option_a: 'A combination of personal volume and organizational or group volume thresholds', option_b: 'The number of social media followers you have', option_c: 'How long you have been a distributor', option_d: 'The total number of recruits you have enrolled', correct_answer: 'A' },
      { text: 'The fastest way to advance in rank is typically to:', option_a: 'Help your downline qualify for their next rank simultaneously', option_b: 'Purchase the maximum personal volume each month', option_c: 'Recruit as many people as possible without focusing on their development', option_d: 'Wait until month-end and evaluate whether to push for qualification', correct_answer: 'A' },
      { text: 'Rank advancement bonuses are valuable because:', option_a: 'They reward the organizational growth milestone and provide income during the build phase', option_b: 'They replace your monthly commission check', option_c: 'They are paid every month after hitting a rank once', option_d: 'They increase your product discount permanently', correct_answer: 'A' },
    ],
  },
  {
    title: 'Fast-Start Bonus Strategies',
    description: 'Maximize your first 30–90 days. How to structure your launch, identify target recruits, build initial volume, and qualify for fast-start bonuses before the window closes.',
    category: 'Leadership', subcategory: 'Compensation', difficulty: 'Intermediate', duration_minutes: 30, is_featured: false, thumbnail: '🚀',
    questions: [
      { text: 'Fast-start bonuses typically have time-limited windows because:', option_a: 'They are designed to incentivize rapid activity and early business building habits', option_b: 'The company wants to limit payout amounts', option_c: 'They are paid from a fixed pool that runs out', option_d: 'They are only available to the first distributor who claims them', correct_answer: 'A' },
      { text: 'To maximize fast-start bonuses, a new distributor should prioritize:', option_a: 'Identifying their warmest prospects and scheduling presentations immediately', option_b: 'Completing every training course before making any contacts', option_c: 'Waiting until they feel fully confident to avoid early mistakes', option_d: 'Buying personal inventory to meet the fast-start volume threshold', correct_answer: 'A' },
      { text: 'The fast-start period is also important for retention because:', option_a: 'Early wins build confidence and social proof that motivates continued activity', option_b: 'The company monitors new distributors more closely during this period', option_c: 'Distributor agreements are more flexible during the first 90 days', option_d: 'Commission rates are higher for all sales in the first month', correct_answer: 'A' },
    ],
  },
  {
    title: 'Compensation Plan Maximization',
    description: 'How earnings compound at higher ranks. Leverage math, residual income modeling at different volume levels, tax planning basics for 1099 income, and realistic milestone timelines.',
    category: 'Leadership', subcategory: 'Compensation', difficulty: 'Advanced', duration_minutes: 45, is_featured: false, thumbnail: '📈',
    questions: [
      { text: 'Residual income in the MLM context refers to:', option_a: 'Commissions earned on recurring purchases by your downline and customers without additional effort', option_b: 'Income that arrives after all expenses are deducted', option_c: 'A guaranteed monthly payment from the company', option_d: 'Income from retail customers only, not the downline', correct_answer: 'A' },
      { text: 'Leverage math in a compensation plan means:', option_a: 'Commissions on a larger organization can far exceed what personal sales alone would generate', option_b: 'You borrow against future earnings to fund your business', option_c: 'Paying team members more results in lower personal income', option_d: 'Volume from a few large customers counts more than many small ones', correct_answer: 'A' },
      { text: 'For 1099 income earners, a key tax planning strategy is:', option_a: 'Setting aside a portion of each commission payment for quarterly estimated taxes', option_b: 'Waiting until April to determine the total owed', option_c: 'Deducting all personal purchases as business expenses', option_d: 'Filing as a W-2 employee if commissions exceed $10,000', correct_answer: 'A' },
    ],
  },
  {
    title: 'Building a 6-Figure Organization',
    description: 'Real case studies from leaders who built sustainable 6-figure businesses. Scaling bottlenecks, org structure at 50+ people, delegation frameworks, and retention at scale.',
    category: 'Leadership', subcategory: 'Scaling', difficulty: 'Advanced', duration_minutes: 60, is_featured: false, thumbnail: '🏢',
    questions: [
      { text: 'The most common scaling bottleneck in MLM organizations above 50 people is:', option_a: 'The leader becoming a single point of failure who handles too many tasks personally', option_b: 'Running out of available prospects in the local market', option_c: 'The compensation plan not paying enough at higher ranks', option_d: 'Too many products in the line for the team to learn', correct_answer: 'A' },
      { text: 'An effective delegation framework at scale requires:', option_a: 'Identifying and developing mid-level leaders who can manage segments of the organization', option_b: 'Assigning all administrative tasks to the newest team members', option_c: 'Keeping all key decisions centralized with the top leader', option_d: 'Hiring paid assistants using commission income', correct_answer: 'A' },
      { text: 'Retention at scale is best maintained by:', option_a: 'Systems that keep members engaged, recognized, and progressing regardless of the leader\'s direct involvement', option_b: 'Personally coaching every member of a 200-person organization', option_c: 'Offering significant product discounts to members who consider leaving', option_d: 'Hosting annual in-person events as the sole retention strategy', correct_answer: 'A' },
    ],
  },

  // QUICK SKILLS (5)
  {
    title: '\'No Time\' Objection — Script Library',
    description: 'Five scripted responses to the #1 objection. When to use each, how to transition to a follow-up, and how to plant seeds without pressure for future conversations.',
    category: 'Quick Skills', subcategory: 'Objection Handling', difficulty: 'Beginner', duration_minutes: 10, is_featured: false, thumbnail: '⏱️',
    questions: [
      { text: 'When a prospect says they don\'t have time, the most productive first response is to:', option_a: 'Acknowledge the constraint and ask what a realistic time commitment would look like for them', option_b: 'Tell them the business takes less than an hour a week', option_c: 'End the conversation and never follow up', option_d: 'Offer to handle all the work while they collect income', correct_answer: 'A' },
      { text: 'Planting a seed without pressure means:', option_a: 'Leaving the door open for a future conversation without demanding an immediate answer', option_b: 'Sending daily reminders until they respond', option_c: 'Asking them to decide within 24 hours', option_d: 'Having your sponsor call them directly', correct_answer: 'A' },
      { text: 'The transition from a "no time" response to a follow-up appointment works best when:', option_a: 'You ask for a specific future date that works for them rather than leaving it open-ended', option_b: 'You schedule the follow-up for the same day', option_c: 'You let them reach out to you when they are ready', option_d: 'You invite them to a group presentation instead', correct_answer: 'A' },
    ],
  },
  {
    title: 'Handling \'It\'s a Pyramid Scheme\'',
    description: 'The response framework for the biggest objection in MLM. How to differentiate, educate without defending, pivot to a product conversation, and when to walk away.',
    category: 'Quick Skills', subcategory: 'Objection Handling', difficulty: 'Beginner', duration_minutes: 12, is_featured: false, thumbnail: '🔺',
    questions: [
      { text: 'When someone says "it\'s a pyramid scheme," the most effective first response is to:', option_a: 'Validate their concern, ask what specifically worries them, and address the actual issue', option_b: 'Immediately present a detailed legal argument defending MLM', option_c: 'Tell them they are wrong and don\'t understand business', option_d: 'End the conversation to avoid conflict', correct_answer: 'A' },
      { text: 'A legal direct sales company is distinguished from a pyramid scheme by:', option_a: 'Generating the majority of revenue from real product sales to end consumers', option_b: 'Being listed on the stock market', option_c: 'Having celebrity endorsements', option_d: 'Operating for more than 10 years', correct_answer: 'A' },
      { text: 'When to walk away from the pyramid scheme objection:', option_a: 'When the person has demonstrated they are not genuinely interested and is seeking to argue rather than learn', option_b: 'After your first response if they do not immediately agree', option_c: 'Only after presenting all seven differentiation points', option_d: 'Never — always persist until they change their mind', correct_answer: 'A' },
    ],
  },
  {
    title: 'Email Outreach Sequences (Pre-Compliant)',
    description: 'Five ready-to-use email sequences: cold outreach, warm reconnect, follow-up, product introduction, and business opportunity. Each includes subject lines and FTC-compliant disclaimers.',
    category: 'Quick Skills', subcategory: 'Prospecting', difficulty: 'Beginner', duration_minutes: 20, is_featured: false, thumbnail: '✉️',
    questions: [
      { text: 'A warm reconnect email sequence works better than cold outreach because:', option_a: 'The recipient already has a relationship with you and is more likely to open and respond', option_b: 'It is less likely to be marked as spam by email filters', option_c: 'Warm contacts are required to respond within 48 hours', option_d: 'It does not require FTC-compliant disclaimers', correct_answer: 'A' },
      { text: 'FTC-compliant disclaimers in email outreach about income should:', option_a: 'Be clearly visible and reference the income disclosure statement', option_b: 'Be placed in the smallest font at the bottom of the email', option_c: 'Only be included if the prospect asks about earnings', option_d: 'Be omitted if the email is sent to someone you know personally', correct_answer: 'A' },
      { text: 'An effective subject line for a business opportunity email should:', option_a: 'Spark curiosity or address a pain point without making income claims', option_b: 'Clearly state the company name and income potential in the subject', option_c: 'Use all capital letters to stand out in the inbox', option_d: 'Include the words "free" and "unlimited income" to increase open rates', correct_answer: 'A' },
    ],
  },
  {
    title: 'Personal Brand Positioning Workshop',
    description: 'Your story arc, authentic positioning, visual consistency across platforms, and the credibility signals that make prospects trust you before you\'ve said a word.',
    category: 'Quick Skills', subcategory: 'Personal Brand', difficulty: 'Intermediate', duration_minutes: 25, is_featured: false, thumbnail: '🎨',
    questions: [
      { text: 'Authentic personal brand positioning is most effective when it:', option_a: 'Reflects your genuine story, values, and the specific transformation you help others achieve', option_b: 'Mimics the personal brand of your highest-earning upline', option_c: 'Focuses entirely on your product line and company affiliation', option_d: 'Changes to match current social media trends', correct_answer: 'A' },
      { text: 'Visual consistency across platforms is important because:', option_a: 'It creates immediate recognition and builds a cohesive professional impression', option_b: 'Social media algorithms reward accounts that use the same profile photo everywhere', option_c: 'It allows you to automate posting across all platforms simultaneously', option_d: 'Platform terms of service require brand consistency for business accounts', correct_answer: 'A' },
      { text: 'A credibility signal that builds trust before a conversation begins includes:', option_a: 'Client testimonials, consistent content history, and demonstrated expertise in your niche', option_b: 'A large follower count regardless of engagement level', option_c: 'A professionally designed logo with the company colors', option_d: 'Mentioning your rank in all profile bios', correct_answer: 'A' },
    ],
  },
  {
    title: 'First Week New Distributor Onboarding',
    description: 'Everything a brand-new distributor does in week 1. System setup, first product order, first 3 contacts, connecting with sponsor, setting 30-day goals, and avoiding the most common first-week mistakes.',
    category: 'Quick Skills', subcategory: 'Onboarding', difficulty: 'Beginner', duration_minutes: 30, is_featured: false, thumbnail: '🎉',
    questions: [
      { text: 'The most important action for a new distributor in their first 48 hours is:', option_a: 'Completing account setup and making a list of 20–30 warm contacts to reach out to', option_b: 'Purchasing the maximum inventory to have products on hand', option_c: 'Attending every available training call before talking to anyone', option_d: 'Setting up a professional website to establish online presence', correct_answer: 'A' },
      { text: 'Connecting with your sponsor during week 1 is important because:', option_a: 'They provide guidance, answer questions, and help you avoid common early mistakes', option_b: 'The company requires sponsor approval before making your first sale', option_c: 'They must submit your first order on your behalf', option_d: 'Sponsor contact during week 1 triggers a bonus payment', correct_answer: 'A' },
      { text: 'The most common first-week mistake new distributors make is:', option_a: 'Waiting until they feel "ready" and missing their fast-start bonus window', option_b: 'Contacting too many people too quickly', option_c: 'Setting 30-day goals that are too ambitious', option_d: 'Ordering more products than they need for personal use', correct_answer: 'A' },
    ],
  },
]

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Check if catalog courses already exist
    const { count } = await supabaseAdmin
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('catalog_visible', true)

    if (count && count > 0) {
      return NextResponse.json({ error: 'Catalog courses already exist', count }, { status: 409 })
    }

    let inserted = 0
    for (const course of MLM_COURSES) {
      const { data: newCourse, error: courseErr } = await supabaseAdmin
        .from('courses')
        .insert({
          title: course.title,
          description: course.description,
          category: course.category,
          subcategory: course.subcategory,
          difficulty: course.difficulty,
          duration_minutes: course.duration_minutes,
          is_featured: course.is_featured,
          thumbnail: course.thumbnail,
          catalog_visible: true,
          is_active: true,
          tags: [course.category],
        })
        .select('id')
        .single()

      if (courseErr) throw new Error(`Course insert failed: ${courseErr.message}`)

      const { error: qErr } = await supabaseAdmin
        .from('questions')
        .insert(course.questions.map(q => ({ ...q, course_id: newCourse.id })))

      if (qErr) throw new Error(`Questions insert failed for "${course.title}": ${qErr.message}`)

      inserted++
    }

    return NextResponse.json({ ok: true, count: inserted })
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
