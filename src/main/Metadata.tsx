import React, { useCallback, useEffect, useMemo, useState } from "react";

import { css } from "@emotion/react";
import { BREAKPOINTS, calendarStyle, selectFieldStyle, titleStyle, titleStyleBold } from "../cssStyles";

import { useAppDispatch, useAppSelector } from "../redux/store";
import {
  fetchMetadata,
  MetadataField,
  setFieldValue,
  selectGetStatus,
  selectCatalogIds,
  selectCatalogById,
  selectFieldById,
  selectGetError,
} from "../redux/metadataSlice";

import Select from "react-select";
import CreatableSelect from "react-select/creatable";

import { useTranslation } from "react-i18next";

import { configureFieldsAttributes, settings } from "../config";
import { useTheme } from "../themes";
import { ThemeProvider } from "@mui/material/styles";
import { ParseKeys } from "i18next";
import { ErrorBox } from "@opencast/appkit";
import { screenWidthAtMost } from "@opencast/appkit";
import { debounce } from "lodash-es";
import { isValid, parseISO } from "date-fns";
import { isJson } from "../util/utilityFunctions";

/**
 * The root component for Metadata
 */
const Metadata: React.FC = () => {
  const dispatch = useAppDispatch();
  const getStatus = useAppSelector(selectGetStatus);

  useEffect(() => {
    if (getStatus === "idle") {
      dispatch(fetchMetadata());
    }
  }, [getStatus, dispatch]);

  return (<Catalogs />);
};

/**
 * Create catalog components or display error message
 */
const Catalogs: React.FC = () => {
  const { t } = useTranslation();
  const catalogIds = useAppSelector(selectCatalogIds);   // array of IDs (strings)
  const getStatus = useAppSelector(selectGetStatus);
  const getError = useAppSelector(selectGetError);

  const metadataStyle = css({
    padding: "20px",
    marginLeft: "auto",
    marginRight: "auto",
    minWidth: "50%",
    display: "grid",
    [screenWidthAtMost(1550)]: {
      minWidth: "70%",
    },
    [screenWidthAtMost(BREAKPOINTS.medium)]: {
      minWidth: "90%",
    },
  });

  return (
    <div css={metadataStyle}>
      {getStatus === "failed" &&
        <ErrorBox>
          <span css={{ whiteSpace: "pre-line" }}>
            {"A problem occurred during communication with Opencast. \n"}
            {getError ?
              t("various.error-details-text", { errorMessage: getError }) : undefined
            }
          </span>
        </ErrorBox>
      }

      {catalogIds.map(id => (
        <Catalog key={id} id={id} />
      ))}
    </div>
  );
};

interface Props { id: string }
/**
 * A catalog created field components
 */
const Catalog: React.FC<Props> = ({ id }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  const catalog = useAppSelector(state => selectCatalogById(state, id));
  if (!catalog) { return null; }

  // eslint-disable-next-line max-len
  const catalogConfig = settings.metadata.configureFields ? settings.metadata.configureFields[catalog.title] : undefined;
  // If there are no fields for a given catalog, do not render
  if (catalogConfig && Object.keys(catalogConfig).length <= 0) {
    return null;
  }

  const catalogStyle = css({
    background: `${theme.menu_background}`,
    borderRadius: "5px",
    boxShadow: `${theme.boxShadow_tiles}`,
    marginTop: "24px",
    boxSizing: "border-box",
    padding: "10px",
  });

  return (
    <section css={catalogStyle}>
      <div css={[titleStyle(theme), titleStyleBold(theme)]}>
        {i18n.exists(`metadata.${catalog.title.replaceAll(".", "-")}`) ?
          t(`metadata.${catalog.title.replaceAll(".", "-")}` as ParseKeys) : catalog.title
        }
      </div>
      {catalog.fieldIds.map(fid => {
        return <Field key={fid} id={fid} catalogConfig={catalogConfig}/>;
      })}
    </section>
  );
};


interface FieldProps {
  id: string,
  catalogConfig: { [key: string]: configureFieldsAttributes } | undefined
}
/**
 * A field has a label, content and validation
 */
const Field: React.FC<FieldProps> = ({ id, catalogConfig }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  const field = useAppSelector(state => selectFieldById(state, id));
  if (!field) { return null; }

  // If configured to not display this field, don't display this field
  if (catalogConfig && field.name in catalogConfig && "show" in catalogConfig[field.name]) {
    if (!catalogConfig[field.name].show) {
      return null;
    }
  }

  let readonly: boolean | undefined = undefined;
  if (catalogConfig && field.name in catalogConfig && "readonly" in catalogConfig[field.name]) {
    readonly = catalogConfig[field.name].readonly;
  }

  const fieldStyle = css({
    display: "flex",
    flexFlow: "column nowrap",
    lineHeight: "2em",
    margin: "10px",
  });

  const fieldLabelStyle = css({
    width: "110px",
    fontSize: "1em",
    fontWeight: "bold",
    color: `${theme.text}`,
    lineHeight: "32px",
    display: "flex",
    flexDirection: "row",
  });

  const fieldLabelRequiredStyle = css({
    color: `${theme.metadata_highlight}`,
  });

  return (
    <div css={fieldStyle} data-testid={field.name}>
      <label css={fieldLabelStyle}>
        <>{
          i18n.exists(`metadata.labels.${field.name}`) ?
            t(`metadata.labels.${field.name}` as ParseKeys) : field.name
        }</>
        {field.required &&
          <span css={fieldLabelRequiredStyle}>
            {t("metadata.required")}
          </span>
        }
      </label>

      <FieldContent field={field} readonly={readonly} />
      <FieldValidation field={field} />
    </div>
  );
};

/**
 * Different input interfaces for fields
 */
const FieldContent: React.FC<{ field: MetadataField, readonly?: boolean }> = ({ field, readonly }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const theme = useTheme();

  const [localValue, setLocalValue] = useState(field.value ?? "");
  const isMulti = Array.isArray(field.value);
  if (readonly === undefined) {
    readonly = field.readOnly;
  }

  useEffect(() => {
    // <input type="datetime-local"> is picky about its value and won"t accept
    // global datetime strings, so we have to convert them to local ourselves.
    if ((field.type === "date" || field.type === "time") && field.value !== "") {
      // field = cloneDeep(field);
      const leDate = new Date(field.value);
      leDate.setMinutes(leDate.getMinutes() - leDate.getTimezoneOffset());
      // field.value = leDate.toISOString().slice(0, 16);
      setLocalValue(leDate.toISOString().slice(0, 16));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Transforms field values and labels into an array of objects
   * that can be parsed by react-select
   * @param field
   */
  const generateReactSelectLibrary = (field: MetadataField) => {
    if (field.collection) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const library: { value: any, label: string, order?: number }[] = [];
      let hasCustomOrder = false;
      Object.entries(field.collection).forEach(([key, value]) => {
        // Parse Label
        let descLabel = null;
        if (i18n.exists(`metadata.${field.name}`)) {
          descLabel = t(`metadata.${field.name}.${key.replaceAll(".", "-")}` as ParseKeys);

          if (field.name === "license") {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            descLabel = t(`metadata.${field.name}.${JSON.parse(key).label.replaceAll(".", "-")}` as ParseKeys);
          }
        }

        // Change label for series
        if (field.name === "isPartOf") {
          descLabel = key;
        }

        let order = null;
        if (isJson(key)) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const parsed = JSON.parse(key);
          if (parsed && typeof parsed === "object" && "order" in parsed) {
            hasCustomOrder = true;
            // eslint-disable-next-line max-len
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            order = parsed.order;
          }
        }

        // Add to library
        library.push({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          value: value,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          label: descLabel ? descLabel : value,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          order: order,
        });
      });

      // Sort
      if (hasCustomOrder) {
        // Apply custom ordering.
        // @ts-expect-error: Can assume order is present
        library.sort((a, b) => a.order - b.order);
      } else {
        // Apply alphabetical ordering.
        library.sort((a, b) => a.label.localeCompare(b.label));
      }

      library.unshift({ value: "", label: "No value" });

      return library;
    } else {
      return [];
    }
  };

  const selectOptions = field.collection
    ? generateReactSelectLibrary(field)
    : [];

  const toSelectValue = (value: string) => {
    const found = selectOptions.find(opt => opt.value === value);

    return {
      value,
      label: found?.label ?? value,
    };
  };

  const currentSelectValue = isMulti
    ? (localValue as unknown as string[]).map(toSelectValue)
    : toSelectValue(localValue);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setLocalValue(e.target.value);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectChange = (selected: any) => {
    if (isMulti) {
      // eslint-disable-next-line max-len
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
      setLocalValue(selected?.map((s: any) => s.value) ?? []);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      setLocalValue(selected?.value ?? "");
    }
  };

  const handleDateConversion = useCallback((value: string) => {
    let returnValue = value;
    if (field && (field.type === "date" || field.type === "time")) {
      if (returnValue !== "") { // Empty string is allowed
        returnValue = new Date(returnValue).toJSON();
      }
    }
    return returnValue;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field?.type]);

  // Set value in store, but debounced
  const debouncedCommit = useMemo(
    () =>
      debounce((newValue: string) => {
        newValue = handleDateConversion(newValue);
        if (newValue !== field.value) {
          dispatch(
            setFieldValue({
              id: field.id,
              value: newValue,
            }),
          );
        }
      }, 500),
    [dispatch, field.id, field.value, handleDateConversion],
  );

  useEffect(() => {
    debouncedCommit(localValue);
    return () => {
      debouncedCommit.cancel();
    };
  }, [localValue, debouncedCommit]);

  // Trigger debounce NOW (for onBlur)
  const commitImmediately = () => {
    debouncedCommit.flush();
  };

  /**
   * CSS
   */
  const fieldTypeStyle = (isReadOnly: boolean) => {
    return css({
      fontSize: "1em",
      borderRadius: "5px",
      boxShadow: isReadOnly ? "0 0 0px rgba(0, 0, 0, 0.3)" : "0 0 1px rgba(0, 0, 0, 0.3)",
      ...(isReadOnly && { color: `${theme.text}` }),
      color: `${theme.text}`,
      outline: isReadOnly ? "0px solid transparent" : `${theme.element_outline}`,
      "&:hover": {
        borderColor: isReadOnly ? undefined : theme.metadata_highlight,
      },
      "&:focus": {
        borderColor: isReadOnly ? undefined : theme.metadata_highlight,
      },
    });
  };

  const inputFieldTypeStyle = (isReadOnly: boolean) => {
    return (
      css({
        padding: "10px 10px",
        border: "1px solid #ccc",
        background: isReadOnly ? `${theme.background}` : `${theme.element_bg}`,
        opacity: isReadOnly ? "0.6" : "1",
        resize: "vertical",
      })
    );
  };

  /**
   * Render
   */
  // input.id = input.name;
  if (field.collection) {
    if (Array.isArray(field.value)) {
      return (
        <CreatableSelect
          onChange={handleSelectChange}
          onBlur={commitImmediately}
          value={currentSelectValue}
          isMulti
          isClearable={!readonly}     // The component does not support readOnly, so we have to work around
          isSearchable={!readonly}    // by setting other settings
          openMenuOnClick={!readonly}
          menuIsOpen={readonly ? false : undefined}
          options={field.collection ? generateReactSelectLibrary(field) : []}
          styles={selectFieldStyle(theme)}
          name={field.name}
          css={fieldTypeStyle(readonly)}
          components={readonly ? {
            MultiValueRemove: () => null,
          } : undefined}>
        </CreatableSelect>
      );
    } else {
      return (
        <Select
          onChange={handleSelectChange}
          onBlur={commitImmediately}
          value={currentSelectValue}
          isClearable={!readonly}     // The component does not support readOnly, so we have to work around
          isSearchable={!readonly}    // by setting other settings
          openMenuOnClick={!readonly}
          menuIsOpen={readonly ? false : undefined}
          options={generateReactSelectLibrary(field)}
          styles={selectFieldStyle(theme)}
          name={field.name}
          css={fieldTypeStyle(readonly)}>
        </Select>
      );
    }
  } else if (field.type === "mixed_text") {
    return (
      <CreatableSelect
        onChange={handleSelectChange}
        onBlur={commitImmediately}
        value={currentSelectValue}
        isMulti
        isClearable={!readonly}     // The component does not support readOnly, so we have to work around
        isSearchable={!readonly}    // by setting other settings
        openMenuOnClick={!readonly}
        menuIsOpen={readonly ? false : undefined}
        options={field.collection ? generateReactSelectLibrary(field) : []}
        styles={selectFieldStyle(theme)}
        name={field.name}
        css={fieldTypeStyle(readonly)}>
      </CreatableSelect>
    );
  } else if (field.type === "date") {
    return (
      <ThemeProvider theme={calendarStyle(theme)}>
        <input
          onChange={handleTextChange}
          onBlur={commitImmediately}
          value={localValue}
          readOnly={readonly}
          type="datetime-local"
          name={field.name}
          // inputFormat="yyyy/MM/dd HH:mm"
          css={[fieldTypeStyle(readonly), inputFieldTypeStyle(readonly),
            {
              resize: "none",
            },
          ]}
          data-testid="dateTimePicker"
        />
      </ThemeProvider>
    );
  } else if (field.type === "time") {
    return (
      <ThemeProvider theme={calendarStyle(theme)}>
        <input
          onChange={handleTextChange}
          onBlur={commitImmediately}
          value={localValue}
          readOnly={readonly}
          type="time"
          name={field.name}
          // inputFormat="HH:mm"
          css={[fieldTypeStyle(readonly), inputFieldTypeStyle(readonly),
            {
              resize: "none",
            },
          ]}
        />
      </ThemeProvider>
    );
  } else if (field.type === "text_long") {
    return (
      <textarea
        onChange={handleTextChange}
        onBlur={commitImmediately}
        value={localValue}
        readOnly={readonly}
        name={field.name}
        css={[fieldTypeStyle(readonly), inputFieldTypeStyle(readonly)]}
      />
    );
  } else {
    return (
      <input
        onChange={handleTextChange}
        onBlur={commitImmediately}
        value={localValue}
        readOnly={readonly}
        name={field.name}
        css={[fieldTypeStyle(readonly), inputFieldTypeStyle(readonly)]}
      />
    );
  }
};

/**
 * Check field values and render warning messages
 */
const FieldValidation: React.FC<{ field: MetadataField }> = ({ field }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  /**
   * Validator for required fields
   * @param value
   */
  const required = (value: unknown) => {
    let val = value;

    if (value && typeof value === "object" && "submitValue" in value) {
      val = value.submitValue;
    }

    if (value && Array.isArray(value) && value.length === 0) {
      val = false;
    }

    return val ? undefined : t("metadata.validation.required");
  };

  /**
   * Validator for the duration field
   * @param value
   */
  const duration = (value: string) => {
    const re = /^[0-9][0-9]:[0-9][0-9]:[0-9][0-9]$/;
    return re.test(value) ? undefined : t("metadata.validation.duration-format");
  };

  /**
   * Validator for the date time fields
   * @param date
   */
  const dateTimeValidator = (date: Date | string) => {
    // Empty field is valid value in Opencast
    if (!date) {
      return undefined;
    }

    const valid = isValid(typeof date === "string" ? parseISO(date) : date);
    return valid ? undefined : t("metadata.validation.datetime");
  };

  /**
   * Returns messages in case something did not validate
   * @param field
   */
  const validate = (field: MetadataField) => {
    const validations = [];
    if (field.required) {
      validations.push(required(field.value));
    }
    if (field.id === "duration") {
      validations.push(duration(field.value));
    }
    if (field.type === "date" || field.type === "time") {
      validations.push(dateTimeValidator(field.value));
    }

    return validations;
  };

  const validateStyle = (isError: boolean) => {
    return css({
      lineHeight: "32px",
      marginLeft: "10px",
      ...(isError && { color: `${theme.error}` }),
      fontWeight: "bold",
    });
  };

  return (
    <span css={validateStyle(true)}>{validate(field)}</span>
  );
};

export default Metadata;
