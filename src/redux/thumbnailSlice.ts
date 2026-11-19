import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface thumbnail {
  isDisplayEditView: boolean,
  index: number,
  generatedAt: number | undefined,  // When the user last generated a thumbnail
}

const initialState: thumbnail = {
  isDisplayEditView: false,
  index: 0,
  generatedAt: undefined,
};

/**
 * Slice for the main menu state
 */
export const thumbnailSlice = createSlice({
  name: "thumbnailState",
  initialState,
  reducers: {
    setIsDisplayEditView: (state, action: PayloadAction<thumbnail["isDisplayEditView"]>) => {
      state.isDisplayEditView = action.payload;
    },
    setIndex: (state, action: PayloadAction<thumbnail["index"]>) => {
      state.index = action.payload;
    },
    setGeneratedAt: (state, action: PayloadAction<thumbnail["generatedAt"]>) => {
      state.generatedAt = action.payload;
    },
  },
  selectors: {
    selectIsDisplayEditView: state => state.isDisplayEditView,
    selectIndex: state => state.index,
    selectGeneratedAt: state => state.generatedAt,
  },
});

// Export Actions
export const { setIsDisplayEditView, setIndex, setGeneratedAt } = thumbnailSlice.actions;

export const { selectIsDisplayEditView, selectIndex, selectGeneratedAt } = thumbnailSlice.selectors;

export default thumbnailSlice.reducer;
