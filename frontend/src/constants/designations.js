/**
 * Teacher designation options
 * These are the standard teaching titles used in the system
 * "Head Teacher" is the special designation for teachers listed in the top section
 */
export const DESIGNATION_OPTIONS = [
  'Assistant Teacher',
  'Senior Teacher',
  'Principle',
  'Lecturer',
  'Assistant Professor',
  'Associate Professor',
  'Professor',
  'Demonstrator',
  'Physical teacher',
  'Office staff',
  'Office assistant',
  'Seminar assistant',
  'Lab assistant',
  'Computer operator',
  'Night guard',
];

export const HEAD_TEACHER_DESIGNATION = 'Principle';

/**
 * Hierarchy tiers for the public Teachers page (top -> bottom).
 * Teachers are grouped by designation into these tiers and rendered as an
 * org-chart style layout: Principal on top, Professors next, then Lecturers,
 * then teaching staff, then everyone else.
 */
export const TEACHER_HIERARCHY = [
  { key: 'principal', title: 'Principal', designations: ['Principle', 'Principal'] },
  {
    key: 'professors',
    title: 'Professors',
    designations: ['Professor', 'Associate Professor', 'Assistant Professor'],
  },
  { key: 'lecturers', title: 'Lecturers', designations: ['Lecturer'] },
  {
    key: 'teachers',
    title: 'Teachers',
    designations: ['Senior Teacher', 'Assistant Teacher', 'Demonstrator', 'Physical teacher'],
  },
  // Anything not matched above falls into this final tier.
  { key: 'staff', title: 'Staff', designations: [] },
];

/**
 * Split a list of teachers into the hierarchy tiers above (order preserved).
 * Returns only the tiers that actually contain teachers.
 */
export const groupTeachersByHierarchy = (teachers = []) => {
  const remaining = [...teachers];
  const groups = [];

  TEACHER_HIERARCHY.forEach((tier, index) => {
    const isLast = index === TEACHER_HIERARCHY.length - 1;
    const matched = [];
    for (let i = remaining.length - 1; i >= 0; i -= 1) {
      const d = remaining[i].designation;
      if (isLast || tier.designations.includes(d)) {
        matched.unshift(remaining[i]);
        remaining.splice(i, 1);
      }
    }
    if (matched.length > 0) {
      groups.push({ ...tier, teachers: matched });
    }
  });

  return groups;
};
