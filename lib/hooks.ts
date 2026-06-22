'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAuditLogs,
  getNotifications,
  getPRs,
  getProfile,
  getReleaseDetail,
  getReleaseNote,
  getReleases,
  getFullReleaseNote,
  getUsers,
  getUserDirectory,
  saveFullReleaseNote,
  saveReleaseNote
} from '@/lib/api';
import {
  AuditEntry,
  NotificationEntry,
  PermissionKey,
  PR,
  Release,
  ReleaseDetail,
  ReleaseEnvironment,
  ReleaseNote,
  ReleaseStatus,
  UserDirectoryEntry,
  UserProfile,
  UserSummary
} from '@/lib/types';

export const useProfile = () =>
  useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: getProfile,
    retry: false
  });

export const usePRs = (params?: {
  status?: string;
  type?: string;
  ownerId?: string;
  reviewerId?: string;
  releaseId?: string;
  releaseEnvironment?: ReleaseEnvironment;
}, enabled = true) =>
  useQuery<PR[]>({
    queryKey: ['prs', params],
    queryFn: () => getPRs(params),
    enabled
  });

export const useReleases = (params?: { environment?: ReleaseEnvironment; status?: ReleaseStatus }, enabled = true) =>
  useQuery<Release[]>({
    queryKey: ['releases', params],
    queryFn: () => getReleases(params),
    enabled
  });

export const useReleaseDetail = (releaseId?: string, enabled = true) =>
  useQuery<ReleaseDetail>({
    queryKey: ['release-detail', releaseId],
    queryFn: () => getReleaseDetail(releaseId as string),
    enabled: enabled && Boolean(releaseId)
  });

export const useUsers = (params?: { status?: UserSummary['status'] }, enabled = true) =>
  useQuery<UserSummary[]>({
    queryKey: ['users', params],
    queryFn: () => getUsers(params),
    enabled
  });

export const useUserDirectory = (
  params?: { status?: UserSummary['status']; permissionKey?: PermissionKey; search?: string },
  enabled = true
) =>
  useQuery<UserDirectoryEntry[]>({
    queryKey: ['user-directory', params],
    queryFn: () => getUserDirectory(params),
    enabled
  });

export const useAuditLogs = (enabled = true) =>
  useQuery<AuditEntry[]>({
    queryKey: ['audit-logs'],
    queryFn: () => getAuditLogs(25),
    enabled
  });

export const useNotifications = (enabled = true) =>
  useQuery<NotificationEntry[]>({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(25),
    enabled
  });

export const useReleaseNote = (releaseId?: string, enabled = true) =>
  useQuery<ReleaseNote>({
    queryKey: ['release-note', releaseId],
    queryFn: () => getReleaseNote(releaseId as string),
    enabled: enabled && Boolean(releaseId)
  });

export const useFullReleaseNote = (releaseId?: string, enabled = true) =>
  useQuery<ReleaseNote>({
    queryKey: ['release-note-full', releaseId],
    queryFn: () => getFullReleaseNote(releaseId as string),
    enabled: enabled && Boolean(releaseId)
  });

export const useReleaseNoteMutation = (releaseId?: string) => {
  const queryClient = useQueryClient();

  return useMutation<ReleaseNote, Error, ReleaseNote>({
    mutationFn: saveReleaseNote,
    onSuccess: (releaseNote) => {
      queryClient.setQueryData(['release-note', releaseId], releaseNote);
    }
  });
};

export const useFullReleaseNoteMutation = (releaseId?: string) => {
  const queryClient = useQueryClient();

  return useMutation<ReleaseNote, Error, ReleaseNote>({
    mutationFn: saveFullReleaseNote,
    onSuccess: (releaseNote) => {
      queryClient.setQueryData(['release-note-full', releaseId], releaseNote);
    }
  });
};
