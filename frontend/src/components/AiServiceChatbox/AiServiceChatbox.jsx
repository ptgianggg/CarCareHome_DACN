import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Bot,
  Eraser,
  ImagePlus,
  LoaderCircle,
  Send,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useVehicleIssueAdvisor } from "@/features/ai-service-advisor/useVehicleIssueAdvisor";
import "./AiServiceChatbox.css";

const ENGLISH_TEXT_MAP = [
  ["recommendation result", "Kết quả phân tích"],
  ["photo and text do not relate", "Ảnh và nội dung chưa liên quan tới chăm sóc xe."],
  ["not applicable", "Không thể áp dụng cho yêu cầu này."],
  ["image shows", "Ảnh hoặc mô tả chưa đủ đúng ngữ cảnh ô tô."],
  ["no service match found", "Chưa tìm thấy dịch vụ phù hợp."],
  ["service request not related", "Yêu cầu chưa liên quan tới chăm sóc xe."],
  ["too blurry", "Ảnh đang quá mờ để phân tích chắc chắn."],
  ["blurry", "Ảnh đang hơi mờ, cần ảnh rõ hơn để tư vấn chính xác hơn."],
  ["low light", "Ảnh đang thiếu sáng, khó nhìn rõ chi tiết xe."],
  ["unreadable", "Ảnh chưa đủ rõ để nhận diện chính xác."]
];

function normalizeProviderText(value, fallback = "") {
  const text = String(value || "").trim();
  if (!text) {
    return fallback;
  }

  const lowerCaseText = text.toLowerCase();
  const mappedEntry = ENGLISH_TEXT_MAP.find(([phrase]) => lowerCaseText.includes(phrase));
  return mappedEntry ? mappedEntry[1] : text;
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function formatTime(value) {
  if (!value) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit"
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function AiServiceChatbox() {
  const navigate = useNavigate();
  const messageListRef = useRef(null);
  const { isAuthenticated } = useAuth();
  const {
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
  } = useVehicleIssueAdvisor(isAuthenticated);

  const hasHistory = messages.length > 1;
  const helperText = useMemo(() => {
    if (!isAuthenticated) {
      return "Đăng nhập để dùng AI Chat và lưu lịch sử tư vấn theo tài khoản.";
    }

    if (!selectedImage) {
      return "Bạn có thể gửi thêm ảnh xe để AI nhìn rõ hơn.";
    }

    return "Nếu ảnh mờ hoặc thiếu sáng, hệ thống sẽ báo và ưu tiên dựa vào mô tả.";
  }, [isAuthenticated, selectedImage]);

  useEffect(() => {
    if (isAuthenticated) {
      return;
    }

    setError("");
  }, [isAuthenticated, setError]);

  useEffect(() => {
    const container = messageListRef.current;
    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [messages]);

  const openRecommendation = (serviceId) => {
    if (serviceId) {
      navigate(`/services/detail/${serviceId}`);
      return;
    }

    navigate("/services");
  };

  const bookRecommendation = (serviceId) => {
    if (serviceId) {
      navigate(`/booking?service_id=${serviceId}`);
      return;
    }

    navigate("/services");
  };

  return (
    <section className="home-ai-section">
      <div className="home-section-heading ai-heading">
        <div>
          <h2 className="section-heading">AI Chat</h2>
          <p className="ai-section-subtitle">Tư vấn nhanh theo mô tả, ảnh xe và dịch vụ đang có.</p>
        </div>

        <button
          type="button"
          className="ai-history-button"
          onClick={clearHistory}
          disabled={!hasHistory}
        >
          <Eraser size={16} />
          <span>Xóa lịch sử</span>
        </button>
      </div>

      <div className="surface-card ai-chat-panel">
        <div className="ai-chat-messages" ref={messageListRef}>
          {messages.map((message) => (
            <article
              key={message.id}
              className={message.role === "assistant" ? "ai-message assistant" : "ai-message user"}
            >
              <div className="ai-message-avatar">
                {message.role === "assistant" ? <Bot size={18} /> : <Sparkles size={18} />}
              </div>

              <div className="ai-message-content">
                <div className="ai-message-meta">
                  <span>{message.role === "assistant" ? "CarCare AI" : "Bạn"}</span>
                  <time>{formatTime(message.createdAt)}</time>
                </div>

              <div className="ai-message-body">
                  {message.kind === "text" && <p>{message.text}</p>}

                  {message.kind === "issue" && (
                    <div className="ai-user-issue">
                      <p>{message.text}</p>
                      {message.imageName && <span className="ai-image-chip">{message.imageName}</span>}
                    </div>
                  )}

                  {message.kind === "recommendation" && (
                    <div className="ai-recommendation">
                      <div className="ai-recommendation-top">
                        <div className="ai-recommendation-copy">
                          <h3>{normalizeProviderText(message.analysis.title, "Kết quả phân tích")}</h3>
                          <p>{normalizeProviderText(message.analysis.summary, "Đã phân tích xong.")}</p>
                        </div>

                        {message.analysis.imageProvided ? (
                          <span
                            className={
                              message.analysis.imageReadable
                                ? "ai-status-pill ai-status-pill-ok"
                                : "ai-status-pill ai-status-pill-warn"
                            }
                          >
                            {message.analysis.imageReadable ? "Ảnh đủ rõ" : "Ảnh chưa đủ rõ"}
                          </span>
                        ) : (
                          <span className="ai-status-pill">Tư vấn theo mô tả</span>
                        )}
                      </div>

                      {message.analysis.imageProvided && message.analysis.imageFeedback && (
                        <div
                          className={
                            message.analysis.imageReadable
                              ? "ai-vision-note"
                              : "ai-vision-note ai-vision-note-warn"
                          }
                        >
                          <AlertCircle size={16} />
                          <p>{normalizeProviderText(message.analysis.imageFeedback)}</p>
                        </div>
                      )}

                      {!message.analysis.relevant && message.analysis.rejectionReason && (
                        <p className="ai-recommendation-reject">
                          {normalizeProviderText(
                            message.analysis.rejectionReason,
                            "Chỉ hỗ trợ nội dung liên quan đến ô tô."
                          )}
                        </p>
                      )}

                      <p className="ai-recommendation-note">
                        {normalizeProviderText(
                          message.analysis.rationale,
                          "Chỉ đề xuất dịch vụ có sẵn trong hệ thống."
                        )}
                      </p>

                      <p className="ai-recommendation-followup">
                        {normalizeProviderText(
                          message.analysis.followUp,
                          "Bạn có thể xem chi tiết dịch vụ hoặc đặt lịch ngay."
                        )}
                      </p>

                      <div className="ai-recommendation-list">
                        {!message.analysis.relevant ? (
                          <div className="ai-empty-recommendation">
                            <p>Chỉ hỗ trợ tư vấn nội dung liên quan đến xe và dịch vụ chăm sóc xe.</p>
                          </div>
                        ) : Array.isArray(message.analysis.recommendations) &&
                          message.analysis.recommendations.length > 0 ? (
                          message.analysis.recommendations.map((service) => (
                            <div key={service.id || service.name} className="ai-service-card">
                              <div className="ai-service-card-copy">
                                <span className="ai-service-category">
                                  {service.category || "Dịch vụ phù hợp"}
                                </span>
                                <h4>{service.name}</h4>
                                <p>
                                  {normalizeProviderText(
                                    service.matchReason,
                                    "Phù hợp với nhu cầu hiện tại."
                                  )}
                                </p>
                                <strong>{formatCurrency(service.price)}đ</strong>
                              </div>

                              <div className="ai-service-card-actions">
                                <button
                                  type="button"
                                  className="ai-service-secondary"
                                  onClick={() => openRecommendation(service.id)}
                                >
                                  Xem dịch vụ
                                </button>
                                <button
                                  type="button"
                                  className="ai-service-primary"
                                  onClick={() => bookRecommendation(service.id)}
                                >
                                  Đặt lịch <ArrowRight size={16} />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="ai-empty-recommendation">
                            <p>Chưa tìm thấy gợi ý đủ sát. Bạn có thể xem toàn bộ dịch vụ hiện có.</p>
                            <button
                              type="button"
                              className="ai-service-primary"
                              onClick={() => openRecommendation("")}
                            >
                              Xem dịch vụ <ArrowRight size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="ai-composer">
          {!isAuthenticated && (
            <div className="ai-auth-block">
              <div className="ai-auth-copy">
                <h3>Đăng nhập để bắt đầu tư vấn</h3>
                <p>AI Chat chỉ hoạt động khi bạn đã đăng nhập. Sau đó bạn có thể gửi mô tả, ảnh xe và xem lại lịch sử trò chuyện.</p>
              </div>

              <button
                type="button"
                className="ai-service-primary"
                onClick={() => navigate("/login")}
              >
                Đăng nhập
              </button>
            </div>
          )}

          <div className="ai-composer-toolbar">
            <label
              className={isAuthenticated ? "ai-upload-button" : "ai-upload-button ai-upload-button-disabled"}
              htmlFor="ai-chat-upload"
            >
              <input
                key={selectedImage?.name || "empty-upload"}
                id="ai-chat-upload"
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageChange}
                disabled={!isAuthenticated}
              />
              <ImagePlus size={18} />
              <span>{selectedImage ? "Đổi ảnh" : "Tải ảnh xe"}</span>
            </label>

            <div className="ai-toolbar-note">{helperText}</div>
          </div>

          {previewUrl && selectedImage && (
            <div className="ai-preview-card">
              <img src={previewUrl} alt={selectedImage.name} />
              <div className="ai-preview-copy">
                <strong>{selectedImage.name}</strong>
                <span>AI sẽ kiểm tra độ rõ của ảnh trước khi gợi ý dịch vụ.</span>
              </div>
              <button type="button" className="ai-preview-remove" onClick={clearSelectedImage}>
                Xóa
              </button>
            </div>
          )}

          <textarea
            value={draftDescription}
            onChange={(event) => setDraftDescription(event.target.value)}
            placeholder="Ví dụ: xe bị trầy cánh cửa bên phải, sơn xước nhẹ và bám bùn ở phần hông xe..."
            rows={4}
            disabled={!isAuthenticated}
          />

          {error && <p className="ai-form-error">{error}</p>}

          <div className="ai-composer-footer">
            <p className="ai-composer-tip">Lịch sử trò chuyện sẽ được lưu trên thiết bị này.</p>

            <button
              type="button"
              className="ai-submit-btn"
              onClick={submitIssue}
              disabled={submitting || !isAuthenticated}
            >
              {submitting ? <LoaderCircle size={18} className="spin" /> : <Send size={18} />}
              <span>{submitting ? "Đang phân tích" : "Gửi"}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AiServiceChatbox;
