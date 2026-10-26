---
id: article
kind: article
allowed: [header, hero, prose, table, quote, faq, footer]
required: [header, hero, prose, footer]
order: [header, hero, prose, prose, table, quote, faq, prose, footer]
stack: [header, hero, prose, prose, table, quote, faq, prose, footer]
---

A long-form article: one argument carried in running text, with a table where a comparison is the clearest form and questions answered at the end.

The recipe has no `cta` — an article does not sell. `prose` is the body and may repeat as many times as the argument needs (the recipe's range is four to twelve sections). `hero.object` is usually `{kind: "none"}`: the thesis is the object, and the text column widens. `table` appears only when the material is a comparison or a list of conditions of the same shape, and one table carries one message; a numeric column requires a source. `quote` is verbatim with a real attribution; `faq` answers the objections the material names, with the answers visible.

Content requirements:

- `hero.thesis` is the article's claim, not its topic; `prose.paragraphs` carry the argument in one to three sentences each.
- The page ends on a quiet `prose` section before `footer` — not on a table, not on an `faq`, never on a call to action.
- A `quote` supports the argument; it never repeats a paragraph as a pull quote.
- Footnotes, references and bibliographies are not a section type: a source line belongs to the object it supports, and a real reference list is out of the MVP's scope.
