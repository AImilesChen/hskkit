# HSKKit P0/P1 digital product contract

Status: approved implementation contract for Stripe Test mode.

## Shared rules

- Currency: USD; one-time Stripe Test checkout only. No live card charge.
- Access: 14 days from fulfillment.
- Download debit: each delivery has 3 successful downloads; server, generation, storage, signature, checksum, or response failures do not debit.
- Refund review: available within 7 days only when no delivery belonging to the order has a successful download. A signed Stripe refund event revokes every delivery, token, and private R2 object for the order.
- Repeat purchase: an active entitlement for the exact same product blocks a new checkout. An expired/refunded/revoked product may be purchased again. Ownership of overlapping single levels does not silently alter bundle price or rights.
- Personal, non-transferable study/print use. No audio.

## P0 catalog

- `level-1` through `level-9`: US$9.99 each. One level-labelled PDF delivery. Levels 7–9 use the same canonical unified advanced-band source set and are not represented as three distinct official vocabulary lists.
- `advanced-7-9`: US$24.99. Separate Level 7, 8, and 9 PDF deliveries plus one combined ZIP.
- `complete-1-9`: US$64.99. Separate Level 1–9 PDF deliveries plus one combined ZIP; its Levels 7–9 PDFs carry the same advanced-band disclosure.

Bundle checkout stores one order and grants multiple child deliveries atomically. Refund/revocation affects all child deliveries. Each child delivery has its own three-successful-download allowance.

## P1 differentiated MVP catalog

Introductory Test price: US$9.99 each.

- `worksheet-pack`: all-level printable vocabulary exercises, student worksheets, answer key, and manifest in a ZIP.
- `assessment-tracker`: CSV tracker usable in spreadsheet software plus a printable assessment record PDF and instructions in a ZIP.
- `30-day-planner`: printable 30-day HSK study planner PDF spanning goal, daily practice, weekly review, and reflection prompts.
- `mock-exam-pack`: level-labelled sample exam sections, student paper, answer/rubric PDF, and manifest in a ZIP. It is practice material, not an official exam.
- `teacher-lesson-plan-pack`: HSK 3.0 lesson-plan templates for 45/60/90-minute classes, differentiation prompts, homework, and assessment notes in a ZIP.

Every generated artifact must be non-empty, have a deterministic manifest, use authorized local content only, and label the HSK standard and unofficial status truthfully.
