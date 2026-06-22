import {
  AuditEntry,
  EmailDomain,
  NotificationEntry,
  PermissionKey,
  PR,
  Release,
  ReleaseDetail,
  ReleaseEnvironment,
  ReleaseNote,
  ReleaseNoteSection,
  ReleaseStatus,
  RoleSummary,
  UserDirectoryEntry,
  UserProfile,
  UserSummary
} from '@/lib/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

type ApiError = Error & {
  status?: number;
  details?: unknown;
  issues?: Record<string, string[]>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toReleaseNoteSections = (value: unknown): ReleaseNoteSection[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!isRecord(entry)) {
        return null;
      }

      const title = typeof entry.title === 'string' ? entry.title : 'Additional';
      const content = typeof entry.content === 'string' ? entry.content : '';

      if (!content.trim()) {
        return null;
      }

      return { title, content };
    })
    .filter((entry): entry is ReleaseNoteSection => Boolean(entry));
};

const createHeaders = (headers?: HeadersInit) => {
  const merged = new Headers({
    Accept: 'application/json',
    'Content-Type': 'application/json'
  });

  if (headers) {
    new Headers(headers).forEach((value, key) => merged.set(key, value));
  }

  return merged;
};

const queryString = (params?: Record<string, string | number | undefined | null>) => {
  if (!params) {
    return '';
  }

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'undefined' || value === null || value === '') {
      return;
    }

    searchParams.set(key, String(value));
  });

  const encoded = searchParams.toString();
  return encoded ? `?${encoded}` : '';
};

const requestJson = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: createHeaders(options.headers)
  });

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(
      (isRecord(payload) && typeof payload.message === 'string' && payload.message) ||
        `Request failed with status ${response.status}`
    ) as ApiError;

    error.status = response.status;

    if (isRecord(payload)) {
      error.details = payload.details;
      if (isRecord(payload.issues)) {
        error.issues = Object.fromEntries(
          Object.entries(payload.issues).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
          ])
        );
      }
    }

    throw error;
  }

  return payload as T;
};

const mapReleaseNote = (value: unknown): ReleaseNote => {
  const payload = isRecord(value) ? value : {};

  return {
    id: typeof payload.id === 'string' ? payload.id : '',
    releaseId: typeof payload.releaseId === 'string' ? payload.releaseId : '',
    scope: payload.scope === 'FULL' ? 'FULL' : 'OWN',
    ownerId: typeof payload.ownerId === 'string' ? payload.ownerId : null,
    content: typeof payload.content === 'string' ? payload.content : '',
    other: toReleaseNoteSections(payload.other),
    version: typeof payload.version === 'number' ? payload.version : 1,
    updatedAt: typeof payload.updatedAt === 'string' ? payload.updatedAt : new Date().toISOString()
  };
};

export const requestOtp = (email: string) =>
  requestJson<{ message: string; devOtp?: string }>('/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ email })
  });

export const verifyOtp = (payload: {
  email: string;
  otp: string;
  firstName: string;
  lastName: string;
  githubUserId: string;
}) =>
  requestJson<{
    message: string;
    user: UserProfile;
    session: { id: string; expiresAt: string; rotatedSessionCount?: number };
  }>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const logout = (scope: 'CURRENT_SESSION' | 'ALL_SESSIONS' = 'CURRENT_SESSION') =>
  requestJson<{ message: string }>('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ scope })
  });

export const getProfile = async () => {
  const payload = await requestJson<{ profile: UserProfile }>('/profile');
  return payload.profile;
};

export const updateProfile = async (payload: {
  firstName?: string;
  lastName?: string;
  email?: string;
  githubUserId?: string;
}) =>
  requestJson<{ profile: UserProfile; requiresVerification?: boolean; notifiedVerifierCount?: number }>('/profile', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

export const getPRs = async (params?: {
  status?: string;
  type?: string;
  ownerId?: string;
  reviewerId?: string;
  releaseId?: string;
  releaseEnvironment?: ReleaseEnvironment;
}) => {
  const payload = await requestJson<{ prs: PR[] }>(`/prs${queryString(params)}`);
  return payload.prs;
};

export const createPr = async (payload: {
  repo: string;
  branch: string;
  prLink: string;
  type: PR['type'];
  reviewerId?: string;
  zohoLink?: string;
  comments?: string;
  releaseMode?: PR['releaseMode'];
}) => {
  const response = await requestJson<{ pr: PR }>('/prs', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return response.pr;
};

export const updatePrStatus = async (payload: { id: string; status: PR['status']; comments?: string }) => {
  const response = await requestJson<{ pr: PR }>(`/prs/${payload.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: payload.status, comments: payload.comments })
  });

  return response.pr;
};

export const assignPrReviewer = async (payload: { id: string; reviewerId: string }) => {
  const response = await requestJson<{ pr: PR }>(`/prs/${payload.id}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ reviewerId: payload.reviewerId })
  });

  return response.pr;
};

export const updatePrReleaseMode = async (payload: { prIds: string[]; mode: PR['releaseMode'] }) =>
  requestJson<{ updatedCount: number; message: string }>('/prs/release-mode', {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

export const getReleases = async (params?: { environment?: ReleaseEnvironment; status?: ReleaseStatus }) => {
  const payload = await requestJson<{ releases: Release[] }>(`/releases${queryString(params)}`);
  return payload.releases;
};

export const getReleaseDetail = async (id: string) => {
  const payload = await requestJson<{ release: ReleaseDetail }>(`/releases/${id}`);
  return payload.release;
};

export const createRelease = async (payload: {
  environment: ReleaseEnvironment;
  name: string;
  cutoffAt: string;
  releaseDate?: string;
  status?: ReleaseStatus;
}) => {
  const response = await requestJson<{ release: Release }>('/releases', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return response.release;
};

export const updateRelease = async (payload: {
  id: string;
  name?: string;
  environment?: ReleaseEnvironment;
  status?: ReleaseStatus;
  cutoffAt?: string;
}) => {
  const response = await requestJson<{ release: Release }>(`/releases/${payload.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: payload.name,
      environment: payload.environment,
      status: payload.status,
      cutoffAt: payload.cutoffAt
    })
  });

  return response.release;
};

export const setReleaseDate = async (payload: { id: string; releaseDate: string }) => {
  const response = await requestJson<{ release: Release }>(`/releases/${payload.id}/date`, {
    method: 'PATCH',
    body: JSON.stringify({ releaseDate: payload.releaseDate })
  });

  return response.release;
};

export const deleteRelease = (id: string) =>
  requestJson<{ message: string }>(`/releases/${id}`, {
    method: 'DELETE'
  });

export const addPrToRelease = (payload: { id: string; prId: string; source?: 'MANUAL' | 'AUTO' }) =>
  requestJson<{ message: string }>(`/releases/${payload.id}/add-pr`, {
    method: 'POST',
    body: JSON.stringify({ prId: payload.prId, source: payload.source ?? 'MANUAL' })
  });

export const removePrFromRelease = (payload: { id: string; prId: string }) =>
  requestJson<{ message: string }>(`/releases/${payload.id}/remove-pr`, {
    method: 'DELETE',
    body: JSON.stringify({ prId: payload.prId })
  });

export const getReleaseNote = async (releaseId: string) => {
  const payload = await requestJson<{ releaseNote: unknown }>(`/release-notes/my${queryString({ releaseId })}`);
  return mapReleaseNote(payload.releaseNote);
};

export const saveReleaseNote = async (note: ReleaseNote) => {
  const payload = await requestJson<{ releaseNote: unknown }>(`/release-notes/my${queryString({ releaseId: note.releaseId })}`, {
    method: 'PUT',
    body: JSON.stringify({
      content: note.content,
      other: note.other,
      expectedVersion: note.version
    })
  });

  return mapReleaseNote(payload.releaseNote);
};

export const getFullReleaseNote = async (releaseId: string) => {
  const payload = await requestJson<{ releaseNote: unknown }>(`/release-notes/${releaseId}`);
  return mapReleaseNote(payload.releaseNote);
};

export const saveFullReleaseNote = async (note: ReleaseNote) => {
  const payload = await requestJson<{ releaseNote: unknown }>(`/release-notes/${note.releaseId}`, {
    method: 'PUT',
    body: JSON.stringify({
      content: note.content,
      other: note.other,
      expectedVersion: note.version
    })
  });

  return mapReleaseNote(payload.releaseNote);
};

export const getUsers = async (params?: { status?: UserSummary['status'] }) => {
  const payload = await requestJson<{ users: UserSummary[] }>(`/users${queryString(params)}`);
  return payload.users;
};

export const getUserDirectory = async (params?: {
  status?: UserSummary['status'];
  permissionKey?: PermissionKey;
  search?: string;
}) => {
  const payload = await requestJson<{ users: UserDirectoryEntry[] }>(`/users/directory${queryString(params)}`);
  return payload.users;
};

export const createUser = async (payload: {
  firstName: string;
  lastName: string;
  email: string;
  githubUserId: string;
  status?: UserSummary['status'];
}) => {
  const response = await requestJson<{ user: UserSummary }>('/users', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return response.user;
};

export const approveUser = async (id: string) => {
  const response = await requestJson<{ user: UserSummary }>(`/users/${id}/approve`, { method: 'POST' });
  return response.user;
};

export const disapproveUser = async (payload: { id: string; reason?: string }) => {
  const response = await requestJson<{ user: UserSummary }>(`/users/${payload.id}/disapprove`, {
    method: 'POST',
    body: JSON.stringify({ reason: payload.reason })
  });

  return response.user;
};

export const assignRoleToUser = async (payload: { id: string; roleId: string }) => {
  const response = await requestJson<{ user: UserSummary }>(`/users/${payload.id}/roles`, {
    method: 'POST',
    body: JSON.stringify({ roleId: payload.roleId })
  });

  return response.user;
};

export const removeRoleFromUser = async (payload: { id: string; roleId: string }) => {
  const response = await requestJson<{ user: UserSummary }>(`/users/${payload.id}/roles/${payload.roleId}`, {
    method: 'DELETE'
  });

  return response.user;
};

export const getRoles = async () => {
  const payload = await requestJson<{ roles: RoleSummary[] }>('/roles');
  return payload.roles;
};

export const createRole = async (payload: {
  name: string;
  description?: string;
  permissions?: { permissionKey: PermissionKey }[];
}) => {
  const response = await requestJson<{ role: RoleSummary }>('/roles', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return response.role;
};

export const updateRole = async (payload: {
  id: string;
  name?: string;
  description?: string | null;
  permissions?: { permissionKey: PermissionKey }[];
}) => {
  const response = await requestJson<{ role: RoleSummary }>(`/roles/${payload.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: payload.name,
      description: payload.description,
      permissions: payload.permissions
    })
  });

  return response.role;
};

export const deleteRole = (id: string) =>
  requestJson<{ message: string }>(`/roles/${id}`, { method: 'DELETE' });

export const assignPermissionToRole = async (payload: { id: string; permissionKey: PermissionKey }) => {
  const response = await requestJson<{ role: RoleSummary }>(`/roles/${payload.id}/permissions`, {
    method: 'POST',
    body: JSON.stringify({ permissionKey: payload.permissionKey })
  });

  return response.role;
};

export const removePermissionFromRole = async (payload: { id: string; permissionId: string }) => {
  const response = await requestJson<{ role: RoleSummary }>(`/roles/${payload.id}/permissions/${payload.permissionId}`, {
    method: 'DELETE'
  });

  return response.role;
};

export const getEmailDomains = async () => {
  const payload = await requestJson<{ emailDomains: EmailDomain[] }>('/email-domains');
  return payload.emailDomains;
};

export const createEmailDomain = async (payload: { domain: string; status?: EmailDomain['status'] }) => {
  const response = await requestJson<{ emailDomain: EmailDomain }>('/email-domains', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return response.emailDomain;
};

export const deleteEmailDomain = (id: string) =>
  requestJson<{ message: string }>(`/email-domains/${id}`, { method: 'DELETE' });

export const updateEmailDomainStatus = async (payload: { id: string; status: EmailDomain['status'] }) => {
  const response = await requestJson<{ emailDomain: EmailDomain }>(`/email-domains/${payload.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: payload.status })
  });

  return response.emailDomain;
};

export const getAuditLogs = (limit = 25) => requestJson<AuditEntry[]>(`/audit-logs${queryString({ limit })}`);
export const getNotifications = (limit = 25) =>
  requestJson<NotificationEntry[]>(`/notifications${queryString({ limit })}`);
