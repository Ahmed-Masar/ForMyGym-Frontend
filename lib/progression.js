/* ─────────────────────────────────────────────────────────────
   Double progression — the "ready to progress" logic.

   Idea: hold the weight, hit a rep target across a number of sets,
   repeat it for N consecutive sessions, THEN it's time to add weight.
   The app only *flags* it — the user always decides whether to load up.
   ───────────────────────────────────────────────────────────── */

// Smart defaults by muscle size. Small muscles want higher reps; big
// compound lifts progress at lower reps. Used only until the user sets
// their own target on an exercise (stored values always win).
const SMALL   = ['Core', 'Cardio'];                 // + forearms live in their own tracker
const MEDIUM  = ['Shoulders', 'Biceps', 'Triceps'];
// everything else (Chest, Back, Legs, Other) → large/compound

export function defaultTarget(category) {
  if (SMALL.includes(category))  return { reps: 15, sets: 3, sessions: 3 };
  if (MEDIUM.includes(category)) return { reps: 10, sets: 3, sessions: 3 };
  return { reps: 8, sets: 3, sessions: 3 };
}

// The concrete target for an exercise: stored values override the default.
export function targetFor(exercise) {
  const d = defaultTarget(exercise?.category ?? 'Other');
  return {
    reps:     exercise?.targetReps       ?? d.reps,
    sets:     exercise?.targetSets       ?? d.sets,
    sessions: exercise?.requiredSessions ?? d.sessions,
  };
}

// The weight at which this session hit the target, or null if it didn't.
// "Hit" = at least `sets` sets reached `reps`; the achieved weight is the
// lightest of the heaviest qualifying sets (i.e. the weight you truly
// completed all the required sets at).
function achievedWeight(sets, target) {
  const hitting = sets.filter((s) => s.reps >= target.reps);
  if (hitting.length < target.sets) return null;
  const weights = hitting.map((s) => s.weight).sort((a, b) => b - a); // heaviest first
  return weights[target.sets - 1];
}

// Pull this exercise's sets out of a populated session.
function setsFor(session, exerciseId) {
  const entry = session.exercises.find((e) => (e.exercise?._id ?? e.exercise) === exerciseId);
  return entry ? entry.sets : null;
}

/* Returns the progression status for an exercise.
   sessions must be newest-first (the API's default order).

   { streak, need, weight, ready }
   - streak : consecutive most-recent sessions that hit the target at `weight`
   - need   : sessions required before it's "ready"
   - weight : the working weight the streak is being counted at (null if none)
   - ready  : streak >= need
   The streak resets when a session misses the target, and restarts at a new
   weight if the user has already loaded up. */
export function progressStatus(exercise, sessions) {
  const target = targetFor(exercise);
  let streak = 0;
  let weight = null;

  for (const session of sessions) {
    const sets = setsFor(session, exercise._id);
    if (!sets || !sets.length) continue; // this exercise wasn't trained that day — skip
    const a = achievedWeight(sets, target);
    if (a === null) break;                // most recent qualifying run is broken → streak stops
    if (weight === null) { weight = a; streak = 1; }
    else if (a === weight) { streak += 1; }
    else break;                           // different weight (loaded up or dropped) → streak stops
  }

  return { streak, need: target.sessions, weight, ready: weight !== null && streak >= target.sessions };
}

/* ── Estimated 1-rep max (Epley) ──
   e1RM = w · (1 + reps/30). Reps are capped at 12 — beyond that the formula
   drifts, and a 20-rep set says more about endurance than max strength. */
export function e1RM(weight, reps) {
  if (!weight || !reps) return 0;
  const r = Math.min(reps, 12);
  return weight * (1 + r / 30);
}

// Best estimated 1RM across a list of sets.
export function bestE1RM(sets) {
  if (!sets?.length) return 0;
  return Math.max(...sets.map((s) => e1RM(s.weight, s.reps)));
}
