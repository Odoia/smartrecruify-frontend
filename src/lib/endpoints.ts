// src/lib/endpoints.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const endpoints = {
  auth: {
    signUp:  `${API_BASE}/auth/sign_up`,
    signIn:  `${API_BASE}/auth/sign_in`,
    refresh: `${API_BASE}/auth/refresh`,
    signOut: `${API_BASE}/auth/sign_out`,
    revoke:  `${API_BASE}/auth/refresh`, // DELETE
    me:      `${API_BASE}/me`,
  },

  // upload de PDF (multipart/form-data) — use diretamente endpoints.documents
  documents: `${API_BASE}/documents`,

  education: {
    records:                 `${API_BASE}/education/education_records`,
    record:        (id: number | string) => `${API_BASE}/education/education_records/${id}`,

    courses:                 `${API_BASE}/education/courses`,
    course:        (id: number | string) => `${API_BASE}/education/courses/${id}`,

    enrollments:             `${API_BASE}/education/course_enrollments`,        // index/create
    enrollment:    (id: number | string) => `${API_BASE}/education/course_enrollments/${id}`, // show/update/destroy

    languageSkills:          `${API_BASE}/education/language_skills`,          // index/create
    languageSkill: (id: number | string) => `${API_BASE}/education/language_skills/${id}`,    // update/destroy
  },

  employment: {
    records:                 `${API_BASE}/employment/employment_records`,
    record:       (id: number | string) => `${API_BASE}/employment/employment_records/${id}`,

    // nested para listar/criar experiências de um employment_record específico
    experiences:  (recordId: number | string) =>
      `${API_BASE}/employment/employment_records/${recordId}/employment_experiences`,

    // flat para atualizar/deletar uma experiência por ID (bate com o controller)
    experienceById: (id: number | string) =>
      `${API_BASE}/employment/employment_experiences/${id}`,
  },
} as const;
