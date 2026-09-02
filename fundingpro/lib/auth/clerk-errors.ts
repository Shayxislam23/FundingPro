export function clerkErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "errors" in err) {
    const errors = (err as { errors?: { message?: string; code?: string }[] }).errors;
    const first = errors?.[0];
    if (first?.message) {
      const msg = first.message.toLowerCase();
      if (msg.includes("password") || msg.includes("identifier")) {
        return "Неверный email или пароль.";
      }
      if (msg.includes("authenticate")) {
        return "Не удалось войти. Проверьте email и пароль.";
      }
      return first.message;
    }
  }
  if (err instanceof Error) {
    if (err.message.toLowerCase().includes("failed to authenticate")) {
      return "Не удалось войти. Проверьте email и пароль.";
    }
    return err.message;
  }
  return "Не удалось войти. Попробуйте ещё раз.";
}
