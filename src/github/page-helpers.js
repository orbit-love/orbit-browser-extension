export const getPageType = () => {
  const issuePageRegex = /.*\/.*\/issues?\/.*/;
  const pullRequestPageRegex = /.*\/.*\/pulls?\/.*/;
  const discussionPageRegex = /.*\/.*\/discussions?\/.*/;

  const currentPath = window.location.pathname;

  if (currentPath.match(issuePageRegex)) {
    return "ISSUE";
  }
  if (currentPath.match(pullRequestPageRegex)) {
    return "PULL_REQUEST";
  }
  if (currentPath.match(discussionPageRegex)) {
    return "DISCUSSION";
  }

  return;
};
