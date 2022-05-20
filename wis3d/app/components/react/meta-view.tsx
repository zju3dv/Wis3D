import { memo } from "react";
import { IStackStyles, Stack } from "@fluentui/react";
import { theme } from "@/utils/theme";
import { renderRecord } from "@/utils/misc";

interface IProps {
  total: number;
  shown: number;
}

export const MetaView = memo<IProps>(function MetaView(props) {
  const { total, shown, ...meta } = props;
  return (
    <Stack styles={metaContainerStyles}>
      <span>
        matches shown: {shown} / {total}
      </span>
      {renderRecord(meta)}
    </Stack>
  );
});

const metaContainerStyles: IStackStyles = {
  root: {
    position: "absolute",
    left: 0,
    bottom: 0,
    pointerEvents: "none",
    padding: theme.spacing.s1,
    textShadow: `0 0 1px black`,
    color: theme.palette.neutralLight,
    fontFamily:"monospace",
    zIndex: 1
  }
};
