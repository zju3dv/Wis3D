import { getTheme } from "@fluentui/react";
import { LevaCustomTheme } from "leva/dist/declarations/src/styles";

export const theme = getTheme();

export const levaTheme: LevaCustomTheme = {
  sizes: {
    rootWidth: "310px", 
    controlWidth: "57%" 
  },
  space: {
    sm: "3px",
  },
  colors: {
    elevation1: theme.semanticColors.disabledBackground, // slider color
    elevation2: theme.semanticColors.bodyBackground, // background color
    elevation3: theme.semanticColors.infoBackground, // input background
    accent1: theme.semanticColors.inputPlaceholderText, // input hovered border color
    accent2: theme.semanticColors.disabledSubtext, // slider bar color
    accent3: theme.semanticColors.disabledText, // slider bar hovered color
    highlight1: theme.semanticColors.bodySubtext, // folder helper color
    highlight2: theme.semanticColors.bodySubtext, // text color
    highlight3: theme.semanticColors.bodyText, // text hovered color
    toolTipText: theme.semanticColors.bodyText
  }
};
