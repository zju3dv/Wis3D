import { memo, useCallback, useRef, useState, useEffect } from "react";
import {
  Checkbox,
  Label,
  Stack,
  List,
  IStackStyles,
  StackItem,
  DefaultButton,
  memoizeFunction,
  ICheckboxStyles,
  mergeStyles,
  mergeStyleSets
} from "@fluentui/react";
import { useObjectStore, objectSelector, objectState, OBJECT_TYPE, IObject } from "@/stores/object-store";
import { theme } from "@/utils/theme";

const wrapperStyles: IStackStyles = {
  root: {
    padding: theme.spacing.s1,
    height: "100%"
  }
};

const listStyles: IStackStyles = {
  root: {
    overflow: "auto"
  }
};

const getCheckboxStyles = memoizeFunction(
  (color: string, checked: boolean) =>
    ({
      root: { padding: theme.spacing.s2 },
      checkbox: {
        background: checked ? color : "white",
        borderColor: color,
        borderWidth: 2,
      },
    } as ICheckboxStyles)
);

const getLabelCheckboxStyles = memoizeFunction(
  (checked: boolean) => 
    ({
      root: { padding: theme.spacing.s2 },
      checkbox: {
        background: checked ? "grey" : "white",
        borderColor: "grey",
        borderWidth: 2,
      }
    } as ICheckboxStyles)
)

var isChoiceSelect = false;
const checkGroup = new Set();
const labelMap = new Map();

const ChoiceGroup = function(props) {
  const choiceItemStyles = mergeStyleSets({
    input: { 
      width: "20px",
      height: "20px",
      display: "none",
    },
    label: {
      "&::before":{
        content: "\"\"",
        display: "inline-block",
        verticalAlign: "middle",
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        border: `2px solid ${props.color}`,
        boxSizing: "border-box",
        marginRight: `${theme.spacing.s1}`
      }
    },
    labelAfter: {
      "&::before":{
        backgroundColor: `${props.color}`,
        backgroundClip: "content-box",
        padding: "3px"
      },
    }
  })

  const choiceItemId = props.type + props.index;
  const onChoiceChange = (event) => {
    isChoiceSelect = true;
    objectState.set((state) => {
      for (const key in state.objDict) {
        for (const [index, obj] of state.objDict[key].entries()) {
          if (key == props.type && index == props.index ) {
            obj.visible = true;
            obj.select = true;
            checkGroup.add(key + index);
          } 
          else {
            obj.visible = false;
            obj.select = false;
            checkGroup.delete(key + index);
          }
        }
      }
    })
  }

  return (
    <div>
      <input checked={props.select} type="radio" name="group" className={choiceItemStyles.input} id={choiceItemId} onChange={onChoiceChange}/>
      <label className={`${ choiceItemStyles.label} ${props.select ? choiceItemStyles.labelAfter:""}`} htmlFor={choiceItemId}></label>
    </div>
  )
}

const selectItemClass = mergeStyles({ display: 'flex', alignItems: 'center' });

const getChoiceItem = function() {
  let choiceItem = checkGroup.values().next().value;
  let index = choiceItem.match(/\d+/g)[0];
  let type = choiceItem.slice(0, -index.length);
  return [type, index];
}

const updateLabelMap = function() {
  labelMap.forEach(function(value, key) {
    labelMap.set(key, 0);
  })
  checkGroup.forEach(function(obj) {
    let type = (obj as any).match(/[a-z,_]+/g)[0];
    labelMap.set(type, 1);
  })
}

const ObjectLabel = function ObjectLabel(props) {
  const { label, type } = props;
  const [ visible, setVisible ] = useState<boolean>(true);
  const objectDict = useObjectStore(objectSelector);
  labelMap.set(type, 1);

  const labelStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  };

  const onLabelChoiceChange = (event: any, checked: boolean) => {
    setVisible(checked)

    if(event.isTrusted) {
      for (const i in objectDict[type]) {
        if(objectDict[type][i].visible != checked) {
          document.getElementById("checkbox-" + type + "-" + i)?.click();
        }
      }
    }
  }

  useEffect(
    () => {
      updateLabelMap();
      labelMap.forEach(function(value, key) {
        let target = document.getElementById("label" + key);
        if(target) {
          if (value == 0 && (target as any)?.checked) {
            target.click();
          } else if (value == 1 && !(target as any).checked) {
            target.click();
          }
        }
      })
    },
    [checkGroup.values()]
  )

  return (
    <div style={labelStyle}>
      <Label>{ label }</Label>
      <Checkbox checked={visible} styles={getLabelCheckboxStyles(visible)} onChange={onLabelChoiceChange} id={"label"+type}/>
    </div>
  )
}

const getOnRenderCell = (type: OBJECT_TYPE) => (obj: IObject, i: number) => {
  const { visible, select, color, name } = obj;
  if(visible) checkGroup.add(type + i);

  const onChange = (ev: any, checked: boolean) => {
    type = ev.target.id.split('-')[1]
    i = ev.target.id.split('-')[2]
    objectState.set((state) => void (state.objDict[type][i].visible = checked));
    if (checked) checkGroup.add(type + i);
    else checkGroup.delete(type + i);
  
    if (checkGroup.size == 0) {
      objectState.set((state) => void (state.objDict[type][i].select = false));
      isChoiceSelect = false;
    } else if ( checkGroup.size == 1) {
      let choiceItem = checkGroup.values().next().value;
      (document.getElementById(choiceItem) as HTMLInputElement).click();
    } else {
      if (isChoiceSelect) {
        const [type, index] = getChoiceItem();
        objectState.set((state) => void (state.objDict[type][index].select = false));
        isChoiceSelect = false;
      }
    }
  }

  return (
    <div className={selectItemClass}>
      <Checkbox checked={visible} styles={getCheckboxStyles(color, visible)} onChange={onChange} id={"checkbox-" + type + "-" + i}/>
      <ChoiceGroup name={name} color={color} type={type} index={i} select={select}/>
      <label>{name}</label>
    </div>
  )
};
const onRenderMeshCell = getOnRenderCell("meshes");
const onRenderPointCloudCell = getOnRenderCell("point_clouds");
const onRenderBoxCell = getOnRenderCell("boxes");
const onRenderCameraPoseCell = getOnRenderCell("camera_trajectories");
const onRenderLineCell = getOnRenderCell("lines");
const onRenderVoxelCell = getOnRenderCell("voxels");
const onRenderSphereCell = getOnRenderCell('spheres');

interface IProps {
  frameIndex?: number;
}

export const ObjectList = memo<IProps>(function ObjectList(props) {
  const objectDict = useObjectStore(objectSelector);
  const allVisibility = useRef(true);
  const { frameIndex } = props;

  useEffect(() => {
    checkGroup.clear();
  }, [frameIndex]);
  
  const toggleAllVisibility = useCallback(() => {
    allVisibility.current = !allVisibility.current;
    if (isChoiceSelect) {
      const [type, index] = getChoiceItem();
      objectState.set((state) => void (state.objDict[type][index].select = false));
      isChoiceSelect = false;
    }
    objectState.set((state) => {
      for (const key in state.objDict) {
        for (const [index, obj] of state.objDict[key].entries()) {
          obj.visible = allVisibility.current;
          if (allVisibility.current) checkGroup.add(key + index);
          else checkGroup.delete(key + index);
        }
      }
    });
  }, []);

  const getListExists = function (type: OBJECT_TYPE) {
    return (objectDict[type] && objectDict[type].length != 0) ? true : false;
  }
  
  return (
    <Stack styles={wrapperStyles}>
      <StackItem grow styles={listStyles}>
        {getListExists("meshes") && (
          <div>
            <ObjectLabel label="Mesh" type="meshes"/>
            <List items={objectDict.meshes} onRenderCell={onRenderMeshCell} onShouldVirtualize = { () => false}/>
          </div>
        )}
        {getListExists("point_clouds") && (
          <div>
            <ObjectLabel label="Point Cloud" type="point_clouds" />
            <List items={objectDict.point_clouds} onRenderCell={onRenderPointCloudCell} onShouldVirtualize = { () => false}/>
          </div>
        )}
        {getListExists("boxes") && (
          <div>
            <ObjectLabel label="Box" type="boxes" />
            <List items={objectDict.boxes} onRenderCell={onRenderBoxCell} onShouldVirtualize = { () => false}/>
          </div>
        )}
        {getListExists("camera_trajectories") && (
          <div>
            <ObjectLabel label="Camera Trajectory" type="camera_trajectories" />
            <List items={objectDict.camera_trajectories} onRenderCell={onRenderCameraPoseCell} onShouldVirtualize = { () => false}/>
          </div>
        )}
        {getListExists("lines") && (
          <div>
            <ObjectLabel label="Line" type="lines" />
            <List items={objectDict.lines} onRenderCell={onRenderLineCell} onShouldVirtualize = { () => false}/>
          </div>
        )}
        {getListExists("voxels") && (
          <div>
            <ObjectLabel label="Voxel" type="voxels" />
            <List items={objectDict.voxels} onRenderCell={onRenderVoxelCell} onShouldVirtualize = { () => false}/>
          </div>
        )}
        {getListExists("spheres") && (
          <div>
            <ObjectLabel label="Sphere" type="spheres" />
            <List items={objectDict.spheres} onRenderCell={onRenderSphereCell} onShouldVirtualize = { () => false}/>
          </div>
        )}
      </StackItem>
      <DefaultButton text="Toggle All" onClick={toggleAllVisibility} />
    </Stack>
  );
});
