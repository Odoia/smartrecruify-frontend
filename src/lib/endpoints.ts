// src/lib/endpoints.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const endpoints = {
  auth: {
    signUp:    `${API_BASE}/auth/sign_up`,
    signIn:    `${API_BASE}/auth/sign_in`,
    refresh:   `${API_BASE}/auth/refresh`,
    signOut:   `${API_BASE}/auth/sign_out`,
    revoke:    `${API_BASE}/auth/refresh`, // DELETE
    me:        `${API_BASE}/me`,
  },
  education: {
    records:        `${API_BASE}/education/education_records`,
    record: (id: number) => `${API_BASE}/education/education_records/${id}`,
    courses:        `${API_BASE}/education/courses`,
    course: (id: number) => `${API_BASE}/education/courses/${id}`,
    enrollments:    `${API_BASE}/education/course_enrollments`,
    enrollment: (id: number) => `${API_BASE}/education/course_enrollments/${id}`,
    languageSkills: `${API_BASE}/education/language_skills`,
  },
  employment: {
    records:     `${API_BASE}/employment/employment_records`,
    record: (id: number) => `${API_BASE}/employment/employment_records/${id}`,
    experiences: (recordId: number) => `${API_BASE}/employment/employment_records/${recordId}/employment_experiences`,
    experience:  (recordId: number, expId: number) =>
      `${API_BASE}/employment/employment_records/${recordId}/employment_experiences/${expId}`,
  },
};
