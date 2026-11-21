import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function main() {
  const zai = await ZAI.create();
  const prompt =
    'neon purple esports gaming arena background, dark futuristic, glowing violet light grid horizon, floating holographic panels, deep black background with purple light rays, cinematic, high quality, no text';
  const sizes = ['1536x704', '1408x768', '1344x768'];
  for (const size of sizes) {
    try {
      const res = await zai.images.generations.create({ prompt, size: size as never });
      const b64 = res.data[0].base64;
      if (!b64) throw new Error('no base64');
      fs.writeFileSync('/home/z/my-project/public/images/hero-banner.png', Buffer.from(b64, 'base64'));
      console.log('OK with size', size);
      return;
    } catch (e) {
      console.error(`size ${size} failed:`, (e as Error).message.slice(0, 200));
      await new Promise((r) => setTimeout(r, 8000));
    }
  }
  console.log('ALL FAILED');
}
main();
