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

  return {
    execFileText,
    execFileCapture,
    getGitStatusSnapshot
  };
}

module.exports = {
  createProcessRuntime
};
