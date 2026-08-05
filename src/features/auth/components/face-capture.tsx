"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, RotateCcw } from "lucide-react";

const CAPTURE_SIZE = 480;
const AUTO_CAPTURE_DELAY_MS = 1000;

type FaceCaptureProps = {
  onCapture: (dataUrl: string) => void;
  busy?: boolean;
  captureLabel?: string;
  /** Abre la camara sola al montar, sin esperar un click. */
  autoStart?: boolean;
  /** Captura sola una vez la camara esta lista (y de nuevo cada vez que retrySignal cambia). */
  autoCapture?: boolean;
  /** Incrementa este numero para forzar otro intento de captura automatica. */
  retrySignal?: number;
};

export function FaceCapture({
  onCapture,
  busy = false,
  captureLabel = "Capturar rostro",
  autoStart = false,
  autoCapture = false,
  retrySignal = 0,
}: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: CAPTURE_SIZE }, height: { ideal: CAPTURE_SIZE } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
    } catch {
      setError("No se pudo acceder a la camara. Revisa los permisos del navegador.");
    }
  }, []);

  useEffect(() => {
    if (!autoStart) return;

    const timeoutId = window.setTimeout(startCamera, 0);
    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement("canvas");
    canvas.width = CAPTURE_SIZE;
    canvas.height = CAPTURE_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, CAPTURE_SIZE, CAPTURE_SIZE);

    onCapture(canvas.toDataURL("image/jpeg", 0.9));
  }, [onCapture]);

  useEffect(() => {
    if (!autoCapture || !active || busy) return;

    const timeoutId = window.setTimeout(capture, AUTO_CAPTURE_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCapture, active, retrySignal]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-100">
        <video
          ref={videoRef}
          muted
          playsInline
          className={`h-full w-full object-cover ${active ? "" : "hidden"}`}
        />
        {!active ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-neutral-400">
            <Camera className="h-8 w-8" />
            <span className="text-xs">Camara desactivada</span>
          </div>
        ) : null}
      </div>

      {error ? <p className="text-center text-xs text-rose-600">{error}</p> : null}

      {active ? (
        <div className="flex w-full gap-2">
          <button
            type="button"
            onClick={capture}
            disabled={busy}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-neutral-900 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:pointer-events-none disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? "Verificando..." : captureLabel}
          </button>
          <button
            type="button"
            onClick={stopCamera}
            disabled={busy}
            aria-label="Apagar camara"
            className="flex h-11 items-center justify-center rounded-2xl border border-neutral-200 px-4 text-sm text-neutral-500 transition hover:text-neutral-900 disabled:pointer-events-none disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startCamera}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-900 transition hover:border-neutral-400"
        >
          <Camera className="h-4 w-4" />
          Activar camara
        </button>
      )}
    </div>
  );
}
