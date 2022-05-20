import { memo, useState } from "react";
import { useXHR } from "@/utils/hooks";
import { VoxelLoader } from "@/utils/VoxelLoader";
import { Mesh, DefaultLoadingManager, BufferGeometry, BoxGeometry, BufferAttribute, MeshBasicMaterial, Color } from "three";
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils";
import { useEffect } from "react";
import { centerOnDbClick } from "./trackball-controls";

interface IProps {
  url: string;
  name?: string;
  visible?: boolean;
  defaultColor?: string;
  vertexColors?: boolean;
}

const generateMesh = function(voxel_size, boxes, defaultColor, vertexColors) {
  let mergedGeometry = new BufferGeometry();
  var hasColor = false;

  var voxelGeometries = [];

  boxes.map((box, index) => {
    const {voxel_center, color} = box;
    let voxelGeometry = new BoxGeometry(voxel_size, voxel_size, voxel_size);

    if (color != null) {
      hasColor = true;
      const boxColor = [color[0] / 255, color[1] / 255, color[2] /255]
      var colors = [];
      for(var i = 0; i < voxelGeometry.attributes.position.count; i++) {
        colors.push(boxColor);
      }
      voxelGeometry.attributes.color = new BufferAttribute(new Float32Array(colors.flat()), 3);
    }

    voxelGeometry.translate(voxel_center[0], voxel_center[1], voxel_center[2]);
    voxelGeometries.push(voxelGeometry);
  })

  mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(voxelGeometries);
  mergedGeometry.computeVertexNormals();

  var material;
  if (hasColor && vertexColors) {
    material = new MeshBasicMaterial({ color: 0xffffff });
    material.vertexColors = true;
  } else {
    const materialColor = new Color(defaultColor);
    material = new MeshBasicMaterial({ color: materialColor})
  }
  material.transparent = true;
  material.opacity = 0.5;
  var voxels = new Mesh(mergedGeometry, material);
  
  return voxels;
}

const BoxVoxel = memo<IProps>(function BoxVoxel(props) {
  const { url, name, visible = true, defaultColor, vertexColors } = props;
  const [obj, setObj] = useState<Mesh>();
  const data = useXHR(url, "GET", "json", []);

  useEffect(() => {
    if (data.length != 0) {
      if(data[1].voxels.length > 0) {
        const mesh = generateMesh(data[0].voxel_size, data[1].voxels, defaultColor, vertexColors);
        setObj(mesh);
      }
    }
  }, [data, defaultColor, vertexColors])

  return obj ? <primitive visible={visible} object={obj} onDoubleClick={centerOnDbClick}/> : <></>;
});

const FileVoxel = memo<IProps>(function FileVoxel(props) {
  const { url, name, visible = true, defaultColor, vertexColors } = props;
  const [obj, setObj] = useState<Mesh>();

  useEffect(() => {
    const loader = new VoxelLoader(DefaultLoadingManager);
    loader.setVoxelColor(defaultColor);
    loader.setVertexColors(vertexColors);
    loader.loadFile(url, function (voxels: Mesh) {
      setObj(voxels);
    });
  }, [url, defaultColor, vertexColors]);

  return obj ? <primitive visible={visible} object={obj} /> : <></>;
});

export const Voxel = memo<IProps>(function Voxel(props) {
    return props.url.endsWith("json") ? <BoxVoxel {...props} /> : <FileVoxel {...props} />
});

export default Voxel;
