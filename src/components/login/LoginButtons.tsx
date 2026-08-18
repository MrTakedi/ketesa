import { Button, CardActions } from "@mui/material";
import { useLogin, useTranslate } from "react-admin";

import createLogger from "../../utils/logger";

import { LoginMethod, ProbeState } from "./types";

const log = createLogger("login-buttons");

interface LoginButtonsProps {
  probeState: ProbeState;
  loginMethod: LoginMethod;
  loading: boolean;
}

export const LoginButtons = ({
  probeState,
  loginMethod,
  loading,
}: LoginButtonsProps) => {
  const translate = useTranslate();
  const login = useLogin();

  void loginMethod;

  const handleSSO = () => {
    if (probeState.tag !== "ready") {
      return;
    }

    const { ssoBaseUrl } = probeState.caps;

    localStorage.setItem("sso_base_url", ssoBaseUrl);

    const redirectUrl =
      window.location.origin + window.location.pathname;

    const ssoFullUrl =
      `${ssoBaseUrl}/_matrix/client/v3/login/sso/redirect` +
      `?redirectUrl=${encodeURIComponent(redirectUrl)}`;

    window.location.href = ssoFullUrl;
  };

  const handleOIDC = () => {
    if (probeState.tag !== "ready") {
      return;
    }

    log.debug("OIDC login initiated", {
      baseUrl: probeState.url,
    });

    login({
      base_url: probeState.url,
      clientUrl:
        window.location.origin + window.location.pathname,
      authMetadata: probeState.caps.authMetadata,
    });
  };

  const ready = probeState.tag === "ready";
  const caps = ready ? probeState.caps : null;

  if (!caps) {
    return (
      <CardActions
        className="actions"
        sx={{
          flexDirection: "column",
          gap: 1,
          "& > :not(:first-of-type)": {
            ml: 0,
          },
        }}
      />
    );
  }

  return (
    <CardActions
      className="actions"
      sx={{
        flexDirection: "column",
        gap: 1,
        "& > :not(:first-of-type)": {
          ml: 0,
        },
      }}
    >
      {caps.sso && (
        <Button
          variant="contained"
          color="secondary"
          onClick={handleSSO}
          disabled={loading}
          fullWidth
        >
          {translate("ketesa.auth.sso_sign_in")}
        </Button>
      )}

      {caps.oidc && (
        <Button
          variant="contained"
          color="secondary"
          onClick={handleOIDC}
          disabled={loading}
          fullWidth
        >
          {translate("ketesa.auth.oidc_sign_in")}
        </Button>
      )}
    </CardActions>
  );
};
