import { isClerkError } from "@clerk/shared/error";

const WRONG_CREDENTIALS_CODES = new Set([
  "form_identifier_not_found",
  "form_password_incorrect",
  "form_password_validation_failed",
]);

export function clerkErrorMessage(err: unknown): string {
  if (isClerkError(err)) {
    if (WRONG_CREDENTIALS_CODES.has(err.code)) {
      return "Неверный email или пароль.";
    }
    if (err.longMessage) {
      return err.longMessage;
    }
    const msg = err.message.toLowerCase();
    if (msg.includes("password") || msg.includes("identifier") || msg.includes("authenticate")) {
      return "Не удалось войти. Проверьте email и пароль.";
    }
    return err.message;
  }

  if (err && typeof err === "object" && "errors" in err) {
    const errors = (err as { errors?: { message?: string; code?: string }[] }).errors;
    const first = errors?.[0];
    if (first?.code && WRONG_CREDENTIALS_CODES.has(first.code)) {
      return "Неверный email или пароль.";
    }
    if (first?.message) {
      const msg = first.message.toLowerCase();
      if (msg.includes("password") || msg.includes("identifier") || msg.includes("authenticate")) {
        return "Не удалось войти. Проверьте email и пароль.";
      }
      return first.message;
    }
  }

  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes("failed to authenticate") || msg.includes("authenticate")) {
      return "Не удалось войти. Проверьте email и пароль.";
    }
    return err.message;
  }

  return "Не удалось войти. Попробуйте ещё раз.";
}
