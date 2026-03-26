const ROLE_LABELS = {
  student: "Student",
  teaching_staff: "Teaching Staff",
  non_teaching_staff: "Non-Teaching Staff",
  admin: "Admin",
};

const ROLE_STYLES = {
  student: "bg-cyan-100 text-cyan-700",
  teaching_staff: "bg-violet-100 text-violet-700",
  non_teaching_staff: "bg-teal-100 text-teal-700",
  admin: "bg-rose-100 text-rose-700",
};

function RoleBadge({ role }) {
  const tone = ROLE_STYLES[role] || ROLE_STYLES.student;

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{ROLE_LABELS[role] || role}</span>;
}

export default RoleBadge;
