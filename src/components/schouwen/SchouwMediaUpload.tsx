import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Camera, Trash2, Upload, Image, Video, Square, RotateCcw, Save, Play, X, Pencil, Check } from "lucide-react";

export interface SchouwFoto {
  url: string;
  label: string;
  uploaded_at: string;
}

interface SchouwMediaUploadProps {
  schouwId: string;
  fotos: SchouwFoto[];
  onFotosChange: (fotos: SchouwFoto[]) => void;
  disabled?: boolean;
}

const SchouwMediaUpload = ({ schouwId, fotos, onFotosChange, disabled }: SchouwMediaUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState("");

  // Inline label editing state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  // Video recording state
  const [showRecorder, setShowRecorder] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Lightbox state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const MAX_RECORD_SECONDS = 60;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    const newFotos: SchouwFoto[] = [...fotos];

    for (const file of Array.from(files)) {
      const isVid = file.type.startsWith("video/");
      const isImg = file.type.startsWith("image/");
      if (!isImg && !isVid) {
        toast.error(`${file.name}: alleen afbeeldingen en video's toegestaan`);
        continue;
      }
      const maxSize = isVid ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`${file.name}: maximaal ${isVid ? "50" : "10"}MB`);
        continue;
      }

      const ext = file.name.split(".").pop();
      const path = `${schouwId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage.from("schouw-media").upload(path, file);
      if (error) {
        toast.error(`Upload mislukt: ${error.message}`);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage.from("schouw-media").getPublicUrl(path);
      newFotos.push({
        url: publicUrl,
        label: label || file.name,
        uploaded_at: new Date().toISOString(),
      });
    }

    onFotosChange(newFotos);
    setLabel("");
    setUploading(false);
    toast.success("Bestanden geüpload");
    e.target.value = "";
  };

  const handleRemove = (index: number) => {
    const updated = fotos.filter((_, i) => i !== index);
    onFotosChange(updated);
  };

  const startEditLabel = (index: number) => {
    setEditingIndex(index);
    setEditingLabel(fotos[index].label);
  };

  const saveEditLabel = () => {
    if (editingIndex === null) return;
    const updated = fotos.map((f, i) =>
      i === editingIndex ? { ...f, label: editingLabel.trim() || f.label } : f
    );
    onFotosChange(updated);
    setEditingIndex(null);
    setEditingLabel("");
  };

  const cancelEditLabel = () => {
    setEditingIndex(null);
    setEditingLabel("");
  };

  // ─── Video recording ───
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "environment" },
        audio: true,
      });
      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }
    } catch {
      toast.error("Kan camera niet openen. Controleer de toestemming.");
      setShowRecorder(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4";

    const recorder = new MediaRecorder(streamRef.current, {
      mimeType,
      videoBitsPerSecond: 1_500_000,
    });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setRecordedBlob(blob);
      setRecordedUrl(URL.createObjectURL(blob));
      stopCamera();
    };
    mediaRecorderRef.current = recorder;
    recorder.start(1000);
    setRecording(true);
    setElapsed(0);

    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        if (prev + 1 >= MAX_RECORD_SECONDS) {
          stopRecording();
          return MAX_RECORD_SECONDS;
        }
        return prev + 1;
      });
    }, 1000);
  }, [stopCamera]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }, []);

  const resetRecording = useCallback(() => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setElapsed(0);
    startCamera();
  }, [recordedUrl, startCamera]);

  const saveRecording = useCallback(async () => {
    if (!recordedBlob) return;
    setUploadingVideo(true);
    const ext = recordedBlob.type.includes("webm") ? "webm" : "mp4";
    const path = `${schouwId}/${Date.now()}-rec.${ext}`;
    const { error } = await supabase.storage.from("schouw-media").upload(path, recordedBlob);
    if (error) {
      toast.error(`Upload mislukt: ${error.message}`);
      setUploadingVideo(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("schouw-media").getPublicUrl(path);
    onFotosChange([...fotos, {
      url: publicUrl,
      label: label || `Video opname ${new Date().toLocaleTimeString("nl-NL")}`,
      uploaded_at: new Date().toISOString(),
    }]);
    setUploadingVideo(false);
    setShowRecorder(false);
    setRecordedBlob(null);
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setLabel("");
    toast.success("Video opgeslagen");
  }, [recordedBlob, recordedUrl, schouwId, fotos, onFotosChange, label]);

  const openRecorder = useCallback(() => {
    setRecordedBlob(null);
    setRecordedUrl(null);
    setElapsed(0);
    setShowRecorder(true);
  }, []);

  const closeRecorder = useCallback(() => {
    stopRecording();
    stopCamera();
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setShowRecorder(false);
  }, [stopRecording, stopCamera, recordedUrl]);

  useEffect(() => {
    if (showRecorder && !recordedBlob) startCamera();
    return () => { if (!showRecorder) stopCamera(); };
  }, [showRecorder, recordedBlob, startCamera, stopCamera]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const isVideo = (url: string) => /\.(mp4|mov|webm|avi)(\?|$)/i.test(url);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
        <div className="flex-1">
          <Label>Label voor nieuwe uploads (optioneel)</Label>
          <Input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="bijv. Meterkast, Dakconstructie"
            className="rounded-xl"
            disabled={disabled}
          />
        </div>
        <div className="flex gap-2">
          <label className="inline-flex">
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleUpload}
              disabled={uploading || disabled}
              className="hidden"
            />
            <Button type="button" variant="outline" className="rounded-full gap-2" disabled={uploading || disabled} asChild>
              <span>
                {uploading ? (
                  <><Upload className="h-4 w-4 animate-pulse" /> Uploaden...</>
                ) : (
                  <><Camera className="h-4 w-4" /> Foto's</>
                )}
              </span>
            </Button>
          </label>
          <Button
            type="button"
            variant="outline"
            className="rounded-full gap-2"
            disabled={disabled}
            onClick={openRecorder}
          >
            <Video className="h-4 w-4" /> Video opnemen
          </Button>
        </div>
      </div>

      {fotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {fotos.map((foto, i) => (
            <div
              key={i}
              className="relative group rounded-xl overflow-hidden border bg-muted"
            >
              <div
                className="cursor-pointer"
                onClick={() => setLightboxUrl(foto.url)}
              >
                {isVideo(foto.url) ? (
                  <div className="relative w-full h-32 bg-black flex items-center justify-center">
                    <video src={foto.url} className="w-full h-32 object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="h-8 w-8 text-white/90 drop-shadow-lg" />
                    </div>
                  </div>
                ) : (
                  <img src={foto.url} alt={foto.label} className="w-full h-32 object-cover" />
                )}
              </div>

              {/* Label area — inline editable */}
              <div className="px-2 py-1.5 bg-background border-t">
                {editingIndex === i ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={editingLabel}
                      onChange={e => setEditingLabel(e.target.value)}
                      className="h-6 text-xs rounded px-1"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === "Enter") saveEditLabel();
                        if (e.key === "Escape") cancelEditLabel();
                      }}
                    />
                    <Button type="button" variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={saveEditLabel}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={cancelEditLabel}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <p className="text-xs truncate flex-1 text-muted-foreground">{foto.label}</p>
                    {!disabled && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 shrink-0 opacity-60 hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); startEditLabel(i); }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); handleRemove(i); }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {fotos.length === 0 && (
        <div className="border-2 border-dashed rounded-xl p-8 text-center text-muted-foreground">
          <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nog geen foto's of video's toegevoegd</p>
          <p className="text-xs mt-1">Upload foto's of neem een video op van de situatie ter plaatse</p>
        </div>
      )}

      {/* ─── Video Recorder Dialog ─── */}
      <Dialog open={showRecorder} onOpenChange={(open) => { if (!open) closeRecorder(); }}>
        <DialogContent className="max-w-lg max-w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" /> Video opnemen
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              {recordedUrl ? (
                <video src={recordedUrl} controls className="w-full h-full object-contain" />
              ) : (
                <video
                  ref={videoPreviewRef}
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(1)" }}
                />
              )}
              {recording && (
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 rounded-full px-3 py-1.5">
                  <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
                  <span className="text-white text-sm font-mono font-medium">
                    {formatTime(elapsed)} / {formatTime(MAX_RECORD_SECONDS)}
                  </span>
                </div>
              )}
            </div>

            {recording && (
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-destructive rounded-full transition-all duration-1000"
                  style={{ width: `${(elapsed / MAX_RECORD_SECONDS) * 100}%` }}
                />
              </div>
            )}

            <div className="flex justify-center gap-3">
              {!recordedUrl ? (
                <>
                  {!recording ? (
                    <Button onClick={startRecording} className="gap-2 rounded-full" variant="destructive">
                      <div className="h-3 w-3 rounded-full bg-white" /> Start opname
                    </Button>
                  ) : (
                    <Button onClick={stopRecording} className="gap-2 rounded-full" variant="destructive">
                      <Square className="h-4 w-4" /> Stop
                    </Button>
                  )}
                  <Button variant="outline" onClick={closeRecorder} className="rounded-full gap-2">
                    <X className="h-4 w-4" /> Annuleer
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={saveRecording} disabled={uploadingVideo} className="gap-2 rounded-full">
                    <Save className="h-4 w-4" /> {uploadingVideo ? "Uploaden..." : "Opslaan"}
                  </Button>
                  <Button variant="outline" onClick={resetRecording} className="gap-2 rounded-full">
                    <RotateCcw className="h-4 w-4" /> Opnieuw
                  </Button>
                  <Button variant="outline" onClick={closeRecorder} className="gap-2 rounded-full">
                    <X className="h-4 w-4" /> Annuleer
                  </Button>
                </>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Max {MAX_RECORD_SECONDS} sec • HD kwaliteit • WebM formaat
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Media Lightbox ─── */}
      <Dialog open={!!lightboxUrl} onOpenChange={(open) => { if (!open) setLightboxUrl(null); }}>
        <DialogContent className="max-w-3xl max-w-[95vw] p-2">
          {lightboxUrl && (
            isVideo(lightboxUrl) ? (
              <video src={lightboxUrl} controls autoPlay className="w-full rounded-lg" />
            ) : (
              <img src={lightboxUrl} alt="" className="w-full rounded-lg object-contain max-h-[80vh]" />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchouwMediaUpload;
