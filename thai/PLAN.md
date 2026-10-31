# Learn Thai: the plan

A Thai learning app, built first for Sofia (7), lives at `/thai/` next to the village.
It is a learning app first: real photos, a native-quality Thai voice, and
proper spaced practice. The games and rewards are there to keep her coming back.

The full word list is in [VOCABULARY.md](VOCABULARY.md): **29 chapters, 353 words and
phrases**, generated from `src/thai/data/chapters.js`.

---

## 1. What the research says, and what we do about it

Sources are linked. Where something is my own reading rather than a finding, it says so.

| Finding | What the app does |
|---|---|
| Picture + sound + word together helps 8-year-olds remember foreign words, up to 6 months later ([Springer 2020](https://link.springer.com/article/10.1007/s10648-020-09527-z)). | Every word has a photo, Thai script, pronunciation and English. Every tap plays the voice. |
| Spaced practice beat massed practice in Grade 3 ([EUR](https://repub.eur.nl/pub/67956)). Recalling a word beats recognising it ([Frontiers 2023](https://www.frontiersin.org/journals/developmental-psychology/articles/10.3389/fdpys.2023.1270938/full)). | A spaced-repetition queue sits behind every game, and the games move from recognising a word to producing it. |
| 8–9-year-olds learn much worse from negative feedback than from positive feedback ([J Neurosci 2008](https://doi.org/10.1523/JNEUROSCI.1485-08.2008)). Duolingo dropped hearts partly because beginners ran out mid-lesson. | **No lives, no hearts, no game over.** A wrong answer greys out, plays the right word, and she tries again. It costs a couple of points (a parent decision, so guessing never pays), but the wallet never goes below zero, and stickers and levels never go down. |
| Expected, tangible rewards can undermine a child's own motivation. Unexpected rewards and positive feedback do not ([Deci, Koestner & Ryan meta-analysis](https://home.ubalt.edu/ntygmitc/642/Articles%20syllabus/Deci%20Koestner%20Ryan%20meta%20IM%20psy%20bull%2099.pdf)). | Points show progress. Some stickers drop as **surprises**. Praise is specific ("You heard the tone!"). |
| Streaks have no controlled research with children, only reports of kids getting upset. | A **forgiving streak**: it counts days learned this week, nothing is ever "lost", and nothing nags. |
| Kids' apps all land on 5–7 minute sessions (Monkey Junior, Drops). | **Today's Lesson** takes about 6 minutes and ends at a clear stopping point. Free play stays open. |
| Under-5s struggle with drag-and-drop. Taps are easy ([Anthony et al.](https://lisa-anthony.com/wp-content/uploads/2013/04/anthony-et-al-jpuc2013.pdf)). | Everything works by tapping. Drag games also accept tap-then-tap. |
| Speech recognition is worse on children's voices ([ISCA](https://www.isca-archive.org/interspeech_2005/darcy05_interspeech.html)). | "Say it" is record-and-compare, never scored. The AI conversation is for practice, not grading. |
| RTGS romanisation ("ph", "th", "kh") gets misread by English speakers (as in "Phuket"). | A simplified Paiboon-style romanisation with tone marks: ไก่ = **gài**. It shows small under the Thai and can be switched off. |

### What successful apps do

| App | What we take from it |
|---|---|
| **Duolingo ABC** | A path of short units that keeps cycling back to earlier ones. Celebrations at the end of a lesson. |
| **Drops** (has Thai) | Photo-like visuals, audio on every word, 5-minute sessions, a script mode. |
| **Gus on the Go** | Tap a picture to hear it, then a review game unlocks. Simple trophies. |
| **Dinolingo** (has Thai) | Points per activity (book 25, game 75, test 100), badges, collectible characters. |
| **Khan Academy Kids** | An adaptive path, narrated stories that highlight each word, collectibles for characters. |
| **Monkey Junior** | Whole-word flashcards, then multisensory games, then review. One lesson a day. |

Duolingo has no Thai course for English speakers, and I couldn't find a Studycat Thai app.
**For a 7-year-old learning Thai there's a real gap.** Drops and Dinolingo are the closest.

---

## 2. Content

### How the words were chosen

Raw frequency lists are mostly little grammar words (กับ "with", ที่, เป็น) that can't be pictured.
So, following what teachers and other apps do:

1. **The most common phrases first.** สวัสดีค่ะ, ขอบคุณค่ะ, ใช่, ไม่ใช่, ไม่เป็นไร. The little words are taught *inside* phrases.
2. **Then high-frequency, easy-to-picture words a child actually uses.** Family, animals, food, body, colours, numbers, actions, feelings.
3. **Something fun every few chapters.** Magic & make-believe comes at chapter 10, not 28.
4. **Thai life, not translated English.** Tuk-tuk, tom yum, ลูกชิ้น, durian, the temple, Songkran, Loy Krathong, bubble tea, 555.

Still to do: once the network allows, cross-check against the Champaiboon (2016) children's textbook
frequency list and the Grade 1 คำพื้นฐาน lists, and tag every word with its rank.

### Written the way Sofia speaks

- Statements end in **ค่ะ (kâ)** and questions in **คะ (ká)**, as a girl says them. The app points out the difference.
- She calls herself **หนู (nǒo)**, as Thai children do with adults.
- Personal phrases: หนูชื่อโซเฟียค่ะ ("My name is Sofia"), หนูอายุเจ็ดขวบค่ะ ("I'm seven").

### Chapters

Six lands, 29 chapters, about 12 words each:

| Land | Chapters |
|---|---|
| 1 First Steps | Hello! · My Family · Pets & Farm · Little Words · Yummy Food |
| 2 Count & Colour | Numbers 0–10 · Colours · Fruit · My Body · Magic & Make-Believe |
| 3 My Day | Feelings · Doing Things · Snacks & Drinks · At Home · Wild Animals |
| 4 Out & About | Toys & Play · Clothes · Things I Can Say · Things That Go · Bugs & Birds |
| 5 Big Wide World | More Doing Things · School · Places · Vegetables · Under the Sea |
| 6 Wonder World | Sky & Weather · Nature · Jobs · Parties & Festivals |

**Fun facts** sit on 55 cards, mostly literal meanings, which kids love and which help memory:
ผีเสื้อ butterfly = "ghost shirt", รถไฟ train = "fire car", ไข่ดาว = "star egg",
แมวน้ำ seal = "water cat", ดอกไม้ไฟ = "fire flowers", and 555 means "hahaha".

**Later chapters:** the Thai alphabet (ก ไก่ … ฮ นกฮูก, the way Thai children learn it, and
many of its keywords are already in the list), time and days (each Thai day has its own colour),
opposites, numbers to 100, food ordering, a "grown-up" phrase pack.

---

## 3. Pictures: real photos

- **Pexels**, the main source. Free, no attribution required, high quality, a simple API with a free key.
- **Pixabay**, the second source, for words that are hard to photograph. It also has illustrations.
- **Numbers and colours are drawn, not photographed.** A colour is a paint swatch, and a number is counted dots with the digit and the Thai numeral (๓). Photos would be ambiguous: is that "red" or "apple"?

**The pipeline** (`npm run thai:photos`):

1. Search each word with its own query (`q` in the data, so "hello" finds a Thai *wai*, not a phone) and keep 8 candidates.
2. Build contact sheets. **I review every word visually and pick the clearest, child-appropriate photo.** You can override any pick in `thai/photos/picks.json`.
3. Download the picks, crop them square, resize to 480 px WebP (about 30 KB each, about 10 MB in all), and commit them, so the app works offline and never hotlinks.
4. Write a credits page with photographer and link. Pexels doesn't require one, but it's good manners and Pixabay asks for it.
5. A check fails the build if any word is missing its photo.

**Spelling on every picture:** every photo carries its Thai word and pronunciation. The one exception is while
the picture *is* the question (Listen & Find, the picture side of a memory card). Then the label
appears the moment she answers.

The 3D emoji set I found is now used only for decoration: stickers, chapter badges, the mascot.
Never for a word.

---

## 4. The Thai voice: OpenAI

- **Every word, phrase and praise line is pre-rendered once** with OpenAI text-to-speech (`gpt-4o-mini-tts`, a warm female voice, told to speak slowly and clearly for a child). The mp3s are committed. No API key in the browser, no wait mid-game, no cost per play. The village's voices work the same way.
- **Done: 362 clips, voice `marin`.** Picked by testing four voices on tone pairs (หมา/ม้า, เสือ/เสื้อ, ไก่/ไข่…): marin 17/18, nova 16, sage 15, coral 13. Re-running only renders lines whose text changed.
- **Check results:** 359 of 362 transcribe back to the right word (failed clips are re-rendered up to 3 more times automatically). Three still want a human listen: นางเงือก, แม่มด, ว่าว.
- **🐢 Slow button:** plays the same clip at 70% speed with the pitch kept.
- **Automatic check:** each clip is transcribed back (OpenAI speech-to-text, Thai) and compared to the expected word. Mismatches are flagged for re-rendering.
- **Human check:** research says to have a native speaker spot-check tones and ค่ะ/คะ. A Thai teacher or nanny listening for 20 minutes would catch what the machine check can't.
- **Fallback:** until the clips exist, the phone's built-in Thai voice is used (good on iPhone, OK on Android), so the app works from day one.

---

## 5. Games

Each chapter has a **Learn** deck and six games. Each game trains something different:

| Game | How it plays | What it trains |
|---|---|---|
| 📖 **Learn** | Swipe through photo cards. Tap to hear, 🐢 to hear it slowly, a fun fact on the back. | First meeting with a word |
| 🃏 **Memory Match** | Flip cards to pair a Thai word card (ไก่ · gài) with its photo. Both speak when flipped. When a pair matches, the photo shows its spelling. | Word ↔ picture ↔ sound |
| 👂 **Listen & Find** | Hear a word, tap the right photo out of 3, then 4. | Listening, the core skill |
| 🫧 **Bubble Pop** | Photos float up in bubbles. Pop the one you hear. No timer pressure. | Fast listening, pure fun |
| 🔤 **Read It** | See a photo, tap the right Thai word out of 3. Romanisation can be hidden for a harder level. | Reading Thai script |
| ✅ **ใช่ or ไม่ใช่?** | A photo and a word: is it right? Quick rounds. | Speed, and teaches ใช่/ไม่ใช่ by using them |

**Phase 2 games:**

- 🎵 **Tone Twins.** Thai minimal pairs: หมา dog / ม้า horse, เสือ tiger / เสื้อ shirt, ไก่ chicken / ไข่ egg, ข้าว rice / ขาว white, ปลา fish / ป่า forest. This is the single most Thai-specific skill.
- 🎤 **Say It.** Hear the word, record yourself, play both back. Never scored.
- 🐘 **Feed the Elephant.** Tap or drag the food you hear to the elephant.
- 🚃 **Word Train.** Build a phrase from word carriages: หนู + ชอบ + มะม่วง.
- 📚 **Story Time.** Short illustrated stories made only from words she knows, read aloud with each word highlighted.

---

## 6. Points, rewards and progress

**Points ⭐:**

| Action | Points |
|---|---|
| Right first time | +10 (+4 if the word is already mastered and not due for review) |
| Right on a retry | +3 |
| **Wrong answer** | **−2** (grown-up setting, 0–10) |
| 5 in a row | +10 combo bonus |
| Memory pair | +5 (Memory never subtracts: wrong flips are how the game is played) |
| New card in Learn | +2, and +10 for finishing a chapter's deck the first time |
| Finishing a game | +20, or +30 when perfect, halved for each repeat of the same game that day |
| Today's Lesson | +20 once a day |
| A turn in the AI conversation | +5 (phase 2) |

### Swapping points for Robux

Points are a real currency, so the rules are built to resist farming:

- **Two totals.** The *wallet* goes up with right answers, down a little with wrong ones, and down when she swaps. *All-time points* never go down and drive stickers and levels, so a bad round never takes a sticker away.
- **Replays pay less:** mastered words pay 4 instead of 10, and round bonuses halve with each repeat on the same day. There's an optional **daily cap**.
- **The rate is yours to set** in the Grown-ups area: "X points = Y Robux". The reward name can be changed too. Until it's set, she sees "not set yet, keep collecting".
- **Sofia asks, a grown-up approves.** She taps "10 Robux for 100 points". The points are set aside and the request waits in the Grown-ups area (with a badge on the tab). Approve to confirm; decline gives the points back. The app only keeps the ledger. Buying the Robux is up to you.
- The Grown-ups area is behind a **4-digit PIN**, chosen on first visit.

**Chapter stars (0–3):**

- ⭐ finish the Learn deck
- ⭐⭐ finish any 2 games
- ⭐⭐⭐ master every word (each recalled correctly on 3 separate days)

**The next chapter unlocks at ⭐⭐**, so she always has somewhere new to go quickly. A parent can unlock everything.

**Other rewards:**

- **Sticker book:** a sticker every 150 points, plus occasional surprise "mystery stickers". Stickers are Thai-themed: elephant, tuk-tuk, mango sticky rice, lotus.
- **Daily goal:** a ring that fills at 100 points. Streak is days-this-week, never lost.
- **Levels** from total points, with a little ceremony on each level-up.
- **Mascot: ครูมะลิ (Khru Mali)**, an elephant teacher who cheers in Thai (เก่งมาก! เยี่ยมเลย!). She picks up praise words without trying.

### Spaced repetition

Every word sits in a Leitner box from 0 to 5. Each box is reviewed after a longer gap: now, 10 minutes, 1 day, 3 days, 1 week, 3 weeks.

- A right answer moves the word up a box, but only once it's due, so drilling doesn't fake progress.
- A wrong answer drops it back to box 1.
- Games pick words that are due or weak first, and every game slips in 1–2 review words from earlier chapters.
- **Today's Lesson** = 4 new words + due reviews + one game, about 6 minutes.
- **Practice** mixes due words from every chapter she has unlocked.

---

## 7. Talking with AI (OpenAI Realtime)

The "low-lag" OpenAI feature is the **Realtime API**: live speech-to-speech with natural
turn-taking. Your key has `gpt-realtime-2.1` (the newest) and a cheaper `gpt-realtime-2.1-mini`.
We'll try both on Thai and pick by ear.

**How it works, keeping the key safe:**

1. The app asks our own tiny endpoint, `/api/realtime-token` (a Vercel function), for a session. The endpoint holds `OPENAI_API_KEY` and returns a **short-lived token**. The real key never reaches the browser.
2. The browser connects straight to OpenAI over **WebRTC** with that token. Her microphone goes in, and Khru Mali's voice and a live transcript come out.
3. The endpoint is protected by a family passcode, so a stranger who finds the URL can't spend your credits.

**What the conversation is like:**

- **Khru Mali**, a warm Thai teacher. Short sentences, slow speech, one question at a time, lots of praise.
- English help only when Sofia is stuck. A parent setting controls how much.
- **She's given the list of words Sofia already knows**, so she talks just above Sofia's level, which is how language is actually acquired.
- **Role-play scenes** unlock with chapters:
  - Meet a new friend (Hello, Family)
  - Buy fruit at the market (Fruit, Little Words, how much?)
  - Order at a restaurant (Food, อร่อยมาก)
  - A trip to the zoo (Wild Animals)
  - Show and tell about a toy (Colours, Numbers, Toys)
  - Free chat
- Points for every turn she speaks. The transcript shows Thai, with a tap to hear any line again.

**Safety and cost:**

- The tutor instructions keep it child-safe and on-topic. It never asks for personal details beyond her first name.
- Nothing is recorded or stored by us. OpenAI doesn't train on API data by default.
- Start it from the parent area or a daily time window, with a **daily minutes cap** (default 10).
- Set a monthly budget on the OpenAI project too. Realtime costs noticeably more per minute than the word audio.
- Keep it a parent-supervised family app, and check OpenAI's current terms for apps used by children.

---

## 8. Parent area

Behind a 4-digit PIN:

- **Swap requests** to approve or decline.
- **Points & swap rate:** the rate, the reward name, the wrong-answer penalty, an optional daily cap.
- **Learning:** show/hide pronunciation (on by default), show/hide English, sound, unlock every chapter, the learner's name.
- **Progress:** points earned and lost per day, right/wrong counts, words seen and mastered per chapter.
- **Voice & pictures:** how many clips and photos are installed.
- **Reset:** change PIN, erase progress (settings stay).

---

## 9. How it's built

```
thai/index.html            second Vite page → served at /thai/
thai/PLAN.md               this file
thai/VOCABULARY.md         generated word list
src/thai/data/chapters.js  every word: Thai, pronunciation, English, photo query, fun fact
src/thai/                  app: plain JS + CSS like the village, no framework
  core/                    save, points, spaced repetition, audio, router
  games/                   one file per game
  ui/                      home map, chapter screen, results, stickers, parent area
public/thai/img/           curated photos (webp)
public/thai/audio/         OpenAI clips + manifest.json
api/realtime-token.js      Vercel function: mints Realtime tokens (phase 2)
scripts/
  thai-vocab-md.mjs        writes VOCABULARY.md
  thai-photos.mjs          search → contact sheets → picks → download
  generate-thai-audio.mjs  OpenAI TTS pre-render + transcription check
  check-thai.mjs           fast data checks (ids, photos, audio, duplicates)
  smoke-thai.mjs           headless phone-sized playthrough of every game
```

- **Phone first:** big tap targets, works one-handed, installable to the home screen (PWA), and works offline except the AI chat.
- **Thai font: Mali.** Rounded and friendly, and keeps the loops on Thai letters, which matters when learning to read. It's self-hosted.
- **Save:** on the device, like the village. Sync between devices is a later conversation.

---

## 10. Phases

**Phase 1: the learning app**

- ✅ App shell, home path, chapter screens, all 29 chapters
- ✅ Learn + five games, points (with −2 for wrong answers), stars, stickers, daily goal, spaced repetition
- ✅ Swap points for Robux with grown-up approval, PIN-protected Grown-ups area
- ✅ OpenAI voice for every word, plus the transcription check
- ✅ PWA (installable, offline), data checks and a phone-sized playthrough test
- ⏳ Curated photos for every word: the script is ready, waiting on a Pexels API key

**Phase 2: talk and tones**

- AI conversation with Khru Mali (Realtime), the role-play scenes, the passcode and time limits
- Tone Twins, Say It, Feed the Elephant
- Profiles, so Dad can learn too (ครับ versions of the phrases)

**Phase 3: read and grow**

- Alphabet chapter (ก ไก่), Word Train, Story Time
- More chapters, a native-speaker review pass, frequency ranks from the Champaiboon list
- Optional sync between devices

---

## 11. What I need from you

1. ~~Allow the OpenAI and photo domains in the cloud environment.~~ Done.
2. **A free Pexels API key** (pexels.com/api). A Pixabay key too if you have one (pixabay.com/api/docs).
3. **For the AI conversation:** in Vercel, add `OPENAI_API_KEY` and a family passcode `CHAT_PASSCODE` as environment variables.
4. **A Thai speaker for a 20-minute listen-through** once the audio exists.
5. **Rotate the OpenAI key when we're done.** It's in this chat's transcript.

## 12. Decisions so far

- Buttons and instructions in **English**. Sofia reads, so instructions are on screen, not spoken.
- **Pronunciation shown by default**, with a toggle in the Grown-ups area.
- **Points can be swapped for Robux** at a rate set later. Wrong answers cost a little.

Still open: should the village link to the Thai app, or should they stay separate?
