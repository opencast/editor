import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Area, AREAS } from "../types";
import { fetchVideoInformation } from "./videoSlice";

export interface workflowSelection {
  changedAreas: Area[],           // Areas that were changed since the video was last published, saved or not
  lastWorkflowFailed: boolean,    // Did the last workflow that ran on this event fail?
}

const initialState: workflowSelection = {
  changedAreas: [],
  lastWorkflowFailed: false,
};

/**
 * Slice for the information that decides which workflow suits the changes best
 */
export const workflowSelectionSlice = createSlice({
  name: "workflowSelectionState",
  initialState,
  reducers: {
    addChangedAreas: (state, action: PayloadAction<Area[]>) => {
      state.changedAreas = AREAS.filter(area => state.changedAreas.includes(area) || action.payload.includes(area));
    },
    clearChangedAreas: state => {
      state.changedAreas = [];
    },
  },
  extraReducers: builder => {
    builder.addCase(fetchVideoInformation.fulfilled, (state, action) => {
      state.changedAreas = action.payload.changed_areas ?? [];
      state.lastWorkflowFailed = action.payload.last_workflow_failed ?? false;
    });
  },
  selectors: {
    selectChangedAreas: state => state.changedAreas,
    selectLastWorkflowFailed: state => state.lastWorkflowFailed,
  },
});

export const { addChangedAreas, clearChangedAreas } = workflowSelectionSlice.actions;

export const { selectChangedAreas, selectLastWorkflowFailed } = workflowSelectionSlice.selectors;

export default workflowSelectionSlice.reducer;
