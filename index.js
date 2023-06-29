const express = require('express');
const app = express();
const { v4: uuidv4 } = require('uuid');
const textToSpeech = require('@google-cloud/text-to-speech');
const { Storage } = require('@google-cloud/storage');
const cors = require('cors')
const dotenv = require('dotenv')
const {OpenAIApi,Configuration } = require('openai')


dotenv.config()
//Enable CORS
app.use(cors({origin:true}))

// Enable JSON request body parsing
app.use(express.json());


//Configure the OpenAI credentials
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

//Initiate new Api client
const openai = new OpenAIApi(configuration);

//Get OpenAI response
const chatGPT = async (prompt) => {
  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      max_tokens: 20,
      prompt: prompt,
    });
    return response.data.choices[0].text;
  } catch (err) {
    console.log(err);
    return err;
  }
};

// Configure the Google Cloud Storage client
const storage = new Storage({keyFileName: process.env.GOOGLE_APPLICATION_CREDENTIALS});

// Configure the Google Cloud Text-to-Speech client
const textToSpeechClient = new textToSpeech.TextToSpeechClient({
  keyFileName: process.env.GOOGLE_APPLICATION_CREDENTIALS
});



// Handle voice input
app.post('/api/bot', async (req, res) => {
  const { input } = req.body;
  const sessionId = uuidv4();

  try {
    // Process the input using GPT-3.5 Turbo
    const gptResponse = await chatGPT(input)
    console.log(gptResponse)

    // Convert the response text to speech
    const audioData = await convertTextToSpeech(gptResponse);

    // Upload the audio to Google Cloud Storage
    const audioFileName = `${sessionId}.mp3`;
    await uploadAudioToStorage(audioData, audioFileName);

    // Generate a signed URL for the audio file
    const signedUrl = await generateSignedUrl(audioFileName);

    // Return the signed URL as the response
    res.json({ audioUrl: signedUrl });
  } catch (error) {
    console.error('Error processing voice input:', error);
    res.status(500).json({ error: 'Error processing voice input' });
  }
});

// Convert text to speech using the Google Cloud Text-to-Speech client
async function convertTextToSpeech(text) {
  const request = {
    input: { text: text },
    voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
    audioConfig: { audioEncoding: 'MP3' },
  };

  const [response] = await textToSpeechClient.synthesizeSpeech(request);
  return response.audioContent;
}

// Upload audio data to Google Cloud Storage
async function uploadAudioToStorage(audioData, fileName) {
  const bucketName = 'audiogpt';

  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);

  await file.save(audioData, {
    contentType: 'audio/mpeg',
    metadata: {
      metadata: {
        // Set cache control headers as desired
        cacheControl: 'public, max-age=31536000',
      },
    },
  });
}

// Generate a signed URL for accessing the audio file
async function generateSignedUrl(fileName) {
  const bucketName = 'audiogpt';
  const expiration = Date.now() + 5 * 60 * 1000; // 5 minutes

  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);

  const options = {
    version: 'v4',
    action: 'read',
    expires: expiration,
  };

  const [url] = await file.getSignedUrl(options);
  return url;
}

// Start the server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
