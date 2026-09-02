/* eslint-disable camelcase */

import { match, useColorScheme } from "@opencast/appkit";
import { COLORS } from "./util/appkit";

export const useTheme = (): Theme => {
  const scheme = useColorScheme();
  return match(scheme.scheme, {
    "light": () => lightMode,
    "dark": () => darkMode,
    "light-high-contrast": () => highContrastLightMode,
    "dark-high-contrast": () => highContrastDarkMode,
  });
};

export interface Theme {
  background: string;
  menu_background: string;
  text: string;
  error: string;
  element_bg: string;
  multiValue: string;
  focused: string;
  focus_text: string;
  selected: string;
  disabled: string;
  menuBorder: string;
  boxShadow: string;
  boxShadow_tiles: string;
  singleKey_bg: string;
  singleKey_border: string;
  singleKey_boxShadow: string;
  invert_wave: string;
  inverted_text: string;
  tooltip: string;
  tooltip_text: string;
  contextMenu: string;
  element_outline: string;
  selected_text: string;
  dropdown_border: string;
  menuButton_outline: string;
  button_outline: string;
  button_color: string;
  indicator_color: string;
  icon_color: string;
  slider_thumb_color: string;
  slider_thumb_shadow: string;
  slider_track_color: string;
  background_finish_menu_icon: string;
  background_play_icon: string;
  background_preview_icon: string;
  waveform_filter: string;
  waveform_bg: string;
  cut: string;
  scrubber: string;
  scrubber_handle: string;
  scrubber_icon: string;
  subtitle_segment_bg: string;
  subtitle_segment_border: string;
  subtitle_segment_text: string;
  header_bg: string;
  header_text: string;
  header_button_hover_bg: string;
  metadata_highlight: string;
  clock_bg: string;
  clock_border: string;
  clock_hands: string;
  clock_focus: string;
  digit_selected: string;
  text_shadow: string;
  audio_only_bg: string;
}

export const lightMode: Theme = {
  background: COLORS.neutral10,
  menu_background: COLORS.neutral05,
  text: COLORS.neutral90,
  error: "#ed1741",
  element_bg: COLORS.neutral05,
  multiValue: COLORS.neutral15,
  focused: COLORS.neutral15,
  focus_text: COLORS.neutral90,
  selected: COLORS.neutral25,
  disabled: "rgba(0, 0, 0, 0.55)",
  menuBorder: `1px solid ${COLORS.neutral30}`,
  boxShadow: `0 0 2px 2px ${COLORS.neutral30}`,
  boxShadow_tiles: "0 5px 10px 0px rgba(150, 150, 150, 0.5)",
  singleKey_bg: COLORS.neutral10,
  singleKey_border: COLORS.neutral20,
  singleKey_boxShadow: "0 2px 2px 0px rgba(150, 150, 150, 0.2)",
  invert_wave: "invert(0%)",
  // for "Generating waveform" text: in lightMode it"s not inverted, so it has to be black
  inverted_text: COLORS.neutral90,
  tooltip: COLORS.neutral80,
  tooltip_text: COLORS.neutral05,
  contextMenu: COLORS.neutral10,
  element_outline: "2px solid transparent",
  selected_text: COLORS.neutral90,
  dropdown_border: `1px solid ${COLORS.neutral40}`,
  menuButton_outline: "2px solid transparent",
  button_outline: "none",
  button_color: COLORS.neutral10,
  indicator_color: COLORS.neutral60,
  icon_color: COLORS.neutral05,
  slider_thumb_color: COLORS.neutral70,
  slider_thumb_shadow: `0 0 0 8px ${COLORS.neutral30}`,
  slider_track_color: COLORS.neutral30,
  background_finish_menu_icon: COLORS.neutral15,
  background_play_icon: COLORS.neutral70,
  background_preview_icon: COLORS.neutral70,
  // All this just to turn the black part of the waveform image blue. Generated with: https://isotropic.co/tool/hex-color-to-css-filter/
  waveform_filter: "invert(44%) sepia(8%) saturate(3893%) hue-rotate(169deg) brightness(99%) contrast(90%)",
  waveform_bg: "",
  cut: COLORS.neutral60,
  scrubber: COLORS.neutral60,
  scrubber_handle: COLORS.neutral05,
  scrubber_icon: COLORS.neutral60,
  subtitle_segment_bg: "rgba(0, 0, 0, 0.4)",
  subtitle_segment_border: `1px solid ${COLORS.neutral80}`,
  subtitle_segment_text: COLORS.neutral05,
  header_bg: COLORS.neutral60,
  header_text: COLORS.neutral05,
  header_button_hover_bg: COLORS.neutral70,
  metadata_highlight: COLORS.neutral50,
  clock_bg: COLORS.neutral15,
  clock_border: "2px solid transparent",
  clock_hands: COLORS.neutral50,
  clock_focus: COLORS.neutral90,
  digit_selected: COLORS.neutral90,
  text_shadow: `2px 0 ${COLORS.neutral15}, -2px 0 ${COLORS.neutral15},` +
    `0 2px ${COLORS.neutral15}, 0 -2px ${COLORS.neutral15},` +
    `1px 1px ${COLORS.neutral15}, -1px -1px ${COLORS.neutral15},` +
    `1px -1px ${COLORS.neutral15}, -1px 1px ${COLORS.neutral15}`,
  audio_only_bg: COLORS.neutral05,
};

export const darkMode: Theme = {
  background: COLORS.neutral10,
  menu_background: COLORS.neutral05,
  text: COLORS.neutral90,
  error: "rgba(237, 23, 65, 0.8)",
  element_bg: COLORS.neutral05,
  multiValue: COLORS.neutral15,
  focused: COLORS.neutral15,
  focus_text: COLORS.neutral90,
  selected: COLORS.neutral25,
  disabled: "rgba(255, 255, 255, 0.5)",
  menuBorder: `1px solid ${COLORS.neutral30}`,
  boxShadow: `0 0 5px ${COLORS.neutral05}`,
  boxShadow_tiles: "0 5px 10px 0px rgba(0, 0, 0, 0.3)",
  singleKey_bg: "linear-gradient(180deg, rgba(40,40,40,1) 0%, rgba(30,30,30,1) 100%)",
  singleKey_border: COLORS.neutral20,
  singleKey_boxShadow: "0 2px 2px 0px rgba(0, 0, 0, 1.0)",
  invert_wave: "invert(100%)",
  inverted_text: COLORS.neutral90,
  tooltip: COLORS.neutral80,
  tooltip_text: COLORS.neutral05,
  contextMenu: COLORS.neutral20,
  element_outline: "2px solid transparent",
  selected_text: COLORS.neutral90,
  dropdown_border: `1px solid ${COLORS.neutral40}`,
  menuButton_outline: "2px solid transparent",
  button_outline: "0px solid transparent",
  button_color: COLORS.neutral20,
  indicator_color: COLORS.neutral60,
  icon_color: "rgba(255, 255, 255, 0.87)",
  slider_thumb_color: COLORS.neutral70,
  slider_thumb_shadow: "0 0 0 8px rgba(255, 255, 255, 0.2)",
  slider_track_color: COLORS.neutral90,
  background_finish_menu_icon: COLORS.neutral15,
  background_play_icon: COLORS.neutral70,
  background_preview_icon: COLORS.neutral70,
  waveform_filter: "invert(11%)",
  waveform_bg: "#fff",
  cut: COLORS.neutral60,
  scrubber: COLORS.neutral60,
  scrubber_handle: COLORS.neutral70,
  scrubber_icon: COLORS.neutral20,
  subtitle_segment_bg: "rgba(0, 0, 0, 0.4)",
  subtitle_segment_border: `1px solid ${COLORS.neutral80}`,
  subtitle_segment_text: COLORS.neutral90,
  header_bg: COLORS.neutral20,
  header_text: COLORS.neutral90,
  header_button_hover_bg: COLORS.neutral10,
  metadata_highlight: COLORS.neutral50,
  clock_bg: COLORS.neutral15,
  clock_border: "2px solid transparent",
  clock_hands: COLORS.neutral50,
  clock_focus: COLORS.neutral90,
  digit_selected: COLORS.neutral90,
  text_shadow: `2px 0 ${COLORS.neutral15}, -2px 0 ${COLORS.neutral15},` +
    `0 2px ${COLORS.neutral15}, 0 -2px ${COLORS.neutral15},` +
    `1px 1px ${COLORS.neutral15}, -1px -1px ${COLORS.neutral15},` +
    `1px -1px ${COLORS.neutral15}, -1px 1px ${COLORS.neutral15}`,
  audio_only_bg: COLORS.neutral90,
};

export const highContrastDarkMode: Theme = {
  background: "#000",
  menu_background: "#000",
  text: "#fff",
  error: "#ED1741",
  element_bg: "none",
  multiValue: "#c4c4c4",
  focused: "#a6ffea",
  focus_text: "#000",
  selected: "#fff",
  disabled: "rgba(255, 255, 255, 0.6)",
  menuBorder: "2px solid #fff",
  boxShadow: "0 0 0 rgba(255, 255, 255, 0.3)",
  boxShadow_tiles: "0 0 0 rgba(255, 255, 255, 0.3)",
  singleKey_bg: "none",
  singleKey_border: "#fff",
  singleKey_boxShadow: "0 2px 2px 0px rgba(150, 150, 150, 0.2)",
  invert_wave: "invert(100%)",
  inverted_text: "#000",
  tooltip: "#fff",
  tooltip_text: "#000",
  contextMenu: "#000",
  element_outline: "2px solid #fff",
  selected_text: "#000",
  dropdown_border: "2px solid #fff",
  menuButton_outline: "2px solid transparent",
  button_outline: "2px solid #a6ffea",
  button_color: "#a6ffea",
  indicator_color: "#a6ffea",
  icon_color: "#000",
  slider_thumb_color: "#fff",
  slider_thumb_shadow: "0 0 0 8px rgba(166, 255, 234, 0.8)",
  slider_track_color: "#fff",
  background_finish_menu_icon: "#000",
  background_play_icon: "#fff",
  background_preview_icon: "#fff",
  waveform_filter: "invert(100%)",
  waveform_bg: "#80B8AC",
  cut: "#fff",
  scrubber: "#fff",
  scrubber_handle: "#fff",
  scrubber_icon: "#000",
  subtitle_segment_bg: "none",
  subtitle_segment_border: "2px solid #fff",
  subtitle_segment_text: "#fff",
  header_bg: "#000",
  header_text: "#fff",
  header_button_hover_bg: "#000",
  metadata_highlight: "rgb(38, 132, 255)",
  clock_bg: "#000",
  clock_border: "2px solid #a6ffea",
  clock_hands: "#fff",
  clock_focus: "#000",
  digit_selected: "#000",
  text_shadow: "2px 0 #000, -2px 0 #000, 0 2px #000, 0 -2px #000," +
    " 1px 1px #000, -1px -1px #000, 1px -1px #000, -1px 1px #000",
  audio_only_bg: "#fff",
};

export const highContrastLightMode: Theme = {
  background: "snow",
  menu_background: "snow",
  text: "#000",
  error: "#a5102d",
  element_bg: "none",
  multiValue: "#2e2e2e",
  focused: "#000099",
  focus_text: "#fff",
  selected: "#4646b5",
  disabled: "rgba(0, 0, 0, 0.6)",
  menuBorder: "2px solid #000",
  boxShadow: "0 0 0 rgba(0, 0, 0, 0.3)",
  boxShadow_tiles: "0 0 0 rgba(0, 0, 0, 0.3)",
  singleKey_bg: "none",
  singleKey_border: "#000",
  singleKey_boxShadow: "0 2px 2px 0px rgba(150, 150, 150, 0.2)",
  invert_wave: "invert(0%)",
  inverted_text: "#fff",
  tooltip: "#000",
  tooltip_text: "#fff",
  contextMenu: "snow",
  element_outline: "2px solid #000",
  selected_text: "#fff",
  dropdown_border: "2px solid #000",
  menuButton_outline: "2px solid transparent",
  button_outline: "3px solid #000099",
  button_color: "#000099",
  indicator_color: "#000099",
  icon_color: "#fff",
  slider_thumb_color: "#000",
  slider_thumb_shadow: "0 0 0 8px rgba(0, 0, 153, 0.6)",
  slider_track_color: "#000",
  background_finish_menu_icon: "snow",
  background_play_icon: "#000",
  background_preview_icon: "#000",
  waveform_filter: "invert(0%)",
  waveform_bg: "#fff",
  cut: "#000",
  scrubber: "#000",
  scrubber_handle: "#000",
  scrubber_icon: "#fff",
  subtitle_segment_bg: "none",
  subtitle_segment_border: "2px solid #000",
  subtitle_segment_text: "#000",
  header_bg: "#000",
  header_text: "#fff",
  header_button_hover_bg: "#000",
  metadata_highlight: "rgb(38, 132, 255)",
  clock_bg: "snow",
  clock_border: "2px solid #000099",
  clock_hands: "#4646b5",
  clock_focus: "#fff",
  digit_selected: "#fff",
  text_shadow: "2px 0 snow, -2px 0 snow, 0 2px snow, 0 -2px snow," +
    " 1px 1px snow, -1px -1px snow, 1px -1px snow, -1px 1px snow",
  audio_only_bg: "#fff",
};
