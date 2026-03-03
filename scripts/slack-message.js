import fs from "fs";

function buildSlackBlocks(meta, prUrl) {
  const { title, subtitle, description, tags, date } = meta;

  const tagsText = tags
    ? tags
        .split(",")
        .map((t) => t.trim())
        .join(" · ")
    : "";

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
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<${prUrl}|GitHub PR \ud655\uc778\ud558\uae30>`,
      },
    },
    { type: "divider" },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "\u2705 \uc2b9\uc778",
            emoji: true,
          },
          style: "primary",
          action_id: "approve_article",
          value: prUrl,
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "\u270f\ufe0f \uc218\uc815 \uc694\uccad",
            emoji: true,
          },
          action_id: "request_revision",
          value: prUrl,
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "\u274c \ubc18\ub824",
            emoji: true,
          },
          style: "danger",
          action_id: "reject_article",
          value: prUrl,
        },
      ],
    },
  ];
}

async function sendSlackMessage(meta, prUrl) {
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_CHANNEL_ID;

  if (!token) throw new Error("SLACK_BOT_TOKEN is required");
  if (!channel) throw new Error("SLACK_CHANNEL_ID is required");

  const blocks = buildSlackBlocks(meta, prUrl);

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
