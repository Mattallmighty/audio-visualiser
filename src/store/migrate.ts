export const VISUALISER_STORE_VERSION = 1

export interface MigrationState {
  [key: string]: any
}

// Migration functions for each version
export const migrations: Record<number, (state: MigrationState) => MigrationState> = {
  // Version 1: Initial version (from localStorage to Zustand)
  1: (state: MigrationState) => {
    // If migrating from old localStorage format (visualiser_state_v1)
    // Transform to new Zustand format
    return state
  }

  // Future migrations go here
  // 2: (state: MigrationState) => { ... }
}
