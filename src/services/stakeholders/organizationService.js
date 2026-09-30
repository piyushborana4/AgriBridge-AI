/**
 * AgriBridge AI — Multi-Tenancy & Cooperative Organization Service (Phase 10)
 * Manages agricultural cooperatives, farmer groups, tenant isolation boundaries,
 * and auditable cross-organization data exchange policies.
 */

import { ORGANIZATION_TYPES, DATA_SOVEREIGNTY_POLICIES, createOrganization } from './stakeholderTypes.js';

let organizationsStore = [
  createOrganization({
    orgId: 'org-nashik-fpo-01',
    name: 'Nashik Onion & Vegetable Producers Co-op',
    orgType: ORGANIZATION_TYPES.COOPERATIVE,
    country: 'India',
    region: 'Maharashtra',
    adminUserId: 'admin-fpo-01',
    memberUserIds: ['farmer-101', 'farmer-102', 'officer-nashik-01'],
    assignedFarmIds: ['farm-1', 'farm-2'],
    sovereigntyPolicy: DATA_SOVEREIGNTY_POLICIES.INSTITUTIONAL
  }),
  createOrganization({
    orgId: 'org-icar-research-02',
    name: 'ICAR-DOGR Agronomic Research Unit',
    orgType: ORGANIZATION_TYPES.RESEARCH_INSTITUTION,
    country: 'India',
    region: 'Maharashtra',
    adminUserId: 'admin-icar-01',
    memberUserIds: ['researcher-303', 'agronomist-lead-01'],
    assignedFarmIds: [],
    sovereigntyPolicy: DATA_SOVEREIGNTY_POLICIES.PUBLIC
  })
];

let organizationSharingAudit = [];

/**
 * Lists all registered organizations
 * @returns {Array<object>}
 */
export function listOrganizations() {
  return [...organizationsStore];
}

/**
 * Gets organization by ID
 * @param {string} orgId
 * @returns {object|null}
 */
export function getOrganization(orgId) {
  return organizationsStore.find(o => o.orgId === orgId) || null;
}

/**
 * Registers a new cooperative / organization
 * @param {object} params
 * @returns {object}
 */
export function registerOrganization(params) {
  const org = createOrganization(params);
  organizationsStore.push(org);
  return org;
}

/**
 * Enforces Tenant Isolation: checks if user has access to target organization's data
 * @param {object} user - { id, role }
 * @param {string} orgId - Target organization ID
 * @returns {boolean}
 */
export function checkTenantAccess(user, orgId) {
  if (!user || !orgId) return false;
  const role = (user.role || '').toUpperCase();
  if (role === 'ADMIN' || role === 'SYSTEM') return true;

  const org = getOrganization(orgId);
  if (!org) return false;

  return org.adminUserId === user.id || org.memberUserIds.includes(user.id);
}

/**
 * Authorizes and logs cross-organization data exchange
 * @param {object} params
 * @returns {object} Sharing transaction record
 */
export function executeCrossOrgSharing({
  sourceOrgId,
  targetOrgId,
  actorUserId,
  dataCategory = 'anonymized_telemetry',
  purpose = 'Multilateral Agronomic Research',
  sovereigntyPolicy = DATA_SOVEREIGNTY_POLICIES.SHARED
}) {
  const sourceOrg = getOrganization(sourceOrgId);
  const targetOrg = getOrganization(targetOrgId);

  if (!sourceOrg) throw new Error(`Source organization ${sourceOrgId} not found`);
  if (!targetOrg) throw new Error(`Target organization ${targetOrgId} not found`);

  // Verify source org policy allows sharing
  if (sourceOrg.sovereigntyPolicy === DATA_SOVEREIGNTY_POLICIES.PRIVATE) {
    throw new Error(`Data sharing rejected: Organization ${sourceOrg.name} has policy set to PRIVATE`);
  }

  const transaction = {
    shareId: `share-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    sourceOrgId,
    sourceOrgName: sourceOrg.name,
    targetOrgId,
    targetOrgName: targetOrg.name,
    actorUserId,
    dataCategory,
    purpose,
    sovereigntyPolicy,
    status: 'AUTHORIZED'
  };

  organizationSharingAudit.unshift(transaction);
  return transaction;
}

/**
 * Lists cross-organization sharing audit records
 * @returns {Array<object>}
 */
export function listOrgSharingAudit() {
  return [...organizationSharingAudit];
}
