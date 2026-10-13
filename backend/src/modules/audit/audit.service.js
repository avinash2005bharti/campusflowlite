import AuditLog from '../../models/AuditLog.js';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js';

export const getAuditLogs = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.entityType) filter.entityType = query.entityType;
  if (query.entityId) filter.entityId = query.entityId;
  if (query.action) filter.action = query.action;
  if (query.actor) filter.actor = query.actor;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('actor', 'name email role')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    AuditLog.countDocuments(filter),
  ]);

  return {
    logs,
    meta: buildPaginationMeta(total, page, limit),
  };
};

export default {
  getAuditLogs,
};
