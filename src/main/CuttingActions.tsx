import React from "react";

import {
  BREAKPOINTS,
  MyOptionType,
  basicButtonStyle,
  customIconStyle,
  selectFieldStyle,
  undisplay,
} from "../cssStyles";

import { IconType } from "react-icons";
import { LuScissors, LuChevronLeft, LuChevronRight, LuTrash, LuMoveHorizontal, LuBookmark } from "react-icons/lu";
import TrashRestore from "../img/trash-restore.svg?react";

import { css } from "@emotion/react";

import { useAppDispatch, useAppSelector } from "../redux/store";
import {
  markAsDeletedOrAlive,
  selectDisplayDuration,
  selectDurationInSeconds,
  selectIsCurrentSegmentAlive,
  selectTimelineZoom,
  setTimelineZoom,
  timelineZoomIn,
  timelineZoomOut,
} from "../redux/videoSlice";
import { rewriteKeys } from "../globalKeys";
import { ActionCreatorWithoutPayload, ActionCreatorWithPayload, PayloadActionCreator } from "@reduxjs/toolkit";

import { useTranslation } from "react-i18next";
import { useTheme } from "../themes";
import { ThemedTooltip } from "./Tooltip";
import { Slider } from "@mui/material";
import { useHotkeys } from "react-hotkeys-hook";
import { ProtoButton } from "@opencast/appkit";
import Select, { components, SingleValue } from "react-select";
import { selectKeymap } from "../redux/hotkeySlice";

/**
 * Defines the different actions a user can perform while in cutting mode
 */
const CuttingActions: React.FC<{
  cut?: ActionCreatorWithoutPayload<string>,
  mergeAll?: ActionCreatorWithoutPayload<string>,
  mergeLeft?: ActionCreatorWithoutPayload<string>,
  mergeRight?: ActionCreatorWithoutPayload<string>,
  isDeleteButtonDisabled?: boolean,
  add?: ActionCreatorWithoutPayload<string>,
  deleteByMerge?: ActionCreatorWithoutPayload<string>,
  deleteByMergeAll?: ActionCreatorWithoutPayload<string>,
}> = ({
  cut,
  mergeAll,
  mergeLeft,
  mergeRight,
  isDeleteButtonDisabled = false,
  add,
  deleteByMerge,
  deleteByMergeAll,
}) => {

  const { t } = useTranslation();

  // Init redux variables
  const dispatch = useAppDispatch();

  const keymap = useAppSelector(selectKeymap);

  /**
   * General action callback for cutting actions
   * @param event event triggered by click or button press
   * @param action redux event to dispatch
   * @param ref Pass a reference if the clicked element should lose focus
   */
  const dispatchAction = <T, >(
    action: ActionCreatorWithoutPayload<string> | undefined,
    actionWithPayload?: PayloadActionCreator<T, string>,
    payload?: T,
    ref?: React.RefObject<HTMLButtonElement>,
  ) => {
    if (action) {
      dispatch(action());
    }
    if (actionWithPayload) {
      dispatch(actionWithPayload(payload));
    }

    // Lose focus if clicked by mouse
    if (ref) {
      ref.current?.blur();
    }
  };

  // Maps functions to hotkeys
  useHotkeys(
    keymap.cutting.cut.key,
    () => dispatchAction(cut),
    keymap.cutting.cut.options,
    [cut],
  );
  useHotkeys(
    keymap.cutting.delete.key,
    () => dispatchAction(markAsDeletedOrAlive),
    keymap.cutting.delete.options,
    [markAsDeletedOrAlive],
  );
  useHotkeys(
    keymap.cutting.mergeLeft.key,
    () => dispatchAction(mergeLeft),
    keymap.cutting.mergeLeft.options,
    [mergeLeft],
  );
  useHotkeys(
    keymap.cutting.mergeRight.key,
    () => dispatchAction(mergeRight),
    keymap.cutting.mergeRight.options,
    [mergeRight],
  );
  useHotkeys(
    keymap.cutting.zoomIn.key,
    () => dispatchAction(timelineZoomIn),
    keymap.cutting.zoomIn.options,
    [timelineZoomIn],
  );
  useHotkeys(
    keymap.cutting.zoomOut.key,
    () => dispatchAction(timelineZoomOut),
    keymap.cutting.zoomOut.options,
    [timelineZoomOut],
  );

  const cuttingStyle = css({
    display: "flex",
    flexDirection: "row" as const,
    justifyContent: "center",
    alignItems: "center",

    flexWrap: "wrap",
  });

  const verticalLineStyle = css({
    borderLeft: "2px solid #DDD;",
    height: "32px",
  });

  return (
    <div css={cuttingStyle}>
      { cut &&
        <>
          <CuttingActionsButton Icon={LuScissors}
            actionName={t("cuttingActions.cut-button")}
            actionHandler={dispatchAction}
            action={cut}
            actionWithPayload={undefined}
            payload={undefined}
            tooltip={t("cuttingActions.cut-tooltip", { hotkeyName: rewriteKeys(keymap.cutting.cut.key) })}
            ariaLabelText={t("cuttingActions.cut-tooltip-aria", { hotkeyName: rewriteKeys(keymap.cutting.cut.key) })}
          />
          <div css={verticalLineStyle} />
        </>
      }
      { add &&
        <>
          <CuttingActionsButton Icon={LuBookmark}
            actionName={t("cuttingActions.add-button")}
            actionHandler={dispatchAction}
            action={add}
            actionWithPayload={undefined}
            payload={undefined}
            tooltip={t("cuttingActions.add-tooltip", { hotkeyName: rewriteKeys(keymap.cutting.cut.key) })}
            ariaLabelText={t("cuttingActions.add-tooltip-aria", { hotkeyName: rewriteKeys(keymap.cutting.cut.key) })}
          />
          <div css={verticalLineStyle} />
        </>
      }
      {!isDeleteButtonDisabled &&
        <>
          <MarkAsDeletedButton actionHandler={dispatchAction} action={markAsDeletedOrAlive}
            hotKeyName={rewriteKeys(keymap.cutting.delete.key)}
          />
          <div css={verticalLineStyle} />
        </>
      }
      { deleteByMerge &&
        <>
          <CuttingActionsButton Icon={LuTrash}
            actionName={t("cuttingActions.delete-button")}
            actionHandler={dispatchAction}
            action={deleteByMerge}
            actionWithPayload={undefined}
            payload={undefined}
            tooltip={t("cuttingActions.deleteByMerge-tooltip", { hotkeyName: rewriteKeys(keymap.cutting.delete.key) })}
            ariaLabelText={t("cuttingActions.deleteByMerge-tooltip-aria",
              { hotkeyName: rewriteKeys(keymap.cutting.delete.key) })}
          />
          <div css={verticalLineStyle} />
        </>
      }
      { mergeLeft &&
        <>
          <CuttingActionsButton Icon={LuChevronLeft}
            actionName={t("cuttingActions.mergeLeft-button")}
            actionHandler={dispatchAction}
            action={mergeLeft}
            actionWithPayload={undefined}
            payload={undefined}
            tooltip={t("cuttingActions.mergeLeft-tooltip", { hotkeyName: rewriteKeys(keymap.cutting.mergeLeft.key) })}
            ariaLabelText={
              t("cuttingActions.mergeLeft-tooltip-aria", { hotkeyName: rewriteKeys(keymap.cutting.mergeLeft.key) })
            }
          />
          <div css={verticalLineStyle} />
        </>
      }
      { mergeRight &&
        <>
          <CuttingActionsButton Icon={LuChevronRight}
            actionName={t("cuttingActions.mergeRight-button")}
            actionHandler={dispatchAction}
            action={mergeRight}
            actionWithPayload={undefined}
            payload={undefined}
            tooltip={t("cuttingActions.mergeRight-tooltip", { hotkeyName: rewriteKeys(keymap.cutting.mergeRight.key) })}
            ariaLabelText={
              t("cuttingActions.mergeRight-tooltip-aria", { hotkeyName: rewriteKeys(keymap.cutting.mergeRight.key) })
            }
          />
          <div css={verticalLineStyle} />
        </>
      }
      { mergeAll &&
        <>
          <CuttingActionsButton Icon={LuMoveHorizontal}
            actionName={t("cuttingActions.merge-all-button")}
            actionHandler={dispatchAction}
            action={mergeAll}
            actionWithPayload={undefined}
            payload={undefined}
            tooltip={t("cuttingActions.merge-all-tooltip")}
            ariaLabelText={t("cuttingActions.merge-all-tooltip-aria")}
          />
          <div css={verticalLineStyle} />
        </>
      }
      { deleteByMergeAll &&
        <>
          <CuttingActionsButton Icon={LuMoveHorizontal}
            actionName={t("cuttingActions.delete-all-button")}
            actionHandler={dispatchAction}
            action={deleteByMergeAll}
            actionWithPayload={undefined}
            payload={undefined}
            tooltip={t("cuttingActions.delete-all-tooltip")}
            ariaLabelText={t("cuttingActions.delete-all-tooltip-aria")}
          />
          <div css={verticalLineStyle} />
        </>
      }
      <ZoomSlider actionHandler={dispatchAction}
        tooltip={t("cuttingActions.zoomSlider-tooltip", {
          hotkeyNameIn: rewriteKeys(keymap.cutting.zoomIn),
          hotkeyNameOut: rewriteKeys(keymap.cutting.zoomOut),
        })}
        ariaLabelText={t("cuttingActions.zoomSlider-aria", {
          hotkeyNameIn: rewriteKeys(keymap.cutting.zoomIn),
          hotkeyNameOut: rewriteKeys(keymap.cutting.zoomOut),
        })}
      />
      <ZoomDropdown />
      {/* <CuttingActionsButton Icon={faQuestion} actionName="Reset changes" action={null}
        tooltip="Not implemented"
        ariaLabelText="Reset changes. Not implemented"
      />
      <CuttingActionsButton Icon={faQuestion} actionName="Undo" action={null}
        tooltip="Not implemented"
        ariaLabelText="Undo. Not implemented"
      /> */}
    </div>
  );
};

/**
 * CSS for cutting buttons
 */
const cuttingActionButtonStyle = css({
  padding: "16px",
});

interface cuttingActionsButtonInterface {
  Icon: IconType,
  actionName: string,
  actionHandler: (
    action: ActionCreatorWithoutPayload<string>,
    actionWithPayload: ActionCreatorWithPayload<number, string> | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
    ref?: React.RefObject<HTMLButtonElement>,
  ) => void,
  action: ActionCreatorWithoutPayload<string>,
  actionWithPayload: ActionCreatorWithPayload<number, string> | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  tooltip: string,
  ariaLabelText: string,
}

/**
 * A button representing a single action a user can take while cutting
 * @param param0
 */
export const CuttingActionsButton: React.FC<cuttingActionsButtonInterface> = ({
  Icon,
  actionName,
  actionHandler,
  action,
  actionWithPayload,
  payload,
  tooltip,
  ariaLabelText,
}) => {
  const ref = React.useRef<HTMLButtonElement>(null);
  const theme = useTheme();

  return (
    <ThemedTooltip title={tooltip}>
      <ProtoButton
        {...{ ref }}
        aria-label={ariaLabelText}
        onClick={() => actionHandler(action, actionWithPayload, payload, ref)}
        css={[basicButtonStyle(theme), cuttingActionButtonStyle]}
      >
        <Icon />
        <span css={undisplay(BREAKPOINTS.medium)}>{actionName}</span>
      </ProtoButton>
    </ThemedTooltip>
  );
};

interface markAsDeleteButtonInterface {
  actionHandler: (
    action: ActionCreatorWithoutPayload<string> | undefined,
    actionWithPayload: ActionCreatorWithPayload<number, string> | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
    ref?: React.RefObject<HTMLButtonElement>
  ) => void,
  action: ActionCreatorWithoutPayload<string>,
  hotKeyName: string,
}

/**
 * Button that changes its function based on context
 */
const MarkAsDeletedButton: React.FC<markAsDeleteButtonInterface> = ({
  actionHandler,
  action,
  hotKeyName,
}) => {
  const { t } = useTranslation();
  const isCurrentSegmentAlive = useAppSelector(selectIsCurrentSegmentAlive);
  const ref = React.useRef<HTMLButtonElement>(null);

  const theme = useTheme();

  return (
    <ThemedTooltip title={t("cuttingActions.delete-restore-tooltip", { hotkeyName: hotKeyName })}>
      <ProtoButton
        {...{ ref }}
        aria-label={t("cuttingActions.delete-restore-tooltip-aria", { hotkeyName: hotKeyName })}
        onClick={() => actionHandler(action, undefined, undefined, ref)}
        css={[basicButtonStyle(theme), cuttingActionButtonStyle]}
      >
        {isCurrentSegmentAlive ? <LuTrash /> : <TrashRestore css={customIconStyle} /> }
        <span css={undisplay(BREAKPOINTS.medium)}>
          {isCurrentSegmentAlive ? t("cuttingActions.delete-button") : t("cuttingActions.restore-button")}
        </span>
      </ProtoButton>
    </ThemedTooltip>
  );
};

interface ZoomSliderInterface {
  actionHandler: (
    action: ActionCreatorWithoutPayload<string> | undefined,
    actionWithPayload: ActionCreatorWithPayload<number, string> | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
    ref?: React.RefObject<HTMLButtonElement>,
  ) => void,
  tooltip: string,
  ariaLabelText: string,
}

export const ZoomSlider : React.FC<ZoomSliderInterface> = ({
  actionHandler,
  tooltip,
  ariaLabelText,
}) => {

  const { t } = useTranslation();
  const theme = useTheme();
  const timelineZoom = useAppSelector(selectTimelineZoom);

  // Callback for the zoom slider
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const zoomSliderOnChange = (event: Event, newValue: number | number[]) => {
    actionHandler(undefined, setTimelineZoom, newValue, undefined);
  };

  const zoomStyle = css({
    display: "flex",
    flexDirection: "row",
    paddingLeft: "16px",
    paddingRight: "16px",
    gap: "15px",
    justifyContent: "center",
    alignItems: "center",
  });


  const sliderStyle = css({
    width: "150px",
    "& .MuiSlider-thumb": {
      color: `${theme.slider_thumb_color}`,
      "&:hover, &.Mui-focusVisible, &.Mui-active": {
        boxShadow: `${theme.slider_thumb_shadow}`,
      },
    },
    "& .MuiSlider-rail": {
      color: `${theme.slider_track_color}`,
    },
    "& .MuiSlider-track": {
      color: `${theme.slider_track_color}`,
    },
  });

  return (
    <ThemedTooltip title={tooltip}>
      <div css={zoomStyle}>
        <span>{t("cuttingActions.zoom")}</span>
        <Slider
          css={sliderStyle}
          min={0}
          max={1}
          step={0.01}
          value={timelineZoom}
          onChange={zoomSliderOnChange}
          aria-label={ariaLabelText}
          valueLabelDisplay="off"
          slotProps={
            {
              input: {
                role: "slider",
              },
            }
          }
        />
      </div>
    </ThemedTooltip>
  );
};

const ZoomDropdown : React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const seconds = useAppSelector(selectDisplayDuration);
  const durationInSeconds = useAppSelector(selectDurationInSeconds);

  const options = [
    {
      label: "All",
      value: "0",
    },
  ];
  if (durationInSeconds > 60) {
    options.push({
      label: "10 s",
      value: "1",
    });
  }
  if (durationInSeconds > 60 * 10) {
    options.push({
      label: "1 m",
      value: (1 - (60 / durationInSeconds)).toString(),
    });
  }
  if (durationInSeconds > 300 * 5) {
    options.push({
      label: "5 m",
      value: (1 - (300 / durationInSeconds)).toString(),
    });
  }

  const renderTime = (seconds: number) => {
    const minutes = seconds / 60;
    const hours = seconds / 3600;

    if (hours >= 1) {
      return Math.round(hours) + " h";
    }
    if (minutes >= 1) {
      return Math.round(minutes) + " m";
    }

    return Math.round(seconds) + " s";
  };

  // @ts-expect-error No proper type for children available
  const Control = ({ children, ...props }) => (
    // @ts-expect-error And therefore this complains as well
    <components.Control {...props}>
      <div style={{ paddingLeft: "5px", paddingRight: "5px" }}>
        ~{renderTime(seconds)}
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
      {children[1]}
    </components.Control>
  );

  return (
    <Select<MyOptionType, false>
      name="Zoom Dropdown"
      styles={selectFieldStyle(theme)}
      options={options}
      onChange={(option: SingleValue<MyOptionType>) => {
        if (option) {
          dispatch(setTimelineZoom(parseFloat(option.value)));
        }
      }}
      components={{ Control }}
    />
  );
};

export default CuttingActions;
