import { combineReducers, configureStore } from "@reduxjs/toolkit";
import mainMenuStateReducer from "./mainMenuSlice";
import videoReducer from "./videoSlice";
import workflowPostReducer from "./workflowPostSlice";
import endReducer from "./endSlice";
import metadataReducer from "./metadataSlice";
import subtitleReducer from "./subtitleSlice";
import chapterReducer from "./chapterSlice";
import thumbnailReducer from "./thumbnailSlice";
import hotkeyReducer from "./hotkeySlice";
import errorReducer from "./errorSlice";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { FLUSH, PAUSE, PERSIST, persistReducer, PURGE, REGISTER, REHYDRATE } from "redux-persist";
import storage from "redux-persist/es/storage";

const reducers = combineReducers({
  mainMenuState: mainMenuStateReducer,
  videoState: videoReducer,
  workflowPostState: workflowPostReducer,
  endState: endReducer,
  metadataState: metadataReducer,
  subtitleState: subtitleReducer,
  chapterState: chapterReducer,
  thumbnailState: thumbnailReducer,
  hotkeyState: hotkeyReducer,
  errorState: errorReducer,
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["hotkeyState"], // persist hotkeys
};

const persistedReducer = persistReducer(persistConfig, reducers);

export const store = configureStore({
  reducer: persistedReducer,

  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export type AppDispatch = typeof store.dispatch;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;

export type ThunkApiConfig = { state: RootState; dispatch: AppDispatch; rejectValue?: string };

// Use instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
