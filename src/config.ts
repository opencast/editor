/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/**
 * Loads config values from
 * - a settings file
 * - GET parameters
 * and exports them.
 * Code was largely adapted from https://github.com/elan-ev/opencast-studio/blob/master/src/settings.js (January 11th, 2021)
 *
 * Also does some global hotkey configuration
 */
import { parse } from "smol-toml";
import deepmerge from "deepmerge";
import { Flavor } from "./types";

/**
 * Local constants
 */
const CONTEXT_SETTINGS_FILE = "editor-settings.toml";

// Sources that values can come from.
const SRC_SERVER = "src-server";
const SRC_URL = "src-url";

/**
 * Possible configuration values for a metadata catalog field
 */
export interface configureFieldsAttributes {
  show: boolean,
  readonly: boolean,
}

export interface subtitleTags {
  lang: string,
  "auto-generated": string,
  "auto-generator": string,
  type: string,
}

/**
 * Settings interface
 */
interface iSettings {
  id: string | undefined,
  allowedCallbackPrefixes: string[],
  callbackUrl: string | undefined,
  callbackSystem: string | undefined,
  opencast: {
    url: string,
    name: string | undefined,
    password: string | undefined,
    local: boolean,
  },
  metadata: {
    show: boolean,
    configureFields: { [key: string]: { [key: string]: configureFieldsAttributes; }; } | undefined,
  },
  trackSelection: {
    show: boolean,
    atLeastOneVideo: boolean,
    atMostTwoVideos: boolean,
  },
  thumbnail: {
    show: boolean,
    simpleMode: boolean,
  },
  subtitles: {
    show: boolean,
    mainFlavor: string,
    languages: { [key: string]: subtitleTags; } | undefined,
    icons: { [key: string]: string; } | undefined,
    defaultVideoFlavor: Flavor | undefined,
    stopOnTyping: boolean,
  };
  chapters: {
    show: boolean,
    mainFlavor: string,
    defaultVideoFlavor: Flavor | undefined,
  };
    comments: {
      show: boolean,
    },
}

/**
 * Settings objects
 * defaultSettings: Sets default values
 * configFileSettings: contains values from the config file
 * urlParameterSettings: contains values from GET parameters
 * settings: contains the combined values from all other setting objects
 */
const defaultSettings: iSettings = {
  id: undefined,
  allowedCallbackPrefixes: [],
  callbackUrl: undefined,
  callbackSystem: undefined,
  opencast: {
    url: window.location.origin,
    name: undefined,
    password: undefined,
    local: true,
  },
  metadata: {
    show: true,
    configureFields: undefined,
  },
  trackSelection: {
    show: true,
    atLeastOneVideo: true,
    atMostTwoVideos: true,
  },
  thumbnail: {
    show: false,
    simpleMode: false,
  },
  subtitles: {
    show: false,
    mainFlavor: "captions",
    languages: {},
    icons: undefined,
    defaultVideoFlavor: undefined,
    stopOnTyping: false,
  },
  chapters: {
    show: false,
    mainFlavor: "chapters",
    defaultVideoFlavor: undefined,
  },
  comments: {
    show: false,
  },
};
let configFileSettings: iSettings;
let urlParameterSettings: iSettings;
export let settings: iSettings;

/**
 * Entry point. Loads values from settings into the exported variables
 * Priorities are:
 * 1. GET Parameters
 * 2. Settings file
 * 3. Default values
 */
export const init = async () => {

  // Get color scheme from local storage, otherwise set auto scheme based on preference
  let scheme = window.localStorage.getItem("colorScheme");
  if (scheme === null || !["light", "dark", "light-high-contrast", "dark-high-contrast"].includes(scheme)) {
    const lightness = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const contrast = window.matchMedia("(prefers-contrast: more)").matches ? "-high-contrast" : "";
    scheme = `${lightness}${contrast}`;
  }
  document.documentElement.dataset.colorScheme = scheme;

  // Get settings from config file
  await loadContextSettings().then(result => {
    configFileSettings = validate(result, false, SRC_SERVER, "from server settings file");
  });

  // Get settings from URL query.
  const urlParams = new URLSearchParams(window.location.search);

  type UrlSettings = {
    [key: string]: string | UrlSettings;
  }

  const rawUrlSettings: UrlSettings = {};
  urlParams.forEach((value, key) => {
    // Create empty objects for full path (if the key contains ".") and set
    // the value at the end.
    let obj: { [k: string]: any; } = rawUrlSettings;
    if (key.startsWith("opencast.") || key === "allowedCallbackPrefixes") {
      return;
    }

    // Fallback for old parameter
    if (key === "mediaPackageId") {
      key = "id";
    }

    const segments = key.split(".");
    segments.slice(0, -1).forEach(segment => {
      if (!(segment in obj)) {
        obj[segment] = {};
      }
      obj = obj[segment];
    });
    obj[segments[segments.length - 1]] = value;
  });

  urlParameterSettings = validate(rawUrlSettings, true, SRC_URL, "given as URL GET parameter");

  // Combine results
  settings = merge.all([defaultSettings, configFileSettings, urlParameterSettings]) as iSettings;

  // Prepare local setting to avoid complicated checks later
  settings.opencast.local = settings.opencast.local && settings.opencast.url === window.location.origin;

  // Prevent malicious callback urls
  settings.callbackUrl = settings.allowedCallbackPrefixes.some(
    p => settings.callbackUrl?.startsWith(p),
  ) ? settings.callbackUrl : undefined;
};

/**
 * Attempts to load toml settings file
 */
const loadContextSettings = async () => {

  // Try to retrieve the context settings.
  let basepath = import.meta.env.BASE_URL || "/";
  if (!basepath.endsWith("/")) {
    basepath += "/";
  }

  // Construct path to settings file. If the `VITE_APP_SETTINGS_PATH` is
  // given and starts with "/", it is interpreted as absolute path from the
  // server root.
  const settingsPath: string = import.meta.env.VITE_APP_SETTINGS_PATH || CONTEXT_SETTINGS_FILE;
  const base = settingsPath.startsWith("/") ? "" : basepath;
  const url = new URL(base.concat(settingsPath), window.location.origin);
  let response;
  try {
    response = await fetch(url);
  } catch (e) {
    console.warn(`Could not access "${settingsPath}" due to network error!`, e || "");
    return null;
  }

  if (response.status === 404) {
    // If the settings file was not found, we silently ignore the error. We
    // expect many installation to provide this file.
    console.debug(`"${settingsPath}" returned 404: ignoring`);
    return null;
  } else if (!response.ok) {
    console.error(
      `Fetching "${settingsPath}" failed: ${response.status} ${response.statusText}`,
    );
    return null;
  }

  if (response.headers.get("Content-Type")?.startsWith("text/html")) {
    console.warn(`"${settingsPath}" request has "Content-Type: text/html" -> ignoring...`);
    return null;
  }

  try {
    return parse(await response.text());
  } catch (e) {
    console.error(`Could not parse "${settingsPath}" as TOML: `, e);
    throw new SyntaxError(`Could not parse "${settingsPath}" as TOML: ${String(e)}`);
  }

};

/**
 * Validate the given `obj` with the global settings `SCHEMA`. If `allowParse`
 * is true, string values are attempted to parse into the expected type. `src`
 * must be one of `SRC_SERVER`, `SRC_URL` or `SRC_LOCAL_STORAGE`.
 * `srcDescription` is just a string for error messages specifying where `obj`
 * comes from.
 * */
const validate = (obj: Record<string, any> | null, allowParse: boolean, src: string, sourceDescription: string) => {
  // Validates `obj` with `schema`. `path` is the current path used for error
  // messages.
  const validate = (schema: any, obj: Record<string, any> | null, path: string) => {
    if (typeof schema === "function") {
      return validateValue(schema, obj, path);
    } else {
      return validateObj(schema, obj, path);
    }
  };

  // Validate a settings value with a validation function. Returns the final
  // value of the setting or `null` if it should be ignored.
  const validateValue = (
    validation: (arg0: any, arg1: boolean, arg2: string) => any,
    value: Record<string, any> | null,
    path: string,
  ) => {
    try {
      const newValue = validation(value, allowParse, src);
      return newValue === undefined ? value : newValue;
    } catch (e) {
      console.warn(
        `Validation of setting "${path}" (${sourceDescription}) with value "${JSON.stringify(value)}" failed: `
        + `${String(e)}. Ignoring.`,
      );
      return null;
    }
  };

  // Validate a settings object/namespace. `schema` and `obj` need to be
  // objects.
  const validateObj = (schema: any, obj: Record<string, any> | null, path: string) => {
    // We iterate through all keys of the given settings object, checking if
    // each key is valid and recursively validating the value of that key.
    const out: { [k: string]: any; } = {};
    for (const key in obj) {
      const newPath = path ? `${path}.${key}` : key;
      if (key in schema) {
        const value = validate(schema[key], obj[key], newPath);

        // If `null` is returned, the validation failed and we ignore this
        // value.
        if (value !== null) {
          out[key] = value;
        }
      } else {
        console.warn(
          `"${newPath}" (${sourceDescription}) is not a valid settings key. Ignoring.`,
        );
      }
    }

    return out;
  };

  return validate(SCHEMA, obj, "");
};


// Validation functions for different types.
const types = {
  "string": (v: string, _allowParse: any) => {
    if (typeof v !== "string") {
      throw new Error("is not a string, but should be");
    }
  },
  "boolean": (v: string, allowParse: any) => {
    if (typeof v === "boolean") {
      return;
    }

    if (allowParse) {
      if (v === "true") {
        return true;
      }
      if (v === "false") {
        return false;
      }
      throw new Error("cant be parsed as boolean");
    } else {
      throw new Error("is not a boolean");
    }
  },
  "array": (v: string | [], _allowParse: any) => {
    if (!Array.isArray(v)) {
      throw new Error("is not an array, but should be");
    }
    // eslint-disable-next-line @typescript-eslint/no-for-in-array
    for (const entry in v) {
      if (typeof entry !== "string") {
        throw new Error("is not a string, but should be");
      }
    }
  },
  "map": (v: { [k: string]: string }, _allowParse: any) => {
    for (const key in v) {
      if (typeof key !== "string") {
        throw new Error("is not a string, but should be");
      }
      if (typeof v[key] !== "string") {
        throw new Error("is not a string, but should be");
      }
    }
  },
  "objectsWithinObjects": (v: any, _allowParse: any) => {
    for (const catalogName in v) {
      if (typeof catalogName !== "string") {
        throw new Error("is not a string, but should be");
      }
      for (const fieldName in v[catalogName]) {
        if (typeof fieldName !== "string") {
          throw new Error("is not a string, but should be");
        }
        for (const attributeName in v[catalogName][fieldName]) {
          if (typeof attributeName !== "string") {
            throw new Error("is not a string, but should be");
          }
          if (attributeName === "show" && typeof v[catalogName][fieldName][attributeName] !== "boolean") {
            throw new Error("is not a boolean");
          }
          if (attributeName === "readonly" && typeof v[catalogName][fieldName][attributeName] !== "boolean") {
            throw new Error("is not a boolean");
          }
        }
      }
    }
  },
};

// Defines all potential settings and their types.
//
// Each setting value has to be a validation function. Such a function takes two
// arguments: the input value `v` and the boolean `allowParse` which specifies
// whether the input might be parsed into the correct type (this is only `true`
// for GET parameters). The validation should throw an error if the input value
// is not valid for the setting. If the function returns `undefined`, the input
// value is valid and used. If the validator returns a different value, the
// input is valid, but is replaced by that new value. See the `types` object
// above for some examples.
const SCHEMA = {
  id: types.string,
  allowedCallbackPrefixes: types.array,
  callbackUrl: types.string,
  callbackSystem: types.string,
  opencast: {
    url: types.string,
    name: types.string,
    password: types.string,
  },
  metadata: {
    show: types.boolean,
    configureFields: types.objectsWithinObjects,
  },
  trackSelection: {
    show: types.boolean,
    atLeastOneVideo: types.boolean,
    atMostTwoVideos: types.boolean,
  },
  subtitles: {
    show: types.boolean,
    mainFlavor: types.string,
    languages: types.objectsWithinObjects,
    icons: types.map,
    defaultVideoFlavor: types.map,
    stopOnTyping: types.boolean,
  },
  chapters: {
    show: types.boolean,
    mainFlavor: types.string,
    defaultVideoFlavor: types.map,
  },
  thumbnail: {
    show: types.boolean,
    simpleMode: types.boolean,
  },
  comments: {
    show: types.boolean,
  },
};

const merge = (a: iSettings, b: iSettings) => {
  return deepmerge(a, b, { arrayMerge });
};
merge.all = (array: object[]) => deepmerge.all(array, { arrayMerge });
const arrayMerge = (_destinationArray: any, sourceArray: any, _options: any) => sourceArray;
