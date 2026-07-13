import React from "react";
import { useTranslation } from "react-i18next";

import { LuChevronLeft, LuChevronRight, LuScissors, LuTrash } from "react-icons/lu";
import TrashRestore from "../img/trash-restore.svg?react";

import { ContextMenuItem, ThemedContextMenu } from "./ContextMenu";
import { rewriteKeys } from "../globalKeys";
import { useAppDispatch, useAppSelector } from "../redux/store";
import { cut, markAsDeletedOrAlive, mergeLeft, mergeRight, selectIsCurrentSegmentAlive } from "../redux/videoSlice";
import { selectKeymap } from "../redux/hotkeySlice";

const CuttingActionsContextMenu: React.FC<{
  children: React.ReactNode,
  isChapters?: boolean
  isInteractiveElements?: boolean,
}> = ({
  children,
  isChapters = false,
  isInteractiveElements = false,
}) => {

  const { t } = useTranslation();

  // Init redux variables
  const dispatch = useAppDispatch();
  const keymap = useAppSelector(selectKeymap);
  const isCurrentSegmentAlive = useAppSelector(selectIsCurrentSegmentAlive);

  const cuttingContextMenuItems: ContextMenuItem[] = [
    {
      name: t("cuttingActions.cut-button"),
      action: () => dispatch(cut()),
      icon: LuScissors,
      hotKey: keymap.cutting.cut.key,
      ariaLabel: t("cuttingActions.cut-tooltip-aria", {
        hotkeyName: rewriteKeys(keymap.cutting.cut.key),
      }),
    },
    {
      name: isCurrentSegmentAlive ? t("cuttingActions.delete-button") : t("cuttingActions.restore-button"),
      action: () => dispatch(markAsDeletedOrAlive()),
      icon: isCurrentSegmentAlive ? LuTrash : TrashRestore,
      hotKey: keymap.cutting.delete.key,
      ariaLabel: t("cuttingActions.delete-restore-tooltip-aria", {
        hotkeyName: rewriteKeys(keymap.cutting.delete.key),
      }),
    },
    {
      name: t("cuttingActions.mergeLeft-button"),
      action: () => dispatch(mergeLeft()),
      icon: LuChevronLeft,
      hotKey: keymap.cutting.mergeLeft.key,
      ariaLabel: t("cuttingActions.mergeLeft-tooltip-aria", {
        hotkeyName: rewriteKeys(keymap.cutting.mergeLeft.key),
      }),
    },
    {
      name: t("cuttingActions.mergeRight-button"),
      action: () => dispatch(mergeRight()),
      icon: LuChevronRight,
      hotKey: keymap.cutting.mergeRight.key,
      ariaLabel: t("cuttingActions.mergeRight-tooltip-aria", {
        hotkeyName: rewriteKeys(keymap.cutting.mergeRight.key),
      }),
    },
  ];

  const render = () => {
    if (isChapters) {
      return (
        <>
          {children}
        </>
      );
    }
    if (isInteractiveElements) {
      return (
        <>
          {children}
        </>
      );
    }
    return (
      <ThemedContextMenu
        menuItems={cuttingContextMenuItems}
      >
        {children}
      </ThemedContextMenu>
    );
  };

  return (
    <>
      {render()}
    </>
  );
};

export default CuttingActionsContextMenu;
