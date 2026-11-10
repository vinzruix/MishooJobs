import React, { useEffect, useState, useRef } from "react";
import { Camera, Trash2, AlertTriangle } from "lucide-react";
import { db } from "../db";
import type { MasterProfilePhotoRecord } from "../types/master_profile";

interface AvatarUploaderProps {
  photoEnabled?: boolean;
  onPhotoChanged?: (hasPhoto: boolean) => void;
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  photoEnabled = true,
  onPhotoChanged,
}) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let activeUrl: string | null = null;

    async function loadPhoto() {
      try {
        const record = await db.master_profile_photo.get("current");
        if (record && record.blob) {
          activeUrl = URL.createObjectURL(record.blob);
          setPhotoUrl(activeUrl);
          if (onPhotoChanged) onPhotoChanged(true);
        } else {
          setPhotoUrl(null);
          if (onPhotoChanged) onPhotoChanged(false);
        }
      } catch (e) {
        console.error("Error al cargar foto de perfil:", e);
      }
    }

    loadPhoto();

    return () => {
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, []);

  const checkStorageQuota = async (): Promise<boolean> => {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        if (estimate.quota && estimate.usage) {
          const ratio = estimate.usage / estimate.quota;
          if (ratio > 0.8) {
            setStorageWarning(`Almacenamiento local del navegador al ${Math.round(ratio * 100)}% de capacidad.`);
            return false;
          }
        }
      } catch {
        // Ignored in non-supporting environments
      }
    }
    setStorageWarning(null);
    return true;
  };

  const resizeAndCompressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 512;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("No se pudo obtener el contexto 2D del canvas"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Try WEBP first, fallback to JPEG
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                canvas.toBlob(
                  (jpegBlob) => {
                    if (jpegBlob) resolve(jpegBlob);
                    else reject(new Error("Error al convertir imagen a Blob"));
                  },
                  "image/jpeg",
                  0.85
                );
              }
            },
            "image/webp",
            0.85
          );
        };
        img.onerror = () => reject(new Error("Error al decodificar la imagen seleccionada"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Error al leer el archivo de imagen"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      await checkStorageQuota();
      const compressedBlob = await resizeAndCompressImage(file);

      const record: MasterProfilePhotoRecord = {
        id: "current",
        blob: compressedBlob,
        mime_type: compressedBlob.type,
        updated_at: new Date().toISOString(),
      };

      await db.master_profile_photo.put(record);

      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
      }
      const newUrl = URL.createObjectURL(compressedBlob);
      setPhotoUrl(newUrl);
      if (onPhotoChanged) onPhotoChanged(true);
    } catch (err) {
      console.error("Error al procesar avatar:", err);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await db.master_profile_photo.delete("current");
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
        setPhotoUrl(null);
      }
      if (onPhotoChanged) onPhotoChanged(false);
    } catch (err) {
      console.error("Error al eliminar foto:", err);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-lg font-mono">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400 font-semibold tracking-wide uppercase">
          Fotografía de Perfil (Avatar)
        </span>
        {photoEnabled && (
          <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
            VISIBLE EN CV
          </span>
        )}
      </div>

      {storageWarning && (
        <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-950/50 border border-amber-800 p-2 rounded">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{storageWarning}</span>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center flex-shrink-0">
          {photoUrl ? (
            <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-6 h-6 text-zinc-500" />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            onChange={handleFileChange}
            aria-label="Seleccionar foto de perfil"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded border border-zinc-700 transition-colors flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{photoUrl ? "Cambiar foto" : "Subir fotografía"}</span>
            </button>

            {photoUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-xs text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-950/60 px-2 py-1.5 rounded border border-rose-900/60 transition-colors flex items-center gap-1"
                title="Eliminar fotografía"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-[11px] text-zinc-500">
            Máx 512x512px. Se comprime y persiste estrictamente en tu navegador.
          </span>
        </div>
      </div>
    </div>
  );
};
