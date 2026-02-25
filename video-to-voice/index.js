require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CHUNK_DURATION_SECONDS = 600; // 10 minutes per chunk
const TEMP_DIR = path.join(__dirname, "temp_audio_chunks");

function extractAudioChunks(videoPath) {
  if (!fs.existsSync(videoPath)) {
    throw new Error(`Video file not found: ${videoPath}`);
  }

  // Get total duration in seconds
  const durationOutput = execSync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 "${videoPath}"`,
    { encoding: "utf-8" }
  ).trim();
  const totalDuration = parseFloat(durationOutput);
  console.log(`Video duration: ${Math.round(totalDuration / 60)} minutes`);

  // Create temp directory
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true });
  }
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  // Split into chunks
  const totalChunks = Math.ceil(totalDuration / CHUNK_DURATION_SECONDS);
  const chunkPaths = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_DURATION_SECONDS;
    const chunkPath = path.join(TEMP_DIR, `chunk_${i}.mp3`);

    console.log(
      `Extracting chunk ${i + 1}/${totalChunks} (start: ${Math.round(start / 60)}min)...`
    );

    execSync(
      `ffmpeg -y -i "${videoPath}" -ss ${start} -t ${CHUNK_DURATION_SECONDS} -vn -acodec libmp3lame -q:a 4 "${chunkPath}"`,
      { stdio: "ignore" }
    );

    chunkPaths.push(chunkPath);
  }

  return chunkPaths;
}

async function transcribeChunk(chunkPath, index, total) {
  console.log(`Transcribing chunk ${index + 1}/${total}...`);

  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(chunkPath),
    model: "whisper-1",
  });

  return transcription.text;
}

async function main() {
  const videoPath = process.argv[2];

  if (!videoPath) {
    console.error("Usage: node index.js <video-file-path>");
    process.exit(1);
  }

  const resolvedPath = path.resolve(videoPath);
  console.log(`Processing: ${resolvedPath}\n`);

  // Step 1: Extract audio chunks
  console.log("--- Extracting audio chunks ---");
  const chunkPaths = extractAudioChunks(resolvedPath);
  console.log(`\nCreated ${chunkPaths.length} chunks\n`);

  // Step 2: Transcribe each chunk
  console.log("--- Transcribing with Whisper ---");
  const transcriptions = [];

  for (let i = 0; i < chunkPaths.length; i++) {
    const text = await transcribeChunk(chunkPaths[i], i, chunkPaths.length);
    transcriptions.push(text);
  }

  // Step 3: Combine and save
  const fullText = transcriptions.join("\n\n");
  const outputName = path.basename(resolvedPath, path.extname(resolvedPath));
  const outputDir = path.join(__dirname, "output");
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${outputName}_transcription.txt`);

  fs.writeFileSync(outputPath, fullText, "utf-8");

  // Cleanup temp files
  fs.rmSync(TEMP_DIR, { recursive: true });

  console.log(`\nDone! Transcription saved to: ${outputPath}`);
  console.log(`Total length: ${fullText.length} characters`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
