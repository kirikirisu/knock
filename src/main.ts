import { App } from "@slack/bolt";
import { Client } from "@notionhq/client";

const ParagraphBlock = {
  crateParagraph(text: string) {
    return {
      paragraph: {
        rich_text: [
          {
            text: {
              content: text,
            },
          },
        ],
      },
    };
  },
  crateParagraphWithLink(text: string, url: string) {
    return {
      paragraph: {
        rich_text: [
          {
            text: {
              content: text,
              link: {
                url,
              },
            },
          },
        ],
      },
    };
  },
};

const notion = new Client({ auth: process.env.NOTION_KEY });
const slack = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

slack.event("reaction_added", async ({ event, client, logger }) => {
  const { item, reaction } = event;
  if (reaction !== "+1") return;

  const resReplies = await client.conversations.replies({
    channel: `${item.channel}`,
    ts: `${item.ts}`,
  });
  if (resReplies.messages === undefined) return;
  // TODO: rich text対応(messages[x].block)、
  // https://api.slack.com/reference/block-kit/blocks#rich_text
  // TODO: 念の為時間でソート
  const slackTextList = resReplies.messages.map((msg) => msg.text ?? "");

  // TODO: rich text 対応
  // https://developers.notion.com/reference/rich-text
  const notionTextList = slackTextList
    .slice(1)
    .map((msg) => ParagraphBlock.crateParagraph(msg));

  const pageId = process.env.NOTION_PAGE_ID;
  const newPage = await notion.pages.create({
    parent: {
      type: "page_id",
      page_id: pageId ?? "",
    },
    properties: {
      title: {
        type: "title",
        title: [
          {
            type: "text",
            text: {
              content: slackTextList[0] ?? "",
              link: null,
            },
          },
        ],
      },
    },
  });

  await notion.blocks.children.append({
    block_id: newPage.id,
    children: notionTextList,
  });
});

(async () => {
  await slack.start(process.env.PORT || 3000);

  console.log("slack running");
})();
