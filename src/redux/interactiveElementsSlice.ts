import { createSlice, nanoid, PayloadAction } from "@reduxjs/toolkit";

export type Textbox = {
  start: number,
  text: string,
  link?: string,
  type: "Textbox",    // Internal, for discerning unions
  idInternal: string, // Identifier for internal use.
}

export type Quiz = {
  start: number,
  question: string,
  answers : {
    text: string,
    correct: boolean,
  }[]
  type: "Quiz"        // Internal, for discerning unions
  idInternal: string, // Identifier for internal use.
}

export type InteractiveElement = Textbox | Quiz;

export type InteractiveElementFromOpencast = {
  id: string,
  elementsJSON: string,
};

export interface interactiveElements {
  interactiveElements: InteractiveElement[],
  hasChanges: boolean;         // Did user make changes to metadata view since last save
}

const initialState: interactiveElements = {
  interactiveElements: [],
  hasChanges: false,
};


/**
 * Slice for the interactive elements editor state
 */
export const interactiveElementsSlice = createSlice({
  name: "interactiveElementsState",
  initialState,
  reducers: {
    setInteractiveElements: (state, action: PayloadAction<interactiveElements["interactiveElements"]>) => {
      state.interactiveElements = action.payload;
    },
    updateStartAtIndex: (state, action: PayloadAction<{index: number, newStart: number}>) => {
      if (action.payload.index < 0 || action.payload.index >= state.interactiveElements.length) {
        console.warn("Index " + action.payload.index + " was out of range");
        return;
      }
      state.interactiveElements[action.payload.index].start = Math.round(action.payload.newStart);

      state.interactiveElements = sortSubtitle(state.interactiveElements);
      state.hasChanges = true;
    },
    addInteractiveElement: (state, action: PayloadAction<InteractiveElement>) => {
      const existingElementIndex = state.interactiveElements.findIndex(e => e.idInternal === action.payload.idInternal);
      if (existingElementIndex < 0) {
        action.payload.idInternal = nanoid();
        state.interactiveElements.push(action.payload);
      } else {
        state.interactiveElements[existingElementIndex] = action.payload;
      }

      state.interactiveElements = sortSubtitle(state.interactiveElements);
      state.hasChanges = true;
    },
    removeInteractiveElementById: (state, action: PayloadAction<string>) => {
      const existingElementIndex = state.interactiveElements.findIndex(e => e.idInternal === action.payload);
      if (existingElementIndex >= 0) {
        state.interactiveElements.splice(existingElementIndex, 1);
      }
    },
  },
  selectors: {
    selectInteractiveElements: state => state.interactiveElements,
  },
});

// Sort a subtitle array by startTime
const sortSubtitle = (elements: InteractiveElement[]) => {
  return elements.sort((a, b) => a.start - b.start);
};

// Export Actions
export const {
  setInteractiveElements,
  updateStartAtIndex,
  addInteractiveElement,
  removeInteractiveElementById,
} = interactiveElementsSlice.actions;

export const {
  selectInteractiveElements,
} = interactiveElementsSlice.selectors;

export default interactiveElementsSlice.reducer;
