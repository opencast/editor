import React, { JSX, useEffect } from "react";
import { css } from "@emotion/react";
import { ParseKeys } from "i18next";
import { useTranslation, Trans } from "react-i18next";
import { getGroupName, HOTKEY_SCOPE, IKey, IKeyGroup, IKeyMap, rewriteKeys } from "../globalKeys";
import { Theme, useTheme } from "../themes";
import { basicButtonStyle, deactivatedButtonStyle } from "../cssStyles";
import { useHotkeysContext, useRecordHotkeys } from "react-hotkeys-hook";
import { useAppDispatch, useAppSelector } from "../redux/store";
import { resetHotkey, selectKeymap, setHotkey } from "../redux/hotkeySlice";
import {
  KeyCombinationContainer, match, Modal, ModalHandle, ProtoButton, SingleKeyContainer,
} from "@opencast/appkit";
import {
  LuArrowBigUp, LuArrowDown, LuArrowLeft, LuArrowRight, LuArrowUp, LuPen, LuRotateCcw, LuTrash,
} from "react-icons/lu";

// Recorded special keys are lowercase ("space", "escape"). Single characters are left as they are.
const capitalize = (name: string) => name.length > 1 ? name[0].toUpperCase() + name.slice(1) : name;

/**
 * Displays a single key. Arrows and Shift are shown with icons, everything else as text.
 */
const KeyCap: React.FC<{ keyName: string }> = ({ keyName }) => {
  const content = match(keyName.toLowerCase(), {
    up: () => <LuArrowUp />,
    down: () => <LuArrowDown />,
    left: () => <LuArrowLeft />,
    right: () => <LuArrowRight />,
    // Recorded keys use these names
    arrowup: () => <LuArrowUp />,
    arrowdown: () => <LuArrowDown />,
    arrowleft: () => <LuArrowLeft />,
    arrowright: () => <LuArrowRight />,
    shift: () => <>{capitalize(keyName)}<LuArrowBigUp /></>,
  }) ?? capitalize(keyName);

  return <SingleKeyContainer>{content}</SingleKeyContainer>;
};

const Group: React.FC<{
  id: string
  entries: IKeyGroup
  openEditModal: (group: string, action: string, actionTitle: string) => void
  openDeleteModal: (group: string, action: string, actionTitle: string) => void
}> = ({ id, entries, openEditModal, openDeleteModal }) => {

  const { t } = useTranslation();

  const groupStyle = css({
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  });

  const headingStyle = css({
    fontSize: "18px",
  });

  const entriesStyle = css({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 380px), 1fr))",
    gap: "12px",
  });

  return (
    <section css={groupStyle}>
      <h3 css={headingStyle}>{t(getGroupName(id))}</h3>
      <div css={entriesStyle}>
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
    </section>
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
    padding: "10px 16px",
    gap: "8px",
    background: `${theme.background}`,
    borderRadius: "4px",
  });

  const labelStyle = css({
    overflowWrap: "anywhere",
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
  });

  const editButtonsStyle = css({
    display: "flex",
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
        <div css={editButtonsStyle}>
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


/**
 * Displays the hotkeys in a modal, which is opened through the given ref.
 */
const KeyboardControlsModal: React.FC<{
  modalRef: React.RefObject<ModalHandle | null>,
}> = ({ modalRef }) => {
  const { t } = useTranslation();

  return (
    <Modal
      ref={modalRef}
      title={t("keyboardControls.header")}
      text={{ close: t("modal.close") }}
      closeOnOutsideClick
      css={{
        width: "80%",
        maxWidth: 1000,
        "& > div": {
          maxHeight: "80vh",
          overflow: "auto",
        },
      }}
    >
      <KeyboardControls />
    </Modal>
  );
};

const KeyboardControls: React.FC = () => {
  const { t } = useTranslation();
  const keymap = useAppSelector(selectKeymap);

  // This component only exists while the modal is open. Meanwhile, the editor's own hotkeys should not trigger.
  const { enableScope, disableScope } = useHotkeysContext();
  useEffect(() => {
    disableScope(HOTKEY_SCOPE);
    return () => enableScope(HOTKEY_SCOPE);
  }, [enableScope, disableScope]);

  const modalRef = React.useRef<ModalHandle>(null);
  const modalRefDelete = React.useRef<ModalHandle>(null);
  const [editGroup, setEditGroup] = React.useState<string>("");
  const [editAction, setEditAction] = React.useState<string>("");
  const [editActionTitle, setEditActionTitle] = React.useState<string>("");

  const openEditModal = (group: string, action: string, actionTitle: string) => {
    setEditGroup(group);
    setEditAction(action);
    setEditActionTitle(actionTitle);

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
    flexDirection: "column",
    gap: "32px",
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

  return (
    <div>
      <ChangeHotkeyModal
        modalRef={modalRef}
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
  group: string,
  action: string,
  actionTitle: string,
}> = ({
  modalRef,
  group,
  action,
  actionTitle,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      ref={modalRef}
      title={t("keyboardControls.changeModal.title", { name: actionTitle, interpolation: { escapeValue: false } })}
      text={{ close: t("modal.close") }}
    >
      <ChangeHotkeyContent modalRef={modalRef} group={group} action={action} />
    </Modal>
  );
};

/**
 * The content of the modal is only mounted while the modal is open.
 * This is what limits the recording of keys to the time the modal is open:
 * The recording grabs all key presses, so it has to end however the modal is closed.
 */
const ChangeHotkeyContent: React.FC<{
  modalRef: React.RefObject<ModalHandle | null>,
  group: string,
  action: string,
}> = ({
  modalRef,
  group,
  action,
}) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const theme = useTheme();

  const keymap = useAppSelector(selectKeymap);

  const [keys, { start, stop, resetKeys }] = useRecordHotkeys();

  useEffect(() => {
    resetKeys();
    start();
  }, [resetKeys, start]);

  // Hard limit maximum amount of keys
  useEffect(() => {
    if (keys.size >= 3) {
      stop();
    }
  }, [keys, stop]);


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
    gap: "24px",
    width: "100%",
    "& > p": { margin: 0 },
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
    border: `${theme.menuBorder}`,
    background: `${theme.element_bg}`,
  });

  const containsPlus = keys.has("+");
  const keyIsAlreadyPresent = isKeyInKeymap(keymap, Array.from(keys));
  const disabled = keys.size === 0 || keyIsAlreadyPresent || containsPlus;

  return (
    <div css={modalContentStyle}>
      <p>{t("keyboardControls.changeModal.info")}</p>
      <p>{t("keyboardControls.changeModal.recordedKeys")}</p>
      <div css={{ minHeight: 36 }}>
        {keys.size > 0 && (
          <KeyCombinationContainer>
            {Array.from(keys).map(key => <KeyCap key={key} keyName={key} />)}
          </KeyCombinationContainer>
        )}
      </div>
      {keyIsAlreadyPresent ? <p>{t("keyboardControls.alreadyInUse")}</p> : null}
      {containsPlus ? <p>{t("keyboardControls.containsPlus")}</p> : null}
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
    border: `${theme.menuBorder}`,
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


export default KeyboardControlsModal;
