'use client';

import Link from 'next/link';
import { AppFrame } from '@/components/AppFrame';
import { EmptyState, SectionCard, StatCard, StatusBadge, type StatusTone } from '@/components/Ui';
import { AUDIT_PERMISSIONS, NAV_ITEMS, RELEASE_LIST_PERMISSIONS } from '@/lib/constants';
import { useAuditLogs, useNotifications, usePRs, useProfile, useReleases, useUsers } from '@/lib/hooks';
import { formatDateTime, formatName, formatPermission, formatRelativeShort, includesAnyPermission } from '@/lib/format';

const statusTone = (status: string): StatusTone => {
  if (status === 'APPROVED' || status === 'ACTIVE' || status === 'COMPLETED' || status === 'SENT') return 'success';
  if (status === 'REJECTED' || status === 'DISAPPROVED' || status === 'FAILED' || status === 'CANCELLED') return 'danger';
  if (status === 'UNDER_REVIEW' || status === 'SCHEDULED' || status === 'CREATED') return 'info';
  return 'warning';
};

export default function HomePage() {
  const profileQuery = useProfile();
  const profile = profileQuery.data;
  const permissions = profile?.permissions ?? [];
  const isActive = profile?.status === 'ACTIVE';

  const prsQuery = usePRs(undefined, Boolean(isActive));
  const releasesQuery = useReleases(undefined, Boolean(isActive && includesAnyPermission(permissions, RELEASE_LIST_PERMISSIONS)));
  const pendingUsersQuery = useUsers(
    { status: 'PENDING_VERIFICATION' },
    Boolean(isActive && includesAnyPermission(permissions, ['CAN_CREATE_USER', 'CAN_VERIFY_USERS', 'CAN_ASSIGN_ROLE']))
  );
  const auditQuery = useAuditLogs(Boolean(isActive && includesAnyPermission(permissions, AUDIT_PERMISSIONS)));
  const notificationQuery = useNotifications(Boolean(isActive && includesAnyPermission(permissions, AUDIT_PERMISSIONS)));

  const prs = prsQuery.data ?? [];
  const releases = releasesQuery.data ?? [];
  const pendingUsers = pendingUsersQuery.data ?? [];
  const audits = auditQuery.data ?? [];
  const notifications = notificationQuery.data ?? [];

  const visibleLinks = NAV_ITEMS.filter((item) => item.href !== '/').filter((item) => {
    if (item.activeOnly && !isActive) {
      return item.href === '/profile';
    }

    if (!item.permissions?.length) {
      return true;
    }

    return includesAnyPermission(permissions, item.permissions);
  });

  return (
    <AppFrame
      title="Overview"
      subtitle="A task-focused workspace for pull requests, releases, notes, and access controls. Everything shown here comes from live backend state, not frontend placeholders."
    >
      <section className="stat-grid">
        <StatCard label="PRs visible to you" value={prs.length} meta="Includes your own backlog unless you can view all PRs." tone="sunrise" />
        <StatCard label="Upcoming releases" value={releases.length} meta="Release discovery respects the widened backend access rules." tone="sea" />
        <StatCard label="Pending verifications" value={pendingUsers.length} meta="Only shown when your permissions allow user administration." tone="gold" />
        <StatCard label="Recent audit events" value={audits.length} meta="Role and release managers see the live trail." tone="ink" />
      </section>

      <div className="grid-2">
        <SectionCard title="Current workload" eyebrow="Operations" description="The most recent PRs, release windows, and verification requests that need attention next.">
          {prs.length ? (
            <div className="table-wrap">
              <table className="workspace-table">
                <thead>
                  <tr>
                    <th>PR</th>
                    <th>Status</th>
                    <th>Owner</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {prs.slice(0, 5).map((pr) => (
                    <tr key={pr.id}>
                      <td>
                        <strong>{pr.repo}</strong>
                        <p>{pr.branch}</p>
                      </td>
                      <td>
                        <StatusBadge tone={statusTone(pr.status)}>{pr.status}</StatusBadge>
                      </td>
                      <td>
                        <strong>{formatName(pr.owner)}</strong>
                        <small>{pr.reviewer ? `Reviewer: ${formatName(pr.reviewer)}` : 'Reviewer not assigned'}</small>
                      </td>
                      <td>
                        <strong>{formatRelativeShort(pr.updatedAt)}</strong>
                        <small>{formatDateTime(pr.updatedAt)}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No PR activity yet"
              description="Once the backend returns PR records for your account, they appear here with review and release metadata."
              action={
                isActive && includesAnyPermission(permissions, ['CAN_CREATE_PR']) ? (
                  <Link href="/prs" className="button-primary">
                    Open PR workspace
                  </Link>
                ) : null
              }
            />
          )}
        </SectionCard>

        <SectionCard title="Navigation" eyebrow="Quick actions" description="Each area opens only the workflows your current permissions actually support.">
          <div className="stack-list">
            {visibleLinks.map((item) => (
              <Link key={item.href} href={item.href} className="list-card">
                <div className="list-row">
                  <div>
                    <h3>{item.label}</h3>
                    <p>{item.description}</p>
                  </div>
                  <span className="button-link">Open</span>
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid-2">
        <SectionCard
          title="Release windows"
          eyebrow="Calendar"
          description="Upcoming release cutoffs and production dates pulled from the release APIs that are now exposed to note contributors as well as managers."
        >
          {releases.length ? (
            <div className="stack-list">
              {releases.slice(0, 4).map((release) => (
                <div key={release.id} className="list-card">
                  <div className="list-row">
                    <div>
                      <p className="eyebrow">{release.environment}</p>
                      <h3>{release.name}</h3>
                      <p>
                        Cutoff {formatDateTime(release.cutoffAt)} · Release {formatDateTime(release.releaseDate)}
                      </p>
                    </div>
                    <div className="tag-list">
                      <StatusBadge tone={statusTone(release.status)}>{release.status}</StatusBadge>
                      <span className="soft-chip">{release.prCount} linked PRs</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No release windows visible" description="Release cards appear here when your account can access the release listing endpoints." />
          )}
        </SectionCard>

        <SectionCard
          title="Permission posture"
          eyebrow="Access"
          description="PRism is now driven directly by the permission matrix in the backend, so the workspace only loads the queries your current role union supports."
        >
          <div className="chip-list">
            {permissions.map((permission) => (
              <span key={permission} className="soft-chip">
                {formatPermission(permission)}
              </span>
            ))}
          </div>
        </SectionCard>
      </div>

      {includesAnyPermission(permissions, AUDIT_PERMISSIONS) ? (
        <div className="grid-2">
          <SectionCard title="Audit trail" eyebrow="Governance" description="Recent actions across roles, releases, and user verification.">
            {audits.length ? (
              <div className="stack-list">
                {audits.slice(0, 5).map((audit) => (
                  <div key={audit.id} className="subtle-card">
                    <div className="list-row">
                      <div>
                        <h3>{audit.action}</h3>
                        <p>
                          {audit.entityType} · by {audit.performedBy}
                        </p>
                      </div>
                      <small>{formatDateTime(audit.createdAt)}</small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No audit entries yet" description="Audit data appears when the backend returns recent immutable events." />
            )}
          </SectionCard>

          <SectionCard title="Notification delivery" eyebrow="Signals" description="Delivery logs for review assignments, release creation, and release-note updates.">
            {notifications.length ? (
              <div className="stack-list">
                {notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="subtle-card">
                    <div className="list-row">
                      <div>
                        <h3>{notification.eventType}</h3>
                        <p>{notification.recipient}</p>
                      </div>
                      <div className="tag-list">
                        <StatusBadge tone={statusTone(notification.status)}>{notification.status}</StatusBadge>
                        <small>{formatDateTime(notification.createdAt)}</small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No notifications logged" description="Notification outcomes will show up here once the relevant backend events fire." />
            )}
          </SectionCard>
        </div>
      ) : null}
    </AppFrame>
  );
}
