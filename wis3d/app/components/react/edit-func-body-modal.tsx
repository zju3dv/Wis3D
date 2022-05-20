import React, { CSSProperties, FormEvent, memo, useCallback, useRef } from "react";
import { Dialog, DialogFooter, IDialogContentProps, PrimaryButton, Text, TextField } from "@fluentui/react";
import { theme } from "@/utils/theme";

interface IProps {
  hidden: boolean;
  onDismiss(): void;
  text: string;
  onSave(text: string): void;
}

export const EditFuncBodyModal = memo<IProps>(function EditFuncBodyModal(props) {
  const { hidden, onDismiss, text, onSave } = props;
  const textRef = useRef(text);

  const onTextChange = useCallback((_ev: FormEvent<HTMLTextAreaElement>, val: string) => (textRef.current = val), []);
  const onClickSave = useCallback(() => onSave(textRef.current), [onSave]);

  return (
    <Dialog
      title="Edit Color Mapping Function"
      hidden={hidden}
      maxWidth="80vw"
      dialogContentProps={dialogContentProps}
      onDismiss={onDismiss}
    >
      <Text>
        The color mapping has a signature of
        <pre style={preStyles}>
          (palette: (index: number) =&gt; string, min: number, max: number, val: number, i: number) =&gt; string
          <br />
          @param palette: given an index of range [0, 1] returns the corresponding color from the choosen colormap.
          <br />
          @param min: the minimum metric value of all keypoints.
          <br />
          @param max: the maxinum metric value of all keypoints.
          <br />
          @param localMax: the maximum value of the top 95% of the metric after sorting from small to large
          <br />
          @param val: the metric value of the current keypoint.
          <br />
          @param i: the index of the keypoint.
          <br />
          @returns: a color string, e.g. "green", "#00ff00", "rgb(0,255,0)", "rgba(0,255,0,0.5)"
        </pre>
      </Text>
      <TextField multiline rows={10} defaultValue={text} onChange={onTextChange} />
      <DialogFooter>
        <PrimaryButton text="Save" onClick={onClickSave} />
      </DialogFooter>
    </Dialog>
  );
});

const dialogContentProps: IDialogContentProps = {
  showCloseButton: true,
  isMultiline: true,
  styles: {
    subText: theme.fonts.large,
    inner: { overflow: "hidden" },
    innerContent: { overflow: "auto" }
  },
  subText:
    "You can write your own function body to get the color for each keypoint. (Requires basic knowledge of javascript.)"
};

const preStyles: CSSProperties = { paddingLeft: 12, lineHeight: 1.5, color: theme.palette.green };
