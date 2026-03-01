export const calculateStrength = (password: string) => {
  let score = 0;
  
  // Length is critical
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Complexity
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (hasUpper && hasLower) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecial) score += 1;

  return Math.min(score, 5); // Max 5 segments
};
