function parseFileProposal(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    task_id: row.task_id,
    workspace_id: row.workspace_id,
    relative_path: row.relative_path,
    action: row.action,
    current_content: row.current_content,
    proposed_content: row.proposed_content,
    status: row.status,
    applied_at: row.applied_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function parseTask(row) {
  if (!row) {
    return null;
  }

  return {
    ...row,
    plan: JSON.parse(row.plan_json),
    plan_json: undefined
  };
}

function parseChecklistItem(row) {
  return {
    id: row.id,
    task_id: row.task_id,
    label: row.label,
    status: row.status,
    position: row.position,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

module.exports = {
  parseFileProposal,
  parseTask,
  parseChecklistItem
};
