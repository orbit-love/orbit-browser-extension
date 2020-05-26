document.addEventListener("DOMContentLoaded", () => {
  gitHubInjection(() => {
    const commentHeader = window.document.getElementsByClassName(
      "timeline-comment-header"
    )[0];
    const commentActionsElement = commentHeader.querySelector(
      ".timeline-comment-actions"
    );
    const gitHubUsername = commentHeader.querySelector(".author").innerText;
    const orbitActionElement = createOrbitDetailsElement(gitHubUsername);
    commentActionsElement.insertBefore(
      orbitActionElement,
      commentActionsElement.firstChild
    );
  });
});
