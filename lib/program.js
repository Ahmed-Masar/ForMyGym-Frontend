export const PROGRAM = [
  {
    day: 1,
    label: 'Chest & Triceps',
    short: 'Chest & Triceps',
    categories: ['Chest', 'Triceps'],
    exercises: [
      'Flat Hammer Chest Press',
      'Incline Hammer Chest Press',
      'Machine Decline Chest Press',
      'Pec Deck Machine',
      'Triceps Pushdown Machine',
      'Triceps Extension Machine',
      'Low Pulley Overhead Extension',
      'Triceps Rope Pushdown',
    ],
  },
  {
    day: 2,
    label: 'Back, Biceps & Forearms',
    short: 'Back & Biceps',
    categories: ['Back', 'Biceps'],
    exercises: [
      'Lat Pulldown',
      'Close-Grip Seated Cable Row',
      'T-Bar Row',
      'Back Extension',
      'Larry Scott Curl',
      'Incline Dumbbell Curl',
      'Hammer Curl',
      'Wrist Curls',
    ],
  },
  {
    day: 3,
    label: 'Shoulders, Traps & Forearms',
    short: 'Shoulders',
    categories: ['Shoulders'],
    exercises: [
      'Machine Shoulder Press',
      'Dumbbell Lateral Raise',
      'Cable Lateral Raise',
      'Reverse Pec Deck Fly',
      'Dumbbell Shrugs',
      'Reverse Barbell Curl',
    ],
  },
  {
    day: 4,
    label: 'Legs',
    short: 'Legs',
    categories: ['Legs'],
    exercises: [
      'Leg Press',
      'Hip Adductor Machine',
      'Hip Abductor Machine',
      'Lying Leg Curl',
      'Calf Raises',
    ],
  },
];

const norm = (s) => s.toLowerCase().trim();

/* Match a logged session to the program day it most resembles,
   by overlap between the session's exercise names and each day's list. */
export function matchDay(session) {
  let best = null;
  let bestScore = 0;
  for (const day of PROGRAM) {
    const names = day.exercises.map(norm);
    const score = session.exercises.filter((ex) => {
      const n = ex.exercise?.name && norm(ex.exercise.name);
      return n && names.some((pn) => pn === n || pn.includes(n) || n.includes(pn));
    }).length;
    if (score > bestScore) { bestScore = score; best = day; }
  }
  return best;
}

/* sessions must be sorted newest-first (the API's default order).
   Returns the next program day in the rotation, plus the last session
   in which that same day was trained. */
export function getUpNext(sessions) {
  let lastDay = null;
  for (const s of sessions) {
    const day = matchDay(s);
    if (day) { lastDay = day; break; }
  }
  const next = lastDay ? PROGRAM[lastDay.day % PROGRAM.length] : PROGRAM[0];
  const lastTrained = sessions.find((s) => matchDay(s)?.day === next.day) ?? null;
  return { next, lastDay, lastTrained };
}

/* Most recent logged sets for an exercise, optionally skipping one date
   (so "last time" while editing today doesn't return today itself).
   sessions must be sorted newest-first. */
export function getLastLog(sessions, exerciseId, excludeDateKey) {
  for (const s of sessions) {
    const key = new Date(s.date).toISOString().slice(0, 10);
    if (excludeDateKey && key === excludeDateKey) continue;
    const entry = s.exercises.find((e) => (e.exercise?._id ?? e.exercise) === exerciseId);
    if (entry && entry.sets.length) return { date: s.date, sets: entry.sets };
  }
  return null;
}
