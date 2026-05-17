function createAgentRecordActionsRuntime({
  fs,
  path,
  dbRun,
  dbGet,
  getWorkspace,
  resolveWorkspacePath,
  parseFileProposal,
  getGitStatusSnapshot
}) {
  async function saveAgentEvent(taskId, eventType, message, metadata = null) {
    await dbRun(
      `INSERT INTO agent_events (task_id, event_type, message, metadata_json)
       VALUES (?, ?, ?, ?)`,
      [
        taskId,
        eventType,
        message,
        metadata ? JSON.stringify(metadata) : null
      ]
    );
  }

  async function applyFileProposalRecord(proposal) {
    if (!proposal) {
      throw new Error('File proposal not found');
    }

    if (proposal.status !== 'approved') {
      throw new Error('Proposal must be approved before it can be applied');
    }

    const workspace = await getWorkspace(proposal.workspace_id);
    const { targetPath } = resolveWorkspacePath(workspace, proposal.relative_path);

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, proposal.proposed_content, 'utf8');

    await dbRun(
      `UPDATE file_write_proposals
       SET status = 'applied', applied_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [proposal.id]
    );

    if (proposal.task_id) {
      await saveAgentEvent(proposal.task_id, 'file.proposal.applied', 'Approved file proposal was applied', {
        proposalId: proposal.id,
        workspaceId: proposal.workspace_id,
        relativePath: proposal.relative_path
      });
    }

    return parseFileProposal(await dbGet(
      'SELECT * FROM file_write_proposals WHERE id = ?',
      [proposal.id]
    ));
  }

  async function createCheckpointRecord(taskId = null, note = 'Manual checkpoint record') {
    const gitStatus = await getGitStatusSnapshot();
    const result = await dbRun(
      `INSERT INTO checkpoint_records (task_id, note, git_status)
       VALUES (?, ?, ?)`,
      [
        taskId,
        note,
        JSON.stringify(gitStatus)
      ]
    );

    if (taskId) {
      await saveAgentEvent(taskId, 'checkpoint.recorded', 'Git checkpoint record was saved', {
        checkpointId: result.lastID,
        clean: gitStatus.clean
      });
    }

    const checkpoint = await dbGet(
      'SELECT * FROM checkpoint_records WHERE id = ?',
      [result.lastID]
    );

    return {
      ...checkpoint,
      git_status: JSON.parse(checkpoint.git_status)
    };
  }

  async function createFileProposalRecords({ taskId, workspaceId, files, initialStatus }) {
    const proposalIds = [];

    for (const file of files) {
      const result = await dbRun(
        `INSERT INTO file_write_proposals
         (task_id, workspace_id, relative_path, action, current_content, proposed_content, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          taskId,
          workspaceId,
          file.safePath,
          'upsert',
          file.currentContent,
          file.proposedContent,
          initialStatus
        ]
      );

      proposalIds.push(result.lastID);
    }

    return proposalIds;
  }

  return {
    saveAgentEvent,
    applyFileProposalRecord,
    createCheckpointRecord,
    createFileProposalRecords
  };
}

module.exports = {
  createAgentRecordActionsRuntime
};
