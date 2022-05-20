import { memo, useState, useCallback, useRef, useEffect } from "react";
import { IconButton, IButtonStyles } from "@fluentui/react";
import { theme } from "@/utils/theme";
import { folder, useControls } from "leva";
import { StoreType } from "leva/dist/declarations/src/types";

const playIcon = { iconName: "Play" };
const pauseIcon = { iconName: "Pause" };

const playButtonStyles: IButtonStyles = {
  root: { borderRadius: "50%", border: `1px solid ${theme.palette.themePrimary}` }
};

interface IPlayButtonProps {
  disabled: boolean;
  onUpdateFrame?(): void;
  store1: StoreType;
  store2: StoreType;
  currentStore: StoreType;
}

const schema = {
  interval: {
    label: "interval (ms)",
    hint: "interval (ms)",
    value: (JSON.parse(localStorage.getItem("interval")) as number) ?? 300,
    min: 10,
    max: 5000
  }
};

export const PlayButton = memo<IPlayButtonProps>(function (props) {
  const { disabled, onUpdateFrame, store1, store2, currentStore } = props;
  const [playing, setPlaying] = useState(false);
  const timeout = useRef<number>();
  const { interval: interval1 } = useControls(schema, { store: store1 });
  const { interval: interval2 } = useControls(schema, { store: store2 });
  const interval = currentStore === store1 ? interval1 : interval2;

  useEffect(() => {
    if (timeout.current) {
      clearInterval(timeout.current);
      timeout.current = undefined;
      setPlaying(false);
    }
  }, [disabled]);

  useEffect(() => {
    if (timeout.current) {
      clearInterval(timeout.current);
      timeout.current = window.setInterval(onUpdateFrame, interval);
    }
  }, [interval]);

  const onClick = useCallback(() => {
    if (timeout.current) {
      clearInterval(timeout.current);
      timeout.current = undefined;
      setPlaying(false);
    } else {
      timeout.current = window.setInterval(onUpdateFrame, interval);
      setPlaying(true);
    }
  }, [interval, onUpdateFrame]);

  return (
    <IconButton
      disabled={disabled}
      iconProps={playing ? pauseIcon : playIcon}
      onClick={onClick}
      styles={playButtonStyles}
    />
  );
});

export default PlayButton;
