import React, { useEffect, useRef, useState } from "react";
import { css } from "@emotion/react";
import { useAppDispatch, useAppSelector } from "../redux/store";
import { selectDuration, selectSegments } from "../redux/videoSlice";
import Draggable, { DraggableEventHandler } from "react-draggable";
import { useTheme } from "../themes";
import { InteractiveElement, selectInteractiveElements, updateStartAtIndex } from "../redux/interactiveElementsSlice";
import { LuFileQuestion, LuType } from "react-icons/lu";
import InteractiveElementsEditor from "./InteractiveElementEditor";
import { ModalHandle } from "@opencast/appkit";

const InteractiveElementsTimeline: React.FC<{
  timelineWidth: number
  timelineHeight: number
}> = ({
  timelineWidth,
  timelineHeight,
}) => {
  const arbitraryHeight = 80;
  const elements = useAppSelector(state => selectInteractiveElements(state));

  const segmentsListStyle = css({
    position: "absolute",
    width: "100%",
    height: timelineHeight,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
  });

  return (
    <div css={segmentsListStyle}>
      {elements.map((item, i) => {
        return (
          <InteractiveElementSegment
            timelineWidth={timelineWidth}
            item={item}
            height={arbitraryHeight}
            key={i}
            index={i}
          />
        );
      })}
    </div>
  );
};

const InteractiveElementSegment: React.FC<{
  timelineWidth: number,
  item: InteractiveElement,
  index: number,
  height: number;
}> = React.memo(props => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const duration = useAppSelector(selectDuration);
  const segments = useAppSelector(selectSegments);
  let wouldBeDeleted = false;

  const modalRef = useRef<ModalHandle>(null);
  const [controlledPosition, setControlledPosition] = useState({ x: 0, y: 0 });
  const [isGrabbed, setIsGrabbed] = useState(false);
  const nodeRef = useRef(null); // For supressing "ReactDOM.findDOMNode() is deprecated" warning
  const draggedRef = useRef<boolean>(false); // For preventing onClicks when done dragging

  for (const segment of segments) {
    if (segment.start < props.item.start && segment.end > props.item.start) {
      wouldBeDeleted = segment.deleted;
    }
  }

  useEffect(() => {
    setControlledPosition({ x: (props.item.start / duration) * (props.timelineWidth), y: 0 });
  }, [props.item.start, duration, props.timelineWidth]);

  const editItem = () => {
    const dragged = draggedRef.current;
    draggedRef.current = false;
    if (!dragged) {
      modalRef.current?.open();
    }
  };

  const onStartDrag: DraggableEventHandler = _e => {
    setIsGrabbed(true);
  };

  const onStopDrag: DraggableEventHandler = (_e, position) => {
    dispatch(updateStartAtIndex({
      index: props.index,
      newStart: (position.x / props.timelineWidth) * (duration),
    }));

    setIsGrabbed(false);
  };

  const segmentStyle = css({
    position: "absolute",
    width: props.item.type === "Textbox" ? `${(10000 / duration) * 100}%` : "32px",
    minWidth: "32px",
    height: "32px",
    background: wouldBeDeleted ? "rgba(200, 0, 0, 1)" : `${theme.element_bg}`,
    border: "1px solid #ccc",
    zIndex: "1000",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",

    cursor: isGrabbed ? "grabbing" : "grab",
  });

  return (
    <>
      <Draggable
        onStart={onStartDrag}
        onDrag={() => { draggedRef.current = true; }}
        onStop={onStopDrag}
        defaultPosition={{ x: 10, y: 10 }}
        position={controlledPosition}
        axis="x"
        bounds="parent"
        nodeRef={nodeRef}
        cancel={".react-resizable-handle"}
      >
        <div css={segmentStyle} ref={nodeRef} onClick={editItem} className="prevent-drag-scroll">
          {props.item.type === "Textbox" ? <LuType /> : undefined}
          {props.item.type === "Quiz" ? <LuFileQuestion /> : undefined}
        </div>
      </Draggable>
      <InteractiveElementsEditor
        element={props.item}
        modalRef={modalRef}
      />
    </>
  );
});

export default InteractiveElementsTimeline;
