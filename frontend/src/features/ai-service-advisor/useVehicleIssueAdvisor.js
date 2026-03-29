import { useEffect, useState } from "react";
import { requestAiServiceAdvisor } from "@/services/api";

const CHAT_HISTORY_KEY = "carcarehome-ai-chat-history";
const MIN_DESCRIPTION_LENGTH = 18;
const MIN_DESCRIPTION_WORDS = 5;

function createInitialMessages() {
  return [
    {
      id: "assistant-welcome",
      role: "assistant",
      kind: "text",
      text: "Gửi ảnh xe và mô tả rõ tình trạng để mình gợi ý dịch vụ phù hợp.",
      createdAt: new Date().toISOString()
    }
  ];
}

function loadStoredMessages() {
  if (typeof window === "undefined") {
    return createInitialMessages();
  }

  try {
    const raw = window.localStorage.getItem(CHAT_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : createInitialMessages();
  } catch {
    return createInitialMessages();
  }
}

function createMessageId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useVehicleIssueAdvisor(isAuthenticated = true) {
  const [messages, setMessages] = useState(loadStoredMessages);
  const [draftDescription, setDraftDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleImageChange = (event) => {
    const nextFile = event.target.files?.[0] || null;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setError("");
    setSelectedImage(nextFile);
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : "");
  };

  const clearSelectedImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedImage(null);
    setPreviewUrl("");
  };

  const clearComposer = () => {
    clearSelectedImage();
    setDraftDescription("");
  };

  const clearHistory = () => {
    const initialMessages = createInitialMessages();
    setMessages(initialMessages);
    setError("");

    if (typeof window !== "undefined") {
      window.localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(initialMessages));
    }
  };

  const submitIssue = async () => {
    setError("");

    if (!isAuthenticated) {
      setError("Vui lòng đăng nhập để dùng AI Chat.");
      return;
    }

    const draft = draftDescription.trim();
    const wordCount = draft.split(/\s+/).filter(Boolean).length;

    if (draft.length < MIN_DESCRIPTION_LENGTH || wordCount < MIN_DESCRIPTION_WORDS) {
      setError(`Vui lòng mô tả ít nhất ${MIN_DESCRIPTION_WORDS} từ và rõ tình trạng xe.`);
      return;
    }

    setSubmitting(true);

    try {
      const analysis = await requestAiServiceAdvisor({
        description: draft,
        imageFile: selectedImage
      });

      if (analysis?.error) {
        setError(analysis.message || "Tạm thời chưa thể phân tích, bạn thử lại sau.");
        return;
      }

      setMessages((previous) => [
        ...previous,
        {
          id: createMessageId("user"),
          role: "user",
          kind: "issue",
          text: draft,
          imageName: selectedImage?.name || "",
          createdAt: new Date().toISOString()
        },
        {
          id: createMessageId("assistant"),
          role: "assistant",
          kind: "recommendation",
          analysis,
          createdAt: new Date().toISOString()
        }
      ]);

      clearComposer();
    } finally {
      setSubmitting(false);
    }
  };

  return {
    messages,
    draftDescription,
    selectedImage,
    previewUrl,
    submitting,
    error,
    setDraftDescription,
    handleImageChange,
    submitIssue,
    clearSelectedImage,
    clearHistory,
    setError
  };
}
