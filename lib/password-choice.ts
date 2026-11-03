/** The invited person chooses the password. The app never invents one. */
export function passwordChoiceError(
  password: string,
  confirm: string,
): "short" | "mismatch" | null {
  if (password.length < 8) return "short";
  if (password !== confirm) return "mismatch";
  return null;
}
