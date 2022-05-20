import { memo, CSSProperties, useState, useLayoutEffect } from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { mergeStyleSets } from "@fluentui/react";
import { theme } from "@/utils/theme";
import { RndWindow } from "./rnd-window";
import { MathUtils } from "three";

const classes = mergeStyleSets({
  wrapper: {
    transform: "none !important",
  },
  labelRoot: {
    width: 0,
    height: 0,
  },
  labelWrapper: [
    theme.fonts.xLarge,
    {
      position: "relative",
      top: -64,
      cursor: "default",
      pointerEvents: "none",
      userSelect: "none",
    },
  ],
  table: {
    padding: theme.spacing.s2,
    width: "100%",
    height: "100%",
    "& tr, & th, & td": {
      padding: theme.spacing.s2,
    },
  },
  thead: {
    "&>tr>th:first-of-type": {
      textAlign: "left",
    },
  },
  tbody: {
    "&>tr>th": {
      textAlign: "left",
    },
    td: {
      textAlign: "center",
    },
  },
});

const rndManager: { prevNodeZIndex?: string; prevNode?: HTMLElement } = {};
const onMouseDown = (ev: MouseEvent) => {
  const node = (ev.currentTarget as HTMLElement).parentElement;
  if (rndManager.prevNode) {
    rndManager.prevNode.style.zIndex = rndManager.prevNodeZIndex;
  }
  rndManager.prevNode = node;
  rndManager.prevNodeZIndex = node.style.zIndex;
  node.style.zIndex = "999";
};

type Vec3 = [number, number, number];

interface IProps {
  position: Vec3;
  scale: Vec3;
  rotation: Vec3;
  name?: string;
  onClose?(): void;
  onUnmount?(): void;
}

let portalRef: HTMLElement;

// const properties: ["position", "rotation", "scale"] = ["position", "rotation", "scale"];
const rndStyle: CSSProperties = { pointerEvents: "auto" /* position: "fixed" */, bottom: 0 };

export const BoxProperties = memo<IProps>(function BoxProperties(props) {
  const { position, scale, rotation, name, onClose } = props;
  const [docker, setDocker] = useState<HTMLElement>();

  useLayoutEffect(() => {
    if (!portalRef) portalRef = document.getElementById("property-docker");
    const docker = document.createElement("div");
    setDocker(docker);
    docker.className = name;
    portalRef.appendChild(docker);
    return () => {
      portalRef.removeChild(docker);
    };
  }, []);

  useLayoutEffect(() => {
    if (!docker) return;

    render(
      <RndWindow
        title={name}
        enableResizing={false}
        onClose={onClose}
        onMouseDown={onMouseDown}
        style={rndStyle}
      >
        <table className={classes.table}>
          <thead className={classes.thead}>
            <tr>
              <th>properties</th>
              <th>x</th>
              <th>y</th>
              <th>z</th>
            </tr>
          </thead>
          <tbody className={classes.tbody}>
            <tr>
              <th>position</th>
              {position.map((v, i) => (
                <td key={i}>{v.toFixed(3)}</td>
              ))}
            </tr>
            <tr>
              <th>scale</th>
              {scale.map((v, i) => (
                <td key={i}>{v.toFixed(3)}</td>
              ))}
            </tr>
            <tr>
              <th>rotation</th>
              {rotation.map((v, i) => (
                <td key={i}>{`${MathUtils.radToDeg(v).toFixed(2)}°`}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </RndWindow>,
      docker
    );
    return () => {
      unmountComponentAtNode(docker);
    };
  }, [docker, position, scale, rotation]);

  return <></>;
});
