import React, { CSSProperties, useRef } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { useAppDispatch, useAppSelector } from "../redux/store";
import { ListChildComponentProps, VariableSizeList } from "react-window";
import { css } from "@emotion/react";
import { TimeInput } from "./SubtitleListEditor";
import { memoize } from "lodash";
import { useTranslation } from "react-i18next";
import { ConfirmationModal, ConfirmationModalHandle, ModalHandle, ProtoButton, useColorScheme } from "@opencast/appkit";
import { useTheme } from "../themes";
import { convertMsToReadableString } from "../util/utilityFunctions";
import { LuFileQuestion, LuPen, LuType, LuTrash } from "react-icons/lu";
import { ThemedTooltip } from "./Tooltip";
import { basicButtonStyle, timeInputStyle } from "../cssStyles";
import {
  InteractiveElement,
  removeInteractiveElementById,
  selectInteractiveElements,
  updateStartAtIndex,
} from "../redux/interactiveElementsSlice";
import InteractiveElementsEditor from "./InteractiveElementEditor";
import { selectSegments } from "../redux/videoSlice";

/**
 * Displays an overview of interactive elements and assorted actions
 */
const InteractiveElementsList: React.FC<{
  segmentHeight?: number,
}> = ({
  segmentHeight = 60,
}) => {
  const listRef = useRef<VariableSizeList>(null);

  const elements = useAppSelector(state => selectInteractiveElements(state));

  const listStyle = css({
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "60%",
    gap: "20px",
  });

  const calcEstimatedSize = React.useCallback(() => {
    return segmentHeight;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const itemData = createItemData(elements);
  type ItemData = ReturnType<typeof createItemData>

  // useCallback to prevent new function objects getting created on every rerender
  const renderSubtitleSegment = React.useCallback(
    ({ index, data, style }: ListChildComponentProps<ItemData>) => (
      <ListItem
        index={index}
        // @ts-expect-error: Type is not properly inferred for some reason
        data={data}
        style={style}
      />
    ),
    [],
  );

  return (
    <div css={listStyle}>
      <AutoSizer>
        {({ height, width }: { height: string | number, width: string | number; }) => (
          <VariableSizeList
            height={height ? height : 0}
            itemCount={elements.length}
            itemData={itemData}
            itemSize={_index => segmentHeight}
            // @ts-expect-error: Type is not properly inferred for some reason
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
            itemKey={(index, data) => data.items[index].idInternal}
            width={width ? width : 0}
            overscanCount={4}
            estimatedItemSize={calcEstimatedSize()}
            innerElementType={innerElementType}
            ref={listRef}
          >
            {renderSubtitleSegment}
          </VariableSizeList>
        )}
      </AutoSizer>
    </div>
  );

};

/**
 * Helper function for reducing rerender calls caused by react-window
 */
function ItemData<T>(
  items: T,
) {
  return { items };
}

export const createItemData = memoize(ItemData);

/**
 * Global variable to synchronize padding for react-window elements
 */
const PADDING_SIZE = 20;

// Used for padding in the VariableSizeList
const innerElementType = React.forwardRef<HTMLDivElement, { style: CSSProperties; }>(({ style, ...rest }, ref) => (
  <div
    ref={ref}
    style={{
      ...style,
      paddingTop: PADDING_SIZE + "px",
      zIndex: "1000",
    }}
    {...rest}
  />
));

const ListItem: React.FC<{
  index: number,
  data: { items: InteractiveElement[] },
  style: CSSProperties,
}> = React.memo(props => {
  // Parse props
  const { items } = props.data;
  const item = items[props.index];

  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { scheme } = useColorScheme();

  const modalRef = useRef<ModalHandle>(null);
  const deleteModalRef = useRef<ConfirmationModalHandle>(null);

  const segments = useAppSelector(selectSegments);
  let wouldBeDeleted = false;

  for (const segment of segments) {
    if (segment.start < item.start && segment.end > item.start) {
      wouldBeDeleted = segment.deleted;
    }
  }

  const updateStartTime = (value: number) => {
    dispatch(updateStartAtIndex({
      index: props.index,
      newStart: value,
    }));
  };

  const editItem = () => {
    modalRef.current?.open();
  };

  const deleteItem = () => {
    dispatch(removeInteractiveElementById(item.idInternal));
  };

  const segmentStyle = css({
    display: "flex",
    flexDirection: "row",
    justifyContent: "left",
    alignItems: "center",
    gap: "20px",
    "& textarea, input": {
      outline: `${theme.element_outline}`,
    },
    "& input": {
      marginTop: (scheme === "dark-high-contrast" || scheme === "light-high-contrast" ? "3%" : "0%"),
      marginBottom: (scheme === "dark-high-contrast" || scheme === "light-high-contrast" ? "3%" : "0%"),
    },
  });

  const typeStyle = css({
    width: "32px",
    height: "32px",
    background: wouldBeDeleted ? "rgba(200, 0, 0, 1)" : `${theme.element_bg}`,
    border: "1px solid #ccc",
    zIndex: "1000",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  });

  const segmentButtonStyle = css({
    width: "32px",
    height: "32px",
    boxShadow: `${theme.boxShadow}`,
    background: `${theme.element_bg}`,
    zIndex: "1000",
  });

  const textFieldStyle = css({
    flexGrow: "7",
    minWidth: "100px",
    height: "32px",
    background: `${theme.element_bg}`,
    border: "1px solid #ccc",
    borderRadius: "3px",
    display: "flex",
    alignItems: "center",
    paddingLeft: "8px",
  });

  return (
    <div tabIndex={-1} css={[segmentStyle, {
      ...props.style,
      // Used for padding in the VariableSizeList
      top: props.style.top !== undefined ?
        `${parseFloat(props.style.top.toString()) + PADDING_SIZE}px` : "0px",
      height: props.style.height !== undefined ?
        `${parseFloat(props.style.height.toString()) - PADDING_SIZE}px` : "0px",
      zIndex: "1000",
    }]}>
      <div css={typeStyle}>
        {item.type === "Textbox" ? <LuType /> : undefined}
        {item.type === "Quiz" ? <LuFileQuestion /> : undefined}
      </div>
      <TimeInput
        generalFieldStyle={[timeInputStyle(theme)]}
        value={item.start}
        changeCallback={updateStartTime}
        tooltip={t("subtitleList.startTime-tooltip")}
        tooltipAria={t("subtitleList.startTime-tooltip-aria") + ": " + convertMsToReadableString(item.start)}
      />
      <div css={textFieldStyle}>
        {item.type === "Textbox" ? item.text : undefined}
        {item.type === "Quiz" ? item.question : undefined}
      </div>
      <ThemedTooltip title={t("interactiveElements.editElement-tooltip")}>
        <ProtoButton
          aria-label={t("interactiveElements.editElement-tooltip-aria")}
          onClick={editItem}
          onKeyDown={makeEnterSpaceHandler(deleteItem)}
          css={[basicButtonStyle(theme), segmentButtonStyle]}
        >
          <LuPen />
        </ProtoButton>
      </ThemedTooltip>
      <ThemedTooltip title={t("interactiveElements.deleteElement-tooltip")}>
        <ProtoButton
          aria-label={t("interactiveElements.deleteElement-tooltip-aria")}
          onClick={() => deleteModalRef.current?.open()}
          css={[basicButtonStyle(theme), segmentButtonStyle, { marginRight: "2px" }]}
        >
          <LuTrash />
        </ProtoButton>
      </ThemedTooltip>
      <InteractiveElementsEditor
        element={item}
        modalRef={modalRef}
      />
      <ConfirmationModal
        title={t("interactiveElements.deleteElement-warning-header")}
        buttonContent={t("modal.confirm")}
        onSubmit={() => {
          deleteModalRef.current?.done();
          deleteItem();
        }}
        ref={deleteModalRef}
        text={{
          cancel: t("modal.cancel"),
          close: t("modal.close"),
          areYouSure: t("modal.areYouSure"),
        }}
      >
        {t("interactiveElements.deleteElement-warning")}
      </ConfirmationModal>
    </div>
  );
});

function makeEnterSpaceHandler(callback: () => void) {
  return (event: React.KeyboardEvent) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      callback();
    }
  };
}

export default InteractiveElementsList;
