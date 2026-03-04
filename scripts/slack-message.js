import fs from "fs";

function buildSlackBlocks(meta, prUrl, baseUrl) {
  const { title, subtitle, description, tags, date } = meta;

  const tagsText = tags
    ? tags
        .split(",")
        .map((t) => t.trim())
        .join(" \u00b7 ")
    : "";

  // Extract PR number from URL
  const prMatch = prUrl.match(/\/pull\/(\d+)/);
  const prNumber = prMatch ? prMatch[1] : "";

  const approveUrl = `${baseUrl}/api/slack-min?action=approve&pr=${prNumber}`;
  const rejectUrl = `${baseUrl}/api/slack-min?action=reject&pr=${prNumber}`;

  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "\ud83d\udcdd \uc0c8 \uc544\ud2f0\ud074\uc774 \uc900\ube44\ub418\uc5c8\uc2b5\ub2c8\ub2e4",
        emoji: true,
      },
    },
    { type: "divider" },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*\uc81c\ubaa9:*\n${title}`,
        },
        {
          type: "mrkdwn",
          text: `*\ubd80\uc81c:*\n${subtitle}`,
        },
      ],
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*\ubc1c\ud589\uc77c:*\n${date}`,
        },
        {
          type: "mrkdwn",
          text: `*\ud0dc\uadf8:*\n${tagsText}`,
        },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `> ${description}`,
      },
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<${prUrl}|\ud83d\udccc GitHub PR \ud655\uc778\ud558\uae30>    <${approveUrl}|\u2705 \uc2b9\uc778\ud558\uae30>    <${rejectUrl}|\u274c \ubc18\ub824\ud558\uae30>`,
      },
    },
  ];
}

async function sendSlackMessage(meta, prUrl) {
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_CHANNEL_ID;

  if (!token) throw new Error("SLACK_BOT_TOKEN is required");
  if (!channel) throw new Error("SLACK_CHANNEL_ID is required");

  const baseUrl = process.env.SITE_URL || "https://consulting.lighttax.biz";
  const blocks = buildSlackBlocks(meta, prUrl, baseUrl);

  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      channel,
      text: `\uc0c8 \uc544\ud2f0\ud074: ${meta.title}`,
      blocks,
    }),
  });

  const result = await response.json();
  if (!result.ok) {
    throw new Error(`Slack API error: ${result.error}`);
  }

  console.log(`Slack message sent to channel ${channel}`);
  return result;
}

// CLI execution
async function main() {
  const metaPath = process.argv[2] || "/tmp/article-meta.json";
  const prUrl = process.argv[3] || "";

  if (!fs.existsSync(metaPath)) {
    throw new Error(`Article meta not found: ${metaPath}`);
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  await sendSlackMessage(meta, prUrl);
}

// CLI execution — only run when invoked directly
const isCLI =
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"));
if (isCLI) {
  main().catch((err) => {
    console.error("Failed to send Slack message:", err.message);
    process.exit(1);
  });
}

export { buildSlackBlocks, sendSlackMessage };
