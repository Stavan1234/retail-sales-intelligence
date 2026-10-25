import { redirect } from "next/navigation";

// Kept so older links keep working after the pages were reorganised by syllabus module.
export default function LegacyRoute() {
  redirect("/hypothesis-tests");
}
