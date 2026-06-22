'use client';

import { AppFrame } from '@/components/AppFrame';
import { EmptyState, SectionCard, StatCard, StatusBadge } from '@/components/Ui';
import { formatDateTime } from '@/lib/format';
import { useAuditLogs, useNotifications, useProfile } from '@/lib/hooks';

const statusTone = (status: string) => {
  if (status === 'SENT') return 'success';
  if (status === 'FAILED') return 'danger';
  return 'info';
};

export default function AuditPage() {
  const profileQuery = useProfile();
  const permissions = profileQuery.data?.permissions ?? [];
  const canAudit =
    profileQuery.data?.status === 'ACTIVE' &&
    (permissions.includes('CAN_MANAGE_ROLES') || permissions.includes('CAN_MANAGE_RELEASE'));
  const auditQuery = useAuditLogs(Boolean(canAudit));
  const notificationQuery = useNotifications(Boolean(canAudit));
  const audits = auditQuery.data ?? [];
  const notifications = notificationQuery.data ?? [];
  const failedNotifications = notifications.filter((notification) => notification.status === 'FAILED');

  return (
    <AppFrame
      title="Audit & notifications"
      subtitle="Governance data now lives in the same rebuilt workspace as the operational pages. Audit events and notification outcomes are rendered as first-class records instead of a detached utility panel."
    >
      {!canAudit ? (
        <SectionCard
          title="Audit access required"
          eyebrow="Permissions"
          description="This route is available to active users with either `CAN_MANAGE_ROLES` or `CAN_MANAGE_RELEASE`."
        >
          <EmptyState
            title="No audit access"
            description="The backend will only return audit logs and notification delivery records to release managers and RBAC administrators."
          />
        </SectionCard>
      ) : null}

      {canAudit ? (
        <>
          <section className="stat-grid">
            <StatCard label="Audit entries" value={audits.length} meta="Recent immutable events pulled from `GET /audit-logs`." tone="sunrise" />
            <StatCard label="Notifications" value={notifications.length} meta="Delivery outcomes from `GET /notifications`." tone="sea" />
            <StatCard label="Failed delivery" value={failedNotifications.length} meta="Failures stay visible for operational follow-up." tone="gold" />
            <StatCard
              label="Last event"
              value={audits[0] ? formatDateTime(audits[0].createdAt) : 'None'}
              meta="Lists are ordered by most recent backend activity."
              tone="ink"
            />
          </section>

          <div className="grid-2">
            <SectionCard
              title="Audit trail"
              eyebrow="Events"
              description="Tracks role changes, release operations, verification actions, and other immutable backend events."
            >
              {audits.length ? (
                <div className="stack-list">
                  {audits.map((audit) => (
                    <div key={audit.id} className="list-card">
                      <div className="list-row">
                        <div>
                          <p className="eyebrow">
                            {audit.entityType} · {formatDateTime(audit.createdAt)}
                          </p>
                          <h3>{audit.action}</h3>
                          <p>Performed by {audit.performedBy}</p>
                        </div>
                        {audit.metadata ? <span className="soft-chip">Metadata attached</span> : null}
                      </div>
                      {audit.metadata ? (
                        <pre className="subtle-card" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                          {JSON.stringify(audit.metadata, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No audit events returned"
                  description="Once the backend records role, release, or verification activity, it will appear here in reverse chronological order."
                />
              )}
            </SectionCard>

            <SectionCard
              title="Notification delivery"
              eyebrow="Signals"
              description="Shows who was notified and whether the backend recorded the delivery as sent or failed."
            >
              {notifications.length ? (
                <div className="stack-list">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="list-card">
                      <div className="list-row">
                        <div>
                          <p className="eyebrow">{formatDateTime(notification.createdAt)}</p>
                          <h3>{notification.eventType}</h3>
                          <p>{notification.recipient}</p>
                        </div>
                        <StatusBadge tone={statusTone(notification.status)}>{notification.status}</StatusBadge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No notification outcomes returned"
                  description="Notification records appear here after backend workflows emit delivery logs."
                />
              )}
            </SectionCard>
          </div>
        </>
      ) : null}
    </AppFrame>
  );
}
