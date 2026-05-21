# HSKKit P1 Initial Legal Compliance Report v3.6
**Version:** Final Decision Version

**Product:** HSKKit — AI-powered HSK Chinese learning platform
**Domain:** hskkit.com
**Operator:** Individual operator / personal business entity [待确认]
**Jurisdiction:** [Operator's jurisdiction — 待确认]
**Target Market:** Global English-speaking Chinese learners (including EU/UK/California users)
**Review Date:** 2026-05-20
**Risk Level:** Medium — Go after fixes
**Hard Launch Condition:** (1) PayPal capability verified; (2) Legal pages published; (3) Checkout disclosure implemented; (4) Subscription state sync confirmed; (5) AI credits enforcement operational; (6) 小帅 submits all Evidence Checklist items (screenshots + test records) for review.
**Status:** Final Decision Version — approved as P1 Initial compliance baseline. Not formal legal advice.

---

## 1. Executive Summary

### 1.1 Risk Level & Verdict

- **Risk Level:** Medium
- **Verdict:** Go after fixes
- **Hard Launch Blockers:** PayPal subscription/webhook/refund capability unverified; Terms/Privacy/Refund/Fair Use pages not published; checkout auto-renewal disclosure not implemented; support@hskkit.com not confirmed operational; backend downgrade/restore Pro not confirmed.

### 1.2 Top 5 Mandatory Items Before Hard Launch

1. Verify PayPal personal account supports subscription creation, recurring billing, webhooks, cancellation, and refunds. If not, upgrade to PayPal Business before launch.
2. Publish Terms of Service, Privacy Policy, Refund Policy, and Fair Use Policy; link in footer sitewide.
3. Implement checkout auto-renewal disclosure: amount, period, auto-renewal, cancellation method, tax note.
4. Confirm support@hskkit.com receives and can respond to cancellation/refund/privacy requests.
5. Confirm backend correctly handles: payment success → Pro upgrade; cancellation → access retained to period end; failed renewal → 3-day grace period → downgrade to Free.

### 1.3 Scope Confirmation — P1 Initial Only

**P1 Initial (live):**
- Pro Monthly: $5.99/month — auto-renewing subscription
- Pro Yearly: $49/year — auto-renewing subscription
- Both include 500 AI credits/month, reset monthly, non-rollover, no cash value

**Free Tier Limits (P1 Initial):**
- Worksheet: 1 per day
- Reading: 2–5 articles
- Flashcards: first 30 words

**Postponed (not in P1 Initial; do not present as purchasable):**
- Lifetime plan ($129 one-time)
- Beta Lifetime ($49–$59, first 100 users)
- Teacher Pack ($19/month or $149/year)
- Standalone credits packs

---

## 2. Data Flow Diagram (Text)

```
User Device
  ├─ Frontend (hskkit.com)
  │   ├─ Auth: Clerk [待确认]
  │   ├─ User input: essays, quiz answers, study plan requests
  │   ├─ Learning data: progress, mistakes, flashcard history
  │   └─ Credits usage: AI explanation, study plan, quiz generation
  │
  ├─ Backend / API
  │   ├─ Database: Supabase [待确认] — user accounts, progress, credits, subscriptions
  │   ├─ AI API: OpenAI [待确认] — prompt + context → generated output
  │   ├─ Payment: PayPal — subscription creation, billing, webhooks
  │   ├─ Email: Resend [待确认] — transactional emails (payment, cancellation, support)
  │   └─ Error/Access Logs: [待确认]
  │
  ├─ CDN / Security: Cloudflare — DNS, CDN, DDoS, Email Routing
  │
  ├─ Analytics: Plausible [待确认] — page views, events (cookieless)
  │   └─ If GA4/Clarity/ad pixels added later: Cookie Policy + Banner required for EU/UK
  │
  └─ Third-party data retention per their own policies
```

---

## 3. Third-Party Services Disclosure

| Service | Purpose | Data Touched | Disclosure Required | Status |
|---|---|---|---|---|
| PayPal | Payment, subscription, refund, dispute | Billing metadata, transaction status, user PayPal info (processed by PayPal) | Must disclose in Privacy + Terms | Personal account API capability [待确认] |
| OpenAI [待确认] | AI explanation, study plan, quiz generation | User input text, learning context, generated output | Must disclose in Privacy + Terms | API data usage policy to be reviewed |
| Cloudflare | DNS, CDN, security, Email Routing | IP, access logs, email routing metadata | Must disclose in Privacy | Actual modules used [待确认] |
| Clerk [待确认] | Authentication, user management | Email, profile data, session data | Must disclose in Privacy | Provider confirmed? [待确认] |
| Supabase [待确认] | Database, user data storage | All user data (accounts, progress, credits, subscriptions) | Must disclose in Privacy | Provider confirmed? [待确认] |
| Resend [待确认] | Transactional email | Email addresses, email content, send logs | Must disclose in Privacy | Provider confirmed? [待确认] |
| Plausible [待确认] | Analytics (cookieless) | Page views, referrer, device type (aggregated, cookieless, designed not to identify individual visitors) | Disclose in Privacy; no banner if cookieless | Confirmed as primary analytics? [待确认] |
| Error Logging [待确认] | Error tracking, debugging | Error traces, stack traces, user context | Disclose in Privacy | Provider (Sentry/Logflare/etc.) [待确认] |

---

## 4. Data Processing Table

| Data Type | Purpose | Lawful Basis | Third Parties | Storage Location | Retention Period | User Deletion / Rights | Notes |
|---|---|---|---|---|---|---|---|
| Email address | Registration, login, service notices, password reset | Contract / Legitimate Interests | Clerk [待确认], Resend [待确认] | Supabase [待确认] | Account lifetime; post-deletion [待确认] | Request via support@hskkit.com | |
| IP address | Rate limiting, abuse prevention, security logs | Legitimate Interests | Cloudflare, backend logs | Cloudflare + backend logs [待确认] | 30–90 days [待确认] | Usually not individually deletable; contact support | |
| User prompts / input text | AI explanation, study plan, quiz generation | Contract | OpenAI [待确认] | Supabase [待确认] | [待确认] | Request deletion via support@hskkit.com | Essay text, quiz answers, study plan requests |
| Generated AI outputs | Deliver results, learning history | Contract | OpenAI [待确认] | Supabase [待确认] | [待确认] | Request deletion via support@hskkit.com | AI explanations, study plans, quizzes |
| Learning progress / mistakes | Track proficiency, personalize study | Contract | None (internal) | Supabase [待确认] | [待确认] | Request deletion via support@hskkit.com | Flashcard progress, quiz scores, mistake log |
| Credits usage records | Billing transparency, abuse prevention, fair use | Contract / Legitimate Interests | None (internal) | Supabase [待确认] | [待确认] | Request via support@hskkit.com | Per-feature consumption log |
| Payment metadata | Orders, subscriptions, refunds, tax records | Contract / Legal Obligation | PayPal | PayPal + site DB [待确认] | As required by tax/accounting law [待确认] | Deletion limited by legal obligations | Order ID, plan type, status, amount, dates |
| PayPal billing metadata | Subscription lifecycle, webhook events | Contract / Legal Obligation | PayPal | PayPal (primary) + site DB [待确认] | Per PayPal policy + tax law [待确认] | Managed via PayPal; site mirrors [待确认] | Subscription ID, billing agreement, event logs |
| Analytics data | Measure usage, improve product | Consent / Legitimate Interests | Plausible [待确认] | Plausible (cloud) | Per Plausible policy [待确认] | Opt-out via browser DNT or contact support | Cookieless; privacy-friendly analytics designed not to identify individual visitors |
| Support messages | Customer support, dispute handling | Contract / Legitimate Interests | Resend [待确认], email inbox | Email/helpdesk system [待确认] | [待确认] | Request deletion subject to legal needs | Cancellation, refund, privacy requests |
| Access / error logs | Security, debugging, abuse detection | Legitimate Interests | Error logging provider [待确认] | Provider + backend [待确认] | 30–90 days [待确认] | Usually aggregate only; contact support | |

---

## 5. Required Legal Pages

| Page | Required | Status | Notes |
|---|---|---|---|
| Privacy Policy | Yes | Draft below (Section 10) | Must publish before launch |
| Terms of Service | Yes | Draft below (Section 11) | Must publish before launch |
| Refund Policy | Yes | Draft below (Section 12) | Must publish before launch |
| Fair Use Policy | Yes | Draft below (Section 13) | Must publish before launch |
| Cookie Policy | Conditional | Draft below (Section 14) | Required if GA4/Clarity/ad pixels used for EU/UK; lightweight if Plausible-only |
| Disclaimer | Yes | Draft below (Section 15) | HSK non-affiliation + AI accuracy disclaimer |
| DMCA Policy | No (P1) | N/A | Only if UGC/public content hosting added later |

---

## 6. Payment / Subscription / Credits Compliance

### 6.1 P1 Initial Plans

- **Pro Monthly:** $5.99/month, auto-renewing
- **Pro Yearly:** $49/year, auto-renewing
- **Currency:** USD
- **Payment Processor:** PayPal
- **Tax/VAT:** Prices are quoted in USD and may not include applicable taxes or VAT. Any applicable taxes, VAT, or similar charges will be calculated and displayed during checkout where supported by PayPal. If PayPal does not support tax/VAT display for your jurisdiction, tax treatment will be confirmed separately [待确认].

### 6.2 AI Credits Rules

- Pro Monthly / Yearly: **500 credits/month**
- Credits **reset monthly** (on billing date) and **do not roll over**
- Credits have **no cash value**, cannot be exchanged, transferred, or redeemed for money
- Credits are subject to Fair Use, rate limits, abuse prevention, and technical safeguards
- Standalone credits packs: **not sold in P1 Initial**

**Credit consumption (P1 Initial):**
- AI Explanation: 2 credits per request
- AI Study Plan: 20 credits per plan
- AI Quiz Generation: 5 credits per 10-question set

### 6.3 Auto-Renewal & Cancellation

- Subscriptions auto-renew at the end of each billing period
- Users cancel **primarily through PayPal subscription management**
- **support@hskkit.com** is the fallback support channel for cancellation help
- After cancellation, Pro access remains active until the end of the current billing period
- **Do not write "Account Settings → Billing → Cancel" unless that UI is implemented**

### 6.4 Failed Renewal & Grace Period

- Failed renewals receive a **3-day grace period** before downgrade to Free
- During grace period, Pro access continues
- After grace period expires without successful payment: automatic downgrade to Free plan
- User notified via email [notification mechanism 待确认]

### 6.5 Refund Rules

- Refund window: **7 days** from initial purchase
- After 7 days, subscription payments are **generally non-refundable**, except where required by applicable law
- Refunds may be **denied or prorated** for heavily used AI credits, consumed service quotas, or completed AI-generated services, except where required by applicable law
- Duplicate charges, obvious billing errors, or technical failures making the service unavailable may be eligible for refund or account credit at our discretion
- Approved refunds processed through PayPal to original payment method; timing depends on PayPal and user's payment provider
- Users contact **support@hskkit.com** for refund requests

### 6.6 Chargeback

- Users are encouraged to contact support@hskkit.com before initiating a chargeback
- Do not state chargebacks are forbidden or attach punitive fines

### 6.7 Tax/VAT Disclosure

- Prices are quoted in USD and may not include applicable taxes or VAT
- Any applicable taxes, VAT, or similar charges will be calculated and displayed during checkout where supported by PayPal
- If PayPal does not support tax/VAT display for your jurisdiction, tax treatment will be confirmed separately [待确认]
- Users are responsible for any applicable local taxes [待确认]

### 6.8 PayPal Technical Caveat

> Before launch, the development team must verify that the selected personal PayPal account supports subscription creation, recurring billing, webhook events, cancellation handling, and refund processing. If the personal PayPal account does not support the required subscription or API capabilities, HSKKit cannot hard-launch paid features and must upgrade to a PayPal Business account or use an alternative subscription-capable payment solution.

---

## 7. AI Content Safety

### 7.1 Minimum Requirements for Launch (Must Implement)

The following AI safety measures must be in place before hard launch:

- **Rate Limits:** AI features must enforce per-user rate limits to prevent abuse and control costs [specific limits 待确认]
- **Prompt Safety Constraints:** System prompts must constrain the AI from generating harmful, illegal, or infringing content; AI must be instructed to provide educational content only [implementation 待确认]
- **Basic Prohibited-Content Filtering:** Input must be filtered against a basic blacklist of prohibited categories (e.g., illegal acts, hate speech, harassment, sexually explicit content) [implementation 待确认]
- **Abuse Logging:** AI usage must be logged for abuse detection, audit, and fair use enforcement [implementation 待确认]

### 7.2 Post-Launch Enhancements (Recommended)

The following measures are recommended for implementation after launch to strengthen AI safety:

- **Content Moderation API:** Integration of a third-party moderation API (e.g., OpenAI Moderation API or equivalent) for pre-send input screening and post-generation output review
- **Output Secondary Review:** Automated secondary checks on AI-generated outputs for sensitive content, factual accuracy flags, or policy violations before delivery to users
- **Advanced Abuse Detection:** Pattern-based detection of automated/scripted abuse, credit farming, or other systematic exploitation of AI features
- **Human Review Escalation:** Process for escalating edge-case or flagged AI outputs to human review

### 7.3 AI Disclaimer (applies to all AI features)
- AI-generated content may be inaccurate, incomplete, or outdated
- AI explanations, study plans, and quizzes are **not official HSK exam advice**
- Learning results and exam scores are **not guaranteed**
- Users should verify important answers against official HSK materials
- HSKKit is not responsible for exam outcomes based on AI-generated content

### 7.4 Prohibited Use
Users may not use AI features to generate:
- Illegal, harmful, abusive, harassing, or discriminatory content
- Content that infringes intellectual property rights
- Misleading or deceptive content
- Content that violates any applicable law or regulation

---

## 8. Children / Minors / Education Data

### 8.1 Age Policy
- The Service is intended for users aged **13 and older**
- **Users under 13 are not permitted to create an account, submit personal information, or use account-based or AI-powered features**
- Parents or legal guardians may use the Service on their own account to assist their children with learning; any data submitted remains the responsibility of the account holder
- We do not knowingly collect personal information from children under 13

### 8.2 Teacher/School Data (P1)
- **Teacher Pack is postponed in P1 Initial**
- No student data collection in P1
- If Teacher Pack is launched in the future, a separate COPPA/FERPA/GDPR education data review is required before launch

---

## 9. HSK Trademark / Non-Affiliation

**Required disclosure across Terms, Disclaimer, and footer:**

> HSK and related names are trademarks or registered trademarks of their respective owners. HSKKit is an independent learning tool and is not affiliated with, endorsed by, sponsored by, or operated by Hanban, Chinese Testing International, or any official HSK test organizer or trademark owner. [Specific trademark owner name 待确认]

---

## 10. Privacy Policy Draft (English)

---

**Privacy Policy for HSKKit**

*Last updated: [Date — 待确认]*

### 1. Introduction

HSKKit ("we", "us", "our") operates hskkit.com (the "Service"). This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our Service.

### 2. Information We Collect

**Account Information:**
- Email address (for registration, login, and service notifications)

**Learning Data:**
- Essays and text you submit for AI feedback
- Quiz answers and results
- Study plan requests and generated plans
- Flashcard progress and learning history
- Mistakes and proficiency tracking

**Usage Data:**
- AI credits consumption records
- Feature usage patterns

**Technical Data:**
- IP address (for rate limiting, security, and abuse prevention)
- Browser type, device information
- Access logs and error logs

**Payment Data:**
- We do not store full payment card details or full PayPal account credentials on our servers.
- PayPal processes payment, billing, refund, fraud-prevention, and dispute-related information under PayPal's own policies.
- We store order metadata (plan type, amount, status, dates) necessary for service delivery and legal/tax compliance.

### 3. How We Use Your Information

- To provide and maintain the Service
- To process payments and manage subscriptions
- To generate AI-powered learning content
- To track learning progress and personalize your experience
- To prevent abuse and ensure security
- To communicate service updates, billing, and support
- To analyze usage and improve the Service

### 4. Third-Party Services

We use the following third-party services:

- **PayPal:** Payment processing, subscription management, refunds
- **OpenAI [待确认]:** AI content generation (explanations, study plans, quizzes)
- **Cloudflare:** DNS, CDN, security, email routing
- **Clerk [待确认]:** Authentication and user management
- **Supabase [待确认]:** Database and data storage
- **Resend [待确认]:** Transactional email delivery
- **Plausible [待确认]:** Privacy-friendly, cookieless analytics (designed not to identify individual visitors)
- **[Error logging provider 待确认]:** Error tracking and debugging

### 5. Data Retention

- Account data: retained for the lifetime of your account; deleted within 30 days of account deletion request received via support@hskkit.com
- Learning data: retained while your account is active; deleted upon account deletion request [unless legal retention required — 待确认]
- AI inputs/outputs: retained while your account is active; deleted upon account deletion request [待确认]
- Payment metadata: retained as required by tax/accounting law [待确认]
- Access logs: [30–90 days — 待确认]
- Analytics data: per Plausible policy [待确认]

### 6. Your Rights (GDPR / Global Users)

Depending on your location, you may have the right to:
- Access your personal data
- Request correction of inaccurate data
- Request deletion of your data
- Object to processing
- Request restriction of processing
- Request data portability
- Withdraw consent (where applicable)

To exercise these rights, contact us at **support@hskkit.com**.

### 7. CCPA / California Residents

We do not sell your personal information. We do not share personal information for cross-context behavioral advertising [if Plausible-only — 待 confirm if GA4/ads added].

### 8. Children

Our Service is intended for users aged 13 and older. Users under 13 are not permitted to create an account, submit personal information, or use account-based or AI-powered features. Parents or legal guardians may use the Service on their own account to assist their children with learning. We do not knowingly collect personal information from children under 13. If you believe we have collected data from a child under 13, please contact us immediately.

### 9. Security

We implement reasonable security measures to protect your data. However, no internet transmission is completely secure.

### 10. International Transfers

Your data may be processed in countries other than your own. We ensure appropriate safeguards are in place [specific safeguards 待确认].

### 11. Changes to This Policy

We may update this Privacy Policy. Changes will be posted on this page with an updated date.

### 12. Contact

For privacy questions or requests:
- Email: **support@hskkit.com**
- Address: [Operator address — 待确认]

---

*This Privacy Policy is provided as a draft for review and does not constitute formal legal advice.*

---

## 11. Terms of Service Draft (English)

---

**Terms of Service for HSKKit**

*Last updated: [Date — 待确认]*

### 1. Acceptance of Terms

By accessing or using HSKKit ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.

### 2. Service Description

HSKKit is an AI-powered online learning platform for HSK Chinese language study. The Service provides AI-generated explanations, study plans, quizzes, flashcards, and reading materials.

**Important:** HSKKit is an independent learning tool and is not affiliated with, endorsed by, sponsored by, or operated by any official HSK test organizer or trademark owner.

### 3. Eligibility

You must be at least 13 years old to use the Service. Users under 13 are not permitted to create an account, submit personal information, or use account-based or AI-powered features. Parents or legal guardians may use the Service on their own account to assist their children with learning.

### 4. Account Registration

You may need to create an account to access certain features. You are responsible for maintaining the confidentiality of your account credentials.

### 5. Subscription Plans (P1 Initial)

**Pro Monthly:** $5.99/month, auto-renewing
**Pro Yearly:** $49/year, auto-renewing

Prices are quoted in USD and may not include applicable taxes or VAT. Any applicable taxes, VAT, or similar charges will be calculated and displayed during checkout where supported by PayPal. If PayPal does not support tax/VAT display for your jurisdiction, tax treatment will be confirmed separately.

Both plans include 500 AI credits per month. Credits reset monthly, do not roll over, have no cash value, and cannot be transferred or redeemed for money.

### 6. Auto-Renewal and Cancellation

- Subscriptions automatically renew at the end of each billing period
- You may cancel primarily through **PayPal subscription management**
- Alternatively, contact **support@hskkit.com** for cancellation assistance
- After cancellation, Pro access remains active until the end of the current billing period
- Failed renewals receive a 3-day grace period before downgrade to Free

### 7. Refunds

- Refund window: 7 days from initial purchase
- After 7 days, subscription payments are generally non-refundable, except where required by applicable law
- Refunds may be denied or prorated for heavily used AI credits or consumed service quotas, except where required by applicable law
- Duplicate charges, billing errors, or technical failures may be eligible for refund or credit at our discretion
- Contact support@hskkit.com for refund requests

### 8. AI-Generated Content

- AI-generated content is provided "AS IS" without guarantees of accuracy, completeness, or originality
- AI explanations, study plans, and quizzes are not official HSK exam advice
- Learning results and exam scores are not guaranteed
- You are responsible for verifying important information against official HSK materials

### 9. Acceptable Use

You agree not to:
- Use the Service for any illegal purpose
- Generate or distribute harmful, abusive, harassing, or discriminatory content
- Infringe intellectual property rights
- Attempt to circumvent rate limits, abuse AI credits, or use automation/scripts to exploit the Service
- Resell, redistribute, or transfer your account or credits
- Use the Service to generate misleading or deceptive content

### 10. Fair Use

Pro plan features and AI credits are subject to reasonable use limits. We reserve the right to suspend accounts or adjust credits for abuse, excessive automated usage, or activity that harms the Service or other users. See our Fair Use Policy for details.

### 11. Intellectual Property

- HSKKit content, branding, and software are our property or licensed to us
- You retain ownership of content you submit
- AI-generated outputs may be used for personal learning purposes according to your plan
- We do not guarantee that AI-generated content is eligible for copyright protection in all jurisdictions

### 12. Limitation of Liability

The Service is provided "AS IS" without warranties of any kind. To the maximum extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the Service.

### 13. Price Changes

We may change subscription prices from time to time. If we increase the price of your plan, we will notify you at least 30 days before the change takes effect. The new price will apply to the next billing period after the notice period. If you do not agree to the new price, you may cancel your subscription before the change takes effect.

### 14. Service Changes and Termination

We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time. We will provide reasonable notice where practicable.

### 15. Governing Law

These Terms are governed by the laws applicable to the operator's place of residence or business [待确认], without regard to conflict-of-law rules, except where mandatory consumer protection laws in your country or region provide otherwise.

### 16. Changes to Terms

We may update these Terms. Continued use of the Service after changes constitutes acceptance.

### 17. Contact

- Email: **support@hskkit.com**
- Address: [Operator address — 待确认]

---

*These Terms are provided as a draft for review and do not constitute formal legal advice.*

---

## 12. Refund Policy Draft (English)

---

**Refund Policy for HSKKit**

*Last updated: [Date — 待确认]*

### 1. Overview

This Refund Policy applies to HSKKit subscription purchases. By subscribing, you agree to this policy.

### 2. Refund Window

You may request a refund within **7 days** of your initial purchase.

### 3. Eligible Refunds

Refunds within the 7-day window may be approved if:
- The service was not substantially used
- AI credits were not heavily consumed
- There was a duplicate charge, obvious billing error, or technical failure making the service unavailable

### 4. Non-Refundable Cases

After 7 days, subscription payments are generally non-refundable, except where required by applicable law.

Renewal payments (automatic recurring charges) are generally non-refundable. You may cancel before the next renewal date to avoid future charges.

Refunds may be denied or prorated for:
- Heavily used AI credits
- Consumed service quotas
- Completed AI-generated services

Exceptions where refunds may still be granted:
- Duplicate charges
- Obvious billing errors
- Technical failures making the service unavailable
- Where required by applicable law

### 5. Refund Process

1. Contact **support@hskkit.com** with your request
2. Include your account email and reason for refund
3. We will respond within 5 business days
4. Approved refunds are processed through PayPal to the original payment method
5. Processing time: typically 5–10 business days (depends on PayPal and your payment provider)

### 6. Chargebacks

We encourage you to contact us before initiating a chargeback. We will work to resolve issues promptly.

### 7. Exceptions

Nothing in this policy limits your rights under applicable consumer protection laws.

---

*This Refund Policy is provided as a draft for review and does not constitute formal legal advice.*

---

## 13. Fair Use Policy Draft (English)

---

**Fair Use Policy for HSKKit**

*Last updated: [Date — 待确认]*

### 1. Purpose

This Fair Use Policy ensures HSKKit remains available and performant for all users. Pro plan features and AI credits are provided for reasonable personal learning use.

### 2. Prohibited Activities

The following activities violate this policy:
- **Automation/Script Abuse:** Using bots, scripts, or automated tools to generate content or consume credits
- **Excessive Generation:** Generating content at volumes far exceeding typical personal learning use
- **Credit Abuse:** Attempting to circumvent credit limits, transfer credits, or exploit the credit system
- **Resale/Redistribution:** Reselling, redistributing, or transferring account access or generated content in bulk
- **API Abuse:** Reverse engineering, scraping, or unauthorized API access
- **Harmful Use:** Using the Service to generate content that harms other users or the platform

### 3. Rate Limits

AI features are subject to rate limits to ensure fair access. Specific limits [待确认 — to be documented].

### 4. Enforcement

We reserve the right to:
- Suspend or terminate accounts violating this policy
- Adjust, reset, or revoke credits
- Restrict access to features
- Take legal action where appropriate

### 5. Appeals

If you believe your account was restricted in error, contact **support@hskkit.com**.

---

*This Fair Use Policy is provided as a draft for review and does not constitute formal legal advice.*

---

## 14. Cookie Policy Draft (English)

---

**Cookie Policy for HSKKit**

*Last updated: [Date — 待确认]*

### 1. What Are Cookies

Cookies are small text files stored on your device when you visit websites.

### 2. Our Use of Cookies

**If Plausible-only (current default):**
- We use Plausible Analytics, a privacy-friendly, cookieless analytics tool
- Plausible is designed not to identify individual visitors and does not use cookies
- No cookie consent banner is required for Plausible-only usage

**If GA4, Microsoft Clarity, or ad pixels are added:**
- We will implement a cookie consent banner for EU/UK users
- Non-essential cookies will not load before consent
- Appropriate consent controls will be provided where required
- This policy will be updated accordingly

### 3. Essential Cookies

Essential cookies required for the Service to function (e.g., authentication, security) may be used without consent.

### 4. Third-Party Cookies

PayPal checkout may set cookies under PayPal's own policies when you interact with payment flows.

### 5. Changes

We will update this policy if our cookie practices change.

### 6. Contact

**support@hskkit.com**

---

*This Cookie Policy is provided as a draft for review and does not constitute formal legal advice.*

---

## 15. Disclaimer Draft (English)

---

**Disclaimer for HSKKit**

### 1. HSK Non-Affiliation

HSK and related names are trademarks or registered trademarks of their respective owners. HSKKit is an independent learning tool and is not affiliated with, endorsed by, sponsored by, or operated by Hanban, Chinese Testing International, or any official HSK test organizer or trademark owner. [Specific trademark owner 待确认]

### 2. AI Content Accuracy

AI-generated content (explanations, study plans, quizzes) is provided for educational purposes only. It may contain errors, omissions, or outdated information. Always verify important information against official HSK materials.

### 3. No Exam Guarantee

Using HSKKit does not guarantee any specific HSK exam score or language proficiency outcome. Individual results depend on many factors including study time, prior knowledge, and test conditions.

### 4. Not Professional Advice

HSKKit does not provide legal, medical, financial, or other professional advice. For such advice, consult a qualified professional.

### 5. Third-Party Links

The Service may contain links to third-party websites. We are not responsible for their content or privacy practices.

---

*This Disclaimer is provided as a draft for review and does not constitute formal legal advice.*

---

## 16. Implementation Consistency Matrix

| Element | Pricing Page | Checkout | Confirmation Email | Terms | Refund Policy | FAQ | Backend | Status |
|---|---|---|---|---|---|---|---|---|
| Pro Monthly $5.99 | Must show | Must show | Must confirm | Must state | N/A | Must answer | Must handle | [待确认] |
| Pro Yearly $49 | Must show | Must show | Must confirm | Must state | N/A | Must answer | Must handle | [待确认] |
| Auto-renewal disclosure | Must show | Must show | Must confirm | Must state | N/A | Must answer | Must handle | [待确认] |
| Cancellation path (PayPal primary + email fallback) | Must show | Must show | Must confirm | Must state | N/A | Must answer | Must handle | [待确认] |
| 7-day refund window | Must link | Must link | Must confirm | Must state | Must state | Must answer | Must handle | [待确认] |
| Credits 500/month, reset, no rollover | Must show | Must show | Must confirm | Must state | N/A | Must answer | Must enforce | [待确认] |
| End-of-period access after cancellation | Must show | Must show | Must confirm | Must state | N/A | Must answer | Must enforce | [待确认] |
| 3-day grace period for failed renewal | Should mention | Should mention | Should confirm | Must state | N/A | Should answer | Must enforce | [待确认] |
| Tax/VAT disclosure | Should show | Must show | Should confirm | Should state | N/A | Should answer | N/A | [待确认] |
| Lifetime/Beta/Teacher not available | Must NOT show | Must NOT show | Must NOT confirm | May mention as future | N/A | May mention as future | Must NOT handle | [待确认] |

---

## 17. Launch Blockers Table

| Blocker | Criteria | Owner | Status |
|---|---|---|---|
| PayPal subscription capability | Can create subscription, charge, receive webhook, cancel, refund | 小帅 | [待确认] |
| Legal pages published | Terms / Privacy / Refund / Fair Use live and footer-linked | 小财/小帅 | [待确认] |
| Checkout auto-renewal disclosure | Payment page shows amount, period, auto-renewal, cancel method, tax note | 小帅 | [待确认] |
| Subscription state sync | Payment success → Pro; cancel → retain to period end; fail → 3–7d grace → Free | 小帅 | [待确认] |
| Support email operational | support@hskkit.com receives and can respond to requests | 建哥/小帅 | [待确认] |
| AI credits enforcement | Backend correctly deducts, resets, blocks overuse | 小帅 | [待确认] |
| HSK disclaimer visible | Footer or key pages show non-affiliation statement | 小帅 | [待确认] |

---

## 18. Launch Checklist

### Must Complete (P0)

- [ ] Privacy Policy published and footer-linked
- [ ] Terms of Service published and footer-linked
- [ ] Refund Policy published and footer-linked
- [ ] Fair Use Policy published and footer-linked
- [ ] Disclaimer (HSK non-affiliation + AI accuracy) visible on site
- [ ] Checkout shows: plan name, amount, billing period, auto-renewal notice, cancellation method, tax note
- [ ] Pricing page shows only Pro Monthly and Pro Yearly
- [ ] Pricing page does not show Lifetime, Beta Lifetime, Teacher Pack, or standalone credits
- [ ] Confirmation email includes: plan details, auto-renewal reminder, cancellation link/method, support contact
- [ ] support@hskkit.com configured and tested
- [ ] PayPal subscription API verified (create, charge, webhook, cancel, refund)
- [ ] Backend subscription state machine implemented (upgrade, cancel, grace period, downgrade)
- [ ] AI credits system implemented (allocation, consumption, reset, enforcement)
- [ ] Rate limits implemented for AI features
- [ ] Input filtering / content moderation for AI features [implementation 待确认]

### Should Complete (P1)

- [ ] Cookie Policy published (if GA4/Clarity/ad pixels used)
- [ ] Cookie consent banner implemented (if non-essential tracking used for EU/UK)
- [ ] Account deletion request process documented (email request to support@hskkit.com; self-service portal if implemented later)
- [ ] Data retention schedule documented internally
- [ ] Error logging provider configured and disclosed
- [ ] Analytics tool confirmed and disclosed
- [ ] Email provider (Resend) configured and domain verified

### Post-Launch Monitoring

- [ ] Monitor refund requests and reasons (weekly for first month)
- [ ] Monitor chargeback rate (weekly for first month)
- [ ] Monitor AI credit consumption patterns (abuse detection)
- [ ] Monitor subscription cancellation reasons
- [ ] Review and update legal pages if implementation changes
- [ ] Schedule legal page review 30 days post-launch

---

## 19. Evidence Checklist (For 小帅)

**Hard launch is blocked until all evidence items are submitted and reviewed.** Before calling launch "ready", collect evidence for:

- [ ] Screenshot: Pricing page showing only Pro Monthly/Yearly
- [ ] Screenshot: Checkout page with auto-renewal disclosure
- [ ] Screenshot: Confirmation email content
- [ ] Screenshot: Footer with legal page links
- [ ] Screenshot: HSK disclaimer visible
- [ ] Test record: PayPal subscription creation successful
- [ ] Test record: PayPal webhook received and processed
- [ ] Test record: PayPal cancellation processed
- [ ] Test record: PayPal refund processed
- [ ] Test record: Subscription upgrade → Pro features accessible
- [ ] Test record: Cancellation → Pro retained to period end
- [ ] Test record: Failed renewal → grace period → downgrade to Free
- [ ] Test record: AI credits correctly allocated, consumed, reset
- [ ] Test record: Rate limit enforced
- [ ] Test record: support@hskkit.com receives email
- [ ] Test record: Input filtering blocks prohibited content

---

## 20. Open Questions for 建哥 / 小帅

### 20.1 Hard Launch Blockers (Must resolve before hard launch)

| # | Question | Impact | Suggested Action |
|---|---|---|---|
| 1 | PayPal personal account: verified for subscription API, webhooks, refunds? | **Hard launch blocker** | Test before launch; upgrade to Business if needed |
| 2 | Legal pages published (Terms / Privacy / Refund / Fair Use) and footer-linked? | **Hard launch blocker** | Publish and verify links |
| 3 | Checkout auto-renewal disclosure implemented (amount, period, auto-renewal, cancel method, tax note)? | **Hard launch blocker** | Implement and test |
| 4 | Backend subscription state machine verified (upgrade, cancel, grace period, downgrade)? | **Hard launch blocker** | Test all state transitions |
| 5 | support@hskkit.com configured and tested for receiving requests? | **Hard launch blocker** | Verify Cloudflare Email Routing |
| 6 | AI credits enforcement implemented (allocation, consumption, reset, overuse block)? | **Hard launch blocker** | Test credit system end-to-end |

### 20.2 Pre-Launch Should Confirm (Resolve before or at launch)

| # | Question | Impact | Suggested Action |
|---|---|---|---|
| 7 | AI API provider confirmed (OpenAI / Gemini / Anthropic)? | Privacy/Terms disclosure accuracy | Confirm provider; review data usage policy |
| 8 | Auth provider confirmed (Clerk / other)? | Privacy/Terms disclosure | Confirm and document |
| 9 | Database/hosting provider confirmed (Supabase / other)? | Privacy/Terms disclosure | Confirm and document |
| 10 | Email provider confirmed (Resend / other)? | Privacy/Terms disclosure | Confirm and document |
| 11 | Analytics tool confirmed (Plausible / GA4 / Clarity)? | Cookie Policy requirement | Confirm; if GA4/Clarity, add Cookie Policy + Banner |
| 12 | Error logging provider confirmed? | Privacy/Terms disclosure | Confirm and document |
| 13 | Operator jurisdiction and address? | Governing law, contact address | Confirm for final Terms/Privacy |
| 14 | Tax/VAT handling at checkout (tax-inclusive or tax-added)? | Checkout disclosure, compliance | Confirm and implement |
| 15 | AI credit consumption definitions | Pricing clarity, Terms precision | **Confirmed: Explanation 2/request, Study Plan 20/plan, Quiz 5/10-question set** |
| 16 | Data retention periods (learning data, logs, AI outputs)? | Privacy Policy accuracy | Decide and document internally |
| 17 | Account deletion process (email-only or self-service)? | Privacy Policy, user rights | Confirm implementation |
| 18 | Rate limit values for AI features? | Fair Use Policy | Define and document |
| 19 | HSK trademark owner exact name (Hanban / CTI / other)? | Disclaimer accuracy | Confirm for final copy |
| 20 | Backend grace period exact duration | Terms precision | **Confirmed: 3 days** |
| 21 | Refund response time commitment | Refund Policy | **Confirmed: 5 business days** |
| 22 | Input filtering / content moderation implemented for AI features? | AI safety, compliance | Implement or add to post-launch roadmap |

### 20.3 Post-Launch Monitor (Track after launch)

| # | Question | Impact | Suggested Action |
|---|---|---|---|
| 23 | Refund request volume and reasons | Product/market fit, pricing validation | Review weekly for first month |
| 24 | Chargeback rate | Payment processor standing, fraud risk | Review weekly for first month |
| 25 | AI credit consumption patterns (abuse detection) | Fair Use enforcement, cost control | Monitor for anomalies |
| 26 | Subscription cancellation reasons | Retention insights | Collect via exit survey or support tickets |
| 27 | Legal page accuracy vs. actual implementation | Compliance drift | Review 30 days post-launch |
| 28 | Under-13 usage detection | COPPA/GDPR child data risk | Monitor signups and support requests |
| 29 | PayPal dispute rate | Merchant account health | Review monthly |
| 30 | EU/UK user cookie consent compliance (if GA4/ads added) | ePrivacy/GDPR risk | Audit if tracking tools change |

---

## 21. Lawyer / Professional Review Recommendations

While this report provides practical compliance guidance, the following areas may benefit from professional legal review before hard launch:

1. **Cross-border consumer protection:** EU/UK consumer rights, withdrawal periods, and mandatory disclosures for digital services
2. **PayPal merchant compliance:** Personal vs Business account requirements, merchant agreement terms, dispute handling
3. **Tax/VAT obligations:** Digital services tax collection and remittance for global sales
4. **AI liability:** Jurisdiction-specific rules on AI-generated educational content liability
5. **Trademark clearance:** Formal opinion on HSK-related branding and domain use
6. **Children's data:** If under-13 usage is detected or Teacher Pack is later launched, COPPA/FERPA/GDPR education data review is essential

---

*This report is a compliance review and legal page draft for HSKKit P1 Initial launch. It does not constitute formal legal advice. All parties should consult qualified legal counsel for jurisdiction-specific interpretations and final policy approval.*
