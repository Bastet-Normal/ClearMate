"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { Upload, X, ZoomIn, Camera, FileImage, Eye, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImageAttachment, ImageOcrStatus } from "@/types";

interface ImageUploadProps {
  images: ImageAttachment[];
  onChange: (images: ImageAttachment[]) => void;
  onOcrExtract?: (id: string, text: string) => void;
  maxImages?: number;
  disabled?: boolean;
  className?: string;
}

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function getImageDimensions(base64: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = base64;
  });
}

export function ImageUpload({
  images,
  onChange,
  onOcrExtract,
  maxImages = 6,
  disabled = false,
  className,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<ImageAttachment | null>(null);
  const [ocrStatus, setOcrStatus] = useState<Record<string, ImageOcrStatus>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const addFiles = useCallback(async (files: File[]) => {
    const allowed = files.slice(0, maxImages - images.length);
    const newImages: ImageAttachment[] = [];

    for (const file of allowed) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 10 * 1024 * 1024) continue; // 10MB limit

      const base64 = await fileToBase64(file);
      const dims = await getImageDimensions(base64);

      newImages.push({
        id: genId(),
        fileName: file.name,
        base64,
        mimeType: file.type,
        ocrText: "",
        ocrStatus: "idle",
        sizeKb: Math.round(file.size / 1024),
        width: dims.width,
        height: dims.height,
      });
    }

    if (newImages.length > 0) {
      onChange([...images, ...newImages]);
    }
  }, [images, maxImages, onChange]);

  // Paste from clipboard
  useEffect(() => {
    const handler = async (e: ClipboardEvent) => {
      if (disabled || images.length >= maxImages) return;
      const files = Array.from(e.clipboardData?.files || []).filter(f => f.type.startsWith("image/"));
      if (files.length > 0) {
        e.preventDefault();
        await addFiles(files);
      }
    };
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, [disabled, images.length, maxImages, addFiles]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    await addFiles(files);
  }, [addFiles, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!dropRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await addFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [addFiles]);

  const removeImage = useCallback((id: string) => {
    onChange(images.filter(img => img.id !== id));
  }, [images, onChange]);

  const runOcr = useCallback(async (img: ImageAttachment) => {
    if (ocrStatus[img.id] === "loading") return;
    setOcrStatus(prev => ({ ...prev, [img.id]: "loading" }));

    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("chi_sim");
      const result = await worker.recognize(img.base64);
      await worker.terminate();

      const text = result.data.text.trim();
      setOcrStatus(prev => ({ ...prev, [img.id]: text ? "done" : "error" }));

      if (text) {
        const updated = images.map(i => i.id === img.id ? { ...i, ocrText: text, ocrStatus: "done" as ImageOcrStatus } : i);
        onChange(updated);
        onOcrExtract?.(img.id, text);
      }
    } catch {
      setOcrStatus(prev => ({ ...prev, [img.id]: "error" }));
    }
  }, [images, ocrStatus, onChange, onOcrExtract]);

  const canAdd = images.length < maxImages && !disabled;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drop Zone — only show if can add more */}
      {canAdd && (
        <div
          ref={dropRef}
          className={cn("drop-zone p-4 text-center group", isDragging && "drag-active")}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
          <div className="flex flex-col items-center gap-2 py-2">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
              "bg-brand-50 text-brand-500 group-hover:bg-brand-100 group-hover:scale-110",
              isDragging && "bg-brand-100 scale-110"
            )}>
              {isDragging ? (
                <FileImage className="h-5 w-5" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-fg-secondary">
                {isDragging ? "松开鼠标上传图片" : "拖拽图片至此，或点击上传"}
              </p>
              <p className="text-xs text-fg-muted mt-0.5">
                支持 JPG、PNG、GIF · 最多 {maxImages} 张 · 每张 ≤ 10MB · 也可粘贴截图 (Ctrl+V)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className={cn(
          "grid gap-2",
          images.length === 1 ? "grid-cols-1" :
          images.length === 2 ? "grid-cols-2" :
          "grid-cols-3"
        )}>
          {images.map((img) => {
            const status = ocrStatus[img.id] ?? img.ocrStatus;
            return (
              <div
                key={img.id}
                className="relative group rounded-xl overflow-hidden border border-border bg-surface-2 aspect-video"
              >
                {/* Preview */}
                <Image
                  src={img.base64}
                  alt={img.fileName}
                  fill
                  unoptimized
                  className="object-cover"
                />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {/* Zoom */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setLightboxImg(img); }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all"
                    title="查看大图"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  {/* OCR */}
                  <button
                    onClick={(e) => { e.stopPropagation(); runOcr(img); }}
                    disabled={status === "loading"}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg backdrop-blur-sm text-white transition-all",
                      status === "done" ? "bg-emerald-500/70 hover:bg-emerald-500" :
                      status === "error" ? "bg-red-500/70 hover:bg-red-500" :
                      "bg-white/20 hover:bg-white/30"
                    )}
                    title={status === "done" ? "已提取文字" : "提取图片文字 (OCR)"}
                  >
                    {status === "loading" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : status === "done" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : status === "error" ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                  {/* Remove */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/70 backdrop-blur-sm text-white hover:bg-red-500 transition-all"
                    title="删除图片"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Status badges */}
                <div className="absolute top-1.5 left-1.5 flex gap-1">
                  {status === "done" && (
                    <span className="flex items-center gap-1 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      <CheckCircle2 className="h-2.5 w-2.5" /> OCR完成
                    </span>
                  )}
                  {status === "loading" && (
                    <span className="flex items-center gap-1 rounded-md bg-blue-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" /> 识别中
                    </span>
                  )}
                </div>

                {/* File info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-all">
                  <p className="text-[10px] text-white/90 truncate">{img.fileName}</p>
                  <p className="text-[9px] text-white/60">{img.sizeKb}KB · {img.width}×{img.height}</p>
                </div>

                {/* OCR text indicator */}
                {img.ocrText && status === "done" && (
                  <div className="absolute right-1.5 bottom-1.5" title={img.ocrText.slice(0, 50)}>
                    <Eye className="h-3 w-3 text-emerald-300" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Add more button */}
          {canAdd && images.length > 0 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "aspect-video rounded-xl border-2 border-dashed border-border-strong",
                "flex flex-col items-center justify-center gap-1.5",
                "text-fg-faint hover:text-brand-500 hover:border-brand-300 hover:bg-brand-50/50 transition-all"
              )}
            >
              <Upload className="h-5 w-5" />
              <span className="text-xs font-medium">添加更多</span>
            </button>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="lightbox-overlay"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative">
            <Image
              src={lightboxImg.base64}
              alt="预览"
              width={lightboxImg.width || 1600}
              height={lightboxImg.height || 900}
              unoptimized
              className="lightbox-img"
              onClick={e => e.stopPropagation()}
            />
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg hover:bg-slate-100 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
