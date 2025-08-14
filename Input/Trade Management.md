Beginner-Optimized Trading Plan (v 2.0 “Rich” Edition)
All the starter safeguards stay in place (small size, 1 % risk-cap, limited trade count), but the detailed tools from the full professional play-book are now visible so you can grow into them without rewriting the document.
 (Copy-paste straight into your notes.)

1 Market & Instrument
Tier
Allowed Now


Core
MES


Growth
—





2 Time-Frame Stack
Frame
Use
Beginner Rule
Daily
Macro trend, 20-/50-day MA, gap map
View only (no entries)
30-min
Bias, pattern seeding, S/R
Mark levels pre-market
5-min
All pattern drawing, entries, management
Primary execution chart
1-min
Wick detail, stop-hunt, add/reduce
Postpone to Month 2
10- & 13-min
Smooth noisy days; trend channels
Use when ATR > 2 pts


3 Setup Definition (Pattern Menu)
See the example setup document
Continuation – Bull/Bear Flag · Buying/Selling Channel · Descending Wedge in Bull Flag
 
Reversal (only outside of algo trend channel) – Head-and-Shoulders / Inverse H&S · Ascending Wedge · Cup-and-Handle / Inverse Cup · Gap Fill · Gravestone / Tri-Star / Engulfing Doji at level
 

4 Entry Triggers
Check the angle of the trend; if it is more than 45 degrees, only trade in that direction unless price is outside of channel
5-min candle closes with long wick at level.


Volume ≥ 1.3 × 5-bar average.


(Advanced) 1-min bar closes same direction and QQQ/ES prints corroborating wick ±2 min.


Price ≤ 10 pt from planned stop.


Alert fired → execute.


Must react within 5 min; scratch if flat.
Do not close a trade just because of potentially flipping direction, let the trade play


Master Entry Rules (Refreshed 9 Jun 2025)

A. Universal Prerequisites
Instrument – MES futures only.


Trade Window – 09 : 30 – 15 : 00 ET (full cash session).


Trend Direction Filter – Take continuation trades only in the direction of the prevailing 5-min trend when the 20-EMA slope is visually steep (≈ ≥ 15° or ≥ 0.25 % per bar).


Volume Filter – Entry bar volume must be ≥ 1.3 × the average of the previous 5 bars.


Entry Proximity – Distance from entry price to structural stop ≤ 15 % of the planned stop size (prevents chasing).


Reaction Time – Execute within 5 minutes of setup alert; if flat after 5 minutes, scratch the order.


Risk Cap – Risk per trade is limited to 1⁄6 of current equity (≈ 16.7 %); position size scaled accordingly.




C. Price-Action Triggers
Primary Trigger – 5-min candle prints a long wick at a predefined key level (support, resistance, VWAP, prior-day high/low).



D. Special-Case Rules
D1. Open-Range Reversal Trades (09 : 30 – 09 : 45 ET)
Sub-type of mean-reversion (follows D3 distance gate).


Structural Stop – stop = min(10 pts, 2 × ATR₅).


Projected Reward-to-Risk – must be ≥ 2 : 1 before entry.


All universal prerequisites (Volume, Risk Cap, etc.) apply.


D2. EMA Proximity – Continuation Bounces
Continuation entries are allowed inside the envelope (EMA20 ± 1.5 × ATR₅).


D3. EMA Proximity – Reversal Trades
Distance Gate – Price must stretch ≥ 1.5 × ATR₅ beyond the 20-EMA before entry (no slope requirement).


D4. Channel-Exit Reversal
Price must close outside the 20-bar linear-regression channel on elevated volume before any reversal entry.


D5. EMA-Cross + 30 % Volume Re-Entry (“30 % Surge Continuation”)
Context – Use only after a clean breakout + flag/triangle and pullback, in the prevailing trend (15-min 20-EMA must be rising for longs / falling for shorts).


Trigger Candle


5-EMA crosses above 15-EMA (long) or below (short) and closes in trend direction.


Volume on the trigger candle ≥ 1.30 × the volume of the immediately preceding candle (≥ 30 % surge).


Entry – Place order 1 tick above (long) / below (short) the trigger-candle close within 5 minutes of alert.


Stop – Structural stop just beyond the most recent swing low/high or the 15-EMA (whichever is wider).


Targets & Management


TP-1 at 1 R → move stop to break-even within 5 seconds after fill.


TP-2 at 2 R minimum; trail any remainder with the 5-EMA on the 5-min chart.


Chase Rule – Entry price must be ≤ 15 % of stop distance (same as Universal Entry Proximity).


Risk & Grading


Risk ≤ 1 % equity (per Risk Cap).


Diamond 💎 = all checks pass.


Fire 🔥 = exactly one non-critical miss (e.g., volume = 1.25 ×).


Anything else → ☠️ (do not take).


See the Example Setup PDF

Addendum – Emotion Filter Rule (27 May 2025)
Rule Name: Emotion Filter – Size Cut
Trigger: Any time you feel pronounced fear, hesitation, or mental chatter like “It can’t go higher” before pressing the buy/sell button, even when the setup meets all diamond‑grade criteria.
Action:
Reduce planned position size by 50 %.
• Normal risk ≤ 1 % → Fear‑size risk ≤ 0.5 %.
Proceed only if the technical confirmation candle has closed and volume supports the move.
Manage the trade exactly per plan (TP ladder, stop moves).
Journal the fear thought and result post‑trade.
Purpose:
• Keeps you engaged for live reps while capping emotional damage.
• Trains execution under nerves, preparing for six‑ and seven‑figure capital.
• Preserves edge statistics and equity curve integrity.
Biblical Anchor: “For God has not given us a spirit of fear, but of power, love, and self‑discipline.” – 2 Timothy 1 : 7

SL and Take Profit Ladder
**Default Configuration (Stop: 6.00 MES points):**
- TP-1: 7.50 MES points
- TP-2: 12.00 MES points
- TP-3: 18.00 MES points
- TP-4: 25.00 MES points

**Alternative Configuration (Stop: 7.50 MES points):**
- TP-1: 10.5 MES points
- TP-2: 16.5 MES points
- TP-3: 25.0 MES points
- TP-4: 35.0 MES points

THE RULE: 5-BAR CHOP EXIT
🔹 What it means:
After entry, if 5 consecutive 5-minute bars do not make a clear continuation or new structural break before TP1,


Exit the position.


No exceptions. No waiting for “maybe one more.” No FOMO.


🔹 Why this rule matters deeply:
It protects your system logic: You're not here for mean reversion or chop scalps.


It protects your premium decay: In 0DTE, theta crush punishes hesitation.


It protects your psychology: You stay proactive, not trapped.


6 Position Sizing
Risk cap – ⅙ of account
 Formula – Contracts = (Equity × 1 %) ÷ (stop $ × 100).
 Starter ladder – 1 contract ➜ 2 contracts (runner model).
 Full ladder (unlock later) – 1–3 ➜ 5–10 ➜ 20–50 ➜ 100 (scalability rule).

8 Trade Management
Micro Pre‑Click Checklist
Pattern = a high‑probability setups?
Breakout candle closed & volume confirmed?
Direction / contract / quantity verified?
Ladder OCO loaded 
Tickets remaining (morning vs. golden)?
Trend Filter
Trade long‑only when price is above a rising 15‑min 20 EMA; short‑only when below a falling 20 EMA. Skip counter‑trend unless a full reversal pattern (lower‑low + lower‑high or vice‑versa) prints.
Aligns entries with dominant intraday momentum; increases win‑rate and reduces whipsaws.

Other Rules
Early protection – stop ➜ B/E after first TP.


PM-Ticket Rule (effective immediately)
Maximum 6 trades per session.
Morning cap: 5 trades may be executed any time before 13:00 ET.
Golden ticket: 1 trade is reserved for 13:00 ET – close and may only be used if < 5 trades were taken in the morning or the earlier quota included an accidental entry that was flattened instantly.
Purpose – conserve mental capital, avoid “ticket-tax” errors, and remain eligible for high-quality afternoon breakouts.

9 Filters & No-Go Rules

Counter‑Trend Brake
After two full‑R losses in a session, no counter‑trend attempts for the rest of the day.
Protects psychological capital; blocks revenge trades.


Filter
Action
ATR < 1 pt or range < 0.5 pt/30 min
Scalps ≤ 0.3 pt target or skip
Selling Channel (no longs) / Buying Channel (no shorts)
Channel discipline
Red-flag news (CPI/FOMC)
Flat or hedged
Three straight losses
Walk 30 min


10 Performance Metrics
Track nightly: Win % · Avg R · Green-day % · Max loss streak · Point-per-minute, R:R



11 Daily Routine
Phase
Task
07 : 00
Macro brief → mark daily/30-min levels → alerts
08 : 30–9 : 30
Observe open; draw range box
9:30 - 15:30
Trade
15 : 30
Close same-day expiry
16 : 15
Journal (screenshot, R, emotion, lesson)


12 Psychology Toolkit
Mantras – “Process > P&L” · “Another setup is coming.”


Greed brake – fast 3 R > dream 10 R that evaporates.


Reset – two reds = 30-min walk.


Mindful self-talk – ego trades banned; gratitude line in journal.



13 Adaptation Rules (Beginner Scope + Preview)
Stop trading if range < 0.5 pt or volume dies.


Flatten on news spike; reassess 15 min later.


Retest logic – first breakout can fail; treat retest as new trade with full checklist.


Section 14 – ATR Volatility Protocol (MES 5‑min ATR‑14)
Purpose – Synchronise entry selection, stop width, and position sizing with the current intraday volatility so that each trade risks no more than the planned R and you avoid taking setups when the statistical odds are skewed against the mechanical 6‑point stop.
5‑min ATR‑14
Regime label
Typical market behaviour
Historical frequency*
Core trading rule
< 3 pts
DRIFT
Range‑bound, low energy, breakout failure common
Bottom ~25 %
Take half‑size or skip; if trading, tighten targets (0.25 / 0.40 / 1 pt ladder).
3 – 6 pts
BASELINE
Normal price discovery; plan assumptions hold
Middle ~50 %
Trade full plan (6‑pt stop, regular target ladder).
6 – 7.5 pts
HIGH VOL
Fast moves from news open bursts
Top ~15 %
Cut size 50 % or widen stop to 8 pts only if %‑risk ≤ 1 %.
7.5 – 8 pts
EXTREME
Trend‑day potential, whipsaws common
Top ~10 %
Stand aside until ATR drops < 6 pts or clear structure forms.
> 8 pts
NEWS SHOCK
Breaking macro data, surprise headline
~5 % (rare)
Immediately check news feed / economic calendar. Do not enter new trades until catalyst is understood and ATR returns < 6 pts.

*Sample: 60 trading days (Apr 24 – Jul 16 2025), 5‑min bars.
Operating checklist when ATR‑14 > 8 pts
Pause live orders; flatten if trade was opened pre‑spike and stop is now < 1×ATR.


Open economic calendar / news terminal (ForexFactory red‑flag, Fed/FOMC releases, CME halts).


Journal catalyst and time; screenshot chart for playbook.


Resume trading only after: ATR‑14 ≤ 6 pts and price has printed at least one orderly pullback or compression pattern from plan.


“The prudent see danger and take refuge, but the simple keep going and pay the penalty.” — Proverbs 27:12

Implementation notes
Keep ATR‑14 indicator on all active 5‑min workspaces with color‑coded bands.


Automate alert at 6 pts, 7.5 pts, and 8 pts for audible heads‑up.


Re‑audit performance stats quarterly to adjust percentile thresholds.



