/**
 * The account's credits as one held picture: the last reading, the sweep that refreshes it, and the answers
 * of the product's own route.
 *
 * The number the widget shows is an **observation**, and it is held in memory here. It is deliberately not
 * written into this row's settings section: that section *is* the profile's Cordis patch, and a sweep that
 * wrote its answer there on every tick would edit that file thousands of times over days. A route of the
 * product's own leaves that file alone.
 *
 * The cadence, and why it is this number. What a sweep buys here is two things only: a figure that is not
 * stale, and a reward that is not missed. The vendor's reward window opens once a day and the balance moves
 * with use, so **ten minutes** holds the figure as usefully as five would at half the requests, and writes no
 * file at all. The number lives in the row, its floor and its ceiling are the two constants beside this
 * module, and a row that asks for something outside them is told so in the log and gets the nearest honest
 * value.
 *
 * The automatic collection is on unless the row turns it off, and its reason is the vendor's own window: a
 * reward that is not taken expires, and a claim that waits for a human press can lose a day of it. A repeat
 * is an answer rather than an accident — the contour replies `200` with a replay mark, and a claim of a
 * reward already held comes back as held — so nothing is taken twice, and every sweep and every claim is
 * logged where a reader can see what fired.
 *
 * @module @coreness/qoder/src/account
 */

const defaults = { now: () => Date.now(), log: () => {} }

/**
 * How many of the account's own lines the route's answer carries.
 *
 * The platform's logger has no sink in this build beyond its own in-memory ring, so a line written
 * there reaches nobody who is not holding the service. What fires — every sweep, every claim, every
 * failure — therefore also travels in the answer, where a reader can see it.
 */
export const NOTES_KEPT = 40

/** The reason of a thrown value, in words. */
const reasonOf = (error) => (error instanceof Error ? error.message : String(error))

/** The code of a thrown value, when it carries one. */
const codeOf = (error) => (typeof error?.code === 'string' && error.code !== '' ? error.code : 'UNKNOWN')

/**
 * The account's picture over the vendor's own calls.
 * @param {object} options the account
 * @param {object} options.credits the reader of the vendor's own calls
 * @param {number} options.everyMs how often the sweep reads
 * @param {boolean} options.autoClaim whether a sweep takes what is claimable
 * @param {() => number} [options.now] the clock, for a test
 * @param {(message: string) => void} [options.log] where a sweep and a claim are said
 * @returns {object} the account
 */
export function createAccount({ credits, everyMs, autoClaim, now = defaults.now, log = defaults.log }) {
  /**
   * The last thing known, and the only thing the widget draws: nothing read yet, a picture, or the
   * reason a reading failed. A failure replaces the picture rather than standing beside it — the
   * numbers of a reading that has just failed are not news, and a stale figure with a failure under it
   * reads as a figure.
   */
  let held = { kind: 'never' }
  /**
   * What the last collection did, kept beside the picture rather than inside it: a reading replaces
   * the numbers, and the report of a collection is not a number — a user who looked away for a moment
   * would otherwise never see it, since the sweep that made it is followed by its own plain readings.
   */
  let collection
  /** One reading at a time: a sweep and a press must not exchange the account's token twice over. */
  let running = null
  /** One data-sharing press at a time: a second press reads the held picture, it sends no second change. */
  let pressing = false
  /** The account's own account of itself: the last few lines, for whoever reads the route's answer. */
  const notes = []

  /** One line of the account, in two places: the platform's log, and the answer a reader can open. */
  function note(line) {
    notes.push({ at: now(), line })
    if (notes.length > NOTES_KEPT) notes.shift()
    log(line)
  }

  /**
   * What the widget reads: the held picture, the cadence that produced it, and the account's own lines.
   *
   * The report of the last collection rides along with a finished picture and only with one — a
   * failure has no numbers and no collection to speak of, and the widget prints the reason instead.
   * `notes` is for a reader with the route's answer in hand; the widget does not draw it.
   */
  const picture = () => ({
    last: held.kind === 'done' && collection !== undefined ? { ...held, collection } : held,
    sweep: { everyMs, autoClaim },
    notes: notes.slice(),
  })

  /** The campaigns of the held picture that can be taken, if a picture stands. */
  function claimable() {
    if (held.kind !== 'done') return []
    return (held.campaigns.list ?? []).filter((campaign) => campaign.claimable === true)
  }

  /**
   * Take one reward and leave the outcome in the picture's own `collection`.
   * @param {string | undefined} campaignId the campaign to take, or nothing for every claimable one
   * @returns {Promise<object>} the summary the widget prints
   */
  async function collect(campaignId) {
    const targets = campaignId === undefined
      ? claimable().map((campaign) => campaign.id)
      : [campaignId]
    const summary = { at: now(), claimed: 0, amount: 0, replayed: false }
    for (const id of targets) {
      try {
        const outcome = await credits.claim(id)
        /* A repeat is an answer, not a failure — the contour replies `200` with a replay mark, and a
           reward it will not hand out answers with a refusal inside a 200. Both leave nothing to count
           and nothing to report as a fault; the log keeps the difference, the widget's line does not. */
        if (outcome.alreadyHeld === true) {
          summary.replayed = outcome.replayed === true ? true : summary.replayed
          note(`the reward ${id} was not taken: the contour handed out nothing new (${outcome.status ?? 'no status'})`)
          continue
        }
        summary.claimed += 1
        summary.amount += typeof outcome.amount === 'number' ? outcome.amount : 0
        note(`took the reward ${id}: +${typeof outcome.amount === 'number' ? outcome.amount : 'an amount the contour did not name'}`)
      } catch (error) {
        summary.failure = `${id}: ${reasonOf(error)}`
        note(`the reward ${id} was not taken: ${summary.failure}`)
      }
    }
    return summary
  }

  /**
   * One reading of the account, and — when the sweep may — the collection that follows it.
   *
   * A reading that took anything is read again before it is held: the balance the widget draws must be
   * the balance the claim left, not the one that made the claim look worthwhile.
   * @param {string} why what asked for the reading (`the mount`, `the sweep`, `a press`)
   * @returns {Promise<object>} the held picture
   */
  async function read(why) {
    try {
      const answer = await credits.read()
      held = { kind: 'done', at: answer.at, quota: answer.quota, campaigns: answer.campaigns, privacy: answer.privacy }
      note(`the account was read (${why}): ${held.campaigns.list.length} campaign(s), the plan ${held.quota.plan.remaining} of ${held.quota.plan.total} left`)
      const targets = autoClaim ? claimable() : []
      if (targets.length > 0) {
        const summary = await collect(undefined)
        collection = summary
        const after = await credits.read()
        held = { kind: 'done', at: after.at, quota: after.quota, campaigns: after.campaigns, privacy: after.privacy }
        note(`the sweep collected ${summary.claimed} reward(s) and read the account again`)
      }
    } catch (error) {
      /* The vendor's own body, kept verbatim and bounded by the reader that took it: the popover shows it
         beside the state, because the user who opens that row is asking what the contour said and wants
         the thing itself — its code, its message and any id it carried, ready to hand on. The other road
         builds a sentence instead (the vendor's words with its id marked), which is what a reader in the
         flow needs and not what a support question is answered with. Two contents, two shapes, each read
         where it stands; this module keeps its own distance from the wire and reads no field of a body. */
      held = { kind: 'failed', at: now(), code: codeOf(error), message: reasonOf(error), vendor: typeof error?.vendor === 'string' && error.vendor !== '' ? error.vendor : null }
      note(`the account could not be read (${why}): ${held.code} — ${held.message}`)
    }
    return held
  }

  /** One reading at a time, whoever asks: two readings of one moment would be two answers to one question. */
  function sweep(why) {
    if (running === null) {
      running = read(why).finally(() => {
        running = null
      })
    }
    return running
  }

  return {
    picture,
    sweep,
    /** Take what the picture says is claimable, then read the account again. */
    async claim(campaignId) {
      const summary = await collect(campaignId)
      collection = summary
      const after = await credits.read()
      held = { kind: 'done', at: after.at, quota: after.quota, campaigns: after.campaigns, privacy: after.privacy }
      return held
    },
    /**
     * The one data-sharing press: read fresh, ask, read again, and keep the after state in the picture.
     * A failure leaves the held picture alone and travels to the caller, which draws its reason.
     * @returns {Promise<object>} the held picture
     */
    async privacySet() {
      if (pressing) return held
      pressing = true
      try {
        const privacy = await credits.privacySet()
        if (held.kind === 'done') held = { ...held, privacy }
        return held
      } finally {
        pressing = false
      }
    },
    /** Whether a reading is in flight — the route says so instead of answering a second one. */
    busy: () => running !== null,
  }
}
