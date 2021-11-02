module.exports = async ({github, context}) => {
  
  const querySpec = `query($owner:String!, $name:String!, $issueNumber:Int!, $cursor:String) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $issueNumber) {
        title
        comments(first:50, after: $cursor){
          totalCount
          edges{
            node {
              author{
                login
              }
              bodyText,
              isMinimized,
              id
            }
            cursor
          }
        }
      }
    }
  }`
  const variables = {
    owner: context.repo.owner,
    name: context.repo.repo,
    issueNumber: context.issue.number,
  }
  const results = []
  let cursor, totalCount = 0

  const query = async ({ cursor }) => {
    const resp = await github.graphql(querySpec, {
      ...variables,
      cursor
    })
    const {totalCount = 0, edges = [] } = (() => {
      try {
        return resp.repository.pullRequest.comments
      } catch (e) {
        console.warn('accessor error', e)
        return {}
      }
    })()
    return {
      results: edges.map(edge => edge.node),
      cursor: (() => {
        try {
          return edges[edges.length - 1].cursor
        } catch (e) {
          return null
        }
      })(),
      totalCount
    }
  }

  do {
    const {
      results: queryResults,
      cursor: queryCursor,
      totalCount: queryTotalCount
    } = await query({ cursor })
    results.push(...queryResults)
    cursor = queryCursor
    totalCount = queryTotalCount
  } while(!!cursor && totalCount > results.length)

  const commentsToMinimize = results.filter(res => res.author.login === 'github-actions' && !res.isMinimized)

  const mutation = `mutation($minComInput: MinimizeCommentInput!) {
    minimizeComment(input: $minComInput) {
      clientMutationId
      minimizedComment{
        minimizedReason
        viewerCanMinimize
        isMinimized
      }
    }
  }`

  console.log(`Minimizing ${commentsToMinimize.length} previous checklist comments.`)

  for (const result of results) {
    const mutationVariable = {
      "minComInput": {
        "subjectId": result.id,
        "classifier": "OUTDATED",
        "clientMutationId": "gha"
      }
    }
    await github.graphql(mutation, mutationVariable)
  }
}
