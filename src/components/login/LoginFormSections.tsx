import { useEffect, useRef } from "react";
import { Box, Collapse, Typography } from "@mui/material";
import { required, SelectInput, TextInput, useTranslate } from "react-admin";
import { useFormContext } from "react-hook-form";

import { isValidBaseUrl } from "../../providers/matrix";

import { LoginMethod, ProbeState } from "./types";
import { prependDefaultProtocol } from "./urls";
import { UseLoginProbe } from "./useLoginProbe";

interface LoginFormSectionsProps {
  formData: { base_url?: string; username?: string };
  probeState: ProbeState;
  loginMethod: LoginMethod;
  setLoginMethod: (method: LoginMethod) => void;
  loading: boolean;
  restrictBaseUrlSingle: string | null;
  restrictBaseUrlMultiple: string[] | null;
  baseUrlChoices: string[];
  start: UseLoginProbe["start"];
}

export const LoginFormSections = ({
  formData,
  probeState,
  loginMethod,
  setLoginMethod,
  loading,
  restrictBaseUrlSingle,
  restrictBaseUrlMultiple,
  baseUrlChoices,
  start,
}: LoginFormSectionsProps) => {
  const translate = useTranslate();
  const form = useFormContext();
  const hasInitializedUrlParams = useRef(false);

  void loginMethod;
  void setLoginMethod;

  const validateBaseUrl = (value: string) => {
    if (!value.match(/^(https?):\/\//)) {
      return translate("ketesa.auth.protocol_error");
    }

    if (!isValidBaseUrl(value)) {
      return translate("ketesa.auth.url_error");
    }

    return undefined;
  };

  const handleBaseUrlBlurOrChange = (
    event?: { target?: { value?: string } }
  ) => {
    let value = event?.target?.value || formData.base_url;

    if (!value) {
      return;
    }

    if (!value.match(/^https?:\/\//)) {
      value = prependDefaultProtocol(value);

      if (!restrictBaseUrlMultiple && !restrictBaseUrlSingle) {
        form.setValue("base_url", value, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }

    form.trigger("base_url");

    const onResolved =
      restrictBaseUrlMultiple || restrictBaseUrlSingle
        ? undefined
        : (nextUrl: string) =>
            form.setValue("base_url", nextUrl, {
              shouldValidate: true,
              shouldDirty: true,
            });

    start(value, onResolved);
  };

  useEffect(() => {
    if (hasInitializedUrlParams.current) {
      return;
    }

    hasInitializedUrlParams.current = true;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      let serverURL = params.get("server");

      if (!serverURL) {
        return;
      }

      if (!serverURL.match(/^(http|https):\/\//)) {
        serverURL = prependDefaultProtocol(serverURL);
      }

      form.setValue("base_url", serverURL, {
        shouldValidate: true,
        shouldDirty: true,
      });

      const onResolved =
        restrictBaseUrlMultiple || restrictBaseUrlSingle
          ? undefined
          : (nextUrl: string) =>
              form.setValue("base_url", nextUrl, {
                shouldValidate: true,
                shouldDirty: true,
              });

      start(serverURL, onResolved);
    }, 0);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const serverVersionText =
    probeState.tag === "ready" && probeState.caps.serverVersion
      ? `${translate("ketesa.auth.server_version")} ${probeState.caps.serverVersion}`
      : "";

  const matrixVersionsText =
    probeState.tag === "ready" &&
    probeState.caps.matrixVersions.length > 0
      ? `${translate("ketesa.auth.supports_specs")} ${probeState.caps.matrixVersions.join(", ")}`
      : "";

  const lastFlowsRef = useRef("");

  if (probeState.tag === "incompatible") {
    lastFlowsRef.current = probeState.advertisedFlows.join(", ");
  }

  return (
    <>
      <Box>
        {restrictBaseUrlMultiple && (
          <SelectInput
            source="base_url"
            label="ketesa.auth.base_url"
            select={true}
            autoComplete="url"
            fullWidth
            {...(loading ? { disabled: true } : {})}
            onChange={handleBaseUrlBlurOrChange}
            validate={[required(), validateBaseUrl]}
            choices={baseUrlChoices}
          />
        )}

        {!restrictBaseUrlSingle && !restrictBaseUrlMultiple && (
          <TextInput
            source="base_url"
            label="ketesa.auth.base_url"
            autoComplete="url"
            fullWidth
            {...(loading ? { disabled: true } : {})}
            resettable={true}
            validate={[required(), validateBaseUrl]}
            onBlur={handleBaseUrlBlurOrChange}
          />
        )}
      </Box>

      <Box aria-live="polite">
        <Collapse
          in={probeState.tag === "resolving"}
          unmountOnExit
        >
          <Typography
            className="serverState"
            color="text.secondary"
            sx={{ wordBreak: "break-word" }}
          >
            {translate("ketesa.auth.server_state.resolving")}
          </Typography>
        </Collapse>

        <Collapse
          in={probeState.tag === "unreachable"}
          unmountOnExit
        >
          <Typography
            className="serverState"
            color="error"
            sx={{ wordBreak: "break-word" }}
          >
            {translate("ketesa.auth.server_state.unreachable")}
          </Typography>
        </Collapse>

        <Collapse
          in={probeState.tag === "incompatible"}
          unmountOnExit
        >
          <Typography
            className="serverState"
            color="error"
            sx={{ wordBreak: "break-word" }}
          >
            {translate("ketesa.auth.server_state.incompatible", {
              flows: lastFlowsRef.current,
            })}
          </Typography>
        </Collapse>

        <Collapse
          in={
            probeState.tag === "ready" &&
            probeState.caps.suppressPassword
          }
          unmountOnExit
        >
          <Typography
            className="serverState"
            color="text.secondary"
            sx={{ wordBreak: "break-word" }}
          >
            {translate(
              "ketesa.auth.server_state.suppress_password_notice"
            )}
          </Typography>
        </Collapse>
      </Box>

      <Collapse
        in={!!serverVersionText || !!matrixVersionsText}
        unmountOnExit
      >
        <Box>
          {serverVersionText && (
            <Typography
              className="serverVersion"
              sx={{ wordBreak: "break-word" }}
            >
              {serverVersionText}
            </Typography>
          )}

          {matrixVersionsText && (
            <Typography
              className="matrixVersions"
              sx={{ wordBreak: "break-word" }}
            >
              {matrixVersionsText}
            </Typography>
          )}
        </Box>
      </Collapse>
    </>
  );
};
