import { PermissionKey, PersonSummary } from '@/lib/types';

export const formatName = (person?: Pick<PersonSummary, 'firstName' | 'lastName' | 'email'> | null) => {
  if (!person) {
    return 'Unassigned';
  }

  const name = `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim();
  return name || person.email;
};

export const formatDate = (value?: string | null) => {
  if (!value) {
    return 'TBD';
  }

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatDateTime = (value?: string | null) => {
  if (!value) {
    return 'TBD';
  }

  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatRelativeShort = (value?: string | null) => {
  if (!value) {
    return 'No date';
  }

  const date = new Date(value).getTime();
  const diff = date - Date.now();
  const absHours = Math.round(Math.abs(diff) / (1000 * 60 * 60));

  if (absHours < 24) {
    return diff >= 0 ? `in ${absHours || 1}h` : `${absHours || 1}h ago`;
  }

  const absDays = Math.round(absHours / 24);
  return diff >= 0 ? `in ${absDays}d` : `${absDays}d ago`;
};

export const titleCase = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const permissionLabels: Record<PermissionKey, string> = {
  CAN_CREATE_PR: 'Create PRs',
  CAN_VIEW_ALL_PRS: 'View all PRs',
  CAN_REVIEW_PR: 'Review PRs',
  CAN_ASSIGN_PR: 'Assign reviewers',
  CAN_GENERATE_OWN_RELEASE_NOTES: 'Write own release notes',
  CAN_GENERATE_FULL_RELEASE_NOTES: 'Publish full release notes',
  CAN_MANAGE_ROLES: 'Manage roles',
  CAN_MANAGE_PERMISSIONS: 'Manage permissions',
  CAN_MANAGE_EMAIL_DOMAIN: 'Manage email domains',
  CAN_VERIFY_USERS: 'Verify users',
  CAN_CREATE_USER: 'Create users',
  CAN_ASSIGN_ROLE: 'Assign roles',
  CAN_MANAGE_RELEASE: 'Manage releases',
  CAN_SET_PROD_RELEASE_DATE: 'Set production dates'
};

export const formatPermission = (permission: PermissionKey) => permissionLabels[permission] ?? titleCase(permission);

export const toInputDateTime = (value?: string | null) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const offsetMinutes = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offsetMinutes * 60_000);
  return local.toISOString().slice(0, 16);
};

export const fromInputDateTime = (value?: string) => {
  if (!value) {
    return undefined;
  }

  return new Date(value).toISOString();
};

export const includesAnyPermission = (have: PermissionKey[] | undefined, need: PermissionKey[]) =>
  need.some((permission) => have?.includes(permission));
