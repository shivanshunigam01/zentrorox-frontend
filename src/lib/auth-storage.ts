const TOKEN_KEY = 'zs_access_token'
const REFRESH_KEY = 'zs_refresh_token'
const USER_KEY = 'zs_user'
const BRANCH_KEY = 'zs_branch_id'

export interface StoredUser {
  id: string
  email: string
  firstName: string
  lastName: string | null
  role: string | null
  tenant: { id: string; code: string; name: string }
  branches: { id: string; name: string; code: string }[]
  defaultBranchId: string | null
}

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  getRefreshToken: () => localStorage.getItem(REFRESH_KEY),
  setRefreshToken: (token: string) => localStorage.setItem(REFRESH_KEY, token),
  getUser: (): StoredUser | null => {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  },
  setUser: (user: StoredUser) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  getBranchId: () => localStorage.getItem(BRANCH_KEY),
  setBranchId: (id: string) => localStorage.setItem(BRANCH_KEY, id),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(BRANCH_KEY)
  },
}
