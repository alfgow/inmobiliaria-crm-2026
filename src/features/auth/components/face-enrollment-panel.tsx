"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Loader2, ScanFace, ShieldAlert } from "lucide-react";

import { enrollFace, type EnrollFaceActionState } from "@/features/auth/actions/enroll-face";
import { revokeFaceAccess } from "@/features/auth/actions/revoke-face-access";
import { FaceCapture } from "@/features/auth/components/face-capture";

const initialState: EnrollFaceActionState = { success: false, message: "" };

type FaceEnrollmentPanelProps = {
  hasActiveEnrollment: boolean;
  enrolledAt: string | null;
};

export function FaceEnrollmentPanel({
  hasActiveEnrollment,
  enrolledAt,
}: FaceEnrollmentPanelProps) {
  const [state, formAction, isPending] = useActionState(enrollFace, initialState);
  const [consent, setConsent] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  async function handleRevoke() {
    setRevoking(true);
    try {
      await revokeFaceAccess();
    } finally {
      setRevoking(false);
    }
  }

  return (
    <section className="rounded-[1.75rem] border border-border-soft/80 bg-white/90 p-5 shadow-[0_22px_55px_rgba(20,16,35,0.08)] backdrop-blur-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-primary text-neutral-900">
          <ScanFace className="size-5" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-neutral-400">
            Reconocimiento facial
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-neutral-900">
            Mi rostro
          </h2>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Permite iniciar sesion con tu rostro en los dispositivos que marques
            como de confianza. Tu contrasena siempre seguira funcionando.
          </p>
        </div>
      </div>

      {hasActiveEnrollment ? (
        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="size-4 shrink-0" />
          Rostro registrado{enrolledAt ? ` el ${enrolledAt}` : ""}.
        </div>
      ) : null}

      <div className="mt-5 grid gap-6 sm:grid-cols-2">
        <form action={formAction} className="flex flex-col gap-4">
          <FaceCapture
            onCapture={setCapturedImage}
            captureLabel={hasActiveEnrollment ? "Volver a capturar" : "Capturar rostro"}
          />
          <input type="hidden" name="image" value={capturedImage ?? ""} />

          {capturedImage ? (
            <div className="flex items-center gap-3 rounded-2xl border border-border-soft bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt="Foto capturada"
                className="size-14 shrink-0 rounded-xl object-cover"
              />
              <p className="text-xs text-neutral-500">
                Foto lista. Revisa que se vea tu rostro con claridad y guarda.
              </p>
            </div>
          ) : null}

          <label className="flex items-start gap-2.5 text-xs leading-5 text-neutral-500">
            <input
              type="checkbox"
              name="consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 rounded border-neutral-300"
            />
            Acepto que mi rostro se use unicamente para iniciar sesion en este
            CRM y entiendo que puedo eliminarlo cuando quiera.
          </label>

          <button
            type="submit"
            disabled={isPending || !capturedImage || !consent}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-primary px-5 text-sm font-semibold text-neutral-900 transition hover:brightness-95 disabled:pointer-events-none disabled:opacity-50"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {isPending ? "Guardando..." : "Guardar rostro"}
          </button>

          {state.message ? (
            <div
              className={[
                "rounded-2xl border px-4 py-3 text-sm",
                state.success
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-700",
              ].join(" ")}
            >
              {state.message}
            </div>
          ) : null}
        </form>

        {hasActiveEnrollment ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 p-4">
            <div className="flex items-start gap-2 text-rose-700">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              <p className="text-xs leading-5">
                Elimina tu rostro y todos tus dispositivos de confianza. Tendras
                que volver a registrarte para usar reconocimiento facial de
                nuevo.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRevoke}
              disabled={revoking}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-rose-300 bg-white px-4 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:pointer-events-none disabled:opacity-60"
            >
              {revoking ? <Loader2 className="size-4 animate-spin" /> : null}
              Eliminar mi rostro
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
