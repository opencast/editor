import React, { JSX } from "react";
import { css } from "@emotion/react";
import { ParseKeys } from "i18next";
import { useTranslation, Trans } from "react-i18next";
import { getGroupName, IKey, IKeyGroup, IKeyMap, rewriteKeys } from "../globalKeys";
import { Theme, useTheme } from "../themes";
import { basicButtonStyle, deactivatedButtonStyle, titleStyle, titleStyleBold } from "../cssStyles";
import { useRecordHotkeys } from "react-hotkeys-hook";
import { useAppDispatch, useAppSelector } from "../redux/store";
import { resetHotkey, selectKeymap, setHotkey } from "../redux/hotkeySlice";
import {
  KeyCombinationContainer, match, Modal, ModalHandle, ProtoButton, SingleKeyContainer,
} from "@opencast/appkit";
import {
  LuArrowBigUp, LuArrowDown, LuArrowLeft, LuArrowRight, LuArrowUp, LuPen, LuRotateCcw, LuTrash,
} from "react-icons/lu";

/**
 * Displays a single key. Arrows and Shift are shown with icons, everything else as text.
 */
const KeyCap: React.FC<{ keyName: string }> = ({ keyName }) => {
  const content = match(keyName.toLowerCase(), {
    up: () => <LuArrowUp />,
    down: () => <LuArrowDown />,
    left: () => <LuArrowLeft />,
    right: () => <LuArrowRight />,
    shift: () => <>{keyName}<LuArrowBigUp /></>,
  }) ?? keyName;

  return <SingleKeyContainer>{content}</SingleKeyContainer>;
};

const Group: React.FC<{
  id: string
  entries: IKeyGroup
  openEditModal: (group: string, action: string, actionTitle: string) => void
  openDeleteModal: (group: string, action: string, actionTitle: string) => void
}> = ({ id, entries, openEditModal, openDeleteModal }) => {

  const { t } = useTranslation();
  const theme = useTheme();

  const groupStyle = css({
    display: "flex",
    flexDirection: "column",
    width: "460px",
    maxWidth: "50vw",

    background: `${theme.menu_background}`,
    borderRadius: "5px",
    boxShadow: `${theme.boxShadow_tiles}`,
    boxSizing: "border-box",
    padding: "0px 20px 20px 20px",
  });

  const headingStyle = css({
    color: `${theme.text}`,
  });

  return (
    <div css={groupStyle}>
      <h3 css={headingStyle}>{t(getGroupName(id))}</h3>
      {Object.entries(entries).map(([entryId, value]) =>
        <Entry
          key={entryId}
          id={entryId}
          entry={value}
          groupId={id}
          openEditModal={openEditModal}
          openDeleteModal={openDeleteModal}
        />,
      )}
    </div>
  );
};

const Entry: React.FC<{
  id: string
  entry: IKey
  groupId: string
  openEditModal: (group: string, action: string, actionTitle: string) => void
  openDeleteModal: (group: string, action: string, actionTitle: string) => void
}> = ({ id, entry, groupId, openEditModal, openDeleteModal }) => {

  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const formatEntry = (entry: IKey) => {
    let formattedSequences: string[][] = [];

    const sequences = entry.key.split(",").map(item => item.trim());
    const sequenceSplitKey = entry.splitKey ?? "+";
    formattedSequences = Object.entries(sequences).map(([, sequence]) => {
      return sequence.split(sequenceSplitKey).map(item => rewriteKeys(item.trim()));
    });

    return formattedSequences;
  };

  const entryStyle = css({
    display: "flex",
    flexFlow: "column nowrap",
    justifyContent: "left",
    width: "100%",
    padding: "10px 0px",
    gap: "10px",
  });

  const labelStyle = css({
    fontWeight: "bold",
    overflow: "hidden",
    textOverflow: "ellipsis",
    wordWrap: "break-word",
    color: `${theme.text}`,
  });

  const entryContentStyle = css({
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  });

  const sequencesStyle = css({
    display: "flex",
    flexFlow: "column",
    gap: "10px",
  });

  const sequenceStyle = css({
    display: "flex",
    flexDirection: "row",
    gap: "10px",
  });

  const orStyle = css({
    alignSelf: "center",
    fontSize: "20px",
    fontWeight: "bold",
  });

  const editButtonStyle = css({
    padding: "12px",
  });

  return (
    <div css={entryStyle}>
      <div css={labelStyle}><Trans>{entry.name || t("keyboardControls.missingLabel")}</Trans></div>
      <div css={entryContentStyle}>
        {entry.key === "" ?
          <div>{t("keyboardControls.keyUndefined")}</div>
          :
          <div css={sequencesStyle}>
            {formatEntry(entry).map((sequence, index, arr) => (
              <div css={sequenceStyle} key={index}>
                <KeyCombinationContainer>
                  {sequence.map((singleKey, index) => <KeyCap key={index} keyName={singleKey} />)}
                </KeyCombinationContainer>
                <div css={orStyle}><Trans>
                  {arr.length - 1 !== index && t("keyboardControls.sequenceSeparator")}
                </Trans></div>
              </div>
            ))}
          </div>
        }
        <div>
          <ProtoButton
            css={[basicButtonStyle(theme), editButtonStyle]}
            onClick={() => openEditModal(groupId, id, t(entry.name as ParseKeys))}
          >
            <LuPen />
          </ProtoButton>
          <ProtoButton
            css={[basicButtonStyle(theme), editButtonStyle]}
            onClick={() => openDeleteModal(groupId, id, t(entry.name as ParseKeys))}
          >
            <LuTrash />
          </ProtoButton>
          <ProtoButton
            css={[basicButtonStyle(theme), editButtonStyle]}
            onClick={() => dispatch(resetHotkey({ group: groupId, action: id }))}
          >
            <LuRotateCcw />
          </ProtoButton>
        </div>
      </div>
    </div>
  );
};


const KeyboardControls: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const keymap = useAppSelector(selectKeymap);

  const [keys, { start, stop, resetKeys }] = useRecordHotkeys();
  const modalRef = React.useRef<ModalHandle>(null);
  const modalRefDelete = React.useRef<ModalHandle>(null);
  const [editGroup, setEditGroup] = React.useState<string>("");
  const [editAction, setEditAction] = React.useState<string>("");
  const [editActionTitle, setEditActionTitle] = React.useState<string>("");

  const openEditModal = (group: string, action: string, actionTitle: string) => {
    setEditGroup(group);
    setEditAction(action);
    setEditActionTitle(actionTitle);

    resetKeys();
    start();

    if (modalRef.current) {
      modalRef.current?.open();
    }
  };

  const openDeleteModal = (group: string, action: string, actionTitle: string) => {
    setEditGroup(group);
    setEditAction(action);
    setEditActionTitle(actionTitle);

    if (modalRefDelete.current) {
      modalRefDelete.current?.open();
    }
  };

  const groupsStyle = css({
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "30px",
  });

  const render = () => {
    if (keymap && Object.keys(keymap).length > 0) {

      const groups: JSX.Element[] = [];
      Object.entries(keymap).forEach(([groupId, group]) => {
        groups.push(<Group
          key={groupId}
          id={groupId}
          entries={group}
          openEditModal={openEditModal}
          openDeleteModal={openDeleteModal}
        />);
      });

      return (
        <div css={groupsStyle}>
          {groups}
        </div>
      );
    }

    // No groups fallback
    return <div>{t("keyboardControls.genericError")}</div>;
  };

  const keyboardControlsStyle = css({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
  });

  return (
    <div css={keyboardControlsStyle}>
      <div css={[titleStyle(theme), titleStyleBold(theme)]}>
        {t("keyboardControls.header")}
      </div>

      <ChangeHotkeyModal
        modalRef={modalRef}
        keys={keys}
        stop={stop}
        group={editGroup}
        action={editAction}
        actionTitle={editActionTitle}
      />

      <DeleteHotkeyModal
        modalRef={modalRefDelete}
        group={editGroup}
        action={editAction}
        actionTitle={editActionTitle}
      />

      {render()}
    </div>
  );
};

const ChangeHotkeyModal: React.FC<{
  modalRef: React.RefObject<ModalHandle | null>,
  keys: Set<string>,
  stop: () => void
  group: string,
  action: string,
  actionTitle: string,
}> = ({
  modalRef,
  keys,
  stop,
  group,
  action,
  actionTitle,
}) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const theme = useTheme();

  const keymap = useAppSelector(selectKeymap);

  // Hard limit maximum amount of keys
  if (keys.size >= 3) {
    stop();
  }

  const setNewKeys = () => {
    stop();

    dispatch(setHotkey({
      group: group,
      action: action,
      key: Array.from(keys).join(" + "),
    }));

    if (modalRef.current?.close) {
      modalRef.current.close();
    }
  };

  const modalContentStyle = css({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
  });

  const buttonsStyle = css({
    display: "flex",
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
  });

  const buttonStyle = (theme: Theme) => css({
    fontSize: "16px",
    padding: "12px 16px",
    justifyContent: "space-around",
    boxShadow: `${theme.boxShadow}`,
    background: `${theme.element_bg}`,
  });

  const containsPlus = keys.has("+");
  const keyIsAlreadyPresent = isKeyInKeymap(keymap, Array.from(keys));
  const disabled = keys.size === 0 || keyIsAlreadyPresent || containsPlus;

  return (
    <Modal
      ref={modalRef}
      title={t("keyboardControls.changeModal.title", { name: actionTitle, interpolation: { escapeValue: false } })}
      text={{ close: t("modal.close") }}
    >
      <div css={modalContentStyle}>
        <p>{t("keyboardControls.changeModal.info")}</p>
        <p>{t("keyboardControls.changeModal.recordedKeys")}</p>
        <p css={css({ minHeight: "19px" })}>{Array.from(keys).join(" + ")}</p>
        {keyIsAlreadyPresent ? <p>{t("keyboardControls.alreadyInUse")}</p> : null}
        {containsPlus ? <p>{t("keyboardControls.containsPlus")}</p> : null}
        <br />
        <div css={buttonsStyle}>
          <ProtoButton
            onClick={modalRef.current?.close}
            css={[basicButtonStyle(theme), buttonStyle(theme)]}
          >
            {t("keyboardControls.changeModal.discard")}
          </ProtoButton>
          <ProtoButton
            onClick={setNewKeys}
            css={!disabled
              ? [basicButtonStyle(theme), buttonStyle(theme)]
              : [deactivatedButtonStyle, buttonStyle(theme)]}
            disabled={disabled}
          >
            {t("keyboardControls.changeModal.save")}
          </ProtoButton>
        </div>
      </div>
    </Modal>
  );
};

const DeleteHotkeyModal: React.FC<{
  modalRef: React.RefObject<ModalHandle | null>,
  group: string,
  action: string,
  actionTitle: string,
}> = ({
  modalRef,
  group,
  action,
  actionTitle,
}) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const theme = useTheme();

  const unsetHotkey = () => {
    dispatch(setHotkey({
      group: group,
      action: action,
      key: "",
    }));

    if (modalRef.current?.close) {
      modalRef.current.close();
    }
  };

  const modalContentStyle = css({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
  });

  const buttonsStyle = css({
    display: "flex",
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
  });

  const buttonStyle = (theme: Theme) => css({
    fontSize: "16px",
    padding: "12px 16px",
    justifyContent: "space-around",
    boxShadow: `${theme.boxShadow}`,
    background: `${theme.element_bg}`,
  });

  return (
    <Modal
      ref={modalRef}
      title={t("keyboardControls.deleteModal.title", { name: actionTitle, interpolation: { escapeValue: false } })}
      text={{ close: t("modal.close") }}
    >
      <div css={modalContentStyle}>
        <p>{t("keyboardControls.deleteModal.info")}</p>
        <br />
        <div css={buttonsStyle}>
          <ProtoButton
            onClick={modalRef.current?.close}
            css={[basicButtonStyle(theme), buttonStyle(theme)]}
          >
            {t("keyboardControls.deleteModal.cancel")}
          </ProtoButton>
          <ProtoButton
            onClick={unsetHotkey}
            css={[basicButtonStyle(theme), buttonStyle(theme)]}
          >
            {t("keyboardControls.deleteModal.confirm")}
          </ProtoButton>
        </div>
      </div>
    </Modal>
  );
};

function isKeyInKeymap(
  keymap: IKeyMap,
  targetKeys: string[],
): boolean {
  if (!targetKeys || targetKeys.length === 0) {
    return false;
  }

  for (const group of Object.values(keymap)) {
    for (const action of Object.values(group)) {
      const sequenceSeparator = ",";
      const sequences = action.key
        .split(sequenceSeparator)
        .map(k => k.trim());

      const targetKeysTransformed = targetKeys
        .map(v => v.toLowerCase())
        .sort();

      for (const sequence of sequences) {
        const keySeparator = action.splitKey ?? "+";

        const keys = sequence
          .split(keySeparator)
          .map(k => k.trim())
          .map(k => k.toLowerCase());

        const setKeys = new Set(keys);
        const setTargetKeys = new Set(targetKeysTransformed);

        if (setKeys.symmetricDifference(setTargetKeys).size === 0) {
          return true;
        }
      }
    }
  }
  return false;
}


export default KeyboardControls;
