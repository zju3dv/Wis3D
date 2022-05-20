import { memo } from "react";
import { IStackStyles, Stack } from "@fluentui/react";
import { theme } from "@/utils/theme";
import { renderRecord } from "@/utils/misc";

interface IProps {
  index: number;
  kpt0: number[];
  kpt1: number[];
}

export const KeypointInfoView = memo<IProps>(function KeypointInfoView(props) {
  const { index, kpt0, kpt1, ...info } = props;
  return (
    <Stack styles={matchInfoContainerStyles}>
      <span>highlighted index: {index}</span>
      <span>
        keypoints: ({kpt0.join(", ")}) &rarr; ({kpt1.join(", ")})
      </span>
      {renderRecord(info)}
    </Stack>
  );
});

const matchInfoContainerStyles: IStackStyles = {
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    pointerEvents: "none",
    padding: theme.spacing.s1,
    textShadow: "0 0 1px black",
    fontFamily: "monospace",
    color: theme.palette.neutralLight,
    zIndex: 1
  }
};
