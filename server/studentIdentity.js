export const normalizeCollegeEmail = email => {
  const normalized = String(email || '').trim().toLowerCase();
  return /^[^@\s]+@act\.edu\.in$/.test(normalized) ? normalized : null;
};

export const getVerifiedStudentIdentity = authUser => {
  if (!authUser || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(authUser.id || '')
    || !authUser.email_confirmed_at) {
    return null;
  }
  const email = normalizeCollegeEmail(authUser.email);
  return email ? { id: authUser.id, email } : null;
};
