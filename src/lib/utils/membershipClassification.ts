/**
 * Membership Classification Utility
 * 
 * Determines if a candidate membership plan is an UPGRADE, BUY_ANOTHER, or RENEW/EXTEND
 * relative to the current active membership.
 * 
 * Domain Model:
 * - Membership coverage: Set of groups/sections that membership grants access to
 * - Scope hierarchy: group < section < club
 * - Package types: single_group, multiple_groups, full_section, full_club
 * - Payment types: monthly, semi_annual, annual, session_pack
 */

export interface AccessInfo {
  id: number;
  name: string;
  type: 'section' | 'group';
}

export interface MembershipCoverage {
  groupIds: Set<number>;
  sectionIds: Set<number>;
  packageType: string; // full_club, full_section, single_group, multiple_groups
  paymentType: string; // monthly, semi_annual, annual, session_pack
  durationDays: number | null; // null for time-based subscriptions (calculated from payment_type)
  price: number;
}

export type MembershipChangeKind = 'UPGRADE' | 'BUY_ANOTHER' | 'RENEW' | 'SAME';

export interface MembershipClassification {
  kind: MembershipChangeKind;
  reason: string;
  scheduledStartDate?: string; // For upgrades, when it should start (after current ends)
}

/**
 * Extract membership coverage from membership/plan data
 */
function extractCoverage(
  includedGroups: AccessInfo[],
  includedSections: AccessInfo[],
  packageType: string
): { groupIds: Set<number>; sectionIds: Set<number> } {
  const groupIds = new Set(includedGroups.map(g => g.id));
  const sectionIds = new Set(includedSections.map(s => s.id));
  
  // For full_club, we can't enumerate all groups/sections, so we use empty sets
  // and check packageType separately
  if (packageType === 'full_club') {
    return { groupIds: new Set(), sectionIds: new Set() };
  }
  
  return { groupIds, sectionIds };
}

/**
 * Calculate duration days from payment type
 */
function getDurationDays(paymentType: string, explicitDurationDays: number | null): number {
  if (explicitDurationDays !== null) {
    return explicitDurationDays;
  }
  
  switch (paymentType) {
    case 'annual':
      return 365;
    case 'semi_annual':
      return 180;
    case 'monthly':
      return 30;
    case 'session_pack':
      // Should have explicit duration_days
      return 30; // fallback
    default:
      return 30;
  }
}

/**
 * Check if coverage N is a strict superset of coverage C
 */
function isStrictSuperset(
  current: { groupIds: Set<number>; sectionIds: Set<number>; packageType: string },
  candidate: { groupIds: Set<number>; sectionIds: Set<number>; packageType: string }
): boolean {
  // Full club is always a superset
  if (candidate.packageType === 'full_club') {
    return current.packageType !== 'full_club';
  }
  
  // If current is full_club, candidate cannot be superset
  if (current.packageType === 'full_club') {
    return false;
  }
  
  // Check section-level superset
  if (candidate.packageType === 'full_section') {
    // Candidate covers entire sections
    if (current.packageType === 'single_group' || current.packageType === 'multiple_groups') {
      // Check if all current groups are in candidate's sections
      // Since we don't have section->group mapping here, we check if candidate sections include current sections
      // This is a simplified check - ideally we'd check group membership
      return current.sectionIds.size > 0 && 
             Array.from(current.sectionIds).every(sid => candidate.sectionIds.has(sid));
    }
    if (current.packageType === 'full_section') {
      // Both are full_section - check if candidate sections include all current sections
      return current.sectionIds.size > 0 && 
             Array.from(current.sectionIds).every(sid => candidate.sectionIds.has(sid)) &&
             candidate.sectionIds.size > current.sectionIds.size;
    }
  }
  
  // Check group-level superset
  if (candidate.packageType === 'multiple_groups') {
    if (current.packageType === 'single_group') {
      // Check if candidate groups include current group
      return current.groupIds.size === 1 && 
             Array.from(current.groupIds).every(gid => candidate.groupIds.has(gid)) &&
             candidate.groupIds.size > 1;
    }
    if (current.packageType === 'multiple_groups') {
      // Both are multiple_groups - check if candidate includes all current groups and more
      return current.groupIds.size > 0 &&
             Array.from(current.groupIds).every(gid => candidate.groupIds.has(gid)) &&
             candidate.groupIds.size > current.groupIds.size;
    }
  }
  
  // Check if candidate sections include all groups from current sections
  // (simplified: if candidate has sections that current has, and candidate has more coverage)
  if (candidate.sectionIds.size > 0 && current.sectionIds.size > 0) {
    const allCurrentSectionsCovered = Array.from(current.sectionIds).every(sid => candidate.sectionIds.has(sid));
    const candidateHasMore = candidate.sectionIds.size > current.sectionIds.size || 
                             candidate.groupIds.size > current.groupIds.size;
    if (allCurrentSectionsCovered && candidateHasMore) {
      return true;
    }
  }
  
  // Check group-level: candidate groups include all current groups and more
  if (candidate.groupIds.size > 0 && current.groupIds.size > 0) {
    const allCurrentGroupsCovered = Array.from(current.groupIds).every(gid => candidate.groupIds.has(gid));
    const candidateHasMore = candidate.groupIds.size > current.groupIds.size;
    if (allCurrentGroupsCovered && candidateHasMore) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if coverage N includes coverage C (not necessarily strict superset)
 */
function includesCoverage(
  current: { groupIds: Set<number>; sectionIds: Set<number>; packageType: string },
  candidate: { groupIds: Set<number>; sectionIds: Set<number>; packageType: string }
): boolean {
  // Full club includes everything
  if (candidate.packageType === 'full_club') {
    return true;
  }
  
  // If current is full_club, only full_club can include it
  if (current.packageType === 'full_club') {
    return candidate.packageType === 'full_club';
  }
  
  // Check section-level inclusion
  if (candidate.packageType === 'full_section') {
    // Candidate covers entire sections - check if current sections are included
    if (current.sectionIds.size > 0) {
      return Array.from(current.sectionIds).every(sid => candidate.sectionIds.has(sid));
    }
    // If current has groups, we'd need section->group mapping to verify
    // For now, assume if candidate has sections, it might include current groups
    return candidate.sectionIds.size > 0;
  }
  
  // Check group-level inclusion
  if (current.groupIds.size > 0 && candidate.groupIds.size > 0) {
    return Array.from(current.groupIds).every(gid => candidate.groupIds.has(gid));
  }
  
  // Check section-level inclusion
  if (current.sectionIds.size > 0 && candidate.sectionIds.size > 0) {
    return Array.from(current.sectionIds).every(sid => candidate.sectionIds.has(sid));
  }
  
  return false;
}

/**
 * Check if coverages are equal
 */
function areCoveragesEqual(
  current: { groupIds: Set<number>; sectionIds: Set<number>; packageType: string },
  candidate: { groupIds: Set<number>; sectionIds: Set<number>; packageType: string }
): boolean {
  if (current.packageType !== candidate.packageType) {
    return false;
  }
  
  if (current.packageType === 'full_club') {
    return candidate.packageType === 'full_club';
  }
  
  // Check if group sets are equal
  if (current.groupIds.size !== candidate.groupIds.size) {
    return false;
  }
  if (current.groupIds.size > 0) {
    const currentArray = Array.from(current.groupIds).sort();
    const candidateArray = Array.from(candidate.groupIds).sort();
    if (JSON.stringify(currentArray) !== JSON.stringify(candidateArray)) {
      return false;
    }
  }
  
  // Check if section sets are equal
  if (current.sectionIds.size !== candidate.sectionIds.size) {
    return false;
  }
  if (current.sectionIds.size > 0) {
    const currentArray = Array.from(current.sectionIds).sort();
    const candidateArray = Array.from(candidate.sectionIds).sort();
    if (JSON.stringify(currentArray) !== JSON.stringify(candidateArray)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Classify membership change: UPGRADE, BUY_ANOTHER, RENEW, or SAME
 * 
 * @param currentMembership Current active/scheduled membership
 * @param candidatePlan Candidate membership plan to evaluate
 * @param currentEndDate End date of current membership (for scheduling upgrades)
 * @returns Classification result
 */
export function classifyMembershipChange(
  currentMembership: {
    includedGroups: AccessInfo[];
    includedSections: AccessInfo[];
    packageType: string;
    paymentType: string;
    durationDays: number | null;
    price: number;
  },
  candidatePlan: {
    includedGroups: AccessInfo[];
    includedSections: AccessInfo[];
    packageType: string;
    paymentType: string;
    durationDays: number | null;
    price: number;
  },
  currentEndDate?: string
): MembershipClassification {
  // Extract coverages
  const currentCoverage = extractCoverage(
    currentMembership.includedGroups,
    currentMembership.includedSections,
    currentMembership.packageType
  );
  const candidateCoverage = extractCoverage(
    candidatePlan.includedGroups,
    candidatePlan.includedSections,
    candidatePlan.packageType
  );
  
  const currentFull = {
    ...currentCoverage,
    packageType: currentMembership.packageType,
  };
  const candidateFull = {
    ...candidateCoverage,
    packageType: candidatePlan.packageType,
  };
  
  // Rule 1: Check if candidate is a strict superset of current coverage
  const isStrictSupersetCoverage = isStrictSuperset(currentFull, candidateFull);
  
  if (isStrictSupersetCoverage) {
    // This is an UPGRADE - candidate provides more coverage
    const scheduledStart = currentEndDate 
      ? new Date(new Date(currentEndDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : undefined;
    
    return {
      kind: 'UPGRADE',
      reason: `Candidate plan provides broader coverage (${candidatePlan.packageType} vs ${currentMembership.packageType})`,
      scheduledStartDate: scheduledStart,
    };
  }
  
  // Rule 2: Check if candidate does NOT include current coverage
  const includesCurrent = includesCoverage(currentFull, candidateFull);
  
  if (!includesCurrent) {
    // Candidate doesn't include current coverage - this is BUY_ANOTHER (parallel membership)
    return {
      kind: 'BUY_ANOTHER',
      reason: `Candidate plan does not include current membership coverage`,
    };
  }
  
  // Rule 3: Same coverage - check duration/term upgrade
  const areEqual = areCoveragesEqual(currentFull, candidateFull);
  
  if (areEqual) {
    const currentDuration = getDurationDays(currentMembership.paymentType, currentMembership.durationDays);
    const candidateDuration = getDurationDays(candidatePlan.paymentType, candidatePlan.durationDays);
    
    // Check if candidate has longer duration (e.g., monthly -> annual)
    if (candidateDuration > currentDuration) {
      // Longer term with same coverage = UPGRADE (better value)
      const scheduledStart = currentEndDate 
        ? new Date(new Date(currentEndDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : undefined;
      
      return {
        kind: 'UPGRADE',
        reason: `Same coverage but longer duration (${candidateDuration} days vs ${currentDuration} days)`,
        scheduledStartDate: scheduledStart,
      };
    }
    
    // Check if candidate is session pack and current is subscription (type upgrade)
    if (candidatePlan.paymentType === 'session_pack' && 
        currentMembership.paymentType !== 'session_pack' &&
        candidatePlan.durationDays && candidatePlan.durationDays > currentDuration) {
      const scheduledStart = currentEndDate 
        ? new Date(new Date(currentEndDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : undefined;
      
      return {
        kind: 'UPGRADE',
        reason: `Upgrade from subscription to session pack with longer validity`,
        scheduledStartDate: scheduledStart,
      };
    }
    
    // Check if current is session pack and candidate is subscription (could be upgrade if longer)
    if (currentMembership.paymentType === 'session_pack' &&
        candidatePlan.paymentType !== 'session_pack' &&
        candidateDuration > (currentMembership.durationDays || 30)) {
      const scheduledStart = currentEndDate 
        ? new Date(new Date(currentEndDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : undefined;
      
      return {
        kind: 'UPGRADE',
        reason: `Upgrade from session pack to subscription with longer duration`,
        scheduledStartDate: scheduledStart,
      };
    }
    
    // Same coverage, same or shorter duration = SAME (or RENEW if same duration)
    if (candidateDuration === currentDuration) {
      return {
        kind: 'RENEW',
        reason: `Same coverage and duration - renewal`,
      };
    }
    
    // Shorter duration = downgrade, treat as BUY_ANOTHER (or block per business rules)
    return {
      kind: 'BUY_ANOTHER',
      reason: `Same coverage but shorter duration - not an upgrade`,
    };
  }
  
  // Rule 4: Candidate includes current but is not strict superset and not equal
  // This means candidate might have different but overlapping coverage
  // For safety, treat as BUY_ANOTHER unless business rules say otherwise
  return {
    kind: 'BUY_ANOTHER',
    reason: `Candidate has overlapping but different coverage`,
  };
}

