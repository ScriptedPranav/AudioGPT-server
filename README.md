# AudioGPT-server
- [Click here] (https://audio-gpt-client.vercel.app/)
- [Client repository] (https://github.com/ScriptedPranav/AudioGPT-client)

## Setup Locally
- Obtain `<yourServiceAccount>.json` file from `google cloud console`
- Create `service_account.json` file at the root directory
- Create `.env`
```bash
  OPENAI_API_KEY = <YOUR_OPEN AI_SECRET KEY>
  GOOGLE_APPLICATION_CREDENTIALS = service_account.json
```
- Run `npm install`
- Start command: `npm run dev`
