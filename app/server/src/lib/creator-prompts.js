function createStarterPlan({ title, category, request }) {
  return {
    type: 'starter-plan',
    title,
    category,
    goal: request,
    phases: [
      'Clarify the target outcome and success criteria.',
      'Inspect the relevant project files and current system state.',
      'Create a small implementation plan with files, APIs, and tests.',
      'Make scoped edits only after the plan is reviewed.',
      'Run checks, report changes, and create a checkpoint.'
    ],
    safetyChecks: [
      'No private keys, exchange keys, wallet keys, or secret trading rules in prompts.',
      'No live trades, public posts, deployments, or destructive commands without explicit approval.',
      'All file writes must stay inside approved project folders.',
      'Every meaningful action should leave an audit trail.'
    ],
    nextAction: 'Review this plan, then generate an implementation checklist.'
  };
}

function buildCreatorPlanningPrompt({ title, category, request }) {
  return [
    'You are the planning brain for a local-first AI creator system.',
    'The owner is not a coder, so explain the plan plainly and concretely.',
    'Do not request private keys, wallet keys, exchange keys, or proprietary trading rules.',
    'Do not suggest live trading, public posting, deployment, or destructive commands without manual approval.',
    '',
    `Title: ${title}`,
    `Category: ${category}`,
    '',
    'User request:',
    request,
    '',
    'Return a concise build plan with these sections:',
    '1. Goal',
    '2. Assumptions',
    '3. Files or modules likely needed',
    '4. Step-by-step implementation plan',
    '5. Verification plan',
    '6. Safety gates before execution'
  ].join('\n');
}

function buildFileProposalPrompt({
  task,
  workspace,
  relativePath,
  instruction,
  currentContent,
  workspaceContext = null
}) {
  const planSummary = JSON.stringify(task.plan, null, 2).slice(0, 6000);
  const existingFileBlock = currentContent === null
    ? 'This file does not exist yet.'
    : currentContent.slice(0, 50000);
  const contextBlock = workspaceContext?.text || 'Workspace context was not collected.';

  return [
    'You are the coding model inside a local-first AI creator system.',
    'The owner is not a coder. Produce practical, complete file content that can be reviewed before it is written.',
    'Return ONLY the complete file content for the requested path.',
    'Do not wrap the answer in markdown fences. Do not add explanations before or after the file content.',
    'Do not include private keys, exchange keys, wallet keys, seed phrases, or live deployment secrets.',
    '',
    `Workspace name: ${workspace.name}`,
    `Workspace path: ${workspace.path}`,
    `Target relative path: ${relativePath}`,
    '',
    `Task title: ${task.title}`,
    `Task category: ${task.category}`,
    '',
    'Original owner request:',
    task.request,
    '',
    'Current task plan JSON:',
    planSummary,
    '',
    'Workspace context files:',
    contextBlock,
    '',
    'File-specific instruction:',
    instruction,
    '',
    'Existing file content:',
    existingFileBlock
  ].join('\n');
}

function buildMultiFileProposalPrompt({
  task,
  workspace,
  instruction,
  maxFiles,
  workspaceContext = null
}) {
  const planSummary = JSON.stringify(task.plan, null, 2).slice(0, 6000);
  const contextBlock = workspaceContext?.text || 'Workspace context was not collected.';

  return [
    'You are the coding model inside a local-first AI creator system.',
    'The owner is not a coder. Produce a small multi-file change that can be reviewed before anything is written.',
    'Return ONLY valid JSON. Do not wrap it in markdown fences. Do not add any explanation outside the JSON.',
    'Do not include private keys, exchange keys, wallet keys, seed phrases, or live deployment secrets.',
    `Create no more than ${maxFiles} files.`,
    '',
    'Required JSON schema:',
    '{"files":[{"relativePath":"path/inside/workspace.ext","content":"complete file content"}]}',
    '',
    `Workspace name: ${workspace.name}`,
    `Workspace path: ${workspace.path}`,
    '',
    `Task title: ${task.title}`,
    `Task category: ${task.category}`,
    '',
    'Original owner request:',
    task.request,
    '',
    'Current task plan JSON:',
    planSummary,
    '',
    'Existing workspace context:',
    contextBlock,
    '',
    'Multi-file instruction:',
    instruction
  ].join('\n');
}

function buildWorkspaceEditPrompt({
  task,
  workspace,
  goal,
  maxFiles,
  workspaceContext = null
}) {
  const planSummary = JSON.stringify(task.plan, null, 2).slice(0, 6000);
  const contextBlock = workspaceContext?.text || 'Workspace context was not collected.';

  return [
    'You are the workspace editing model inside a local-first AI creator system.',
    'The owner is not a coder. Convert the edit goal into a small, reviewable set of complete file proposals.',
    'Return ONLY valid JSON. Do not wrap it in markdown fences. Do not add any explanation outside the JSON.',
    'Do not include private keys, exchange keys, wallet keys, seed phrases, or live deployment secrets.',
    'Do not propose destructive cleanup. Preserve existing behavior unless the goal explicitly requires changing it.',
    `Create no more than ${maxFiles} files.`,
    '',
    'Required JSON schema:',
    '{"summary":"one sentence describing the edit","verification":"command or manual check to run after applying","files":[{"relativePath":"path/inside/workspace.ext","content":"complete file content"}]}',
    '',
    `Workspace name: ${workspace.name}`,
    `Workspace path: ${workspace.path}`,
    '',
    `Task title: ${task.title}`,
    `Task category: ${task.category}`,
    '',
    'Original owner request:',
    task.request,
    '',
    'Current task plan JSON:',
    planSummary,
    '',
    'Existing workspace context:',
    contextBlock,
    '',
    'Workspace edit goal:',
    goal
  ].join('\n');
}

function normalizeWorkspaceEditPayload(payload, maxFiles) {
  const files = normalizeGeneratedFiles(payload, maxFiles);
  const summary = String(payload?.summary || 'Workspace edit proposal generated.').trim().slice(0, 500);
  const verification = String(payload?.verification || 'Review and run the relevant project check after applying.').trim().slice(0, 500);

  return {
    summary,
    verification,
    files
  };
}

function extractGeneratedFileContent(modelResponse) {
  const trimmed = String(modelResponse || '').trim();

  if (!trimmed) {
    return '';
  }

  const fenced = trimmed.match(/^```[a-zA-Z0-9_.-]*\n([\s\S]*?)\n```$/);

  if (fenced) {
    return fenced[1];
  }

  return trimmed;
}

function parseJsonFromModelResponse(modelResponse) {
  const withoutFence = extractGeneratedFileContent(modelResponse);
  const firstBrace = withoutFence.indexOf('{');
  const lastBrace = withoutFence.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('Local model did not return a JSON object');
  }

  return JSON.parse(withoutFence.slice(firstBrace, lastBrace + 1));
}

function normalizeGeneratedFiles(payload, maxFiles) {
  if (!payload || !Array.isArray(payload.files)) {
    throw new Error('Local model JSON must include a files array');
  }

  if (!payload.files.length) {
    throw new Error('Local model returned no files');
  }

  if (payload.files.length > maxFiles) {
    throw new Error(`Local model returned too many files. Maximum allowed: ${maxFiles}`);
  }

  return payload.files.map((file, index) => {
    const relativePath = file.relativePath || file.path;
    const content = file.content || file.proposedContent;

    if (!relativePath || typeof relativePath !== 'string') {
      throw new Error(`Generated file ${index + 1} is missing relativePath`);
    }

    if (typeof content !== 'string') {
      throw new Error(`Generated file ${index + 1} is missing content`);
    }

    if (content.length > 250000) {
      throw new Error(`Generated file ${index + 1} is too large for this proposal flow`);
    }

    return {
      relativePath,
      content
    };
  });
}

function buildChecklistPrompt({ task, instruction, maxItems }) {
  const planSummary = JSON.stringify(task.plan, null, 2).slice(0, 6000);

  return [
    'You are the implementation checklist generator for a local-first AI creator system.',
    'The owner is not a coder. Create concrete, plain-English checklist items they can approve or mark done.',
    'Return ONLY valid JSON. Do not wrap it in markdown fences. Do not add text outside JSON.',
    `Create no more than ${maxItems} checklist items.`,
    '',
    'Required JSON schema:',
    '{"items":["short checklist item","short checklist item"]}',
    '',
    `Task title: ${task.title}`,
    `Task category: ${task.category}`,
    '',
    'Original owner request:',
    task.request,
    '',
    'Current task plan JSON:',
    planSummary,
    '',
    'Checklist instruction:',
    instruction
  ].join('\n');
}

function normalizeGeneratedChecklist(payload, maxItems) {
  if (!payload || !Array.isArray(payload.items)) {
    throw new Error('Local model JSON must include an items array');
  }

  const labels = payload.items.map(item => {
    if (typeof item === 'string') {
      return item.trim();
    }

    if (item && typeof item.label === 'string') {
      return item.label.trim();
    }

    return '';
  }).filter(Boolean);

  if (!labels.length) {
    throw new Error('Local model returned no checklist items');
  }

  if (labels.length > maxItems) {
    throw new Error(`Local model returned too many checklist items. Maximum allowed: ${maxItems}`);
  }

  return labels.map(label => {
    if (label.length > 240) {
      return `${label.slice(0, 237)}...`;
    }

    return label;
  });
}

module.exports = {
  createStarterPlan,
  buildCreatorPlanningPrompt,
  buildFileProposalPrompt,
  buildMultiFileProposalPrompt,
  buildWorkspaceEditPrompt,
  normalizeWorkspaceEditPayload,
  extractGeneratedFileContent,
  parseJsonFromModelResponse,
  normalizeGeneratedFiles,
  buildChecklistPrompt,
  normalizeGeneratedChecklist
};
