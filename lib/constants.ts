import { PermissionKey, PrStatus, PrType, ReleaseEnvironment, ReleaseStatus, UserStatus } from '@/lib/types';

export const ALL_PERMISSIONS: PermissionKey[] = [
  'CAN_CREATE_PR',
  'CAN_VIEW_ALL_PRS',
  'CAN_REVIEW_PR',
  'CAN_ASSIGN_PR',
  'CAN_GENERATE_OWN_RELEASE_NOTES',
  'CAN_GENERATE_FULL_RELEASE_NOTES',
  'CAN_MANAGE_ROLES',
  'CAN_MANAGE_PERMISSIONS',
  'CAN_MANAGE_EMAIL_DOMAIN',
  'CAN_VERIFY_USERS',
  'CAN_CREATE_USER',
  'CAN_ASSIGN_ROLE',
  'CAN_MANAGE_RELEASE',
  'CAN_SET_PROD_RELEASE_DATE'
];

export const PR_STATUS_OPTIONS: PrStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'REREVIEW',
  'DEPLOYED'
];

export const PR_TYPE_OPTIONS: PrType[] = ['FEATURE', 'ENHANCEMENT', 'BUG'];
export const RELEASE_STATUS_OPTIONS: ReleaseStatus[] = ['CREATED', 'SCHEDULED', 'COMPLETED', 'CANCELLED'];
export const RELEASE_ENVIRONMENT_OPTIONS: ReleaseEnvironment[] = ['STAGING', 'PRODUCTION', 'UAT'];
export const USER_STATUS_OPTIONS: UserStatus[] = ['ACTIVE', 'INACTIVE', 'PENDING_VERIFICATION', 'DISAPPROVED'];

export const RELEASE_LIST_PERMISSIONS: PermissionKey[] = [
  'CAN_CREATE_PR',
  'CAN_VIEW_ALL_PRS',
  'CAN_MANAGE_RELEASE',
  'CAN_SET_PROD_RELEASE_DATE',
  'CAN_GENERATE_OWN_RELEASE_NOTES',
  'CAN_GENERATE_FULL_RELEASE_NOTES'
];

export const AUDIT_PERMISSIONS: PermissionKey[] = ['CAN_MANAGE_ROLES', 'CAN_MANAGE_RELEASE'];

export const RELEASE_NOTE_GUIDANCE = [
  'Use feature or bug name as the human-readable heading for each change.',
  'Include the Zoho story or bug ID, branch name, and every related PR link.',
  'Document any new environment values and production asset links when relevant.',
  'Keep owner attribution explicit so release managers know who supplied each note.',
  'When preparing full notes, group entries by product area and distinguish features from bugs.'
];

export const RELEASE_NOTE_TEMPLATE_SECTIONS = [
  'Feature name / Bug name',
  'Zoho story or bug ID',
  'Branch name',
  'PR links for app, backend, admin, and DB scripts',
  'Environment changes with values',
  'Production assets or zip links',
  'Owner name'
];

export interface NavItem {
  href: string;
  label: string;
  description: string;
  permissions?: PermissionKey[];
  activeOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Overview',
    description: 'Operational summary and quick actions'
  },
  {
    href: '/prs',
    label: 'PRs',
    description: 'Track review, assignment, and release mode',
    permissions: ['CAN_CREATE_PR', 'CAN_VIEW_ALL_PRS', 'CAN_REVIEW_PR', 'CAN_ASSIGN_PR'],
    activeOnly: true
  },
  {
    href: '/releases',
    label: 'Releases',
    description: 'Manage staging and production windows',
    permissions: ['CAN_MANAGE_RELEASE', 'CAN_SET_PROD_RELEASE_DATE'],
    activeOnly: true
  },
  {
    href: '/release-notes',
    label: 'Release Notes',
    description: 'Prepare personal and consolidated notes',
    permissions: ['CAN_GENERATE_OWN_RELEASE_NOTES', 'CAN_GENERATE_FULL_RELEASE_NOTES'],
    activeOnly: true
  },
  {
    href: '/users',
    label: 'Users',
    description: 'Verification, creation, and role assignment',
    permissions: ['CAN_CREATE_USER', 'CAN_VERIFY_USERS', 'CAN_ASSIGN_ROLE'],
    activeOnly: true
  },
  {
    href: '/roles',
    label: 'Roles',
    description: 'Role design and permission matrix',
    permissions: ['CAN_MANAGE_ROLES', 'CAN_MANAGE_PERMISSIONS'],
    activeOnly: true
  },
  {
    href: '/email-domains',
    label: 'Domains',
    description: 'Domain allowlist controls',
    permissions: ['CAN_MANAGE_EMAIL_DOMAIN'],
    activeOnly: true
  },
  {
    href: '/audit',
    label: 'Audit',
    description: 'Audit trail and notification delivery',
    permissions: ['CAN_MANAGE_ROLES', 'CAN_MANAGE_RELEASE'],
    activeOnly: true
  },
  {
    href: '/profile',
    label: 'Profile',
    description: 'Identity, roles, and session state'
  }
];
