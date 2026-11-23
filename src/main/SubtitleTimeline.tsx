import React, { useEffect, useRef, useState } from "react";
import { css } from "@emotion/react";
import { SegmentsList as CuttingSegmentsList, Scrubber, Waveforms, useZoomableTimeline } from "./Timeline";
import { ZoomDropdown, ZoomSlider } from "./CuttingActions";
import {
  addCueAtIndex,
  selectCurrentlyAt,
  selectIsPlaying,
  selectSelectedSubtitleById,
  selectSelectedSubtitleId,
  setClickTriggered,
  setCueAtIndex,
  setCurrentlyAt,
  setFocusSegmentId,
  setFocusSegmentTriggered,
  setFocusSegmentTriggered2,
  setIsPlaying,
} from "../redux/subtitleSlice";
import { useAppDispatch, useAppSelector } from "../redux/store";
import {
  moveCut,
  selectActiveSegmentIndex,
  selectDuration,
  selectSegments,
  timelineZoomIn,
  timelineZoomOut,
} from "../redux/videoSlice";
import Draggable, { DraggableEventHandler } from "react-draggable";
import { SubtitleCue } from "../types";
import { Resizable, ResizeCallbackData } from "react-resizable";
import "react-resizable/css/styles.css";
import ScrollContainer, { ScrollEvent } from "react-indiana-drag-scroll";
import { useTheme } from "../themes";
import { useTranslation } from "react-i18next";
import { useHotkeys } from "react-hotkeys-hook";
import { shallowEqual } from "react-redux";
import TimelineStamps from "./TimelineStamps";
import { rewriteKeys } from "../globalKeys";
import { selectKeymap } from "../redux/hotkeySlice";
import { ActionCreatorWithoutPayload, ActionCreatorWithPayload } from "@reduxjs/toolkit";

/**
 * Copy-paste of the timeline in Video.tsx, so that we can make some small adjustments,
 * like adding in a list of subtitle segments
 */
const SubtitleTimeline: React.FC = () => {

  const { t } = useTranslation();

  // Init redux variables
  const dispatch = useAppDispatch();
  const keymap = useAppSelector(selectKeymap);
  const currentlyAt = useAppSelector(selectCurrentlyAt);
  const subtitleId = useAppSelector(selectSelectedSubtitleId, shallowEqual);

  // Height of the time codes ruler that overlays the top of the scrollable timeline area
  const timelineStampsHeight = 20;
  // Height of the subtitle segments row and of the waveform below it
  const subtitleSegmentsHeight = 80;
  const waveformHeight = 120;
  // Height of the scrollable timeline area. Also used to size the scrubber
  const timelineHeight = timelineStampsHeight + subtitleSegmentsHeight + waveformHeight;

  const scrubberRef = useRef<HTMLDivElement | null>(null);
  const {
    duration, ref, width, scrollContainerRef, scrollContainerWidth,
    scrollLeft, visibleWidth, zoomedWidth,
    updateScrollMetrics, updateScroll, setCurrentlyAtToClick, scrollByOwnWidth,
  } = useZoomableTimeline(currentlyAt, setClickTriggered, setCurrentlyAt);

  // Callback for the zoom slider/dropdown, dispatching the zoom action to redux
  const dispatchZoomAction = (
    action: ActionCreatorWithoutPayload<string> | undefined,
    actionWithPayload: ActionCreatorWithPayload<number, string> | undefined,
    payload: number,
  ) => {
    if (action) {
      dispatch(action());
    }
    if (actionWithPayload) {
      dispatch(actionWithPayload(payload));
    }
  };

  // Hotkeys for zooming, shared with the Cutting/Chapter timelines
  useHotkeys(
    keymap.cutting.zoomIn.key,
    () => dispatch(timelineZoomIn()),
    keymap.cutting.zoomIn.options,
    [],
  );
  useHotkeys(
    keymap.cutting.zoomOut.key,
    () => dispatch(timelineZoomOut()),
    keymap.cutting.zoomOut.options,
    [],
  );

  const timelineStyle = css({
    position: "relative",     // Need to set position for Draggable bounds to work
    height: timelineHeight + "px",
    width: `${zoomedWidth}px`,    // Width modified by zoom
  });

  // Callback for adding subtitle segment by hotkey
  const addCue = (time: number) => {
    dispatch(addCueAtIndex({
      identifier: subtitleId,
      cueIndex: -1,
      text: "",
      startTime: time,
      endTime: time + 5000,
    }));
  };

  useHotkeys(
    keymap.subtitleList.addCue.key,
    () => addCue(currentlyAt),
    keymap.subtitleList.addCue.options,
    [currentlyAt],
  );

  // Callback for the scroll container
  const onEndScroll = (e: ScrollEvent) => {
    updateScroll();

    // Blur active element after scrolling, to ensure hotkeys are working
    // This is a little hack to work around focus getting stuck in textarea elements from the subtitle list
    if (!e.external) {
      try {
        (document.activeElement as HTMLElement).blur();
      } catch (_e) {
        console.error("Tried to blur active element, but active element cannot be blurred.");
      }
    }
  };

  const subtitleTimelineStyle = css({
    position: "relative",
    width: "100%",
    paddingBottom: "15px",
  });

  return (
    <div css={subtitleTimelineStyle}>
      {/* Time codes above the timeline. Overlays the top of the scrollable container, like the scrubber does */}
      <div css={css({ position: "absolute" })}>
        <TimelineStamps
          durationMs={duration}
          zoomedWidth={zoomedWidth}
          scrollLeft={scrollLeft}
          visibleWidth={visibleWidth}
          height={timelineStampsHeight}
        />
      </div>
      {/* Scrollable timeline container. Has width of parent*/}
      <ScrollContainer innerRef={scrollContainerRef}
        css={{ overflowY: "hidden", width: "100%", height: `${timelineHeight}px` }}
        vertical={false}
        horizontal={true}
        onEndScroll={onEndScroll}
        onScroll={updateScrollMetrics}
        // dom elements with this id in the container will not trigger scrolling when dragged
        ignoreElements={".prevent-drag-scroll"}
        hideScrollbars={false}            // ScrollContainer hides scrollbars per default
      >
        {/* Container. Overflows. Width based on parent times zoom level*/}
        <div ref={ref} css={timelineStyle} onMouseDown={e => setCurrentlyAtToClick(e)}>
          <Scrubber
            ref={scrubberRef}
            timelineWidth={width}
            timelineHeight={timelineHeight}
            scrollContainerWidth={scrollContainerWidth}
            scrollLeft={scrollContainerRef.current?.scrollLeft ?? 0}
            scrollTheContainerbyOwnWidth={scrollByOwnWidth}
            selectCurrentlyAt={selectCurrentlyAt}
            selectIsPlaying={selectIsPlaying}
            setCurrentlyAt={setCurrentlyAt}
            setIsPlaying={setIsPlaying}
          />
          {/* Pushed down below the time codes, which overlay this content from above */}
          <div css={{ position: "relative", top: `${timelineStampsHeight}px` }}>
            <TimelineSubtitleSegmentsList timelineWidth={width} />
            <div css={{ position: "relative", height: `${waveformHeight}px` }} >
              <Waveforms timelineHeight={waveformHeight} />
              <CuttingSegmentsList
                timelineWidth={width}
                timelineHeight={waveformHeight}
                styleByActiveSegment={false}
                tabable={false}
                selectSegments={selectSegments}
                selectActiveSegmentIndex={selectActiveSegmentIndex}
                moveCut={moveCut}
              />
            </div>
          </div>
        </div>
      </ScrollContainer>
      <div css={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: "10px" }}>
        <ZoomSlider actionHandler={dispatchZoomAction}
          tooltip={t("cuttingActions.zoomSlider-tooltip", {
            hotkeyNameIn: rewriteKeys(keymap.cutting.zoomIn.key),
            hotkeyNameOut: rewriteKeys(keymap.cutting.zoomOut.key),
          })}
          ariaLabelText={t("cuttingActions.zoomSlider-aria", {
            hotkeyNameIn: rewriteKeys(keymap.cutting.zoomIn.key),
            hotkeyNameOut: rewriteKeys(keymap.cutting.zoomOut.key),
          })}
        />
        <ZoomDropdown />
      </div>
    </div>



  // <div className="layoutRoot absoluteLayout">
  //   {/* <Example /> */}
  //   <Example2 />
  //   {/* <TimelineSubtitleSegment
  //   timelineWidth={width}
  //   cue={{id: "42", text:"HI", startTime: 1000, endTime: 5000, tree:{children: [{type: "", value: ""}]}}}
  //   index={0}
  //   height={80}
  //   /> */}
  // </div>
  );
};


/**
 * Displays subtitle segments as a row of boxes
 */
const TimelineSubtitleSegmentsList: React.FC<{ timelineWidth: number; }> = ({ timelineWidth }) => {

  const arbitraryHeight = 80;
  const subtitle = useAppSelector(selectSelectedSubtitleById);

  const segmentsListStyle = css({
    position: "relative",
    width: "100%",
    height: `${arbitraryHeight}px`,
    overflow: "hidden",
  });

  return (
    <div css={segmentsListStyle}>
      {subtitle?.cues?.map((item, i) => {
        return (
          <TimelineSubtitleSegment
            timelineWidth={timelineWidth}
            cue={item}
            height={arbitraryHeight}
            key={item.idInternal}
            index={i}
          />
        );
      })}
    </div>
  );
};

/**
 * A single segments for the timeline subtitle segments list
 */
const TimelineSubtitleSegment: React.FC<{
  timelineWidth: number,
  cue: SubtitleCue,
  index: number,
  height: number;
}> = React.memo(props => {

  // Redux
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector(selectSelectedSubtitleId);
  const duration = useAppSelector(selectDuration);

  // Dimensions and position offsets in px. Required for resizing
  const [absoluteWidth, setAbsoluteWidth] = useState(0);
  const [absoluteHeight, setAbsoluteHeight] = useState(0);
  const [absoluteLeft, setAbsoluteLeft] = useState(0);
  const [absoluteTop, setAbsoluteTop] = useState(0);

  const [controlledPosition, setControlledPosition] = useState({ x: 0, y: 0 });
  const [isGrabbed, setIsGrabbed] = useState(false);
  const nodeRef = React.useRef(null); // For supressing "ReactDOM.findDOMNode() is deprecated" warning

  const theme = useTheme();
  // Reposition scrubber when the current x position was changed externally
  useEffect(() => {
    setControlledPosition({ x: (props.cue.startTime / duration) * (props.timelineWidth), y: 0 });
  }, [props.cue.startTime, duration, props.timelineWidth]);

  // Set width and reset any resizing that may have happened meanwhile
  useEffect(() => {
    setAbsoluteWidth(((props.cue.endTime - props.cue.startTime) / duration) * props.timelineWidth);
    setAbsoluteHeight(props.height);
    setAbsoluteLeft(0);
    setAbsoluteTop(0);
  }, [duration, props.cue.endTime, props.cue.startTime, props.height, props.timelineWidth]);

  // Check for impossible timestamps and update state in redux
  const dispatchNewTimes = (newStartTime: number, newEndTime: number) => {
    if (newStartTime < 0) {
      newStartTime = 0;
    }
    if (newEndTime < newStartTime) {
      newEndTime = newStartTime;
    }

    dispatch(setCueAtIndex({
      identifier: selectedId,
      cueIndex: props.index,
      newCue: {
        id: props.cue.id,
        idInternal: props.cue.idInternal,
        text: props.cue.text,
        startTime: newStartTime,
        endTime: newEndTime,
        tree: props.cue.tree,
      },
    }));
  };

  // Resizable does not support resizing in the west/north directions out of the box,
  // so additional calculations are necessary.
  // Adapted from Resizable example code
  const onResizeAbsolute = (_event: React.SyntheticEvent, data: ResizeCallbackData): void => {
    const { size, handle } = data;
    // Possible TODO: Find a way to stop resizing a segment beyond 0ms here instead of later
    let newLeft = absoluteLeft;

    if (handle[handle.length - 1] === "w") {
      newLeft -= size.width - absoluteWidth;
    }

    setAbsoluteWidth(size.width);
    setAbsoluteLeft(newLeft);
  };

  // Update redux state based on the resize
  const onResizeStop = (_event: React.SyntheticEvent, data: ResizeCallbackData): void => {
    const { handle } = data;
    // Calc new width, factoring in offset
    const newWidth = absoluteWidth;

    const newSegmentDuration = (newWidth / props.timelineWidth) * duration;
    const timeDiff = (props.cue.endTime - props.cue.startTime) - newSegmentDuration;

    let newStartTime = props.cue.startTime;
    let newEndTime = props.cue.endTime;
    // if handle === left, update startTime
    if (handle === "w") {
      newStartTime = props.cue.startTime + timeDiff;
    }
    // if handle === right, update endTime
    if (handle === "e") {
      newEndTime = props.cue.endTime - timeDiff;
    }

    dispatchNewTimes(newStartTime, newEndTime);

    // Reset resizing
    // Required when resizing beyond 0 multiple times,
    // because the time does not change, so the reset in useEffect does not trigger
    setAbsoluteWidth(((props.cue.endTime - props.cue.startTime) / duration) * props.timelineWidth);
    setAbsoluteHeight(props.height);
    setAbsoluteLeft(0);
    setAbsoluteTop(0);
  };

  const onStartDrag: DraggableEventHandler = _e => {
    setIsGrabbed(true);
  };

  const onStopDrag: DraggableEventHandler = (_e, position) => {
    // Update position and thereby start/end times in redux
    const { x } = position;
    dispatchNewTimes(
      (x / props.timelineWidth) * (duration),
      (x / props.timelineWidth) * (duration) + (props.cue.endTime - props.cue.startTime),
    );

    setIsGrabbed(false);
  };

  const onClick = () => {
    // Scroll to segment start
    dispatch(setCurrentlyAt(props.cue.startTime));

    // Inform list view which segment was clicked
    dispatch(setFocusSegmentTriggered(true));
    dispatch(setFocusSegmentId(props.cue.idInternal));
    dispatch(setFocusSegmentTriggered2(true));
  };

  const segmentStyle = css({
    position: "absolute",

    // Apply resizable calculations
    width: absoluteWidth,
    height: absoluteHeight,
    margin: `${absoluteTop}px 0px 0px ${absoluteLeft}px`,

    background: `${theme.subtitle_segment_bg}`,
    border: `${theme.subtitle_segment_border}`,
    borderRadius: "5px",
    color: `${theme.subtitle_segment_text}`,
    zIndex: 1,

    cursor: isGrabbed ? "grabbing" : "grab",

    // Center text
    display: "flex",
    alignItems: "center",
  });

  const textStyle = css({
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    padding: "8px",
    color: `${theme.subtitle_segment_text}`,
  });

  return (
    <Draggable
      onStart={onStartDrag}
      onStop={onStopDrag}
      onMouseDown={e => e.stopPropagation()}  // Prevent timeline click from also jumping the scrubber here
      defaultPosition={{ x: 10, y: 10 }}
      position={controlledPosition}
      axis="x"
      bounds="parent"
      nodeRef={nodeRef}
      cancel={".react-resizable-handle"}
    >
      <Resizable
        height={absoluteHeight}
        width={absoluteWidth}
        onResize={onResizeAbsolute}
        onResizeStop={onResizeStop}
        resizeHandles={["w", "e"]}
      >
        <div css={segmentStyle} ref={nodeRef} onClick={onClick} className="prevent-drag-scroll">
          <span css={textStyle}>{props.cue.text}</span>
        </div>
      </Resizable>
    </Draggable>
  );
});

// /**
//  * For debugging
//  * Minimal example: Resizable
//  */
//  const Example: React.FC = () => {

//   const [absoluteWidth, setAbsoluteWidth] = useState(200)
//   const [absoluteHeight, setAbsoluteHeight] = useState(200)
//   const [absoluteLeft, setAbsoluteLeft] = useState(0)
//   const [absoluteTop, setAbsoluteTop] = useState(0)

//   // On bottom layout. Used to resize the center element around its flex parent.
//   const onResizeAbsolute = (event: any, {element, size, handle}: any) => {
//     let newLeft = absoluteLeft;
//     let newTop = absoluteTop;
//     const deltaHeight = size.height - absoluteHeight;
//     const deltaWidth = size.width - absoluteWidth;
//     if (handle[0] === "n") {
//       newTop -= deltaHeight;
//     } else if (handle[0] === "s") {
//       newTop += deltaHeight;
//     }
//     if (handle[handle.length - 1] === "w") {
//       newLeft -= deltaWidth;
//     } else if (handle[handle.length - 1] === "e") {
//       newLeft += deltaWidth;
//     }

//     setAbsoluteWidth(size.width)
//     setAbsoluteHeight(size.height)
//     setAbsoluteLeft(newLeft)
//     setAbsoluteTop(newTop)
//   };

//   return (
//     <Resizable
//       // className="box absolutely-positioned center-aligned"
//       height={absoluteHeight}
//       width={absoluteWidth}
//       onResize={onResizeAbsolute}
//       resizeHandles={["sw", "se", "nw", "ne", "w", "e", "n", "s"]}
//     >
//       <div
//         // className="box"
//         style={{
//           width: absoluteWidth,
//           height: absoluteHeight,
//           margin: `${absoluteTop}px 0px 0px ${absoluteLeft}px`,
//         }}
//       >
//         <span className="text">
//           {"Raw use of <Resizable> element with controlled position.
//           Resize and reposition in all directions" + absoluteLeft}
//         </span>
//       </div>
//     </Resizable>
//   );
// }

// /**
//  * For debugging
//  * Minimal example: Draggable + Resizable
//  * Erratic behaviour when resizing the east handle for smallish widths
//  */
// const Example2: React.FC = () => {

//   const [absoluteWidth, setAbsoluteWidth] = useState(200)
//   const [absoluteHeight, setAbsoluteHeight] = useState(200)
//   const [absoluteLeft, setAbsoluteLeft] = useState(0)
//   const [absoluteTop, setAbsoluteTop] = useState(0)

//   // On bottom layout. Used to resize the center element around its flex parent.
//   const onResizeAbsolute = (event: any, {element, size, handle}: any) => {
//     let newLeft = absoluteLeft;
//     let newTop = absoluteTop;
//     const deltaHeight = size.height - absoluteHeight;
//     const deltaWidth = size.width - absoluteWidth;
//     if (handle[0] === "n") {
//       newTop -= deltaHeight;
//     } else if (handle[0] === "s") {
//       newTop += deltaHeight;
//     }
//     if (handle[handle.length - 1] === "w") {
//       newLeft -= deltaWidth;
//     } else if (handle[handle.length - 1] === "e") {
//       newLeft += deltaWidth;
//     }

//     setAbsoluteWidth(size.width)
//     setAbsoluteHeight(size.height)
//     setAbsoluteLeft(newLeft)
//     setAbsoluteTop(newTop)
//   };

//   const leStyle = {
//     width: absoluteWidth,
//     height: absoluteHeight,
//     margin: `${absoluteTop}px 0px 0px ${absoluteLeft}px`,
//     backgroundColor: "red",
//   }

//   return (
//     <div>
//       <Draggable
//         defaultPosition={{ x: 10, y: 10 }}
//         onDrag={() => console.log("onDrag")}
//         cancel={".react-resizable-handle"}
//       >
//         <Resizable
//           height={absoluteHeight}
//           width={absoluteWidth}
//           onResize={onResizeAbsolute}
//           resizeHandles={["sw", "se", "nw", "ne", "w", "e", "n", "s"]}
//         >
//           <div style={ leStyle }>
//             test
//           </div>
//         </Resizable>
//       </Draggable>
//     </div>
//   )
// }

export default SubtitleTimeline;
