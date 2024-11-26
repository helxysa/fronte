export default class CurrentUserService {
  private static currentUserId: number | null = null
  private static currentUsername: string | null

  static setCurrentUserId(userId: number | null) {
    this.currentUserId = userId
  }

  static getCurrentUserId(): number | null {
    return this.currentUserId
  }

  static setCurrentUsername(username: string | null) {
    this.currentUsername = username
  }

  static getCurrentUsername(): string | null {
    return this.currentUsername
  }
}
