/**
 * Compatibility boundary retained for the existing stack.
 * The mock-only development build never reads platform identity headers.
 */
export type ChatGPTUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

export async function getChatGPTUser(): Promise<null> {
  return null;
}

export async function requireChatGPTUser(): Promise<never> {
  throw new Error('이 개발판은 실계정 인증을 사용하지 않습니다.');
}

export function chatGPTSignInPath(): string {
  return '/';
}

export function chatGPTSignOutPath(): string {
  return '/';
}
