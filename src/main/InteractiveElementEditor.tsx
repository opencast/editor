import { useTranslation } from "react-i18next";
import { useAppDispatch } from "../redux/store";
import { TimeInput } from "./SubtitleListEditor";
import { useState } from "react";
import { css } from "@emotion/react";
import { useTheme } from "../themes";
import { timeInputStyle } from "../cssStyles";
import { convertMsToReadableString } from "../util/utilityFunctions";
import {
  addInteractiveElement,
  InteractiveElement,
  Quiz,
  Textbox,
} from "../redux/interactiveElementsSlice";
import { Modal, ModalHandle, ProtoButton } from "@opencast/appkit";
import { nanoid } from "@reduxjs/toolkit";
import { LuPlus, LuTrash } from "react-icons/lu";
import { basicButtonStyle } from "../cssStyles";

/**
 * Displays an editor view for a selected interactive element
 */
const InteractiveElementsEditor: React.FC<{
  element: Partial<InteractiveElement>
  modalRef: React.RefObject<ModalHandle | null>
}> = ({
  element,
  modalRef,
}) => {
  const { t } = useTranslation();

  const title = element.type === "Quiz"
    ? t("interactiveElementsEditor.title.quiz")
    : t("interactiveElementsEditor.title.textbox");

  return (
    <Modal
      title={title}
      text={{ close: "" }}
      // @ts-expect-error: This is fine and should be fixed in newer appkit versions.
      ref={modalRef}
    >
      { element.type === "Textbox" &&
        <TextboxEditor
          element={element}
          modalRef={modalRef}
        />
      }
      { element.type === "Quiz" &&
        <QuizEditor
          element={element}
          modalRef={modalRef}
        />
      }
    </Modal>
  );
};

const TextboxEditor: React.FC<{
  element: Partial<Textbox>,
  modalRef: React.RefObject<ModalHandle | null>,
}> = ({
  element,
  modalRef,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const [textbox, setTextbox] = useState<Textbox>({
    idInternal: nanoid(),
    start: 0,
    text: "",
    type: "Textbox",
    ...element,
  });


  const updateStartTime = (value: number) => {
    setTextbox({
      ...textbox,
      start: value,
    });
  };

  const updateText = (value: string) => {
    setTextbox({
      ...textbox,
      text: value,
    });
  };

  const updateLink = (value: string) => {
    setTextbox({
      ...textbox,
      link: value,
    });
  };

  const submit = () => {
    dispatch(addInteractiveElement(textbox));
    modalRef.current?.close?.();
  };

  const modalStyle = css({
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  });

  const descriptionStyle = css({
    maxWidth: "400px",
  });

  const fieldsStyle = css({
    display: "grid",
    gridTemplateColumns: "1fr 4fr",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
  });

  return (
    <div css={modalStyle}>
      <div css={descriptionStyle}>
        {t("interactiveElementsEditor.textbox.description")}
      </div>
      <div css={fieldsStyle}>
        <label>{t("interactiveElementsEditor.start")}</label>
        <TimeInput
          generalFieldStyle={[timeInputStyle(theme)]}
          value={textbox.start}
          changeCallback={updateStartTime}
          tooltip={t("subtitleList.startTime-tooltip")}
          tooltipAria={t("subtitleList.startTime-tooltip-aria") + ": " + convertMsToReadableString(textbox.start)}
        />
        <label>{t("interactiveElementsEditor.textbox.text")}</label>
        <input
          css={timeInputStyle(theme)}
          value={textbox.text}
          onChange={e => updateText(e.target.value)}
        />
        <label>{t("interactiveElementsEditor.textbox.link")}</label>
        <input
          css={timeInputStyle(theme)}
          value={textbox.link}
          onChange={e => updateLink(e.target.value)}
        />
      </div>
      <ProtoButton
        css={[basicButtonStyle(theme), { marginTop: "10px", padding: "10px 0px" }]}
        onClick={submit}
      >
        {t("interactiveElementsEditor.submit")}
      </ProtoButton>
    </div>
  );
};

const QuizEditor: React.FC<{
  element: Partial<Quiz>,
  modalRef: React.RefObject<ModalHandle | null>
}> = ({
  element,
  modalRef,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const [quiz, setQuiz] = useState<Quiz>({
    idInternal: nanoid(),
    start: 0,
    question: "",
    answers: [
      { text: "", correct: true },
      { text: "", correct: true },
    ],
    type: "Quiz",
    ...element,
  });

  const updateStartTime = (value: number) => {
    setQuiz({
      ...quiz,
      start: value,
    });
  };

  const updateQuestion = (value: string) => {
    setQuiz({
      ...quiz,
      question: value,
    });
  };

  const updateAnswerText = (index: number, value: string) => {
    setQuiz({
      ...quiz,
      answers: quiz.answers.map((a, i) =>
        i === index ? { ...a, text: value } : a,
      ),
    });
  };

  const updateAnswerCorrect = (index: number, value: boolean) => {
    setQuiz({
      ...quiz,
      answers: quiz.answers.map((a, i) =>
        i === index ? { ...a, correct: value } : a,
      ),
    });
  };

  const removeAnswer = (index: number) => {
    setQuiz({
      ...quiz,
      answers: quiz.answers.filter((_, i) => i !== index),
    });
  };

  const newAnswer = () => {
    setQuiz({
      ...quiz,
      answers: [
        ...quiz.answers,
        {
          text: "",
          correct: false,
        },
      ],
    });
  };

  const submit = () => {
    dispatch(addInteractiveElement(quiz));
    modalRef.current?.close?.();
  };

  const modalStyle = css({
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  });

  const descriptionStyle = css({
    maxWidth: "480px",
  });

  const fieldsStyle = css({
    display: "grid",
    gridTemplateColumns: "1fr 4fr",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
  });

  const segmentButtonStyle = css({
    height: "100%",
    width: "44px",
    boxShadow: `${theme.boxShadow}`,
    background: `${theme.element_bg}`,
  });

  const answersStyle = css({
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  });

  const answerStyle = css({
    display: "grid",
    gridTemplateColumns: "4fr 1fr 1fr",
    gap: "10px",
  });

  return (
    <div css={modalStyle}>
      <div css={descriptionStyle}>
        {t("interactiveElementsEditor.quiz.description")}
      </div>
      <div css={fieldsStyle}>
        <label>{t("interactiveElementsEditor.start")}</label>
        <TimeInput
          generalFieldStyle={[timeInputStyle(theme)]}
          value={quiz.start}
          changeCallback={updateStartTime}
          tooltip={t("subtitleList.startTime-tooltip")}
          tooltipAria={t("subtitleList.startTime-tooltip-aria") + ": " + convertMsToReadableString(quiz.start)}
        />
        <label>{t("interactiveElementsEditor.quiz.question")}</label>
        <input
          css={[timeInputStyle(theme)]}
          value={quiz.question}
          onChange={e => updateQuestion(e.target.value)}
        />
        <label>{t("interactiveElementsEditor.quiz.answers")}</label>
        <div css={answersStyle}>
          <div css={answerStyle}>
            <div css={{ paddingLeft: "15px" }}>{t("interactiveElementsEditor.quiz.answer")}</div>
            <div>{t("interactiveElementsEditor.quiz.answerCorrect")}</div>
            <div>{t("interactiveElementsEditor.quiz.answerDelete")}</div>
          </div>
          { quiz.answers.map((answer, i) => {
            return (
              <div key={i} css={answerStyle}>
                <input
                  css={[timeInputStyle(theme)]}
                  value={answer.text}
                  onChange={e => updateAnswerText(i, e.target.value)}
                />
                <input
                  type={"checkbox"}
                  css={basicButtonStyle(theme)}
                  checked={answer.correct}
                  onChange={e => updateAnswerCorrect(i, e.target.checked)}
                />
                <ProtoButton
                  css={[basicButtonStyle(theme), segmentButtonStyle]}
                  onClick={() => removeAnswer(i)}
                >
                  <LuTrash />
                </ProtoButton>
              </div>
            );
          })}
          <ProtoButton
            css={[basicButtonStyle(theme)]}
            onClick={() => newAnswer()}
          >
            <LuPlus />
          </ProtoButton>
        </div>
      </div>
      <ProtoButton
        css={[basicButtonStyle(theme), { marginTop: "10px", padding: "10px 0px" }]}
        onClick={() => submit()}
      >
        {t("interactiveElementsEditor.submit")}
      </ProtoButton>
    </div>
  );
};



export default InteractiveElementsEditor;
