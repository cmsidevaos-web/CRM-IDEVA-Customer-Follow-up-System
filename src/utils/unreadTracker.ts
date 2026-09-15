import { ViewTab, Customer, Activity, Order, AppUser } from '../types';

export interface TabReadState {
  lastVisitedAt: number;
  readItemIds: string[];
  lastKnownCount: number;
  isAcknowledged: boolean;
}

const STORAGE_KEY = 'ideva_tab_read_state_v2';

export function getStoredTabReadState(): Record<string, TabReadState> {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {};
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load tab read state:', e);
  }
  return {};
}

export function saveTabReadState(state: Record<string, TabReadState>): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save tab read state:', e);
  }
}

/**
 * Mark a specific tab as read and record all currently existing item IDs as read.
 */
export function markTabItemsRead(
  tab: ViewTab,
  currentItemIds: string[] = []
): Record<string, TabReadState> {
  const currentState = getStoredTabReadState();
  const existingTabState = currentState[tab] || {
    lastVisitedAt: 0,
    readItemIds: [],
    lastKnownCount: 0,
    isAcknowledged: false,
  };

  const mergedReadIds = Array.from(new Set([...existingTabState.readItemIds, ...currentItemIds]));

  const updatedState: Record<string, TabReadState> = {
    ...currentState,
    [tab]: {
      lastVisitedAt: Date.now(),
      readItemIds: mergedReadIds,
      lastKnownCount: currentItemIds.length,
      isAcknowledged: true,
    },
  };

  // Special alias handling: If CUSTOMERS or CUSTOMER_PROFILE is read, sync both
  if (tab === 'CUSTOMERS' || tab === 'CUSTOMER_PROFILE') {
    updatedState['CUSTOMERS'] = {
      lastVisitedAt: Date.now(),
      readItemIds: mergedReadIds,
      lastKnownCount: currentItemIds.length,
      isAcknowledged: true,
    };
    updatedState['CUSTOMER_PROFILE'] = {
      lastVisitedAt: Date.now(),
      readItemIds: mergedReadIds,
      lastKnownCount: currentItemIds.length,
      isAcknowledged: true,
    };
  }

  saveTabReadState(updatedState);
  return updatedState;
}

/**
 * Compute the unread count for items with explicit IDs.
 * If the tab was never visited before, but items exist, they show as unread until clicked.
 * Once visited, only items whose IDs are NOT in readItemIds will count.
 */
export function computeUnreadCountForItems(
  tab: ViewTab,
  allItemIds: string[],
  tabStateMap: Record<string, TabReadState>
): number {
  const tabState = tabStateMap[tab];
  if (!tabState) {
    // Tab has never been opened by the user yet
    return allItemIds.length;
  }

  const readSet = new Set(tabState.readItemIds || []);
  const unreadItems = allItemIds.filter((id) => !readSet.has(id));
  return unreadItems.length;
}

/**
 * Compute the unread count for static/category menus (e.g. REPORTS, USER_MANUAL, SETTINGS).
 * Returns 0 if the user has visited/acknowledged the tab.
 */
export function computeUnreadCountForCategory(
  tab: ViewTab,
  totalCategoryCount: number,
  tabStateMap: Record<string, TabReadState>
): number {
  const tabState = tabStateMap[tab];
  if (!tabState || !tabState.isAcknowledged) {
    return totalCategoryCount;
  }
  // Once acknowledged, badge is cleared unless new items were added beyond lastKnownCount
  const diff = totalCategoryCount - (tabState.lastKnownCount || 0);
  return Math.max(0, diff);
}
