/** Reusable inline loading indicator with two visual variants — info Alert (default) or plain Box. */
import { Alert, Box, CircularProgress, Typography } from "@mui/material";

/** Props for {@link Loading}. */
type LoadingProps = {
  /** Custom message rendered next to the spinner. Defaults to "Loading..." when omitted. */
  children?: JSX.Element | string;
  /** Visual container — `"alert"` (MUI Alert with info severity) or `"box"` (plain inline row). */
  containerType?: "alert" | "box";
};

/**
 * Renders a small spinner with an optional message.
 *
 * Use the default `containerType="alert"` for page-level loading states; switch
 * to `containerType="box"` to inline the spinner inside another component.
 */
export default function (props: LoadingProps) {
  const { children } = props;
  const containerType = props.containerType || "alert";

  const contentDom = <Typography>{children || "Loading..."}</Typography>;
  switch (containerType) {
    case "box":
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <CircularProgress size={20} sx={{ alignSelf: "center" }} />
          {contentDom}
        </Box>
      );

    case "alert":
    default:
      return (
        <Alert
          severity="info"
          iconMapping={{
            info: <CircularProgress size={20} sx={{ alignSelf: "center" }} />,
          }}
        >
          {contentDom}
        </Alert>
      );
  }
}
