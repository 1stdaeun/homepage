async function triggerWorkflow(workflowFile, prNumber, ghToken, repo) {
  const response = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows/${workflowFile}/dispatches`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${ghToken}`,
      },
      body: JSON.stringify({
        ref: "main",
        inputs: { pr_number: prNumber },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${error}`);
  }
}

function htmlResponse(res, title, message) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(`<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f5f5f5}
.card{background:#fff;border-radius:12px;padding:40px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.1)}
h1{font-size:48px;margin:0 0 16px}p{color:#555;font-size:18px}</style>
</head><body><div class="card"><h1>${title}</h1><p>${message}</p></div></body></html>`);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action, pr } = req.query;

  if (!action || !pr) {
    return htmlResponse(
      res,
      "\ud83d\udcdd",
      "\uc2b9\uacc4 \uc5d0\ub514\ud130 MIN \uc5d4\ub4dc\ud3ec\uc778\ud2b8",
    );
  }

  const ghToken = process.env.MIN_GH_ACTIONS_TOKEN;
  const repo = process.env.VERCEL_GIT_REPO_SLUG
    ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
    : "1stdaeun/homepage";

  if (!ghToken) {
    return htmlResponse(
      res,
      "\u26a0\ufe0f",
      "\uc124\uc815 \uc624\ub958: GH_ACTIONS_TOKEN\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.",
    );
  }

  try {
    switch (action) {
      case "approve":
        await triggerWorkflow("merge-article.yml", pr, ghToken, repo);
        return htmlResponse(
          res,
          "\u2705",
          `PR #${pr} \uc2b9\uc778\ub418\uc5c8\uc2b5\ub2c8\ub2e4. \uba38\uc9c0 \uc911...`,
        );

      case "reject":
        await triggerWorkflow("close-article.yml", pr, ghToken, repo);
        return htmlResponse(
          res,
          "\u274c",
          `PR #${pr} \ubc18\ub824\ub418\uc5c8\uc2b5\ub2c8\ub2e4.`,
        );

      default:
        return htmlResponse(
          res,
          "\u2753",
          `\uc54c \uc218 \uc5c6\ub294 \uc561\uc158: ${action}`,
        );
    }
  } catch (err) {
    return htmlResponse(
      res,
      "\u26a0\ufe0f",
      `\uc624\ub958 \ubc1c\uc0dd: ${err.message}`,
    );
  }
}
