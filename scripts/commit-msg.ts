import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const IGNORED_BRANCHES = ['main', 'release'] as const;
const COMMIT_MSG_FILE: string = process.argv[2] || '';
const ISSUE_NUMBER_REGEX = /#(\d+)/;
const EXISTING_ISSUE_REGEX = /\[#\d+\]/;

type BranchName = string;
type IssueNumber = string;
type CommitMessage = string;

const getCurrentBranch = (): BranchName => {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  } catch (error) {
    console.error('브랜치 정보를 가져오는데 실패했습니다:', error);
    process.exit(1);
  }
};

const extractIssueNumber = (branchName: BranchName): IssueNumber | null => {
  const match = branchName.match(ISSUE_NUMBER_REGEX);
  return match ? match[1] : null;
};

const readCommitMessage = (filePath: string): CommitMessage => {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error('커밋 메시지 파일을 읽는데 실패했습니다:', error);
    process.exit(1);
  }
};

const writeCommitMessage = (filePath: string, message: CommitMessage): void => {
  try {
    writeFileSync(filePath, message);
  } catch (error) {
    console.error('커밋 메시지를 저장하는데 실패했습니다:', error);
    process.exit(1);
  }
};

const shouldProcessBranch = (branch: BranchName): boolean => {
  return !IGNORED_BRANCHES.includes(branch as (typeof IGNORED_BRANCHES)[number]);
};

const hasExistingIssueNumber = (commitMsg: CommitMessage): boolean => {
  return EXISTING_ISSUE_REGEX.test(commitMsg);
};

const main = (): void => {
  if (!COMMIT_MSG_FILE) {
    console.error('커밋 메시지 파일 경로가 제공되지 않았습니다.');
    process.exit(1);
  }

  const branch = getCurrentBranch();

  if (!shouldProcessBranch(branch)) {
    console.log('Main, Release 브랜치는 커밋 메시지 파일을 처리하지 않습니다.');
    process.exit(0);
  }

  const issueNumber = extractIssueNumber(branch);

  if (!issueNumber) {
    console.log('브랜치에서 이슈 번호를 찾을 수 없습니다.');
    process.exit(0);
  }

  const commitMsg = readCommitMessage(COMMIT_MSG_FILE);

  if (hasExistingIssueNumber(commitMsg)) {
    console.log('커밋 메시지에 이미 이슈 번호가 존재합니다.');
    process.exit(0);
  }

  const newCommitMsg = `[#${issueNumber}] ${commitMsg}`;

  writeCommitMessage(COMMIT_MSG_FILE, newCommitMsg);
  console.log(`이슈 번호 [#${issueNumber}]가 커밋 메시지에 추가되었습니다.`);
};

try {
  main();
} catch (error) {
  console.error('예상치 못한 에러가 발생했습니다:', error);
  process.exit(1);
}
