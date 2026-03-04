import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useImageUploadChoice } from "../components/common/ImageUploadChoiceSheet";
import { mediaApi } from "../api/media";
import { toast } from "../store";
import type { MessageAttachment } from "../types/chat";
import type { UploadingDraftItem } from "../components/common/UploadDraftList";
import { normalizeProgressPercent } from "../utils/format";
import { extractErrorMessage } from "../utils/error";

export interface UseFileUploadReturn {
  pendingAttachments: MessageAttachment[];
  setPendingAttachments: React.Dispatch<
    React.SetStateAction<MessageAttachment[]>
  >;
  uploading: boolean;
  uploadingPreview: UploadingDraftItem | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  pickFile: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  removeAttachment: (mediaId: string) => void;
  /** Render this node in your component tree so the image-upload choice sheet works. */
  imageUploadChoiceSheet: React.ReactNode;
}

export interface UseFileUploadOptions {
  /** Prefix for the upload preview id. Defaults to "upload". */
  idPrefix?: string;
  /** Extra guard that prevents picking a file (e.g. while sending). */
  disabled?: boolean;
}

export function useFileUpload(
  options?: UseFileUploadOptions,
): UseFileUploadReturn {
  const { t } = useTranslation();
  const idPrefix = options?.idPrefix ?? "upload";

  const [pendingAttachments, setPendingAttachments] = useState<
    MessageAttachment[]
  >([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingPreview, setUploadingPreview] =
    useState<UploadingDraftItem | null>(null);
  // Cast needed for React 18 LegacyRef compatibility with useRef(null)
  const fileInputRef = useRef<HTMLInputElement>(null!) as React.RefObject<HTMLInputElement>;
  const {
    requestChoice: requestImageUploadChoice,
    sheetNode: imageUploadChoiceSheet,
  } = useImageUploadChoice();

  const pickFile = useCallback(() => {
    if (uploading || options?.disabled) return;
    fileInputRef.current?.click();
  }, [uploading, options?.disabled]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      const mimeType = file.type || "application/octet-stream";
      const mimeTypeLower = mimeType.toLowerCase();
      const isImage = mimeTypeLower.startsWith("image/");
      const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
      const previewId = `${idPrefix}_${Date.now()}`;

      let keepOriginalImage = false;
      if (isImage) {
        const choice = await requestImageUploadChoice({
          fileName: file.name,
          fileSize: file.size,
          previewUrl,
        });
        if (choice == null) {
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          return;
        }
        keepOriginalImage = choice;
      }

      setUploading(true);
      setUploadingPreview({
        id: previewId,
        name: file.name,
        mimeType,
        previewUrl,
        fileSize: file.size,
        progress: 0,
      });
      try {
        const media = await mediaApi.uploadFile(file, {
          keepOriginalImage,
          onProgress: (progress) => {
            const pct = normalizeProgressPercent(progress);
            setUploadingPreview((prev) =>
              prev ? { ...prev, progress: pct } : prev,
            );
          },
        });
        if (!media.url) {
          throw new Error("Upload succeeded but no media URL was returned.");
        }
        setPendingAttachments((prev) => [
          ...prev,
          {
            mediaId: media.mediaId,
            mimeType: media.mimeType,
            url: media.url!,
            thumbnailUrl: media.thumbnailUrl,
            fileSize: media.fileSize,
            fileName: file.name,
          },
        ]);
      } catch (err) {
        console.error("File upload failed:", err);
        toast.error(
          extractErrorMessage(
            err,
            t("common.uploadFailed", "Upload failed"),
          ),
        );
      } finally {
        setUploading(false);
        setUploadingPreview(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      }
    },
    [idPrefix, requestImageUploadChoice, t],
  );

  const removeAttachment = useCallback((mediaId: string) => {
    setPendingAttachments((prev) =>
      prev.filter((item) => item.mediaId !== mediaId),
    );
  }, []);

  return {
    pendingAttachments,
    setPendingAttachments,
    uploading,
    uploadingPreview,
    fileInputRef,
    pickFile,
    handleFileChange,
    removeAttachment,
    imageUploadChoiceSheet,
  };
}
