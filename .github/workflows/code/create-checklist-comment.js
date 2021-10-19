module.exports = async ({github, context}) => {
  const pathToChecklist = './e2e/checklist.md'
  const fs = require('fs')
  const { promisify } = require('util')
  const asyncReadFile = promisify(fs.readFile)
  const text = await asyncReadFile(pathToChecklist, 'utf-8')
  github.rest.issues.createComment({
    issue_number: context.issue.number,
    owner: context.repo.owner,
    repo: context.repo.repo,
    body: text
  })
}
