function createProcessRuntime({ execFile, projectRoot }) {
  function execFileText(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      execFile(command, args, {
        cwd: projectRoot,
        timeout: 10000,
        maxBuffer: 1024 * 1024,
        ...options
      }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
          return;
        }

        resolve(stdout.trim());
      });
    });
  }

  function execFileCapture(command, args, options = {}) {
    return new Promise(resolve => {
      execFile(command, args, {
        timeout: 20000,
        maxBuffer: 1024 * 1024,
        ...options
      }, (error, stdout, stderr) => {
        resolve({
          exitCode: error && typeof error.code === 'number' ? error.code : 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          error: error ? error.message : null
        });
      });
    });
  }

  async function getGitStatusSnapshot() {
    const [branch, shortStatus, lastCommit] = await Promise.all([
      execFileText('git', ['rev-parse', '--abbrev-ref', 'HEAD']).catch(error => `unknown (${error.message})`),
      execFileText('git', ['status', '--short']).catch(error => `Unable to read git status: ${error.message}`),
      execFileText('git', ['log', '-1', '--oneline']).catch(error => `unknown (${error.message})`)
    ]);

    return {
      branch,
      shortStatus,
      lastCommit,
      clean: shortStatus.length === 0,
      checkedAt: new Date().toISOString()
    };
  }

  function parseGitRemoteOutput(remoteOutput = '') {
    return String(remoteOutput || '')
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const match = line.match(/^(\S+)\s+(\S+)\s+\((fetch|push)\)$/);

        if (!match) {
          return {
            name: 'unknown',
            url: line,
            direction: 'unknown'
          };
        }

        return {
          name: match[1],
          url: match[2],
          direction: match[3]
        };
      });
  }

  function maskRemoteUrl(url = '') {
    return String(url || '').replace(/https:\/\/([^:@/]+):([^@/]+)@/i, 'https://$1:***@');
  }

  async function getGitPublishStatus(target = {}) {
    const owner = String(target.owner || 'EtherealCoin').trim() || 'EtherealCoin';
    const repo = String(target.repo || 'EtherealAI').trim() || 'EtherealAI';
    const expectedHttpsUrl = `https://github.com/${owner}/${repo}.git`;
    const expectedHttpsWithUserUrl = `https://${owner}@github.com/${owner}/${repo}.git`;
    const expectedSshUrl = `git@github.com:${owner}/${repo}.git`;
    const [gitStatus, remoteOutput, recentCommitOutput] = await Promise.all([
      getGitStatusSnapshot(),
      execFileText('git', ['remote', '-v']).catch(error => `Unable to read git remotes: ${error.message}`),
      execFileText('git', ['log', '--oneline', '-5']).catch(error => `Unable to read recent commits: ${error.message}`)
    ]);
    const remotes = parseGitRemoteOutput(remoteOutput).map(remote => ({
      ...remote,
      url: maskRemoteUrl(remote.url)
    }));
    const originPush = remotes.find(remote => remote.name === 'origin' && remote.direction === 'push')
      || remotes.find(remote => remote.name === 'origin')
      || null;
    const originUrl = originPush?.url || '';
    const matchesTarget = [
      expectedHttpsUrl,
      expectedHttpsWithUserUrl,
      expectedSshUrl
    ].includes(originUrl);
    const usesHttps = /^https:\/\//i.test(originUrl);
    const usesSsh = /^git@github\.com:/i.test(originUrl);
    const authState = usesHttps
      ? 'needs_pat_or_credential_manager'
      : usesSsh
        ? 'needs_ssh_key_configured'
        : 'unknown';
    const recentCommits = String(recentCommitOutput || '')
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    return {
      target: {
        owner,
        repo,
        visibility: 'owner_selected_private_recommended',
        expectedHttpsUrl,
        expectedHttpsWithUserUrl,
        expectedSshUrl
      },
      git: {
        ...gitStatus,
        remotes,
        originPushUrl: originUrl,
        matchesTarget,
        recentCommits
      },
      publishReadiness: {
        readyToPushLocally: gitStatus.branch === 'main' && matchesTarget && gitStatus.clean === true,
        authState,
        blockedBy: matchesTarget
          ? ['github_authentication_required']
          : ['remote_target_mismatch', 'github_authentication_required'],
        nextOwnerActions: [
          'Create or open the GitHub account in the browser.',
          'Create a private repository named EtherealAI under owner EtherealCoin or the chosen account.',
          'Authenticate this Mac with a GitHub Personal Access Token, GitHub CLI, credential manager, or SSH key.',
          'Run git push -u origin main after authentication.'
        ],
        passwordAuthAllowed: false,
        tokenStoredByEtherealAI: false,
        externalAccountCreatedByEtherealAI: false
      },
      safetyBoundary: {
        localOnlyStatusCheck: true,
        noCredentialStored: true,
        noPasswordUse: true,
        noAccountCreation: true,
        noNetworkPushAttempt: true
      },
      checkedAt: new Date().toISOString()
    };
  }

  return {
    execFileText,
    execFileCapture,
    getGitStatusSnapshot,
    getGitPublishStatus
  };
}

module.exports = {
  createProcessRuntime
};
