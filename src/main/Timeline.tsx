import { debounce } from "lodash";
import React, { useState, useRef, useEffect, RefObject, useLayoutEffect } from "react";

import Draggable, { DraggableEventHandler } from "react-draggable";

import { css } from "@emotion/react";

import { useAppDispatch, useAppSelector } from "../redux/store";
import { Segment, httpRequestState } from "../types";
import {
  selectDuration,
  selectVideoURL,
  selectWaveformImages,
  setWaveformImages,
  selectTimelineZoom,
  selectDurationInSeconds,
  selectSegments,
  selectActiveSegmentIndex,
  moveCut,
  selectDisplayDuration,
} from "../redux/videoSlice";

import { LuMenu } from "react-icons/lu";

import useResizeObserver from "use-resize-observer";

import { Waveform } from "../util/waveform";
import { convertMsToReadableString } from "../util/utilityFunctions";
import { rewriteKeys } from "../globalKeys";

import { useTranslation } from "react-i18next";
import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import { RootState } from "../redux/store";
import { useTheme } from "../themes";
import { ThemedTooltip } from "./Tooltip";
import ScrollContainer from "react-indiana-drag-scroll";
import CuttingActionsContextMenu from "./CuttingActionsContextMenu";
import { useHotkeys } from "react-hotkeys-hook";
import { Spinner } from "@opencast/appkit";
import {
  selectSelectedSubtitleByIdForTimeline as chapterSelectSegments,
  selectActiveSegmentIndex as chapterSelectActiveSegmentIndex,
  moveCut as chapterMoveCut,
} from "../redux/chapterSlice";
import TimelineStamps from "./TimelineStamps";
import { selectKeymap } from "../redux/hotkeySlice";
import InteractiveElementsTimeline from "./InteractiveElementsTimeline";

/**
 * A container for visualizing the cutting of the video, as well as for controlling
 * the current position in the video
 * Its width corresponds to the duration of the video
 * TODO: Figure out why ResizeObserver does not update anymore if we stop passing the width to the SegmentsList
 */
const Timeline: React.FC<{
  timelineHeight?: number,
  styleByActiveSegment?: boolean,
  selectCurrentlyAt: (state: RootState) => number,
  selectIsPlaying: (state: RootState) => boolean,
  setClickTriggered: ActionCreatorWithPayload<boolean, string>,
  setCurrentlyAt: ActionCreatorWithPayload<number, string>,
  setIsPlaying: ActionCreatorWithPayload<boolean, string>,
  isChapters?: boolean,
  isInteractiveElements?: boolean,
}> = ({
  timelineHeight = 200,
  styleByActiveSegment = true,
  selectCurrentlyAt,
  selectIsPlaying,
  setClickTriggered,
  setCurrentlyAt,
  setIsPlaying,
  isChapters = false,
  isInteractiveElements = false,
}) => {

  // Init redux variables
  const currentlyAt = useAppSelector(selectCurrentlyAt);
  const dispatch = useAppDispatch();
  const duration = useAppSelector(selectDuration);
  const durationInSeconds = useAppSelector(selectDurationInSeconds);
  const timelineZoom = useAppSelector(selectTimelineZoom);
  const displayDuration = useAppSelector(selectDisplayDuration);

  const scrubberRef = useRef<HTMLDivElement | null>(null);
  const { ref, width = 1 } = useResizeObserver<HTMLDivElement>();
  const scrollContainerRef = useRef<HTMLElement>(null);
  const { width: scrollContainerWidth = 1 } = useResizeObserver<HTMLElement>({ ref: scrollContainerRef });

  const currentlyScrolling = useRef(false);
  const zoomCenter = useRef(0);

  // Vars for timelineStamps
  const timelineStampsHeight = 20;
  const waveformHeight = timelineHeight - timelineStampsHeight;
  const [scrollLeft, setScrollLeft] = useState(0);
  const [visibleWidth, setVisibleWidth] = useState(0);

  const updateScroll = () => {
    if (currentlyScrolling.current) {
      currentlyScrolling.current = false;
      return;
    }
    const scrollLeft = scrollContainerRef.current?.scrollLeft ?? 0;
    const clientWidth = scrollContainerRef.current?.clientWidth ?? 0;
    const centerPosition = scrollLeft + 0.5 * clientWidth;
    const scrubberPosition = duration ? (currentlyAt / duration) * width : 0;
    const scrubberVisible = scrollLeft <= scrubberPosition && scrubberPosition <= scrollLeft + clientWidth;

    zoomCenter.current = (scrubberVisible ? scrubberPosition : centerPosition) / width;

  };

  const updateScrollMetrics = () => {
    if (!scrollContainerRef.current) {
      return;
    }
    const el = scrollContainerRef.current;
    setScrollLeft(el.scrollLeft);
    setVisibleWidth(el.clientWidth);
  };

  const displayPercentage = (durationInSeconds / displayDuration);
  const getWaveformWidth = (baseWidth: number) => {
    return baseWidth * displayPercentage;
  };
  const zoomedWidth = getWaveformWidth(scrollContainerWidth);

  // Make sure visibleWidth is set so canvas is drawn on first render
  useLayoutEffect(() => {
    updateScrollMetrics();
  }, [width, duration]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(updateScroll, [currentlyAt, timelineZoom, width, scrollContainerWidth]);

  useEffect(() => {
    if (!scrollContainerRef.current) {
      return;
    }
    const clientWidth = scrollContainerRef.current.clientWidth ?? 0;
    const left = zoomCenter.current * displayPercentage * clientWidth - 0.5 * clientWidth;

    currentlyScrolling.current = true;
    scrollContainerRef.current.scrollLeft = left;
  }, [displayPercentage]);

  const timelineStyle = css({
    position: "relative",     // Need to set position for Draggable bounds to work
    height: timelineHeight + "px",
    width: `${zoomedWidth}px`,    // Width modified by zoom
  });

  // Update the current time based on the position clicked on the timeline
  const setCurrentlyAtToClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    dispatch(setClickTriggered(true));
    dispatch(setCurrentlyAt((offsetX / width) * (duration)));
  };

  // Scroll the scroll container by its width one time
  // To be used when the scrubber moves out of sight while playing the video.
  const scrollByOwnWidth = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current?.scrollLeft + scrollContainerWidth;
      updateScroll();
    }
  };

  return (
    <CuttingActionsContextMenu isChapters={isChapters} isInteractiveElements={isInteractiveElements}>
      <div css={css({ position: "absolute" })}>
        <TimelineStamps
          durationMs={duration}
          zoomedWidth={zoomedWidth}
          scrollLeft={scrollLeft}
          visibleWidth={visibleWidth}
          height={timelineStampsHeight}
        />
      </div>
      <ScrollContainer
        innerRef={scrollContainerRef}
        css={{
          overflowY: "hidden",
          width: "100%",
          height: `${timelineHeight}px`,
        }}
        vertical={false}
        horizontal={true}
        // dom elements with this id in the container will not trigger scrolling when dragged
        ignoreElements={".prevent-drag-scroll"}
        hideScrollbars={false}            // ScrollContainer hides scrollbars per default
        onScroll={updateScrollMetrics}
        onEndScroll={updateScroll}
      >
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
          <div css={{ position: "relative", height: timelineHeight + "px", top: `${timelineStampsHeight}px` }}>
            <Waveforms
              timelineHeight={!isChapters ? waveformHeight : (waveformHeight / 4) * 3}
              topOffset={!isChapters ? undefined : (waveformHeight / 4) * 1}
            />
            {isChapters &&
              <SegmentsList
                timelineWidth={width}
                timelineHeight={(waveformHeight / 4) * 1}
                styleByActiveSegment={styleByActiveSegment}
                tabable={true}
                selectSegments={chapterSelectSegments}
                selectActiveSegmentIndex={chapterSelectActiveSegmentIndex}
                moveCut={chapterMoveCut}
              />
            }
            {isInteractiveElements &&
              <InteractiveElementsTimeline
                timelineWidth={width}
                timelineHeight={timelineHeight}
              />
            }
            <SegmentsList
              timelineWidth={width}
              timelineHeight={!isChapters ? waveformHeight : (waveformHeight / 4) * 3}
              styleByActiveSegment={!isChapters ? styleByActiveSegment : false}
              tabable={true}
              selectSegments={selectSegments}
              selectActiveSegmentIndex={selectActiveSegmentIndex}
              moveCut={moveCut}
            />
          </div>
        </div>
      </ScrollContainer>
    </CuttingActionsContextMenu>
  );
};

type ScrubberProps = {
  timelineWidth: number,
  timelineHeight: number,
  scrollContainerWidth: number,
  scrollLeft: number,
  scrollTheContainerbyOwnWidth: () => void,
  selectCurrentlyAt: (state: RootState) => number,
  selectIsPlaying: (state: RootState) => boolean,
  setCurrentlyAt: ActionCreatorWithPayload<number, string>,
  setIsPlaying: ActionCreatorWithPayload<boolean, string>,
}

/**
 * Displays and defines the current position in the video
 * @param param0
 */
export const Scrubber = React.forwardRef<HTMLDivElement, ScrubberProps>((props, nodeRef) => {
  const { timelineWidth, timelineHeight, scrollContainerWidth, scrollLeft, scrollTheContainerbyOwnWidth,
    selectCurrentlyAt, selectIsPlaying, setCurrentlyAt, setIsPlaying } = props;

  const { t } = useTranslation();

  // Init redux variables
  const dispatch = useAppDispatch();
  const keymap = useAppSelector(selectKeymap);
  const isPlaying = useAppSelector(selectIsPlaying);
  const currentlyAt = useAppSelector(selectCurrentlyAt);
  const duration = useAppSelector(selectDuration);
  const activeSegmentIndex = useAppSelector(selectActiveSegmentIndex);  // For ARIA information display
  const segments = useAppSelector(selectSegments);                      // For ARIA information display
  const theme = useTheme();

  // Init state variables
  const [controlledPosition, setControlledPosition] = useState({ x: 0, y: 0 });
  const [isGrabbed, setIsGrabbed] = useState(false);
  const [wasPlayingWhenGrabbed, setWasPlayingWhenGrabbed] = useState(false);
  const [keyboardJumpDelta, setKeyboardJumpDelta] = useState(1000);  // In milliseconds. For keyboard navigation
  const wasCurrentlyAtRef = useRef(0);
  const activeSegment = segments[activeSegmentIndex];

  // Reposition scrubber when the current x position was changed externally
  useEffect(() => {
    if (currentlyAt !== wasCurrentlyAtRef.current && !isGrabbed) {
      updateXPos();
      wasCurrentlyAtRef.current = currentlyAt;
    }
  });

  // Reposition scrubber when the timeline width changes
  useEffect(() => {
    if (currentlyAt && duration) {
      updateXPos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineWidth]);

  // Check when the scrubber moves out of sight (can happen when playing the video while zoomed in)
  // and then scroll the container
  useEffect(() => {
    if (controlledPosition.x > (scrollLeft + scrollContainerWidth)) {
      scrollTheContainerbyOwnWidth();
    }
  }, [controlledPosition.x, scrollContainerWidth, scrollLeft, scrollTheContainerbyOwnWidth]);

  // Callback for when the scrubber gets dragged by the user
  const onControlledDrag: DraggableEventHandler = debounce((_e, position: { x: number, y : number }) => {
    // Update position
    const { x } = position;
    dispatch(setCurrentlyAt((x / timelineWidth) * (duration)));
  }, 200);

  // Callback for when the position changes by something other than dragging
  const updateXPos = () => {
    setControlledPosition({ x: (currentlyAt / duration) * (timelineWidth), y: 0 });
  };

  const onStartDrag: DraggableEventHandler = () => {
    setIsGrabbed(true);

    // Halt video playback
    if (isPlaying) {
      setWasPlayingWhenGrabbed(true);
      dispatch(setIsPlaying(false));
    } else {
      setWasPlayingWhenGrabbed(false);
    }
  };

  const onStopDrag: DraggableEventHandler = (_e, position) => {
    // Update position
    const { x } = position;
    setControlledPosition({ x, y: 0 });
    dispatch(setCurrentlyAt((x / timelineWidth) * (duration)));

    setIsGrabbed(false);
    // Resume video playback
    if (wasPlayingWhenGrabbed) {
      dispatch(setIsPlaying(true));
    }
  };

  // Callbacks for keyboard controls
  // TODO: Better increases and decreases than ten intervals
  // TODO: Additional helpful controls (e.g. jump to start/end of segment/next segment)
  useHotkeys(
    keymap.timeline.left.key,
    () => dispatch(setCurrentlyAt(Math.max(currentlyAt - keyboardJumpDelta, 0))),
    keymap.timeline.left.options,
    [currentlyAt, keyboardJumpDelta],
  );
  useHotkeys(
    keymap.timeline.right.key,
    () => dispatch(setCurrentlyAt(Math.min(currentlyAt + keyboardJumpDelta, duration))),
    keymap.timeline.right.options,
    [currentlyAt, keyboardJumpDelta, duration],
  );
  useHotkeys(
    keymap.timeline.increase.key,
    () => setKeyboardJumpDelta(keyboardJumpDelta => Math.min(keyboardJumpDelta * 10, 1000000)),
    keymap.timeline.increase.options,
    [keyboardJumpDelta],
  );
  useHotkeys(
    keymap.timeline.decrease.key,
    () => setKeyboardJumpDelta(keyboardJumpDelta => Math.max(keyboardJumpDelta / 10, 1)),
    keymap.timeline.decrease.options,
    [keyboardJumpDelta],
  );

  const scrubberStyle = css({
    backgroundColor: `${theme.scrubber}`,
    height: timelineHeight + 20 + "px", //    TODO: CHECK IF height: "100%",
    width: "1px",
    position: "absolute",
    zIndex: 20,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
  });

  const scrubberDragHandleStyle = css({
    // Base style
    background: `${theme.scrubber_handle}`,
    display: "inline-block",
    height: "20px",
    position: "relative",
    width: "20px",
    borderRadius: "5px",
    boxShadow: `${theme.boxShadow_tiles}`,
    "&:after": {
      borderTop: `10px solid ${theme.scrubber_handle}`,
      borderLeft: "10px solid transparent",
      borderRight: "10px solid transparent",
      content: "''",
      height: 0,
      left: 0,
      position: "absolute",
      top: "17px",
      width: 0,
    },
    // Animation
    cursor: isGrabbed ? "grabbing" : "grab",
  });

  const scrubberDragHandleIconStyle = css({
    paddingLeft: "2px",
    paddingTop: "2px",
    color: `${theme.scrubber_icon}`,
  });

  // // Possible TODO: Find a way to use ariaLive in a way that only the latest change is announced
  // const keyboardUpdateMessage = () => {
  //   return currentlyAt +  " Milliseconds"
  // }

  return (
    <Draggable
      onDrag={onControlledDrag}
      onStart={onStartDrag}
      onStop={onStopDrag}
      axis="x"
      bounds="parent"
      position={controlledPosition}
      nodeRef={nodeRef as RefObject<HTMLElement>}
    >
      <div ref={nodeRef} css={scrubberStyle} className="prevent-drag-scroll">
        <div css={scrubberDragHandleStyle} aria-grabbed={isGrabbed}
          aria-label={t("timeline.scrubber-text-aria",
            {
              currentTime: convertMsToReadableString(currentlyAt),
              segment: activeSegmentIndex,
              segmentStatus: (activeSegment && activeSegment.deleted ? "Deleted" : "Alive"),
              moveLeft: rewriteKeys(keymap.timeline.left.key),
              moveRight: rewriteKeys(keymap.timeline.right.key),
              increase: rewriteKeys(keymap.timeline.increase.key),
              decrease: rewriteKeys(keymap.timeline.decrease.key),
            })}
          tabIndex={0}>
          <LuMenu css={scrubberDragHandleIconStyle} />
        </div>
      </div>
    </Draggable>
  );
});

/**
 * Container responsible for rendering the segments that are created when cutting
 */
export const SegmentsList: React.FC<{
  timelineWidth: number,
  timelineHeight: number,
  styleByActiveSegment?: boolean,
  tabable?: boolean,
  selectSegments: (state: RootState) => Segment[],
  selectActiveSegmentIndex: (state: RootState) => number,
  moveCut: ActionCreatorWithPayload<{leftSegmentIndex: number, time: Segment["start"]}, string>,
}> = ({
  timelineWidth,
  timelineHeight,
  styleByActiveSegment = true,
  tabable = true,
  selectSegments,
  selectActiveSegmentIndex,
  moveCut,
}) => {
  const { t } = useTranslation();

  // Init redux variables
  const segments = useAppSelector(selectSegments);
  const duration = useAppSelector(selectDuration);
  const activeSegmentIndex = useAppSelector(selectActiveSegmentIndex);

  /**
   * Returns a background color based on whether the segment is to be deleted
   * and whether the segment is currently active
   */
  const bgColor = (deleted: boolean, active: boolean) => {
    if (!deleted && !active) {
      return "rgba(137, 137, 137, 0.4)";
    } else if (deleted && !active) {
      return `repeating-linear-gradient(
              -35deg,
              rgba(200, 0, 0, 0.4),
              rgba(200, 0, 0, 0.4) 2px,
              rgba(255, 95, 95, 0.4) 2px,
              rgba(255, 95, 95, 0.4) 50px);`;
    } else if (!deleted && active) {
      return "rgba(78, 78, 78, 0.4)";
    } else if (deleted && active) {
      return `repeating-linear-gradient(
              -35deg,
              rgba(180, 0, 0, 0.4),
              rgba(180, 0, 0, 0.4) 2px,
              rgba(255, 65, 65, 0.4) 2px,
              rgba(255, 65, 65, 0.4) 50px);`;
    }
  };

  // Render the individual segments
  const renderedSegments = () => {
    return (
      segments.map((segment: Segment, index: number) => (
        <React.Fragment key={segment.id}>
          <ThemedTooltip title={t("timeline.segment-tooltip", { segment: index })}>
            <div
              aria-label={t("timeline.segments-text-aria",
                {
                  segment: index,
                  segmentStatus: (segment.deleted ? "Deleted" : "Alive"),
                  start: convertMsToReadableString(segment.start),
                  end: convertMsToReadableString(segment.end),
                })}
              tabIndex={tabable ? 0 : -1}
              css={{
                background: bgColor(segment.deleted, styleByActiveSegment ? activeSegmentIndex === index : false),
                borderStyle: styleByActiveSegment ? (activeSegmentIndex === index ? "dashed" : "solid") : "solid",
                borderColor: "white",
                borderWidth: "1px",
                boxSizing: "border-box",
                width: ((segment.end - segment.start) / duration) * 100 + "%",
                height: timelineHeight + "px",     // CHECK IF 100%
                zIndex: 1,
                // Center text
                display: "flex",
                alignItems: "center",
              }}>
              {segment.text &&
                  <span
                    css={{
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      padding: "8px",
                    }}
                  >
                    {segment.text}
                  </span>
              }
            </div>
          </ThemedTooltip>
          {index + 1 < segments.length &&    // Check if not rightmost section
            <CutMark
              leftSegmentIndex={index}
              timelineWidth={timelineWidth}
              timelineHeight={timelineHeight}
              selectSegments={selectSegments}
              moveCut={moveCut}
            />
          }
        </React.Fragment>
      ))
    );
  };

  const segmentsStyle = css({
    display: "flex",
    flexDirection: "row",
  });

  return (
    <div css={segmentsStyle}>
      {renderedSegments()}
    </div>
  );
};

export const CutMark: React.FC<{
  leftSegmentIndex: number,
  timelineWidth: number,
  timelineHeight: number,
  selectSegments: (state: RootState) => Segment[],
  moveCut: ActionCreatorWithPayload<{leftSegmentIndex: number, time: Segment["start"]}, string>,
}> = ({
  leftSegmentIndex,
  timelineWidth,
  timelineHeight,
  selectSegments,
  moveCut,
}) => {

  // Init redux variables
  const dispatch = useAppDispatch();
  const segments = useAppSelector(selectSegments);
  const duration = useAppSelector(selectDuration);
  const rightSegmentIndex = leftSegmentIndex + 1;
  const leftSegment = segments[leftSegmentIndex];
  const rightSegment = segments[rightSegmentIndex];
  const theme = useTheme();

  // Init state variables
  const [controlledPosition, setControlledPosition] = useState({ x: 0, y: 0 });
  const [currentTime, setCurrentTime] = useState(rightSegment.start);
  const [isGrabbed, setIsGrabbed] = useState(false);
  const nodeRef = React.useRef(null); // For supressing "ReactDOM.findDOMNode() is deprecated" warning

  const { t } = useTranslation();

  const updateCurrentTime = (x: number) => {
    setCurrentTime(rightSegment.start + (x * duration) / timelineWidth);
  };

  // Callback for when the cut gets dragged by the user
  const onControlledDrag: DraggableEventHandler = (_e, position) => {
    // Update time
    const { x } = position;
    updateCurrentTime(x);
  };

  const onStartDrag: DraggableEventHandler = () => {
    setIsGrabbed(true);
  };

  const onStopDrag: DraggableEventHandler = (_e, position) => {
    // Move cut to new position
    const { x } = position;
    updateCurrentTime(x);

    dispatch(moveCut({
      leftSegmentIndex: leftSegmentIndex,
      time: currentTime,
    }));

    // Reset position to origin
    setControlledPosition({ x: 0, y: 0 });

    setIsGrabbed(false);
  };

  const cutStyle = css({
    height: timelineHeight,
    width: "2px",
    zIndex: 3,
    cursor: "col-resize",
    position: "absolute",
    left: (leftSegment.end / duration) * timelineWidth - 1 + "px",
    background: isGrabbed ? `repeating-linear-gradient(
        180deg, ${theme.cut},
        ${theme.scrubber} 4px,
        transparent 4px,
        transparent 8px)`
      : "transparent",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  });

  const cutDragAreaStyle = css({
    width: "10px",
    height: "100%",
  });

  return (
    <Draggable
      onDrag={onControlledDrag}
      onStart={onStartDrag}
      onStop={onStopDrag}
      onMouseDown={e => e.stopPropagation()}  // Prevent timeline click

      axis="x"
      bounds={{
        left: -((leftSegment.end - leftSegment.start) / duration) * timelineWidth,
        right: ((rightSegment.end - rightSegment.start) / duration) * timelineWidth,
      }}
      position={controlledPosition}
      nodeRef={nodeRef}
    >
      <div
        className="prevent-drag-scroll"
        ref={nodeRef}
        css={cutStyle}
        aria-label={t("timeline.cut-text-aria",
          {
            time: convertMsToReadableString(currentTime),
            leftSegment: leftSegmentIndex,
            rightSegment: rightSegmentIndex,
          })}>
        <div css={cutDragAreaStyle} />
      </div>
    </Draggable>
  );
};

/**
 * Generates waveform images and displays them
 */
export const Waveforms: React.FC<{ timelineHeight: number; topOffset?: number }> = ({ timelineHeight, topOffset }) => {

  const { t } = useTranslation();

  const dispatch = useAppDispatch();
  const videoURLs = useAppSelector(selectVideoURL);
  const videoURLStatus = useAppSelector((state: { videoState: { status: httpRequestState["status"]; }; }) =>
    state.videoState.status);
  const theme = useTheme();

  // Update based on current fetching status
  const images = useAppSelector(selectWaveformImages);
  const [waveformWorkerError, setWaveformWorkerError] = useState<boolean>(false);

  const waveformDisplayTestStyle = css({
    display: "flex",
    flexDirection: "column",
    position: "absolute" as const,
    justifyContent: "center",
    ...(images.length <= 0) && { alignItems: "center" },  // Only center during loading
    width: "100%",
    height: timelineHeight + "px",   // CHECK IF     height: "100%",
    paddingTop: topOffset,
    filter: `${theme.invert_wave}`,
    color: `${theme.inverted_text}`,
  });

  const waveformStyle = css({
    background: `${theme.waveform_bg}`,
    borderRadius: "5px",
    imageRendering: "pixelated",
  });

  // When the URLs to the videos are fetched, generate waveforms
  useEffect(() => {
    if (videoURLStatus === "success") {
      if (images.length > 0) {
        return;
      }

      const newImages: string[] = [];    // Store local paths to image files
      let waveformsProcessed = 0;  // Counter for checking if all workers are done

      // Only display the waveform of the first video we get
      const onlyOneURL = [videoURLs[0]];

      onlyOneURL.forEach((videoURL, _index, array) => {
        // Set up blob request
        let blob = null;
        const xhr = new XMLHttpRequest();
        xhr.open("GET", videoURL);
        xhr.responseType = "blob";
        xhr.onload = () => {
          blob = xhr.response as Blob;
          const file = new File([blob], "waveform" + _index);

          // Start waveform worker with blob
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const waveformWorker: any = new Waveform({
            type: "img", width: "2000", height: "230", samples: 100000, media: file,
          });

          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          waveformWorker.onerror = (error: string) => {
            setWaveformWorkerError(true);
            console.log("Waveform could not be generated:" + error);
          };

          // When done, save path to generated waveform img
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          waveformWorker.oncomplete = (image: string, _numSamples: number) => {
            newImages.push(image);
            waveformsProcessed++;
            // If all images are generated, rerender
            if (waveformsProcessed === array.length) {
              dispatch(setWaveformImages(newImages));
            }
          };
        };

        xhr.send();
      });
    }
  }, [dispatch, images, videoURLStatus, videoURLs]);


  const renderImages = () => {
    if (images.length > 0) {
      return (
        <img alt="Waveform" src={images[0]} css={[waveformStyle, { minHeight: 0, height: "100%" }]}></img>
        // images.map((image, index) =>
        //   <img key={index} alt="Waveform" src={image ? image : ""} css={{minHeight: 0}}></img>
        // )
      );
    } else if (waveformWorkerError) {
      return (
        // Display a flatline
        <div css={{ width: "100%" }}><hr /></div>
      );
    } else {
      return (
        <>
          <Spinner size={40} />
          <div>{t("timeline.generateWaveform-text")}</div>
        </>
      );
    }
  };

  return (
    <div css={waveformDisplayTestStyle}>
      {renderImages()}
    </div>
  );
};

export default Timeline;
