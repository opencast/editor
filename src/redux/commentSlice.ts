import { createSlice, nanoid, PayloadAction } from "@reduxjs/toolkit";

import { Comment, CommentReply, httpRequestState } from "../types";
import { fetchVideoInformation } from "./videoSlice";
import { postVideoInformation } from "./workflowPostSlice";

interface CommentState {
  comments: Comment[];
  commentReasons: string[];
  hasChanges: boolean;
}

/**
 * Strip the reason key for localization
 * (e.g. "EVENTS.EVENTS.DETAILS.COMMENTS.REASONS.REVIEW" -> review)
 */
const normalizeReason = (reason: string): string => {
  const parts = reason.toLowerCase().split("reasons.");
  return parts.length > 1 ? parts[parts.length - 1] : reason;
};

const initialState: CommentState & httpRequestState = {
  comments: [],
  commentReasons: [],
  hasChanges: false,

  status: "idle",
  error: undefined,
  errorReason: "unknown",
};

/**
 * Slice for managing comments
 * All changes are applied locally first and then saved together with other changes
 * via postVideoInformation in workflowPostSlice.ts
 */
const commentSlice = createSlice({
  name: "commentState",
  initialState,
  reducers: {
    setHasChanges: (state, action: PayloadAction<CommentState["hasChanges"]>) => {
      state.hasChanges = action.payload;
    },
    /**
     * Add a new comment locally
     */
    addComment: (state, action: PayloadAction<{
      reason: string;
      text: string;
    }>) => {
      const newComment: Comment = {
        id: nanoid(),
        creationDate: new Date().toISOString(),
        author: "",  // Backend stamps the actual author via SecurityService
        displayName: "",
        reason: action.payload.reason,
        text: action.payload.text,
        resolvedStatus: false,
        replies: [],
        pending: true,  // Mark as pending until saved to backend
      };
      state.comments.push(newComment);
      state.hasChanges = true;
    },
    /**
     * Add a reply to a comment locally
     */
    addReply: (state, action: PayloadAction<{
      commentId: Comment["id"];
      text: string;
    }>) => {
      const comment = state.comments.find(c => c.id === action.payload.commentId);
      if (comment) {
        const newReply: CommentReply = {
          id: nanoid(),
          creationDate: new Date().toISOString(),
          author: "",  // Backend stamps the actual author via SecurityService
          displayName: "",
          text: action.payload.text,
          pending: true,  // Mark as pending until saved to backend
        };
        comment.replies.push(newReply);
        state.hasChanges = true;
      }
    },
    /**
     * Delete a comment locally
     */
    deleteComment: (state, action: PayloadAction<Comment["id"]>) => {
      state.comments = state.comments.filter(c => c.id !== action.payload);
      state.hasChanges = true;
    },
    /**
     * Delete a reply locally
     */
    deleteReply: (state, action: PayloadAction<{
      commentId: Comment["id"];
      replyId: CommentReply["id"];
    }>) => {
      const comment = state.comments.find(c => c.id === action.payload.commentId);
      if (comment) {
        comment.replies = comment.replies.filter(r => r.id !== action.payload.replyId);
        state.hasChanges = true;
      }
    },
    /**
     * Update the resolved status of a comment locally
     */
    updateResolvedStatus: (state, action: PayloadAction<{
      commentId: Comment["id"];
      resolved: boolean;
    }>) => {
      const comment = state.comments.find(c => c.id === action.payload.commentId);
      if (comment) {
        comment.resolvedStatus = action.payload.resolved;
        state.hasChanges = true;
      }
    },
    /**
     * Update the text of a comment locally
     */
    updateCommentText: (state, action: PayloadAction<{
      commentId: Comment["id"];
      text: string;
    }>) => {
      const comment = state.comments.find(c => c.id === action.payload.commentId);
      if (comment) {
        comment.text = action.payload.text;
        state.hasChanges = true;
      }
    },
    /**
     * Update the reason of a comment locally
     */
    updateCommentReason: (state, action: PayloadAction<{
      commentId: Comment["id"];
      reason: string;
    }>) => {
      const comment = state.comments.find(c => c.id === action.payload.commentId);
      if (comment) {
        comment.reason = action.payload.reason;
        state.hasChanges = true;
      }
    },
  },
  extraReducers: builder => {
    // Listen to fetchVideoInformation to populate comments from edit.json
    builder.addCase(
      fetchVideoInformation.pending, (state, _action) => {
        state.status = "loading";
      });
    builder.addCase(
      fetchVideoInformation.fulfilled, (state, { payload }) => {
        // Comments and reasons are fetched together with video info
        if (payload.comments) {
          state.comments = payload.comments.map(c => ({ ...c, reason: normalizeReason(c.reason) }));
        }
        if (payload.commentReasons) {
          state.commentReasons = payload.commentReasons.map(normalizeReason);
        }
        state.status = "success";
        state.hasChanges = false;
      });
    builder.addCase(
      fetchVideoInformation.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
    // Clear pending flags after successful save
    builder.addCase(
      postVideoInformation.fulfilled, state => {
        state.comments.forEach(comment => {
          comment.pending = false;
          comment.replies.forEach(reply => {
            reply.pending = false;
          });
        });
      });
  },
  selectors: {
    selectComments: state => state.comments,
    selectCommentReasons: state => state.commentReasons,
    selectHasChanges: state => state.hasChanges,
    selectStatus: state => state.status,
    selectError: state => state.error,
    selectCommentById: (state, commentId: Comment["id"]) => {
      return state.comments.find(c => c.id === commentId);
    },
  },
});

export const {
  setHasChanges,
  addComment,
  addReply,
  deleteComment,
  deleteReply,
  updateResolvedStatus,
  updateCommentText,
  updateCommentReason,
} = commentSlice.actions;

export const {
  selectComments,
  selectCommentReasons,
  selectHasChanges,
  selectStatus,
  selectError,
  selectCommentById,
} = commentSlice.selectors;

export default commentSlice.reducer;
