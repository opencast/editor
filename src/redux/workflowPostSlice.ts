import { createSlice } from "@reduxjs/toolkit";
import { client } from "../util/client";
import { Segment, Comment, PostEditArgument, httpRequestState } from "../types";
import { settings } from "../config";
import { createAppAsyncThunk } from "./createAsyncThunkWithTypes";
import { selectCatalogById, selectCatalogIds, selectFieldById } from "./metadataSlice";

const initialState: httpRequestState = {
  status: "idle",
  error: undefined,
  errorReason: "unknown",
};

/**
 * Convert comments for the backend API.
 * New comments (with nanoid string IDs) get id 0 so the backend knows to create them.
 * The `pending` field is stripped since the backend doesn't know about it.
 */
const convertComments = (comments: Comment[]) => {
  return comments.map(comment => ({
    id: typeof comment.id === "string" ? 0 : comment.id,
    creationDate: comment.creationDate,
    author: comment.author,
    reason: comment.reason,
    text: comment.text,
    resolvedStatus: comment.resolvedStatus,
    replies: comment.replies.map(reply => ({
      id: typeof reply.id === "string" ? 0 : reply.id,
      creationDate: reply.creationDate,
      author: reply.author,
      text: reply.text,
    })),
  }));
};

export const postVideoInformation =
  createAppAsyncThunk("video/postVideoInformation", async (argument: PostEditArgument, { getState }) => {
    if (!settings.id) {
      throw new Error("Missing media package id");
    }

    // Transform
    const state = getState();
    const catalogsJson = selectCatalogIds(state).map(catId => {
      const cat = selectCatalogById(state, catId);

      const fieldsJson = cat.fieldIds.map(fieldId => {
        const field = selectFieldById(state, fieldId);

        // Remove internal keys (`id`, `catalogId`) & restore original field `id`
        const { catalogId, id: compositeId, ...rest } = field;
        const originalId = compositeId.split(":")[1];          // after `${catalogId}:`

        return { ...rest, id: originalId, collection: undefined };
      });

      return {
        flavor: cat.flavor,
        title: cat.title,
        fields: fieldsJson,
      };
    });

    const response = await client.post(`${settings.opencast.url}/editor/${settings.id}/edit.json`,
      {
        segments: convertSegments(argument.segments),
        tracks: argument.tracks,
        customizedTrackSelection: argument.customizedTrackSelection,
        subtitles: argument.subtitles,
        chapters: argument.chapters,
        workflows: argument.workflow,
        metadataJSON: JSON.stringify(catalogsJson),
        comments: convertComments(argument.comments),
      },
    );
    return response;
  });

/**
 * Slice for managing a post request for saving current changes
 * TODO: Create a wrapper for this and workflowPostAndProcessSlice
 */
const workflowPostSlice = createSlice({
  name: "workflowPostState",
  initialState,
  reducers: {
    resetPostRequestState: state => {
      state.status = "idle";
    },
  },
  extraReducers: builder => {
    builder.addCase(
      postVideoInformation.pending, (state, _action) => {
        state.status = "loading";
      });
    builder.addCase(
      postVideoInformation.fulfilled, (state, _action) => {
        state.status = "success";
      });
    builder.addCase(
      postVideoInformation.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
  selectors: {
    selectStatus: state => state.status,
    selectError: state => state.error,
  },
});

interface segmentAPI {
  start: number,
  end: number,
  deleted: boolean,
  selected: boolean,
}

// Convert a segment from how it is stored in redux into
// a segment that can be send to Opencast
export const convertSegments = (segments: Segment[]) => {
  const newSegments: segmentAPI[] = [];

  segments.forEach(segment => {
    newSegments.push({
      start: segment.start,
      end: segment.end,
      deleted: segment.deleted,
      selected: false,
    });
  });

  return newSegments;
};

export const { resetPostRequestState } = workflowPostSlice.actions;

export const { selectStatus, selectError } = workflowPostSlice.selectors;

export default workflowPostSlice.reducer;
