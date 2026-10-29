export interface InviteDetails { email: string }
export interface InviteInput { token: string; email: string; fullName: string; password: string }
export interface InviteService {
  validate(token: string): Promise<InviteDetails | null>;
  accept(input: InviteInput): Promise<void>;
}
export interface PasswordResetService {
  requestReset(email: string): Promise<void>;
  validateResetToken(token: string): Promise<boolean>;
  resetPassword(token: string, password: string): Promise<void>;
}
