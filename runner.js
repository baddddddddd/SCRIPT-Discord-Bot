import { spawn } from 'child_process';

function startBot() {
  console.log("Starting process...")
  const botProcess = spawn('node', ['index.js'], { stdio: 'inherit' });

  botProcess.on('close', (code) => {
    console.log(`Bot process exited with code ${code}. Restarting...`);
    return startBot(); // Restart the bot on crash
  });
}

startBot();
