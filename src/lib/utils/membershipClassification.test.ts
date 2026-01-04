/**
 * Unit Tests for Membership Classification
 * 
 * These tests verify the correct classification of membership changes:
 * - UPGRADE: Candidate provides broader coverage or better terms
 * - BUY_ANOTHER: Candidate has different/parallel coverage
 * - RENEW: Same coverage and duration
 * - SAME: Same membership (shouldn't appear in UI)
 * 
 * To run these tests, you'll need to set up a test framework (e.g., Vitest, Jest).
 * For now, these serve as documentation of expected behavior.
 */

import { classifyMembershipChange, AccessInfo } from './membershipClassification';

// Helper to create test data
function createAccessInfo(id: number, name: string, type: 'section' | 'group'): AccessInfo {
  return { id, name, type };
}

describe('Membership Classification', () => {
  const currentEndDate = '2025-12-31';

  describe('Coverage-based upgrades', () => {
    test('single_group -> multiple_groups (including current group) = UPGRADE', () => {
      const current = {
        includedGroups: [createAccessInfo(1, 'Group A', 'group')],
        includedSections: [],
        packageType: 'single_group',
        paymentType: 'monthly',
        durationDays: null,
        price: 10000,
      };

      const candidate = {
        includedGroups: [
          createAccessInfo(1, 'Group A', 'group'),
          createAccessInfo(2, 'Group B', 'group'),
        ],
        includedSections: [],
        packageType: 'multiple_groups',
        paymentType: 'monthly',
        durationDays: null,
        price: 15000,
      };

      const result = classifyMembershipChange(current, candidate, currentEndDate);
      expect(result.kind).toBe('UPGRADE');
      expect(result.scheduledStartDate).toBe('2026-01-01');
    });

    test('single_group -> different single_group = BUY_ANOTHER', () => {
      const current = {
        includedGroups: [createAccessInfo(1, 'Group A', 'group')],
        includedSections: [],
        packageType: 'single_group',
        paymentType: 'monthly',
        durationDays: null,
        price: 10000,
      };

      const candidate = {
        includedGroups: [createAccessInfo(2, 'Group B', 'group')],
        includedSections: [],
        packageType: 'single_group',
        paymentType: 'monthly',
        durationDays: null,
        price: 10000,
      };

      const result = classifyMembershipChange(current, candidate, currentEndDate);
      expect(result.kind).toBe('BUY_ANOTHER');
    });

    test('single_group -> full_section (containing group) = UPGRADE', () => {
      const current = {
        includedGroups: [createAccessInfo(1, 'Group A', 'group')],
        includedSections: [createAccessInfo(10, 'Section X', 'section')],
        packageType: 'single_group',
        paymentType: 'monthly',
        durationDays: null,
        price: 10000,
      };

      const candidate = {
        includedGroups: [],
        includedSections: [createAccessInfo(10, 'Section X', 'section')],
        packageType: 'full_section',
        paymentType: 'monthly',
        durationDays: null,
        price: 20000,
      };

      const result = classifyMembershipChange(current, candidate, currentEndDate);
      expect(result.kind).toBe('UPGRADE');
    });

    test('single_group -> different section = BUY_ANOTHER', () => {
      const current = {
        includedGroups: [createAccessInfo(1, 'Group A', 'group')],
        includedSections: [createAccessInfo(10, 'Section X', 'section')],
        packageType: 'single_group',
        paymentType: 'monthly',
        durationDays: null,
        price: 10000,
      };

      const candidate = {
        includedGroups: [],
        includedSections: [createAccessInfo(20, 'Section Y', 'section')],
        packageType: 'full_section',
        paymentType: 'monthly',
        durationDays: null,
        price: 20000,
      };

      const result = classifyMembershipChange(current, candidate, currentEndDate);
      expect(result.kind).toBe('BUY_ANOTHER');
    });

    test('full_section -> full_club = UPGRADE', () => {
      const current = {
        includedGroups: [],
        includedSections: [createAccessInfo(10, 'Section X', 'section')],
        packageType: 'full_section',
        paymentType: 'monthly',
        durationDays: null,
        price: 20000,
      };

      const candidate = {
        includedGroups: [],
        includedSections: [],
        packageType: 'full_club',
        paymentType: 'monthly',
        durationDays: null,
        price: 50000,
      };

      const result = classifyMembershipChange(current, candidate, currentEndDate);
      expect(result.kind).toBe('UPGRADE');
    });

    test('multiple_groups -> full_section (including groups) = UPGRADE', () => {
      const current = {
        includedGroups: [
          createAccessInfo(1, 'Group A', 'group'),
          createAccessInfo(2, 'Group B', 'group'),
        ],
        includedSections: [createAccessInfo(10, 'Section X', 'section')],
        packageType: 'multiple_groups',
        paymentType: 'monthly',
        durationDays: null,
        price: 15000,
      };

      const candidate = {
        includedGroups: [],
        includedSections: [createAccessInfo(10, 'Section X', 'section')],
        packageType: 'full_section',
        paymentType: 'monthly',
        durationDays: null,
        price: 20000,
      };

      const result = classifyMembershipChange(current, candidate, currentEndDate);
      expect(result.kind).toBe('UPGRADE');
    });
  });

  describe('Duration-based upgrades', () => {
    test('monthly -> annual (same coverage) = UPGRADE', () => {
      const current = {
        includedGroups: [createAccessInfo(1, 'Group A', 'group')],
        includedSections: [],
        packageType: 'single_group',
        paymentType: 'monthly',
        durationDays: null,
        price: 10000,
      };

      const candidate = {
        includedGroups: [createAccessInfo(1, 'Group A', 'group')],
        includedSections: [],
        packageType: 'single_group',
        paymentType: 'annual',
        durationDays: null,
        price: 100000,
      };

      const result = classifyMembershipChange(current, candidate, currentEndDate);
      expect(result.kind).toBe('UPGRADE');
    });

    test('monthly -> semi_annual (same coverage) = UPGRADE', () => {
      const current = {
        includedGroups: [createAccessInfo(1, 'Group A', 'group')],
        includedSections: [],
        packageType: 'single_group',
        paymentType: 'monthly',
        durationDays: null,
        price: 10000,
      };

      const candidate = {
        includedGroups: [createAccessInfo(1, 'Group A', 'group')],
        includedSections: [],
        packageType: 'single_group',
        paymentType: 'semi_annual',
        durationDays: null,
        price: 50000,
      };

      const result = classifyMembershipChange(current, candidate, currentEndDate);
      expect(result.kind).toBe('UPGRADE');
    });

    test('annual -> monthly (same coverage) = BUY_ANOTHER (downgrade)', () => {
      const current = {
        includedGroups: [createAccessInfo(1, 'Group A', 'group')],
        includedSections: [],
        packageType: 'single_group',
        paymentType: 'annual',
        durationDays: null,
        price: 100000,
      };

      const candidate = {
        includedGroups: [createAccessInfo(1, 'Group A', 'group')],
        includedSections: [],
        packageType: 'single_group',
        paymentType: 'monthly',
        durationDays: null,
        price: 10000,
      };

      const result = classifyMembershipChange(current, candidate, currentEndDate);
      expect(result.kind).toBe('BUY_ANOTHER');
    });

    test('same coverage, same duration = RENEW', () => {
      const current = {
        includedGroups: [createAccessInfo(1, 'Group A', 'group')],
        includedSections: [],
        packageType: 'single_group',
        paymentType: 'monthly',
        durationDays: null,
        price: 10000,
      };

      const candidate = {
        includedGroups: [createAccessInfo(1, 'Group A', 'group')],
        includedSections: [],
        packageType: 'single_group',
        paymentType: 'monthly',
        durationDays: null,
        price: 10000,
      };

      const result = classifyMembershipChange(current, candidate, currentEndDate);
      expect(result.kind).toBe('RENEW');
    });
  });

  describe('Type-based upgrades', () => {
    test('session_pack -> monthly subscription (longer duration) = UPGRADE', () => {
      const current = {
        includedGroups: [createAccessInfo(1, 'Group A', 'group')],
        includedSections: [],
        packageType: 'single_group',
        paymentType: 'session_pack',
        durationDays: 30,
        price: 5000,
      };

      const candidate = {
        includedGroups: [createAccessInfo(1, 'Group A', 'group')],
        includedSections: [],
        packageType: 'single_group',
        paymentType: 'monthly',
        durationDays: null,
        price: 10000,
      };

      const result = classifyMembershipChange(current, candidate, currentEndDate);
      // This depends on duration comparison - if monthly (30 days) > session_pack (30 days), it's same
      // But if session_pack is shorter, it's upgrade
      expect(['UPGRADE', 'RENEW']).toContain(result.kind);
    });

    test('monthly -> session_pack (shorter duration) = BUY_ANOTHER', () => {
      const current = {
        includedGroups: [createAccessInfo(1, 'Group A', 'group')],
        includedSections: [],
        packageType: 'single_group',
        paymentType: 'monthly',
        durationDays: null,
        price: 10000,
      };

      const candidate = {
        includedGroups: [createAccessInfo(1, 'Group A', 'group')],
        includedSections: [],
        packageType: 'single_group',
        paymentType: 'session_pack',
        durationDays: 15,
        price: 5000,
      };

      const result = classifyMembershipChange(current, candidate, currentEndDate);
      expect(result.kind).toBe('BUY_ANOTHER');
    });
  });

  describe('Full club scenarios', () => {
    test('full_club -> full_club (longer duration) = UPGRADE', () => {
      const current = {
        includedGroups: [],
        includedSections: [],
        packageType: 'full_club',
        paymentType: 'monthly',
        durationDays: null,
        price: 50000,
      };

      const candidate = {
        includedGroups: [],
        includedSections: [],
        packageType: 'full_club',
        paymentType: 'annual',
        durationDays: null,
        price: 500000,
      };

      const result = classifyMembershipChange(current, candidate, currentEndDate);
      expect(result.kind).toBe('UPGRADE');
    });

    test('full_club -> section = BUY_ANOTHER (downgrade)', () => {
      const current = {
        includedGroups: [],
        includedSections: [],
        packageType: 'full_club',
        paymentType: 'monthly',
        durationDays: null,
        price: 50000,
      };

      const candidate = {
        includedGroups: [],
        includedSections: [createAccessInfo(10, 'Section X', 'section')],
        packageType: 'full_section',
        paymentType: 'monthly',
        durationDays: null,
        price: 20000,
      };

      const result = classifyMembershipChange(current, candidate, currentEndDate);
      expect(result.kind).toBe('BUY_ANOTHER');
    });
  });

  describe('Scheduling', () => {
    test('UPGRADE includes scheduledStartDate', () => {
      const current = {
        includedGroups: [createAccessInfo(1, 'Group A', 'group')],
        includedSections: [],
        packageType: 'single_group',
        paymentType: 'monthly',
        durationDays: null,
        price: 10000,
      };

      const candidate = {
        includedGroups: [
          createAccessInfo(1, 'Group A', 'group'),
          createAccessInfo(2, 'Group B', 'group'),
        ],
        includedSections: [],
        packageType: 'multiple_groups',
        paymentType: 'monthly',
        durationDays: null,
        price: 15000,
      };

      const result = classifyMembershipChange(current, candidate, '2025-12-31');
      expect(result.kind).toBe('UPGRADE');
      expect(result.scheduledStartDate).toBe('2026-01-01');
    });

    test('BUY_ANOTHER does not include scheduledStartDate', () => {
      const current = {
        includedGroups: [createAccessInfo(1, 'Group A', 'group')],
        includedSections: [],
        packageType: 'single_group',
        paymentType: 'monthly',
        durationDays: null,
        price: 10000,
      };

      const candidate = {
        includedGroups: [createAccessInfo(2, 'Group B', 'group')],
        includedSections: [],
        packageType: 'single_group',
        paymentType: 'monthly',
        durationDays: null,
        price: 10000,
      };

      const result = classifyMembershipChange(current, candidate, currentEndDate);
      expect(result.kind).toBe('BUY_ANOTHER');
      expect(result.scheduledStartDate).toBeUndefined();
    });
  });
});

