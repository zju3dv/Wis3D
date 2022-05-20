import {
  memo,
  useState,
  useCallback,
  useRef,
  useMemo,
  PropsWithChildren,
  MouseEvent,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import { Rnd, Props as RndProps, RndDragCallback, RndResizeCallback } from "react-rnd";
import {
  Text,
  Stack,
  CommandBar,
  IStackStyles,
  mergeStyleSets,
  ICommandBarItemProps,
  ICommandBarStyles,
} from "@fluentui/react";
import { useId } from "@fluentui/react-hooks";
import { theme } from "@/utils/theme";

const noop = () => undefined;

const classes = mergeStyleSets({
  wrapper: {
    boxShadow: theme.effects.elevation8,
    border: `1px solid ${theme.palette.neutralLight}`,
    background: "white",
    display: "flex !important",
    flexDirection: "column",
  },
  main: {
    flex: 1,
    overflow: "hidden",
    cursor: "default",
  },
});

const mountedHeaderStyles: IStackStyles = {
  root: {
    background: "white",
    paddingLeft: theme.spacing.m,
    cursor: "move",
    borderBottom: `1px solid ${theme.palette.neutralLighter}`,
  },
};

const initialHeaderStyles: IStackStyles = {
  root: { ...(mountedHeaderStyles.root as any), width: "fit-content" },
};

const commandBarStyles: ICommandBarStyles = { root: { paddingRight: 0 } };

type IRndWindowProps = PropsWithChildren<
  {
    title?: string;
    docker?: HTMLElement;
    onClose?: (ev: MouseEvent<any>) => void;
  } & Partial<RndProps>
>;

const minimizedSize = { width: "auto", height: "auto" };
export const RndWindow = memo<IRndWindowProps>(function RndWindow(props) {
  const {
    children,
    title = " ",
    docker,
    onClose,
    default: initialProps,
    style,
    width,
    ...otherProps
  } = props;
  const ref = useRef<Rnd>();
  const id = useId();
  const [position, setPosition] = useState({
    x: initialProps?.x ?? 0,
    y: initialProps?.y ?? 0,
  });
  const [size, setSize] = useState({
    width: initialProps?.width ?? "auto",
    height: initialProps?.height ?? "auto",
  });
  const prevPos = useRef(position);
  const [minimized, setMinimized] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [minWidth, setMinWidth] = useState<number>();
  const [wrapperStyle, setWrapperStyle] = useState(style);

  const toggleMinimize = useCallback(() => setMinimized((val) => !val), []);
  const toggleCollapse = useCallback(() => setCollapsed((val) => !val), []);

  useLayoutEffect(() => {
    const header = document.getElementById(id);
    setMinWidth(header.clientWidth + 104);
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    setPosition(
      minimized
        ? (pos) => {
            prevPos.current = pos;
            return { x: 0, y: 0 };
          }
        : prevPos.current
    );
  }, [minimized]);

  useLayoutEffect(() => {
    setWrapperStyle(
      minimized
        ? {
            ...style,
            position: "static",
            transform: "translate(0,0)",
          }
        : style
    );
  }, [minimized, style]);

  const onDragStop = useCallback<RndDragCallback>((_e, d) => setPosition(d), [setPosition]);
  const onResizeStop = useCallback<RndResizeCallback>((_e, _direction, ref, _delta, position) => {
    setSize({ width: ref.clientWidth, height: "auto" });
    setPosition(position);
  }, []);

  const commands = useMemo(() => {
    const commands: ICommandBarItemProps[] = [];
    docker &&
      commands.push({
        key: "minimize",
        iconOnly: true,
        iconProps: { iconName: minimized ? "ChromeRestore" : "ChromeMinimize" },
        onClick: toggleMinimize,
      });
    commands.push({
      key: "collapse",
      disabled: minimized,
      iconOnly: true,
      iconProps: { iconName: collapsed ? "ChevronDownMed" : "ChevronUpMed" },
      onClick: toggleCollapse,
    });
    onClose &&
      commands.push({
        id: title,
        key: "close",
        iconOnly: true,
        iconProps: { iconName: "ChromeClose" },
        onClick: onClose,
      });
    return commands;
  }, [docker, minimized, collapsed, title, onClose]);

  const node = (
    <Rnd
      ref={ref}
      className={classes.wrapper}
      lockAspectRatio
      bounds="parent"
      dragHandleClassName="rnd-titlebar"
      minWidth={minWidth}
      size={minimized ? minimizedSize : size}
      position={position}
      onDragStop={onDragStop}
      onResizeStop={onResizeStop}
      dragAxis={minimized ? "x" : "both"}
      style={wrapperStyle}
      {...otherProps}
    >
      <Stack
        id={id}
        className="rnd-titlebar"
        horizontal
        verticalAlign="center"
        horizontalAlign={mounted ? "space-between" : undefined}
        styles={mounted ? mountedHeaderStyles : initialHeaderStyles}
      >
        <Text variant="large">{title}</Text>
        <CommandBar items={commands} styles={commandBarStyles} onReduceData={noop} />
      </Stack>
      {mounted && <div className={classes.main}>{collapsed || minimized || children}</div>}
    </Rnd>
  );

  return minimized && docker ? createPortal(node, docker) : node;
});
