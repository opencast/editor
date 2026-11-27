import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface end {
  end: boolean,
}

const initialState: end = {
  end: false,
};

/**
 * Slice for the state of the editor being done, after which the user can not do any actions anymore
 */
export const endSlice = createSlice({
  name: "endState",
  initialState,
  reducers: {
    setEnd: (state, action: PayloadAction<end["end"]>) => {
      state.end = action.payload;
    },
  },
  selectors: {
    selectIsEnd: state => state.end,
  },
});

export const { setEnd } = endSlice.actions;

export const { selectIsEnd } = endSlice.selectors;

export default endSlice.reducer;
