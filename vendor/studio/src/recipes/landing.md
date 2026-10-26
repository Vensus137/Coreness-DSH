---
id: landing
kind: landing
allowed: [header, hero, prose, cards, quote, stats, split, faq, cta, footer]
required: [header, hero, cta, footer]
order: [header, hero, prose, cards, quote, stats, split, faq, cta, footer]
stack: [header, hero, prose, cards, quote, stats, split, faq, cta, footer]
---

A one-page argument for a product, a service or a programme: the claim, the proof, and one action.

The stack above is the design order, not a template. Any subset keeps that order and every required section. `header` opens the page, `hero` states the claim directly after it, `cta` carries the page's single action before `footer`; `footer` closes it. `prose` may repeat. Nothing else repeats except `footer`'s bookend brand, which is the header's own.

Content requirements, in the order they are decided:

- `hero.object` follows the one priority: a number with a real source, else an exact quotation with a real attribution, else a wordmark, else `{kind: "none"}`. Never invent a number, a metric or a quotation to fill the object; `none` is a finished composition.
- `stats` and any numeric claim appear only when the supplied material carries the number and its source. A section is omitted, never padded.
- `quote` appears only with a verbatim quotation and a real person or document; a pull quote follows the same rule and never repeats the lead.
- `cards` hold genuinely parallel items; `faq` answers the objections the material names; `split` puts one claim against its evidence.
- The page ends quiet: `cta` then `footer`. No second action anywhere; one filled field on the whole page.

The event variant is `src/recipes/landing-event.md`; `variant: "event"` is accepted only on a landing and it changes the required set (it adds `timeline`) and the order.
