import { configureStore } from "@reduxjs/toolkit";
import mainMenuStateReducer from "./mainMenuSlice";
import finishStateReducer from "./finishSlice";
import videoReducer from "./videoSlice";
import workflowPostReducer from "./workflowPostSlice";
import endReducer from "./endSlice";
import metadataReducer from "./metadataSlice";
import subtitleReducer from "./subtitleSlice";
import chapterReducer from "./chapterSlice";
import errorReducer from "./errorSlice";
import commentReducer from "./commentSlice";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

export const store = configureStore({
  reducer: {
    mainMenuState: mainMenuStateReducer,
    finishState: finishStateReducer,
    videoState: videoReducer,
    workflowPostState: workflowPostReducer,
    endState: endReducer,
    metadataState: metadataReducer,
    subtitleState: subtitleReducer,
    chapterState: chapterReducer,
    errorState: errorReducer,
    commentState: commentReducer,
  },
});

export type AppDispatch = typeof store.dispatch;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;

export type ThunkApiConfig = { state: RootState; dispatch: AppDispatch; rejectValue?: string };

// Use instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
