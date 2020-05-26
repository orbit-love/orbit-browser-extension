document.addEventListener("DOMContentLoaded", async () => {
  const ORBIT_CREDENTIALS = await getOrbitCredentials();
  gitHubInjection(async () => {
    const commentHeaders = window.document.getElementsByClassName(
      "timeline-comment-header"
    );
    for (const commentHeader of commentHeaders) {
      const commentActionsElement = commentHeader.querySelector(
        ".timeline-comment-actions"
      );
      const gitHubUsername = commentHeader.querySelector(".author").innerText;
      const orbitActionElement = await createOrbitDetailsElement(
        ORBIT_CREDENTIALS,
        gitHubUsername
      );
      commentActionsElement.insertBefore(
        orbitActionElement,
        commentActionsElement.firstChild
      );
    }
  });
});
