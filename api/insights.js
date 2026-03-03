export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const NOTION_API_KEY = process.env.NOTION_API_KEY;
  const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    res.status(500).json({ error: "Notion API not configured" });
    return;
  }

  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sorts: [{ property: "Date", direction: "descending" }],
          page_size: 20,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status}`);
    }

    const data = await response.json();

    const insights = data.results.map((page) => {
      const props = page.properties;
      return {
        title: extractTitle(props.Name || props.Title),
        date: extractDate(props.Date),
        tags: extractMultiSelect(props.Tags),
        summary: extractRichText(props.Summary),
      };
    });

    res.status(200).json(insights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function extractTitle(prop) {
  if (!prop || !prop.title) return "";
  return prop.title.map((t) => t.plain_text).join("");
}

function extractDate(prop) {
  if (!prop || !prop.date) return "";
  return prop.date.start || "";
}

function extractMultiSelect(prop) {
  if (!prop || !prop.multi_select) return [];
  return prop.multi_select.map((s) => s.name);
}

function extractRichText(prop) {
  if (!prop || !prop.rich_text) return "";
  return prop.rich_text.map((t) => t.plain_text).join("");
}
