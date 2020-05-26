document.addEventListener("DOMContentLoaded", () => {
  gitHubInjection(async () => {
    const commentHeader = window.document.getElementsByClassName(
      "timeline-comment-header"
    )[0];
    const commentActionsElement = commentHeader.querySelector(
      ".timeline-comment-actions"
    );
    const gitHubUsername = commentHeader.querySelector(".author").innerText;
    const orbitActionElement = await createOrbitDetailsElement(gitHubUsername);
    commentActionsElement.insertBefore(
      orbitActionElement,
      commentActionsElement.firstChild
    );
  });
});
