/**
 * Contains mappings for special keyboard controls, beyond what is usually expected of a webpage
 * Learn more about keymaps at https://github.com/greena13/react-hotkeys#defining-key-maps (12.03.2021)
 *
 * Additional global configuration settins are placed in "./config.ts"
 * (They are not placed here, because that somehow makes the name fields of keymaps undefined for some reason)
 *
 * If you add a new keyMap, be sure to add it to the getAllHotkeys function
 */
import { match } from "@opencast/appkit";
import { ParseKeys } from "i18next";

// Apple devices, including iPads and iPhones (their user agents contain "like Mac OS X"),
// have an Option key on hardware keyboards.
const isAppleDevice = /Mac/.test(navigator.userAgent);

// Groups for displaying hotkeys in the overview page
const groupVideoPlayer = "keyboardControls.groupVideoPlayer";
const groupCuttingView = "keyboardControls.groupCuttingView";
const groupCuttingViewScrubber = "keyboardControls.groupCuttingViewScrubber";
const groupSubtitleList = "keyboardControls.groupSubtitleList";

/**
 * Helper function that rewrites keys based on the OS
 */
export const rewriteKeys = (key: string | IKey) => {
  const newKey = typeof key === "string" ?
    key : key.splitKey ?
      key.key.replaceAll(key.splitKey, "+") : key.key;

  return isAppleDevice ? newKey.replace("Alt", "Option") : newKey;
};

export const getGroupName = (groupName: string): ParseKeys => {
  return match(groupName, {
    videoPlayer: () => groupVideoPlayer,
    cutting: () => groupCuttingView,
    timeline: () => groupCuttingViewScrubber,
    subtitleList: () => groupSubtitleList,
  }) ?? "keyboardControls.defaultGroupName";
};

export interface IKeyMap {
  [property: string]: IKeyGroup;
}

export interface IKeyGroup {
  [property: string]: IKey;
}

export interface IKey {
  name: string;
  key: string;
  options: object,
  splitKey?: string;
}

const hotkeysDefaultOptions: object = {
  preventDefault: true,
  enableOnFormTags: ["slider"],
};

export const subtitleListHotkeysDefaultOptions: object = {
  preventDefault: true,
  enableOnFormTags: ["input", "select", "textarea", "slider"],
};

const cuttingZoomInSplitKey = ";";


export const DEFAULT_KEYMAP: IKeyMap = {
  videoPlayer: {
    play: {
      name: "keyboardControls.videoPlayButton",
      key: "Shift+Alt+Space, Space",
      options: {
        ...hotkeysDefaultOptions,
      },
    },
    previous: {
      name: "video.previousButton",
      key: "Shift+Alt+Left",
      options: {
        ...hotkeysDefaultOptions,
      },
    },
    next: {
      name: "video.nextButton",
      key: "Shift+Alt+Right",
      options: {
        ...hotkeysDefaultOptions,
      },
    },
    preview: {
      name: "video.previewButton",
      key: "Shift+Alt+p",
      options: {
        ...hotkeysDefaultOptions,
      },
    },
  },
  cutting: {
    cut: {
      name: "cuttingActions.cut-button",
      key: "Shift+Alt+c",
      options: {
        ...hotkeysDefaultOptions,
      },
    },
    delete: {
      name: "cuttingActions.delete-button",
      key: "Shift+Alt+d",
      options: {
        ...hotkeysDefaultOptions,
      },
    },
    mergeLeft: {
      name: "cuttingActions.mergeLeft-button",
      key: "Shift+Alt+n",
      options: {
        ...hotkeysDefaultOptions,
      },
    },
    mergeRight: {
      name: "cuttingActions.mergeRight-button",
      key: "Shift+Alt+m",
      options: {
        ...hotkeysDefaultOptions,
      },
    },
    zoomIn: {
      name: "cuttingActions.zoomIn",
      key: "Shift;Alt;r, +",
      splitKey: cuttingZoomInSplitKey,
      options: {
        ...hotkeysDefaultOptions,
        splitKey: cuttingZoomInSplitKey,
        useKey: true,
      },
    },
    zoomOut: {
      name: "cuttingActions.zoomOut",
      key: "Shift+Alt+e, -",
      options: {
        ...hotkeysDefaultOptions,
        useKey: true,
      },
    },
  },
  timeline: {
    left: {
      name: "keyboardControls.scrubberLeft",
      key: "Shift+Alt+j , Left",
      options: {
        preventDefault: true,
      },
    },
    right: {
      name: "keyboardControls.scrubberRight",
      key: "Shift+Alt+l, Right",
      options: {
        preventDefault: true,
      },
    },
    increase: {
      name: "keyboardControls.scrubberIncrease",
      key: "Shift+Alt+i, Up",
      options: {
        preventDefault: true,
      },
    },
    decrease: {
      name: "keyboardControls.scrubberDecrease",
      key: "Shift+Alt+k, Down",
      options: {
        preventDefault: true,
      },
    },
  },
  subtitleList: {
    addAbove: {
      name: "subtitleList.addSegmentAbove",
      key: "Shift+Alt+q",
      options: {},
    },
    addBelow: {
      name: "subtitleList.addSegmentBelow",
      key: "Shift+Alt+a",
      options: {},
    },
    jumpAbove: {
      name: "subtitleList.jumpToSegmentAbove",
      key: "Shift+Alt+w",
      options: {},
    },
    jumpBelow: {
      name: "subtitleList.jumpToSegmentBelow",
      key: "Shift+Alt+s",
      options: {},
    },
    delete: {
      name: "subtitleList.deleteSegment",
      key: "Shift+Alt+d",
      options: {},
    },
    addCue: {
      name: "subtitleList.addCue",
      key: "Shift+Alt+e",
      options: {},
    },
  },
};
