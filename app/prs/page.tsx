'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppFrame } from '@/components/AppFrame';
import {
  ActionDisclosure,
  EmptyState,
  Field,
  InlineMessage,
  SectionCard,
  SelectInput,
  StatCard,
  StatusBadge,
  type StatusTone,
  TextAreaInput,
  TextInput
} from '@/components/Ui';
import { assignPrReviewer, createPr, updatePrReleaseMode, updatePrStatus } from '@/lib/api';
import { PR_STATUS_OPTIONS, PR_TYPE_OPTIONS, RELEASE_LIST_PERMISSIONS } from '@/lib/constants';
import { formatDateTime, formatName, formatRelativeShort, includesAnyPermission } from '@/lib/format';
import { usePRs, useProfile, useReleases, useUserDirectory } from '@/lib/hooks';
import { PR } from '@/lib/types';

const EMPTY_PRS: PR[] = [];

const statusTone = (status: string): StatusTone => {
  if (status === 'APPROVED' || status === 'DEPLOYED') return 'success';
  if (status === 'REJECTED') return 'danger';
  if (status === 'UNDER_REVIEW') return 'info';
  return 'warning';
};

export default function PrsPage() {
  const queryClient = useQueryClient();
  const profile = useProfile().data;
  const permissions = profile?.permissions ?? [];
  const canCreate = permissions.includes('CAN_CREATE_PR');
  const canReview = permissions.includes('CAN_REVIEW_PR');
  const canAssign = permissions.includes('CAN_ASSIGN_PR');
  const canViewAll = permissions.includes('CAN_VIEW_ALL_PRS');
  const canSeeReleases = includesAnyPermission(permissions, RELEASE_LIST_PERMISSIONS);

  const [filters, setFilters] = useState({ status: '', type: '', releaseId: '' });
  const prsQuery = usePRs(
    {
      status: filters.status || undefined,
      type: filters.type || undefined,
      releaseId: filters.releaseId || undefined
    },
    Boolean(profile?.status === 'ACTIVE')
  );
  const releasesQuery = useReleases(undefined, Boolean(profile?.status === 'ACTIVE' && canSeeReleases));
  const reviewersQuery = useUserDirectory(
    { status: 'ACTIVE', permissionKey: 'CAN_REVIEW_PR' },
    Boolean(profile?.status === 'ACTIVE' && (canCreate || canAssign))
  );

  const prs = useMemo(() => prsQuery.data ?? EMPTY_PRS, [prsQuery.data]);
  const releases = releasesQuery.data ?? [];
  const reviewers = reviewersQuery.data ?? [];

  const [createState, setCreateState] = useState({
    repo: '',
    branch: '',
    prLink: '',
    type: 'FEATURE' as PR['type'],
    reviewerId: '',
    zohoLink: '',
    comments: '',
    releaseMode: 'MANUAL' as PR['releaseMode']
  });

  const [reviewerDrafts, setReviewerDrafts] = useState<Record<string, string>>({});
  const [statusDrafts, setStatusDrafts] = useState<Record<string, PR['status']>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [releaseModeDrafts, setReleaseModeDrafts] = useState<Record<string, PR['releaseMode']>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const invalidate = () => Promise.all([queryClient.invalidateQueries({ queryKey: ['prs'] }), queryClient.invalidateQueries({ queryKey: ['releases'] })]);

  const createMutation = useMutation({
    mutationFn: createPr,
    onSuccess: async () => {
      await invalidate();
      setMessage('PR created successfully.');
      setError('');
      setCreateState({
        repo: '',
        branch: '',
        prLink: '',
        type: 'FEATURE',
        reviewerId: '',
        zohoLink: '',
        comments: '',
        releaseMode: 'MANUAL'
      });
    },
    onError: (mutationError) => {
      setError((mutationError as Error).message);
      setMessage('');
    }
  });

  const reviewMutation = useMutation({
    mutationFn: updatePrStatus,
    onSuccess: async () => {
      await invalidate();
      setMessage('PR status updated.');
      setError('');
    },
    onError: (mutationError) => {
      setError((mutationError as Error).message);
      setMessage('');
    }
  });

  const assignMutation = useMutation({
    mutationFn: assignPrReviewer,
    onSuccess: async () => {
      await invalidate();
      setMessage('Reviewer assignment updated.');
      setError('');
    },
    onError: (mutationError) => {
      setError((mutationError as Error).message);
      setMessage('');
    }
  });

  const releaseModeMutation = useMutation({
    mutationFn: updatePrReleaseMode,
    onSuccess: async () => {
      await invalidate();
      setMessage('Release mode updated.');
      setError('');
    },
    onError: (mutationError) => {
      setError((mutationError as Error).message);
      setMessage('');
    }
  });

  const statusCounts = useMemo(
    () =>
      prs.reduce<Record<string, number>>((acc, pr) => {
        acc[pr.status] = (acc[pr.status] ?? 0) + 1;
        return acc;
      }, {}),
    [prs]
  );

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createMutation.mutate({
      repo: createState.repo,
      branch: createState.branch,
      prLink: createState.prLink,
      type: createState.type,
      reviewerId: createState.reviewerId || undefined,
      zohoLink: createState.zohoLink || undefined,
      comments: createState.comments || undefined,
      releaseMode: createState.releaseMode
    });
  };

  return (
    <AppFrame
      title="PR workspace"
      subtitle="Review queues, assignment, release mode, and release link visibility now run against the actual PR APIs and their backend response shapes."
      actions={
        <div className="inline-actions">
          {canSeeReleases ? (
            <SelectInput value={filters.releaseId} onChange={(event) => setFilters((current) => ({ ...current, releaseId: event.target.value }))}>
              <option value="">All releases</option>
              {releases.map((release) => (
                <option key={release.id} value={release.id}>
                  {release.name}
                </option>
              ))}
            </SelectInput>
          ) : null}
        </div>
      }
    >
      <section className="stat-grid">
        <StatCard label="Visible PRs" value={prs.length} meta={canViewAll ? 'You can review the full backlog.' : 'Scoped to your own PRs.'} tone="sunrise" />
        <StatCard label="Under review" value={statusCounts.UNDER_REVIEW ?? 0} meta="Use row actions to approve, reject, or request rereview." tone="sea" />
        <StatCard label="Approved" value={statusCounts.APPROVED ?? 0} meta="Approved PRs can be linked into staging releases." tone="gold" />
        <StatCard label="Deployed" value={statusCounts.DEPLOYED ?? 0} meta="Production-ready PRs stay visible with release link history." tone="ink" />
      </section>

      {canCreate ? (
        <ActionDisclosure title="Create PR" summary="The submission form stays collapsed until you need it, instead of occupying the page all the time.">
          <form className="form-grid" onSubmit={handleCreate}>
            <Field label="Repository" required>
              <TextInput value={createState.repo} onChange={(event) => setCreateState((current) => ({ ...current, repo: event.target.value }))} required />
            </Field>
            <Field label="Branch" required>
              <TextInput value={createState.branch} onChange={(event) => setCreateState((current) => ({ ...current, branch: event.target.value }))} required />
            </Field>
            <Field label="PR link" required>
              <TextInput value={createState.prLink} onChange={(event) => setCreateState((current) => ({ ...current, prLink: event.target.value }))} type="url" required />
            </Field>
            <Field label="PR type" required>
              <SelectInput value={createState.type} onChange={(event) => setCreateState((current) => ({ ...current, type: event.target.value as PR['type'] }))}>
                {PR_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Reviewer">
              <SelectInput value={createState.reviewerId} onChange={(event) => setCreateState((current) => ({ ...current, reviewerId: event.target.value }))}>
                <option value="">Assign later</option>
                {reviewers.map((reviewer) => (
                  <option key={reviewer.id} value={reviewer.id}>
                    {formatName(reviewer)}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Release mode" hint="AUTO lets release creation auto-link this PR when it becomes eligible.">
              <SelectInput value={createState.releaseMode} onChange={(event) => setCreateState((current) => ({ ...current, releaseMode: event.target.value as PR['releaseMode'] }))}>
                <option value="MANUAL">MANUAL</option>
                <option value="AUTO">AUTO</option>
              </SelectInput>
            </Field>
            <Field label="Zoho ticket link">
              <TextInput value={createState.zohoLink} onChange={(event) => setCreateState((current) => ({ ...current, zohoLink: event.target.value }))} type="url" />
            </Field>
            <Field label="Comments">
              <TextAreaInput value={createState.comments} onChange={(event) => setCreateState((current) => ({ ...current, comments: event.target.value }))} />
            </Field>
            <div className="inline-actions" style={{ alignItems: 'end' }}>
              <button type="submit" className="button-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create PR'}
              </button>
            </div>
          </form>
        </ActionDisclosure>
      ) : null}

      {message ? <InlineMessage tone="success">{message}</InlineMessage> : null}
      {error ? <InlineMessage tone="danger">{error}</InlineMessage> : null}

      <SectionCard
        title="Tracked pull requests"
        eyebrow="Backlog"
        description="Filters and row actions are connected to live query params and mutations instead of local placeholder state."
        aside={
          <div className="inline-actions">
            <SelectInput value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="">All statuses</option>
              {PR_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </SelectInput>
            <SelectInput value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}>
              <option value="">All types</option>
              {PR_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </SelectInput>
          </div>
        }
      >
        {prs.length ? (
          <div className="stack-list">
            {prs.map((pr) => {
              const reviewerId = reviewerDrafts[pr.id] ?? pr.reviewerId ?? '';
              const status = statusDrafts[pr.id] ?? pr.status;
              const comment = commentDrafts[pr.id] ?? pr.comments;
              const releaseMode = releaseModeDrafts[pr.id] ?? pr.releaseMode;

              return (
                <div key={pr.id} className="list-card">
                  <div className="list-row">
                    <div>
                      <p className="eyebrow">{pr.type}</p>
                      <h3>{pr.repo}</h3>
                      <p>
                        {pr.branch} · owner {formatName(pr.owner)} · updated {formatRelativeShort(pr.updatedAt)}
                      </p>
                    </div>
                    <div className="tag-list">
                      <StatusBadge tone={statusTone(pr.status)}>{pr.status}</StatusBadge>
                      <span className="soft-chip">{pr.releaseMode}</span>
                      {pr.deployedFlag ? <StatusBadge tone="success">DEPLOYED FLAG</StatusBadge> : null}
                    </div>
                  </div>

                  <div className="chip-list">
                    {pr.releaseLinks.length ? (
                      pr.releaseLinks.map((link) => (
                        <span key={`${pr.id}-${link.releaseId}`} className="soft-chip">
                          {link.environment}: {link.releaseName}
                        </span>
                      ))
                    ) : (
                      <span className="soft-chip">No release links yet</span>
                    )}
                  </div>

                  <div className="meta-row">
                    <Link href={pr.prLink} target="_blank" rel="noreferrer" className="button-link">
                      View PR link
                    </Link>
                    {pr.zohoLink ? (
                      <Link href={pr.zohoLink} target="_blank" rel="noreferrer" className="button-link">
                        Open Zoho ticket
                      </Link>
                    ) : null}
                    <span className="soft-chip">Reviewer: {pr.reviewer ? formatName(pr.reviewer) : 'Unassigned'}</span>
                    <span className="soft-chip">Last sync {formatDateTime(pr.updatedAt)}</span>
                  </div>

                  {(canReview || canAssign || canCreate) ? (
                    <ActionDisclosure title="PR actions" summary="Each mutation stays attached to the record it changes, instead of relying on raw ID fields elsewhere on the page.">
                      <div className="grid-3">
                        {canAssign ? (
                          <form
                            className="stack-card"
                            onSubmit={(event) => {
                              event.preventDefault();
                              if (!reviewerId) return;
                              assignMutation.mutate({ id: pr.id, reviewerId });
                            }}
                          >
                            <Field label="Assign reviewer">
                              <SelectInput value={reviewerId} onChange={(event) => setReviewerDrafts((current) => ({ ...current, [pr.id]: event.target.value }))}>
                                <option value="">Choose reviewer</option>
                                {reviewers.map((reviewer) => (
                                  <option key={reviewer.id} value={reviewer.id}>
                                    {formatName(reviewer)}
                                  </option>
                                ))}
                              </SelectInput>
                            </Field>
                            <button type="submit" className="button-secondary" disabled={assignMutation.isPending || !reviewerId}>
                              {assignMutation.isPending ? 'Updating...' : 'Assign reviewer'}
                            </button>
                          </form>
                        ) : null}

                        {canReview ? (
                          <form
                            className="stack-card"
                            onSubmit={(event) => {
                              event.preventDefault();
                              reviewMutation.mutate({ id: pr.id, status, comments: comment || undefined });
                            }}
                          >
                            <Field label="Update status">
                              <SelectInput value={status} onChange={(event) => setStatusDrafts((current) => ({ ...current, [pr.id]: event.target.value as PR['status'] }))}>
                                {PR_STATUS_OPTIONS.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </SelectInput>
                            </Field>
                            <Field label="Comments">
                              <TextAreaInput value={comment} onChange={(event) => setCommentDrafts((current) => ({ ...current, [pr.id]: event.target.value }))} />
                            </Field>
                            <button type="submit" className="button-secondary" disabled={reviewMutation.isPending}>
                              {reviewMutation.isPending ? 'Saving...' : 'Save review'}
                            </button>
                          </form>
                        ) : null}

                        {canCreate ? (
                          <form
                            className="stack-card"
                            onSubmit={(event) => {
                              event.preventDefault();
                              releaseModeMutation.mutate({ prIds: [pr.id], mode: releaseMode });
                            }}
                          >
                            <Field label="Release mode">
                              <SelectInput value={releaseMode} onChange={(event) => setReleaseModeDrafts((current) => ({ ...current, [pr.id]: event.target.value as PR['releaseMode'] }))}>
                                <option value="MANUAL">MANUAL</option>
                                <option value="AUTO">AUTO</option>
                              </SelectInput>
                            </Field>
                            <button type="submit" className="button-secondary" disabled={releaseModeMutation.isPending}>
                              {releaseModeMutation.isPending ? 'Saving...' : 'Update release mode'}
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </ActionDisclosure>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No PRs matched the current filters"
            description="Try clearing the filters, or create the first PR record if your account has submission access."
            action={
              filters.status || filters.type || filters.releaseId ? (
                <button type="button" className="button-ghost" onClick={() => setFilters({ status: '', type: '', releaseId: '' })}>
                  Reset filters
                </button>
              ) : canCreate ? (
                <Link href="#" className="button-ghost">
                  Use the create form above
                </Link>
              ) : null
            }
          />
        )}
      </SectionCard>
    </AppFrame>
  );
}
