export type PermissionKey =
  | 'CAN_CREATE_PR'
  | 'CAN_VIEW_ALL_PRS'
  | 'CAN_REVIEW_PR'
  | 'CAN_ASSIGN_PR'
  | 'CAN_GENERATE_OWN_RELEASE_NOTES'
  | 'CAN_GENERATE_FULL_RELEASE_NOTES'
  | 'CAN_MANAGE_ROLES'
  | 'CAN_MANAGE_PERMISSIONS'
  | 'CAN_MANAGE_EMAIL_DOMAIN'
  | 'CAN_VERIFY_USERS'
  | 'CAN_CREATE_USER'
  | 'CAN_ASSIGN_ROLE'
  | 'CAN_MANAGE_RELEASE'
  | 'CAN_SET_PROD_RELEASE_DATE';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION' | 'DISAPPROVED';
export type PrStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'REREVIEW' | 'DEPLOYED';
export type PrType = 'FEATURE' | 'ENHANCEMENT' | 'BUG';
export type ReleaseEnvironment = 'STAGING' | 'PRODUCTION' | 'UAT';
export type ReleaseStatus = 'CREATED' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
export type ReleaseLinkMode = 'MANUAL' | 'AUTO';
export type ReleasePrSource = 'MANUAL' | 'AUTO';
export type ReleaseNoteScope = 'OWN' | 'FULL';
export type DomainStatus = 'ACTIVE' | 'INACTIVE';
export type NotificationStatus = 'SENT' | 'FAILED';

export interface UserRole {
  id: string;
  name: string;
}

export interface PersonSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  githubUserId: string;
  status: UserStatus;
  roles: UserRole[];
  permissions: PermissionKey[];
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  githubUserId: string;
  status: UserStatus;
  roles: UserRole[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserDirectoryEntry {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  githubUserId: string;
  status: UserStatus;
  roles: UserRole[];
}

export interface RolePermission {
  id: string;
  key: PermissionKey;
  description: string | null;
}

export interface RoleSummary {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
  permissions: RolePermission[];
}

export interface EmailDomain {
  id: string;
  domain: string;
  status: DomainStatus;
  createdBy: string;
  createdAt: string;
}

export interface PrReleaseLink {
  releaseId: string;
  releaseName: string;
  environment: ReleaseEnvironment;
  status: ReleaseStatus | string;
  source: ReleasePrSource;
  linkedAt: string;
}

export interface PR {
  id: string;
  ownerId: string;
  repo: string;
  branch: string;
  prLink: string;
  reviewerId: string | null;
  status: PrStatus;
  type: PrType;
  zohoLink: string | null;
  deployedFlag: boolean;
  comments: string;
  releaseMode: ReleaseLinkMode;
  owner: PersonSummary;
  reviewer: PersonSummary | null;
  releaseLinks: PrReleaseLink[];
  createdAt: string;
  updatedAt: string;
}

export interface Release {
  id: string;
  environment: ReleaseEnvironment;
  status: ReleaseStatus;
  name: string;
  releaseDate: string | null;
  cutoffAt: string | null;
  prCount: number;
  autoLinkedCount?: number;
  createdBy: string;
  createdAt: string;
}

export interface ReleasePrSummary {
  id: string;
  repo: string;
  branch: string;
  prLink: string;
  status: PrStatus;
  type: PrType;
  deployedFlag: boolean;
  releaseMode: ReleaseLinkMode;
  comments: string;
  owner: PersonSummary;
  reviewer: PersonSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedReleasePr {
  prId: string;
  source: ReleasePrSource;
  addedBy: string | null;
  linkedAt: string;
  pr: ReleasePrSummary;
}

export interface ReleaseDetail extends Release {
  linkedPrs: LinkedReleasePr[];
  eligiblePrs: ReleasePrSummary[];
}

export interface AuditEntry {
  id: string;
  entityType: string;
  action: string;
  performedBy: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationEntry {
  id: string;
  eventType: string;
  recipient: string;
  status: NotificationStatus;
  createdAt: string;
}

export interface ReleaseNoteSection {
  title: string;
  content: string;
}

export interface ReleaseNote {
  id: string;
  releaseId: string;
  scope: ReleaseNoteScope;
  ownerId: string | null;
  content: string;
  other: ReleaseNoteSection[];
  version: number;
  updatedAt: string;
}
