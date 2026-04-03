"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  onTranscript: (text: string) => void;
}

type SRConstructor = new () => SpeechRecognition;

function getSRConstructor(): SRConstructor | null {
  if (typeof window === "undefined") return null;
  return (
    (window as unknown as { SpeechRecognition?: SRConstructor }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: SRConstructor }).webkitSpeechRecognition ||
    null
  );
}

export default function VoiceInput({ onTranscript }: Props) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (getSRConstructor()) setSupported(true);
  }, []);

  const stopAndRelease = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setListening(false);
  };

  const toggle = () => {
    if (listening) {
      // abort() 는 결과를 버리고 즉시 종료 → stop() 으로 변경하면
      // 현재까지 인식된 내용을 onresult로 반환 후 종료
      recognitionRef.current?.stop();
      return;
    }

    const SR = getSRConstructor();
    if (!SR) return;

    // 매번 새 인스턴스 생성 → 이전 세션 마이크 스트림 완전 해제 보장
    const recognition = new SR();
    recognition.lang = "ko-KR";
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      onTranscript(event.results[0][0].transcript);
      stopAndRelease();
    };
    recognition.onend = () => stopAndRelease();
    recognition.onerror = () => stopAndRelease();

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  if (!supported) return null;

  return (
    <button
      onClick={toggle}
      className="voice-btn"
      data-listening={listening ? "true" : "false"}
      aria-label={listening ? "녹음 중지" : "음성으로 기록하기"}
    >
      <span className="voice-ripple" />
      <span className="voice-ripple voice-ripple--delay" />

      <span className="voice-icon">
        {listening ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4z"/>
            <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.93V20H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.07A7 7 0 0 0 19 11z"/>
          </svg>
        )}
      </span>
      <span className="voice-label">
        {listening ? "듣고 있어요 — 탭해서 완료" : "탭해서 말하기"}
      </span>
    </button>
  );
}
