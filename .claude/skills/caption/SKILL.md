---
name: caption
description: Write a tweet caption for a component Vansh just built, modelled on what is going viral in his design Twitter feed. He pastes raw copied text from his X/Twitter feed; the skill parses every post, ranks them by engagement relative to the rest of the feed, works out why the top ones spread (hook, length, format, tone), reads the component's source to find what is actually striking about it, and writes caption options that borrow those patterns without copying them. Use whenever the user runs /caption, pastes a Twitter/X feed and asks for a caption, or asks "what should I tweet for this component".
---

# /caption

Turn a pasted design-Twitter feed plus a component into a caption that fits
what is currently working on the timeline.

## Inputs

1. **The feed.** Raw text copied from X. It is messy: names, handles, `·`,
   timestamps, post text, then a run of bare numbers. It may also contain
   "Show more", "Quote", ads ("Promoted"), and "Who to follow" blocks.
2. **The component.** Use, in this order:
   - the component he names in the message;
   - otherwise whatever is in [src/app/playground/page.tsx](src/app/playground/page.tsx) (follow its imports);
   - otherwise the most recently changed file under `registry/new-york/`
     (`git log -1 --name-only -- registry/new-york` or `git status`).
   If it is still ambiguous, ask which component. Don't guess.

If there is no feed in the message, ask him to paste it. Don't invent trends.

## Step 1: Parse the feed into posts

Split the text into one record per post: `handle`, `age`, `text`, and metrics.

- X copies metrics as bare numbers after the post text, in this order:
  **replies, reposts, likes, views** (sometimes bookmarks after views).
  A missing count is just absent, so match from the end: the largest and last
  number is usually views.
- Normalise `1.2K` → 1200, `3.4M` → 3,400,000.
- Age: `3h`, `45m`, `Oct 28`. Convert to hours old (today is in your context).
- Drop ads, "Who to follow", and pure reply fragments with no metrics.
- Keep quote-tweeted text attached to its parent, marked as quoted.

If metrics are missing for most posts, say so and rank on what is there
(e.g. likes only), rather than pretending to precision.

## Step 2: Rank what is viral

Rank relative to this feed, not absolute numbers. A design feed's ceiling is
different from a news feed's.

- **Primary score:** likes + 2 × reposts + 3 × bookmarks (bookmarks signal
  "I want to use this", which is exactly the reaction a component wants).
- **Velocity:** divide by hours old (minimum 1). A 2h-old post with 800 likes
  beats a 3-day-old post with 2,000.
- **Like-to-view ratio** above roughly 3% means the content itself landed, not
  just a big account's reach. Prefer these as models.
- Flag accounts that are obviously large (huge views on a weak post) so their
  reach doesn't get mistaken for a good pattern.

Take the top ~5 (or top 10–15% of a long feed) as the **viral set**.

## Step 3: Work out why they spread

For each post in the viral set, note:

- **Hook:** the first line. Statement, question, "I made…", number, contrarian
  take, "this is what X should feel like", lowercase one-liner, etc.
- **Length:** word count, single line vs. line breaks.
- **Tone & casing:** lowercase/sentence case, emoji use, punctuation.
- **What it shows:** video/demo, before→after, technique reveal, free/open source.
- **Call to action:** "code below", "link in replies", "free", none.

Then name the 2–4 patterns that repeat across the set. Those patterns drive
the captions, not any single tweet.

## Step 4: Understand the component

Read the source. Find the one thing a viewer notices in the first second
(the interaction, the physics, the trick), and the tech behind it (GSAP,
Motion, WebGL, SVG). Check whether it is in the registry: if so it installs with

```
npx shadcn@latest add https://www.pixel-perfect.space/r/<registry-name>.json
```

and the site is https://www.pixel-perfect.space.

## Vansh's own winners

Posts of his that went viral. Treat them as the strongest signal, above the
pasted feed, because they prove what his audience responds to.

- 2026-10-31, shelf gallery: "the cards bend based on how fast you scroll.
  every vertex. no video editing this is live WebGL"
  Why it worked: a concrete mechanic in plain words ("bend based on how fast
  you scroll"), a short detail line that signals depth ("every vertex."), and a
  line that heads off doubt ("no video editing this is live WebGL"). Lowercase,
  no emoji, no link.

When he reports another winner, add it here with the date and why it worked.

## Step 5: Write the captions

Give **5 options**, best first. For each: the caption, then one line on which
viral pattern it borrows and from which post (`@handle`, likes).

Rules:

- Under 280 characters. Most winners in design feeds are under ~15 words;
  match the viral set's length, don't default long.
- Borrow structure, never wording. No caption may reuse a distinctive phrase
  from a feed post.
- Match the feed's casing and emoji habits. If the viral set is lowercase with
  no emoji, so are the captions.
- Describe what it does or how it feels, concretely. "drag it and it keeps
  spinning" beats "smooth interactive carousel".
- No hashtags unless the viral set uses them. No em dashes. No hype words
  ("insane", "game-changer", "elevate", "seamless", "🚀"). No "Not X. It's Y."
- Don't claim things the component doesn't do.

Then add:

- **Reply tweet** (optional): the install command or site link, since links in
  the main post get less reach.
- **Posting note**, one line: e.g. "post as a video, the motion is the hook".

## Output shape

Keep it short. Lead with the captions; put the analysis after.

```
**Best:** <caption>

1. <caption>
   borrows <pattern> (@handle, 4.1K likes)
2. ...

Reply: <link or install line>
Note: <one line>

**What's working in your feed**
- <pattern>: @handle (likes, age), @handle (...)
- ...
```

Only show the top 3–5 viral posts in the analysis. Don't dump the full parsed
feed unless he asks.
