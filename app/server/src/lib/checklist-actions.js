function createChecklistActionsRuntime({
  dbAll,
  dbGet,
  dbRun,
  parseChecklistItem,
  saveAgentEvent
}) {
  async function createChecklistForTask(task) {
    const existing = await dbAll(
      'SELECT * FROM task_checklist_items WHERE task_id = ? ORDER BY position ASC',
      [task.id]
    );

    if (existing.length) {
      return existing.map(parseChecklistItem);
    }

    const plan = task.plan;
    const starterItems = [
      'Review the saved plan and confirm the outcome is correct.',
      'Confirm an approved workspace before any file writes.',
      'Check Git status before implementation.',
      'Create or update only the files named in the implementation checklist.',
      'Run the safest available verification command.',
      'Save a checkpoint record after verification.'
    ];

    const planItems = Array.isArray(plan.phases)
      ? plan.phases.map(phase => `Plan phase: ${phase}`)
      : [];
    const items = [...starterItems, ...planItems].slice(0, 12);

    for (let index = 0; index < items.length; index += 1) {
      await dbRun(
        `INSERT INTO task_checklist_items (task_id, label, position)
         VALUES (?, ?, ?)`,
        [task.id, items[index], index + 1]
      );
    }

    await saveAgentEvent(task.id, 'checklist.created', 'Implementation checklist was created', {
      itemCount: items.length
    });

    const rows = await dbAll(
      'SELECT * FROM task_checklist_items WHERE task_id = ? ORDER BY position ASC',
      [task.id]
    );

    return rows.map(parseChecklistItem);
  }

  async function appendChecklistItems(taskId, labels, eventType, metadata = {}) {
    const cleanLabels = labels
      .map(label => String(label || '').trim())
      .filter(Boolean);

    if (!cleanLabels.length) {
      return dbAll(
        'SELECT * FROM task_checklist_items WHERE task_id = ? ORDER BY position ASC',
        [taskId]
      ).then(rows => rows.map(parseChecklistItem));
    }

    const existing = await dbAll(
      'SELECT label FROM task_checklist_items WHERE task_id = ?',
      [taskId]
    );
    const existingLabels = new Set(existing.map(item => item.label.toLowerCase()));
    const maxRow = await dbGet(
      'SELECT MAX(position) AS maxPosition FROM task_checklist_items WHERE task_id = ?',
      [taskId]
    );
    let position = Number(maxRow?.maxPosition || 0);
    let insertedCount = 0;

    for (const label of cleanLabels) {
      const normalized = label.toLowerCase();

      if (existingLabels.has(normalized)) {
        continue;
      }

      position += 1;
      insertedCount += 1;
      existingLabels.add(normalized);

      await dbRun(
        `INSERT INTO task_checklist_items (task_id, label, position)
         VALUES (?, ?, ?)`,
        [taskId, label, position]
      );
    }

    if (insertedCount > 0) {
      await saveAgentEvent(taskId, eventType, 'Checklist items were added', {
        ...metadata,
        itemCount: insertedCount
      });
    }

    const rows = await dbAll(
      'SELECT * FROM task_checklist_items WHERE task_id = ? ORDER BY position ASC',
      [taskId]
    );

    return rows.map(parseChecklistItem);
  }

  return {
    createChecklistForTask,
    appendChecklistItems
  };
}

module.exports = {
  createChecklistActionsRuntime
};
