import { memo, useState, useCallback, useEffect, KeyboardEvent } from "react";
import {
  Slider,
  Stack,
  Text,
  IconButton,
  TextField,
  StackItem,
  IStackTokens,
  IIconProps,
  ITextFieldStyles,
  ITextStyles
} from "@fluentui/react";
import { theme } from "@/utils/theme";

const containerTokens: IStackTokens = { padding: theme.spacing.s1 };
const rightIcon: IIconProps = { iconName: "ChevronRight" };
const leftIcon: IIconProps = { iconName: "ChevronLeft" };
const sliderInputStyles: Partial<ITextFieldStyles> = {
  field: {
    width: 48,
    textAlign: "center",
    outline: "none",
    borderRadius: 2,
    MozAppearance: "textfield",
    "::-webkit-outer-spin-button, ::-webkit-inner-spin-button": {
      WebkitAppearance: "none"
    }
  }
};
const textStyles: ITextStyles = { root: { paddingLeft: theme.spacing.s1, paddingRight: theme.spacing.s1 } };

interface IProps {
  min: number;
  max: number;
  value: number;
  onChange?(val: number): void;
}

export const InputSlider = memo<IProps>(function InputSlider(props) {
  const { min, max, value, onChange } = props;
  const [curVal, setCurVal] = useState(value);
  const [text, setText] = useState(value.toString());

  useEffect(() => {
    setCurVal(value);
    setText(value.toString());
  }, [value]);

  const onTextChange = useCallback((_ev, val: string) => {
    setText(val);
  }, []);

  const onKeyDown = useCallback(
    (ev: KeyboardEvent<HTMLInputElement>) => {
      if (ev.key.toLowerCase() === "enter") {
        const input = ev.currentTarget;
        const val = Number(ev.currentTarget.value);
        const min = Number(input.min);
        const max = Number(input.max);
        const value = val < min ? min : val > max ? max : val;
        onChange(value);
      }
    },
    [onChange]
  );

  const onCurValChange = useCallback((val: number) => setCurVal(val), []);
  const onChanged = useCallback(
    (_ev: any) =>
      setCurVal((v) => {
        onChange(v);
        return v;
      }),
    [onChange]
  );
  const decrease = useCallback(() => onChange && onChange(value - 1), [onChange, value]);
  const increase = useCallback(() => onChange && onChange(value + 1), [onChange, value]);

  return (
    <Stack grow horizontal disableShrink tokens={containerTokens}>
      <StackItem grow={1}>
        <Slider showValue={false} min={min} max={max} value={curVal} onChange={onCurValChange} onChanged={onChanged} />
      </StackItem>
      <Stack horizontal verticalAlign="center">
        <IconButton iconProps={leftIcon} disabled={min === value} onClick={decrease} />
        <TextField
          styles={sliderInputStyles}
          min={min}
          max={max}
          value={text}
          onChange={onTextChange}
          onKeyDown={onKeyDown}
        />
        <Text variant="large" styles={textStyles}>{` / ${max}`}</Text>
        <IconButton iconProps={rightIcon} disabled={max === value} onClick={increase} />
      </Stack>
    </Stack>
  );
});
