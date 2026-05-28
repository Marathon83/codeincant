import { useState, useRef, useCallback } from "react";

export default function useVoice(onResult) {
  const [recording, setRecording]   = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [supported] = useState(() => "webkitSpeechRecognition" in window || "SpeechRecognition" in window);
  const recRef = useRef(null);

  const start = useCallback(() => {
    if (!supported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      onResult(text);
    };
    rec.onend = () => setRecording(false);
    rec.onerror = (e) => {
      setRecording(false);
      const msg = e.error === "not-allowed" ? "Microphone access denied" : "Voice input failed";
      setVoiceError(msg);
      setTimeout(() => setVoiceError(""), 2500);
    };
    recRef.current = rec;
    rec.start();
    setRecording(true);
  }, [supported, onResult]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setRecording(false);
  }, []);

  const toggle = useCallback(() => {
    recording ? stop() : start();
  }, [recording, start, stop]);

  return { recording, supported, toggle, voiceError };
}
