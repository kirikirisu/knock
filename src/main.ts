import { App } from '@slack/bolt';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

app.event('reaction_added', async ({event, logger}) => {
  logger.info(event);
  if (event.reaction === 'heart') {
  }
});

(async () => {
  await app.start(process.env.PORT || 3000);

  console.log('app running');
})();
