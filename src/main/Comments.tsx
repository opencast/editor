import { useState } from "react";
import { css } from "@emotion/react";
import { useTheme } from "../themes";
import Select from "react-select";
import {
  basicButtonStyle,
  checkboxStyle as generalCheckboxStyle,
  titleStyleBold,
  backgroundBoxStyle,
  selectFieldStyle,
} from "../cssStyles";
import { useTranslation } from "react-i18next";
import { LuClock9, LuReply, LuTrash2 } from "react-icons/lu";
import { ThemedTooltip } from "./Tooltip";

import { useAppDispatch, useAppSelector } from "../redux/store";
import {
  addComment,
  addReply,
  deleteComment,
  deleteReply,
  updateResolvedStatus,
  selectComments,
  selectCommentReasons,
  selectStatus,
} from "../redux/commentSlice";
import { Comment, CommentReply } from "../types";
import { settings } from "../config";

/**
 * Component for managing comments
 */
const Comments: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const comments = useAppSelector(selectComments);
  const commentReasons = useAppSelector(selectCommentReasons);
  const status = useAppSelector(selectStatus);

  // Local state for forms
  const [replyToComment, setReplyToComment] = useState(false);
  const [replyCommentId, setReplyCommentId] = useState<Comment["id"] | undefined>(undefined);
  const [originalComment, setOriginalComment] = useState<Comment | undefined>(undefined);
  const [commentReplyText, setCommentReplyText] = useState("");
  const [commentReplyIsResolved, setCommentReplyIsResolved] = useState(false);

  const [newCommentText, setNewCommentText] = useState("");
  const [commentReason, setCommentReason] = useState("");

  // Comments are fetched together with video info via fetchVideoInformation

  // Handlers
  const handleSaveComment = () => {
    if (!settings.id || !newCommentText || !commentReason) {
      return;
    }

    dispatch(addComment({
      reason: commentReason,
      text: newCommentText,
    }));
    setNewCommentText("");
    setCommentReason("");
  };

  const handleReplyTo = (comment: Comment) => {
    setReplyToComment(true);
    setReplyCommentId(comment.id);
    setOriginalComment(comment);
    setCommentReplyIsResolved(comment.resolvedStatus);
  };

  const handleExitReplyMode = () => {
    setReplyToComment(false);
    setReplyCommentId(undefined);
    setOriginalComment(undefined);
    setCommentReplyText("");
    setCommentReplyIsResolved(false);
  };

  const handleSaveReply = () => {
    if (!settings.id || !originalComment || !commentReplyText) {
      return;
    }

    dispatch(addReply({
      commentId: originalComment.id,
      text: commentReplyText,
    }));
    // Update resolved status locally (allows toggling resolved/open)
    dispatch(updateResolvedStatus({ commentId: originalComment.id, resolved: commentReplyIsResolved }));
    handleExitReplyMode();
  };

  const handleDeleteComment = (comment: Comment) => {
    dispatch(deleteComment(comment.id));
  };

  const handleDeleteReply = (comment: Comment, reply: CommentReply) => {
    dispatch(deleteReply({ commentId: comment.id, replyId: reply.id }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Styles
  const containerStyle = css({
    margin: "auto",
    width: "100%",
    maxWidth: "1200px",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  });

  const commentContainerStyle = css({
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    marginBottom: "20px",
    maxWidth: "100%", // Prevent children from overflowing
    // Modern scrollbar styling
    "&::-webkit-scrollbar": {
      width: "8px",
      background: theme.background,
    },
    "&::-webkit-scrollbar-thumb": {
      background: theme.text,
      borderRadius: "5px",
    },
  });

  const commentCardStyle = (isActive: boolean) => css([
    backgroundBoxStyle(theme),
    {
      border: isActive ? `${theme.button_outline}` : theme.menuBorder,
    },
  ]);

  const replyCardStyle = css({
    marginTop: "20px",
    marginLeft: "20px",
  });

  const commentHeaderStyle = css({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "8px",
    flexWrap: "wrap",
  });

  const authorStyle = css({
    fontWeight: "bold",
    fontSize: "1em",
    color: theme.text,
  });

  const badgeStyle = (color?: string) => css({
    fontSize: "0.75em",
    color: color || theme.text,
    border: `1px solid ${color || theme.text}`,
    padding: "2px 8px",
    borderRadius: "9999px",
  });

  // Badge component with optional tooltip support
  const Badge: React.FC<{ color?: string; tooltip?: string; children: React.ReactNode }> = ({
    color,
    tooltip,
    children,
  }) => {
    const badge = <span css={badgeStyle(color)}>{children}</span>;
    if (tooltip) {
      return <ThemedTooltip title={tooltip}>{badge}</ThemedTooltip>;
    }
    return badge;
  };

  const commentTextStyle = css({
    marginTop: "8px",
    marginBottom: "12px",
    lineHeight: "1.5",
    whiteSpace: "pre-wrap",
    color: theme.text,
  });

  const actionButtonsStyle = css({
    display: "flex",
    gap: "12px",
    marginTop: "8px",
    justifyContent: "flex-end",
  });

  const actionButtonStyle = css([
    basicButtonStyle(theme),
    {
      padding: "6px 12px",
      border: `1px solid ${theme.text}`,
      color: theme.text,
      background: "transparent",
      gap: "6px",
      minWidth: 0,
      "&:hover": {
        background: theme.text,
        borderColor: theme.text,
        color: theme.menu_background,
      },
      outline: "none",
    },
  ]);

  const deleteButtonStyle = css([
    basicButtonStyle(theme),
    {
      padding: "6px 12px",
      border: `1px solid ${theme.error}`,
      color: theme.error,
      background: "transparent",
      gap: "6px",
      minWidth: 0,
      "&:hover": {
        background: theme.error,
        color: theme.menu_background,
      },
      outline: "none",
    },
  ]);

  const textareaStyle = css({
    width: "100%",
    maxWidth: "100%",
    minHeight: "100px",
    padding: "12px",
    borderRadius: "5px",
    border: theme.menuBorder,
    background: theme.element_bg,
    color: theme.text,
    fontSize: "1em",
    fontFamily: "inherit",
    resize: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  });

  const selectContainerStyle = css({
    width: "100%",
    maxWidth: "500px",
  });

  const rowContainerStyle = css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "12px",
  });

  const checkboxStyle = css([
    generalCheckboxStyle(theme),
    {
      width: "18px",
      height: "18px",
      cursor: "pointer",
    },
  ]);

  const buttonContainerStyle = css({
    display: "flex",
    gap: "12px",
  });

  const submitButtonStyle = (disabled: boolean) => css([
    basicButtonStyle(theme),
    {
      padding: "10px 20px",
      fontSize: "1em",
      fontWeight: "bold",
      border: theme.menuBorder,
      background: disabled ? theme.menu_background : "#4caf50",
      color: disabled ? theme.text : theme.menu_background,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      "&:hover": {
        background: disabled ? theme.menu_background : "#45a049",
        color: disabled ? theme.text : "white",
      },
      "&:focus": {
        borderColor: theme.metadata_highlight,
      },
      outline: "none",
    },
  ]);

  const cancelButtonStyle = css([
    basicButtonStyle(theme),
    {
      padding: "10px 20px",
      fontSize: "1em",
      border: `1px solid ${theme.error}`,
      color: theme.error,
      background: "transparent",
      "&:hover": {
        background: theme.error,
        color: theme.menu_background,
      },
      outline: "none",
    },
  ]);

  const loadingStyle = css({
    textAlign: "center",
    padding: "40px",
    fontSize: "1.2em",
    color: theme.text,
  });

  const emptyStateStyle = css({
    textAlign: "center",
    padding: "40px",
    color: theme.text,
    opacity: 0.7,
  });

  // Render loading state
  if (status === "loading") {
    return (
      <div css={containerStyle}>
        <div css={loadingStyle}>{t("various.loading")}</div>
      </div>
    );
  }

  return (
    <div css={containerStyle}>
      <h2 css={titleStyleBold(theme)}>{t("mainMenu.comments-button")}</h2>

      {/* Comments List */}
      <div css={commentContainerStyle}>
        {comments.length === 0 ? (
          <div css={emptyStateStyle}>
            {t("comments.no-comments")}
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} css={commentCardStyle(replyCommentId === comment.id)}>
              {/* Comment Header */}
              <div css={commentHeaderStyle}>
                <div css={css({ display: "flex", flexDirection: "column", flex: 1 })}>
                  <div css={css({ display: "flex", alignItems: "center", gap: "8px" })}>
                    <span css={authorStyle}>{comment.author}</span>
                    {comment.pending && (
                      <Badge color="#ff9800" tooltip={t("comments.pending-tooltip")}>
                        {t("comments.pending")}
                      </Badge>
                    )}
                    <Badge color={comment.resolvedStatus ? "#4caf50" : "#2684ff"}>
                      {t(comment.resolvedStatus ? "comments.resolved" : "comments.open")}
                    </Badge>
                    <Badge>
                      {t(`comments.reasons.${comment.reason}` as never)}
                    </Badge>
                  </div>
                </div>
                <span css={css({
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.9em",
                  color: theme.text,
                  opacity: 0.7,
                  marginLeft: "auto",
                  whiteSpace: "nowrap",
                })}>
                  <LuClock9 size={14} />
                  {formatDate(comment.creationDate)}
                </span>
              </div>

              {/* Comment Text */}
              <div css={commentTextStyle}>{comment.text}</div>

              {/* Action Buttons */}
              <div css={actionButtonsStyle}>
                <button css={actionButtonStyle} onClick={() => handleReplyTo(comment)}>
                  <LuReply size={16} />
                  {t("comments.reply")}
                </button>
                <button css={deleteButtonStyle} onClick={() => handleDeleteComment(comment)}>
                  <LuTrash2 size={16} />
                  {t("comments.delete")}
                </button>
              </div>

              {/* Replies */}
              {comment.replies.map(reply => (
                <div key={reply.id} css={replyCardStyle}>
                  <div css={commentHeaderStyle}>
                    <div css={css({ display: "flex", alignItems: "center", gap: "8px", flex: 1 })}>
                      <span css={authorStyle}>{reply.author}</span>
                      {reply.pending && (
                        <Badge color="#ff9800" tooltip={t("comments.pending-tooltip")}>
                          {t("comments.pending")}
                        </Badge>
                      )}
                    </div>
                    <span css={css({
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.9em",
                      color: theme.text,
                      opacity: 0.7,
                      marginLeft: "auto",
                      whiteSpace: "nowrap",
                    })}>
                      <LuClock9 size={12} />
                      {formatDate(reply.creationDate)}
                    </span>
                  </div>
                  <div css={commentTextStyle}>
                    {reply.text}
                  </div>
                  <div css={css({ display: "flex", justifyContent: "flex-end" })}>
                    <button
                      css={deleteButtonStyle}
                      onClick={() => handleDeleteReply(comment, reply)}
                    >
                      <LuTrash2 size={16} />
                      {t("comments.delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form (hidden when replying) */}
      {!replyToComment && (
        <div css={css({ paddingBottom: "20px" })}>
          <textarea
            css={textareaStyle}
            value={newCommentText}
            onChange={e => setNewCommentText(e.target.value)}
            placeholder={t("comments.placeholder")}
          />

          {/* flex row container for select and buttons */}
          <div css={rowContainerStyle}>
            {/* "Select a reason" dropdown */}
            <div css={selectContainerStyle}>
              <Select<{ value: string; label: string }>
                styles={selectFieldStyle(theme)}
                value={commentReason
                  ? { value: commentReason, label: t(`comments.reasons.${commentReason}` as never) }
                  : null}
                onChange={selected => setCommentReason(selected?.value || "")}
                options={commentReasons.map(reason => ({
                  value: reason,
                  label: t(`comments.reasons.${reason}` as never),
                }))}
                placeholder={t("comments.select-reason")}
                isClearable
                menuPlacement="top"
              />
            </div>

            {/* Buttons */}
            <button
              css={submitButtonStyle(!newCommentText || !commentReason)}
              onClick={handleSaveComment}
              disabled={!newCommentText || !commentReason}
            >
              {t("comments.submit")}
            </button>
          </div>
        </div>
      )}

      {/* Reply Form (shown when replying) */}
      {replyToComment && originalComment && (
        <div css={css({ paddingBottom: "20px" })}>
          <textarea
            css={textareaStyle}
            value={commentReplyText}
            onChange={e => setCommentReplyText(e.target.value)}
            placeholder={
              t("comments.reply-placeholder") +
              " @" +
              originalComment.author +
              "..."
            }
          />

          <div css={rowContainerStyle}>
            <div css={css({ display: "flex", alignItems: "center", gap: "8px" })}>
              <input
                type="checkbox"
                id="resolved-checkbox"
                css={checkboxStyle}
                checked={commentReplyIsResolved}
                onChange={e => setCommentReplyIsResolved(e.target.checked)}
              />
              <label htmlFor="resolved-checkbox" style={{ cursor: "pointer" }}>
                {t("comments.mark-resolved")}
              </label>
            </div>
            <div css={buttonContainerStyle}>
              <button css={cancelButtonStyle} onClick={handleExitReplyMode}>
                {t("comments.cancel")}
              </button>
              <button
                css={submitButtonStyle(!commentReplyText)}
                onClick={handleSaveReply}
                disabled={!commentReplyText}
              >
                {t("comments.reply")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comments;
