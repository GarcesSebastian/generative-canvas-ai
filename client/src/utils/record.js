import { generateCanvas } from "./app.js";

let recording = false;
let mediaRecorder;
let audioChunks = [];
let recognition;

const recordButton = document.getElementById('record-audio');
const audioPlayerContainer = document.getElementById('audio-player');
const audioPlayer = audioPlayerContainer.querySelector('audio');
const transcriptionContainer = document.getElementById('prompt');

if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'es-ES';

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    transcriptionContainer.innerHTML = finalTranscript + '<i style="color: #999;">' + interimTranscript + '</i>';
    transcriptionContainer.classList.remove('hidden');
  };

  recognition.onerror = (event) => {
    console.error('Error en el reconocimiento de voz:', event.error);
  };
} else {
  console.log('El reconocimiento de voz no está soportado en este navegador.');
}

recordButton.addEventListener('click', async () => {
  if (!recording) {
    recordButton.textContent = '⏹️ Detener Grabación';
    recording = true;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);

      audioPlayer.src = audioUrl;
      audioPlayerContainer.classList.remove('hidden');

      audioChunks = [];
    };

    mediaRecorder.start();
    if (recognition) {
      recognition.start();
    }
    console.log("Grabación iniciada...");
  } else {
    recordButton.textContent = '🎤 Grabar Audio';
    recording = false;
    
    mediaRecorder.stop();
    if (recognition) {
      recognition.stop();
    }

    generateCanvas(transcriptionContainer.textContent);

    console.log("Grabación detenida.");
  }
});

const string = `{ "test": "test", "operation": ${240} }`;
console.log(JSON.parse(string));
