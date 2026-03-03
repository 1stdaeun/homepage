import crypto from "crypto";

export const config = {
  api: { bodyParser: false },
};

function verifySlackSignature(signingSecret, timestamp, rawBody, signature) {
  const fiveMinutes = 5 * 60;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(timestamp)) > fiveMinutes) return false;

  const sigBasestring = `v0:${timestamp}:${rawBody}`;
  const hmac = crypto
    .createHmac("sha256", signingSecret)
    .update(sigBasestring)
    .digest("hex");
  const computed = `v0=${hmac}`;

  return crypto.timingSafeEqual(
    Buffer.from(computed, "utf-8"),
    Buffer.from(signature, "utf-8"),
  );
}

function extractPrNumber(prUrl) {
  const match = prUrl.match(/\/pull\/(\d+)/);
  return match ? match[1] : null;
}

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

async function updateSlackMessage(responseUrl, text) {
  await fetch(responseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      replace_original: false,
      text,
    }),
  });
}

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  // Allow GET for Slack URL verification during setup
  if (req.method === "GET") {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const signingSecret = process.env.MIN_SLACK_SIGNING_SECRET;
  const ghToken = process.env.MIN_GH_ACTIONS_TOKEN;
  const repo = process.env.VERCEL_GIT_REPO_SLUG
    ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
    : "rlaek/homepage";

  if (!signingSecret || !ghToken) {
    return res.status(500).json({ error: "Missing configuration" });
  }

  // Read raw body for signature verification
  const rawBody = await getRawBody(req);

  // Handle Slack url_verification challenge
  try {
    const body = JSON.parse(rawBody);
    if (body.type === "url_verification") {
      return res.status(200).json({ challenge: body.challenge });
    }
  } catch {
    // Not JSON — continue to normal payload handling
  }

  // Verify Slack signature
  const timestamp = req.headers["x-slack-request-timestamp"];
  const signature = req.headers["x-slack-signature"];

  if (!verifySlackSignature(signingSecret, timestamp, rawBody, signature)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  // Parse URL-encoded payload
  const params = new URLSearchParams(rawBody);
  const payload = JSON.parse(params.get("payload"));

  const action = payload.actions?.[0];
  if (!action) {
    return res.status(400).json({ error: "No action found" });
  }

  const prUrl = action.value;
  const prNumber = extractPrNumber(prUrl);
  const responseUrl = payload.response_url;
  const user = payload.user?.name || "unknown";

  if (!prNumber) {
    return res.status(400).json({ error: "Invalid PR URL" });
  }

  try {
    switch (action.action_id) {
      case "approve_article":
        await triggerWorkflow("merge-article.yml", prNumber, ghToken, repo);
        await updateSlackMessage(
          responseUrl,
          `\u2705 *${user}*\ub2d8\uc774 \uc2b9\uc778\ud588\uc2b5\ub2c8\ub2e4. PR #${prNumber} \uba38\uc9c0 \uc911...`,
        );
        break;

      case "request_revision":
        await updateSlackMessage(
          responseUrl,
          `\u270f\ufe0f *${user}*\ub2d8\uc774 \uc218\uc815\uc744 \uc694\uccad\ud588\uc2b5\ub2c8\ub2e4. \uc774 \uc2a4\ub808\ub4dc\uc5d0 \ud53c\ub4dc\ubc31\uc744 \ub0a8\uaca8\uc8fc\uc138\uc694.`,
        );
        break;

      case "reject_article":
        await triggerWorkflow("close-article.yml", prNumber, ghToken, repo);
        await updateSlackMessage(
          responseUrl,
          `\u274c *${user}*\ub2d8\uc774 \ubc18\ub824\ud588\uc2b5\ub2c8\ub2e4. PR #${prNumber} \ub2eb\ub294 \uc911...`,
        );
        break;

      default:
        return res
          .status(400)
          .json({ error: `Unknown action: ${action.action_id}` });
    }
  } catch (err) {
    console.error("Action handler error:", err);
    await updateSlackMessage(
      responseUrl,
      `\u26a0\ufe0f \ucc98\ub9ac \uc911 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4: ${err.message}`,
    );
    return res.status(500).json({ error: err.message });
  }

  return res.status(200).json({ ok: true });
}

export { verifySlackSignature, extractPrNumber };
