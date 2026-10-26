---
id: landing
kind: landing
variant: event
allowed: [header, hero, prose, stats, timeline, cards, quote, faq, cta, footer]
required: [header, hero, timeline, cta, footer]
order: [header, hero, prose, stats, timeline, cards, quote, faq, cta, footer]
stack: [header, hero, prose, stats, timeline, cards, quote, faq, cta, footer]
---

The landing's event variant: one page for a dated occasion — a workshop, a launch, a conference — where the reader must learn what happens, when, and how to take part.

`variant: "event"` is a manifest field on a `landing`; the recipe is still `landing` and `page.json` records both. The variant changes the required set and the order: `hero` is followed by a quiet `prose` section, then `stats` (sourced numbers only, or omitted) introduces the proof, and `timeline` carries the real sequence — dates, sessions or steps — in order. `header` opens, `cta` closes with the one action, `footer` bookends. The `prose` section between `hero` and `stats` is what keeps the rhythm rule: `stats` is dense and no dense section may stand directly after the hero; an event page without sourced numbers omits both `stats` and that `prose`.

Content requirements:

- The occasion is real in the material: a date, a place, a programme. A date the material does not carry is not written; `hero.caption` or `timeline` labels are where real facts stand.
- `timeline` holds three to five real moments in order; its labels are the real labels the material gives (a year, a day, a session), never invented ordinals.
- `hero.object` keeps the same priority as the plain landing: a sourced number, an exact quotation, a wordmark, or `none`.
- The action is one, and it is the participation itself: a registration or an enquiry address the material actually supplies. No countdown, no "limited offer", no second action.

Everything valid on a landing is valid here except the required set and the order; the rhythm rule is the same and the page still ends quiet.
