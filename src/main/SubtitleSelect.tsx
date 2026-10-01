import React, { ComponentProps, ReactElement, useEffect } from "react";
import { css } from "@emotion/react";
import {
  basicButtonStyle,
  tileButtonStyle,
  disableButtonAnimation,
  subtitleSelectStyle,
} from "../cssStyles";
import { settings, subtitleTags } from "../config";
import { selectSubtitles, setSelectedSubtitleId, setSubtitle } from "../redux/subtitleSlice";
import { useAppDispatch, useAppSelector } from "../redux/store";
import { setIsDisplayEditView } from "../redux/subtitleSlice";
import { LuPlus } from "react-icons/lu";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { selectSubtitlesFromOpencast } from "../redux/videoSlice";
import { useTheme } from "../themes";
import { ThemeProvider } from "@mui/material/styles";
import { Autocomplete, TextField } from "@mui/material";
import { ThemedTooltip } from "./Tooltip";
import { languageCodeToName } from "../util/utilityFunctions";
import { v4 as uuidv4 } from "uuid";
import { TFunction } from "i18next";
import { ProtoButton } from "@opencast/appkit";

/**
 * Displays buttons that allow the user to select the subtitle they want to edit
 */
const SubtitleSelect: React.FC = () => {

  const { t } = useTranslation();
  const subtitlesFromOpencast = useAppSelector(selectSubtitlesFromOpencast); // track objects received from Opencast
  const subtitles = useAppSelector(selectSubtitles);                         // parsed subtitles stored in redux

  const [displaySubtitles, setDisplaySubtitles] = useState<{ id: string, tags: string[], deleted: boolean; }[]>([]);
  const [canBeAddedSubtitles, setCanBeAddedSubtitles] = useState<{ id: string, tags: string[]; }[]>([]);

  // Update the collections for the select and add buttons
  useEffect(() => {
    const languages = { ...settings.subtitles.languages };

    // Get ids of already created tracks or exisiting subtitle tracks
    let existingSubtitles = subtitlesFromOpencast
      .filter(track => !subtitles[track.id])
      .map(track => {
        return { id: track.id, tags: track.tags, deleted: false };
      });

    existingSubtitles = Object.entries(subtitles)
      .map(track => {
        return { id: track[0], tags: track[1].tags, deleted: track[1].deleted };
      })
      .concat(existingSubtitles);

    // Looks for languages in existing subtitles
    // so that those languages don"t show in the addSubtitles dropdown
    const subtitlesFromOpencastLangs = subtitlesFromOpencast
      .reduce((result: { id: string, lang: string; }[], track) => {
        const lang = track.tags.find(e => e.startsWith("lang:"));
        if (lang && !subtitles[track.id]?.deleted) {
          result.push({ id: track.id, lang: lang.split(":")[1].trim() });
        }
        return result;
      }, []);

    const subtitlesLangs = Object.entries(subtitles)
      .reduce((result: { id: string, lang: string; }[], track) => {
        const lang = track[1].tags.find(e => e.startsWith("lang:"));
        if (lang && !subtitles[track[0]]?.deleted) {
          result.push({ id: track[0], lang: lang.split(":")[1].trim() });
        }
        return result;
      }, []);

    const existingLangs = subtitlesFromOpencastLangs.concat(subtitlesLangs);

    // Create list of subtitles that can be added
    const canBeAddedSubtitles = Object.entries(languages)
      .reduce((result: string[][], language) => {
        if (!existingLangs.find(e => e.lang === language[1]["lang"])) {
          result.push(convertTags(language[1]));
        } else {
          delete languages[language[0]];
        }
        return result;
      }, [])
      .map(tags => { return { id: uuidv4(), tags: tags }; });

    setDisplaySubtitles(existingSubtitles);
    setCanBeAddedSubtitles(canBeAddedSubtitles);
  }, [subtitlesFromOpencast, subtitles, t]);

  // Converts tags from the config file format to opencast format
  const convertTags = (tags: subtitleTags) => {
    return Object.entries(tags)
      .map(tag => `${tag[0]}:${tag[1]}`)
      .concat();
  };

  const subtitleSelectStyle = css({
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "30px",
  });

  const renderButtons = () => {
    const buttons: ReactElement<ComponentProps<typeof SubtitleSelectButton>>[] = [];
    if (settings.subtitles.languages === undefined) {
      return buttons;
    }

    for (const subtitle of displaySubtitles) {
      if (subtitle.deleted) {
        continue;
      }
      let lang = subtitle.tags.find(e => e.startsWith("lang:"));
      lang = lang ? lang.split(":")[1].trim() : undefined;
      const icon = lang ? ((settings.subtitles || {}).icons || {})[lang] : undefined;

      buttons.push(
        <SubtitleSelectButton
          id={subtitle.id}
          key={subtitle.id}
          title={generateButtonTitle(subtitle.tags, t)}
          icon={icon}
        />,
      );
    }

    return buttons.sort((dat1, dat2) => dat1.props["title"].localeCompare(dat2.props["title"]));
  };

  return (
    <div css={subtitleSelectStyle}>
      {renderButtons()}
      {canBeAddedSubtitles.length > 0 &&
        <SubtitleAddButton subtitlesForDropdown={canBeAddedSubtitles} />
      }
    </div>
  );
};

/**
 * A button that sets the subtitle that should be edited
 */
const SubtitleSelectButton: React.FC<{
  id: string,
  title: string,
  icon: string | undefined,
}> = ({
  id,
  title,
  icon,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const onClickHandler = () => {
    dispatch(setIsDisplayEditView(true));
    dispatch(setSelectedSubtitleId(id));
  };

  const flagStyle = css({
    fontSize: "2.5em",
    overflow: "hidden",

    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: `${theme.background_finish_menu_icon}`,
    color: `${theme.text}`,
    borderRadius: "50%",
    width: "90px",
    height: "90px",
  });

  const titleStyle = css({
    overflow: "hidden",
    textOverflow: "ellipsis",
    minWidth: 0,
  });

  return (
    <ThemedTooltip title={t("subtitles.selectSubtitleButton-tooltip", { title: title })}>
      <ProtoButton
        aria-label={t("subtitles.selectSubtitleButton-tooltip-aria", { title: title })}
        onClick={onClickHandler}
        css={[basicButtonStyle(theme), tileButtonStyle(theme)]}
      >
        {icon && <div css={flagStyle}>{icon}</div>}
        <div css={titleStyle}>{title ?? t("subtitles.generic") + " " + id}</div>
      </ProtoButton>
    </ThemedTooltip>
  );
};

/**
 * Actually not a button, but a container for a form that allows creating new subtitles for editing
 */
const SubtitleAddButton: React.FC<{
  subtitlesForDropdown: { id: string, tags: string[]; }[];
}> = ({
  subtitlesForDropdown,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const dispatch = useAppDispatch();

  const [isPlusDisplay, setIsPlusDisplay] = useState(true);
  const [subtitleId, setSubtitleId] = useState<string | null>(null);

  // Parse language data into a format the dropdown understands
  const selectData = () => {
    const data = [];
    for (const subtitle of subtitlesForDropdown) {
      const lang = generateButtonTitle(subtitle.tags, t);
      data.push({ label: lang ?? t("subtitles.generic") + " " + subtitle.id, value: subtitle.id });
    }
    data.sort((dat1, dat2) => dat1.label.localeCompare(dat2.label));
    return data;
  };

  const onSubmit = () => {
    if (!subtitleId) { return; }
    // Create new subtitle for the given language
    const id = subtitleId;
    const relatedSubtitle = subtitlesForDropdown.find(tag => tag.id === id);
    const tags = relatedSubtitle ? relatedSubtitle.tags : [];
    dispatch(setSubtitle({ identifier: id, subtitles: { cues: [], tags: tags, deleted: false } }));

    // Reset
    setIsPlusDisplay(true);

    // Move to editor view
    dispatch(setIsDisplayEditView(true));
    dispatch(setSelectedSubtitleId(id));
  };

  const plusIconStyle = css({
    display: isPlusDisplay ? "flex" : "none",
  });

  const subtitleAddFormStyle = css({
    display: !isPlusDisplay ? "flex" : "none",
    flexDirection: "column" as const,
    gap: "30px",
    width: "80%",
    padding: "20px",
  });

  const createButtonStyle = css({
    padding: "10px 5px",
    width: "100%",
    boxShadow: "",
    border: `1px solid ${theme.text}`,
    backgroundColor: `${theme.background}`,
    color: `${theme.text}`,

    "&[disabled]": {
      opacity: "0.6",
      cursor: "not-allowed",
    },
  });

  return (
    <ThemedTooltip title={isPlusDisplay ? t("subtitles.createSubtitleButton-tooltip") : ""}>
      <ProtoButton
        aria-label={isPlusDisplay ?
          t("subtitles.createSubtitleButton-tooltip") : t("subtitles.createSubtitleButton-clicked-tooltip-aria")}
        onClick={() => setIsPlusDisplay(false)}
        css={[basicButtonStyle(theme), tileButtonStyle(theme), !isPlusDisplay && disableButtonAnimation]}
      >
        <LuPlus css={[plusIconStyle, { fontSize: 42 }]} />

        <div css={subtitleAddFormStyle}>
          <ThemeProvider theme={subtitleSelectStyle(theme)}>
            <Autocomplete<{label: string, value: string}>
              css={{ backgroundColor: `${theme.background}` }}
              options={selectData()}
              getOptionLabel={option => option.label}
              renderInput={params => <TextField {...params} label={t("subtitles.createSubtitleDropdown-label")} />}
              onChange={(_event: React.SyntheticEvent, newValue: {label: string, value: string} | null) => {
                setSubtitleId(newValue ? newValue.value : null);
              }}
              // @ts-expect-error: Weird typing
              disableClearable
            >
            </Autocomplete>
          </ThemeProvider>

          <ThemedTooltip
            title={subtitleId ?
              t("subtitles.createSubtitleButton-createButton-disabled-tooltip") :
              t("subtitles.createSubtitleButton-createButton-tooltip")
            }
          >
            <span>
              <button css={[basicButtonStyle(theme), createButtonStyle]}
                type="submit"
                aria-label={t("subtitles.createSubtitleButton-createButton-tooltip")}
                disabled={!subtitleId}
                onClick={onSubmit}
              >
                {t("subtitles.createSubtitleButton-createButton")}
              </button>
            </span>
          </ThemedTooltip>
        </div>
      </ProtoButton>
    </ThemedTooltip>
  );
};

/**
 * Generates a title for the buttons from the tags
 */
export function generateButtonTitle(tags: string[], t: TFunction<"translation", undefined>) {
  let lang = tags.find(e => e.startsWith("lang:"));
  lang = lang ? lang.split(":")[1].trim() : undefined;
  lang = languageCodeToName(lang?.trim()) ?? lang;

  let cc = "";
  const type = tags.find(e => e.startsWith("type:"));
  const isCC = type ? type.split(":")[1].trim() === "closed-caption" : undefined;
  if (isCC) {
    cc = "[CC]";
  }

  let autoGen = "";
  const genType = tags.find(e => e.startsWith("generator-type:"));
  const isAutoGen = genType ? genType.split(":")[1].trim() === "auto" : undefined;
  if (isAutoGen) {
    autoGen = "(" + t("subtitles.autoGenerated") + ")";
  }

  return cc + " " + lang + " " + autoGen;
}

export default SubtitleSelect;
