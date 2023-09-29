import {memo, useState, useCallback, useRef, useEffect} from "react";
import dynamic from "next/dynamic";
import {useRouter} from "next/router";
import type {UrlObject} from "url";
import {Text, Stack, mergeStyleSets, IStackStyles, PivotItem} from "@fluentui/react";
import Select from 'react-select';
import {LevaPanel, useControls, useCreateStore} from "leva";
import {levaTheme, theme} from "@/utils/theme";
import {InputSlider} from "@/components/react/input-slider";
import {useObjectStore, objectState, objectSelector} from "@/stores/object-store";
import {ObjectList} from "@/components/react/object-list";
import {RndWindow} from "@/components/react/rnd-window";
import {useXHR} from "@/utils/hooks";
import {useHotkeys} from "react-hotkeys-hook";

const Pivot = dynamic(() => import("@fluentui/react/lib/Pivot").then(({Pivot}) => Pivot), {ssr: false});
const PlayButton = dynamic(() => import("@/components/react/play-button"), {ssr: false});
const Canvas = dynamic(() => import("@/components/canvas/canvas"), {ssr: false});
const Scene = dynamic(() => import("@/components/canvas/scene"), {ssr: false});
const Correspondence = dynamic(() => import("@/components/canvas/correspondence"), {ssr: false});

const rndManager: { prevNodeZIndex?: string; prevNode?: HTMLElement } = {};
const onMouseDown = (ev: MouseEvent) => {
    const node = ev.currentTarget as HTMLElement;
    if (rndManager.prevNode) {
        rndManager.prevNode.style.zIndex = rndManager.prevNodeZIndex;
    }
    rndManager.prevNode = node;
    rndManager.prevNodeZIndex = node.style.zIndex;
    node.style.zIndex = "999";
};

const base = process.env.NODE_ENV === "production" ? "" : "http://dgpu.idr.ai:19091";

const Home = memo(function Home() {
    const router = useRouter();
    const tab = router.query.tab as string || "3d";
    const sequence = router.query.sequence as string;
    const [frameIndex, setFrameIndex] = useState(0);
    const store1 = useCreateStore();
    const store2 = useCreateStore();
    const seqs = useXHR(`${base}/all_sequences`, "GET", "json", []);
    const seqName = sequence || seqs[0];
    const framesUrl = seqName && `${base}/all_scenes_in_sequence?sequence=${encodeURIComponent(seqName)}`;
    const frames = useXHR(framesUrl, "GET", "json", [], (ev) => {
        const length = (ev.currentTarget as XMLHttpRequest).response?.length;
        if (!length) {
            // console.log("no frames in this sequence")
            setFrameIndex(0);
            localStorage.setItem('myFrameIndex', "0");
        } else if (frameIndex >= length) {
            // console.log("frameIndex >= length", frameIndex, length);
            setFrameIndex(length - 1);
            localStorage.setItem('myFrameIndex', (length - 1).toString());
        } else {
            // console.log("else");
            let myFrameIndex = parseInt(localStorage.getItem("myFrameIndex"), 10);
            if (!isNaN(myFrameIndex)) {
                // console.log("myFrameIndex", myFrameIndex);
                if (myFrameIndex >= length) {
                    myFrameIndex = length - 1;
                    localStorage.setItem('myFrameIndex', (length - 1).toString());
                }
                setFrameIndex(myFrameIndex);
            } else {
                // console.log("else else");
                setFrameIndex(frameIndex);
                localStorage.setItem('myFrameIndex', frameIndex.toString());
            }
        }
    });
    useXHR(
        frames[frameIndex] && `${base}/files_in_scene?scene_path=${encodeURIComponent(frames[frameIndex])}`,
        "GET",
        "json",
        {},
        (ev) => {
            store1.get("preserveItems");
            const preserveItems: boolean = store1.get("preserveItems");
            objectState.loadObjects((ev.currentTarget as XMLHttpRequest).response, base, preserveItems);
        }
    );
    const objDict = useObjectStore(objectSelector);
    const imgDockerRef = useRef<HTMLDivElement>();
    const propertyDockerRef = useRef<HTMLDivElement>();
    const levaPanelRef = useRef<HTMLDivElement>();

    useControls(
        {
            preserveItems: {
                label: "preserve items",
                hint: "preserve items",
                value: false
            }
        },
        {store: store1},
        []
    );

    useEffect(() => {
        const onBeforeUnload = () => {
            const data1 = store1.getData();
            const data2 = store2.getData();
            const data = router.query.tab === "2d" ? {...data1, ...data2} : {...data2, ...data1};
            for (const [key, item] of Object.entries(data)) {
                if ("value" in item) {
                    localStorage.setItem(key, JSON.stringify(item.value));
                }
            }
        };
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", onBeforeUnload);
        };
    }, []);

    const onClickTab = useCallback(
        (item: PivotItem) => {
            const url: UrlObject = {
                pathname: "/",
                query: sequence ? {tab: item.props.itemKey, sequence: sequence} : {tab: item.props.itemKey}
            };
            router.push(url, url, {shallow: true});
        },
        [sequence]
    );
    const nextFrame = useCallback(() => {
        setFrameIndex(function (val) {
            localStorage.setItem('myFrameIndex', (val + 1).toString());
            return val + 1;
        });
    }, []);

    const onSeqChange = useCallback(
        (option) => {
            const url: UrlObject = {
                pathname: "/",
                query: {tab, sequence: option.value}
            };
            router.push(url, url, {shallow: true});
        },
        [tab, seqName]
    );

    const options = seqs.map((seq) => ({label: seq, value: seq}));

    useHotkeys(
        "d",
        () => {
            setFrameIndex((val) => {
                if (val < frames.length - 1) {
                    localStorage.setItem('myFrameIndex', (val + 1).toString());
                    return val + 1;
                }
                return val;
            });
        },
        [frames]
    );

    useHotkeys(
        "a",
        () => {
            setFrameIndex((val) => {
                if (val > 0) {
                    localStorage.setItem('myFrameIndex', (val - 1).toString());
                    return val - 1;
                }
                return val;
            });
        },
        [frames]
    );

    useHotkeys(
        "s",
        () => {
            for (var index = 0; index < seqs.length; index++) {
                if (seqName == seqs[index]) {
                    break;
                }
            }
            if (index < seqs.length - 1) index++;
            const url: UrlObject = {
                pathname: "/",
                query: {tab, sequence: seqs[index]}
            };
            router.push(url, url, {shallow: true});
        },
        [seqs, seqName]
    )

    useHotkeys(
        "w",
        () => {
            for (var index = 0; index < seqs.length; index++) {
                if (seqName == seqs[index]) break;
            }
            if (index > 0) index--;
            const url: UrlObject = {
                pathname: "/",
                query: {tab, sequence: seqs[index]}
            };
            router.push(url, url, {shallow: true});
        },
        [seqs, seqName]
    )

    useHotkeys(
        "r",
        () => {
            window.location.reload();
            // setFrameIndex((val) => {
            //     return (val - 1 + frames.length) % frames.length;
            // });
            // setFrameIndex((val) => {
            //     return (val + 1) % frames.length;
            // });
        },
        [frames]
    );
    useHotkeys(
        "q",
        () => {
            setFrameIndex((val) => {
                localStorage.setItem('myFrameIndex', "0");
                return 0;
            });
        },
        [frames]
    );
    useHotkeys(
        "e",
        () => {
            setFrameIndex((val) => {
                localStorage.setItem('myFrameIndex', (frames.length - 1).toString());
                return frames.length - 1;
            });
        },
        [frames]
    );

    const [levaPosX, setLevaPosX] = useState(0);
    const [levaPosY, setLevaPosY] = useState(0);
    const clickLevaPanel = () => {
        document.onmousemove = (e) => {
            const levaPanel = levaPanelRef.current.firstChild as HTMLDivElement;
            if (levaPanel.style.transform) {
                const currentTransform = levaPanel.style.transform.split('(')[1].split(')')[0].split(',');
                let resultX = parseInt(currentTransform[0]) > 0 ? 0 : parseInt(currentTransform[0]);
                resultX = resultX < -(document.body.offsetWidth - 310) ? -(document.body.offsetWidth - 310) : resultX;
                let resultY = parseInt(currentTransform[1]) > -60 ? parseInt(currentTransform[1]) : -60;
                resultY = resultY < (document.body.offsetHeight - 100) ? resultY : document.body.offsetHeight - 100;

                levaPanel.style.transform = `translate3d(${resultX}px, ${resultY}px, ${currentTransform[2]})`;
                setLevaPosX(resultX);
                setLevaPosY(resultY);
            }
        }
    }

    const leaveLevaPanel = () => {
        document.onmousemove = null;
        (levaPanelRef.current.firstChild as HTMLDivElement).style.transform = `translate3d(${levaPosX}px, ${levaPosY}px, 0px)`;
    }

    return (
        <Stack styles={wrapperStyles}>
            <Stack styles={headerStyles} horizontal>
                <Stack styles={brandStyles}>
                    <Text variant="xLargePlus">Wis3D</Text>
                </Stack>
                <Pivot selectedKey={tab} onLinkClick={onClickTab} headersOnly={true} className={classes.pivot}>
                    <PivotItem headerText="3D Objects" itemKey="3d"></PivotItem>
                    <PivotItem headerText="Keypoint Correspondences" itemKey="2d"></PivotItem>
                </Pivot>

                <Select
                    options={options}
                    value={options.find(option => option.value === seqName)}

                    onChange={onSeqChange}
                    // maxMenuHeight={"100%" as any}
                    styles={{
                        menu: provided => ({
                            ...provided,
                            zIndex: 9999,
                            width: "max-content",
                            height: "fit-content",
                            minWidth: "100%",
                            // minHeight: "100%",
                            position: "absolute",
                            right: 0
                        })
                    }}
                />
            </Stack>
            <Stack horizontal grow={1} styles={mainWrapperStyles}>
                <Stack disableShrink styles={sidebarStyles}>
                    {tab == "3d" && <ObjectList frameIndex={frameIndex}/>}
                    {tab == "2d" &&
                        <LevaPanel store={store2} fill flat hideCopyButton titleBar={false} theme={levaTheme}/>}
                </Stack>
                <Stack grow={1} reversed styles={mainStyles}>
                    <Stack horizontal verticalAlign="center" styles={sliderWrapperStyles}>
                        <PlayButton
                            disabled={frameIndex === frames.length - 1}
                            onUpdateFrame={nextFrame}
                            store1={store1}
                            store2={store2}
                            currentStore={tab === "3d" ? store1 : store2}
                        />
                        <InputSlider min={0} max={frames.length - 1} value={frameIndex} onChange={setFrameIndex}/>
                    </Stack>
                    <Stack grow={1} disableShrink styles={canvasWrapperStyles}>
                        {tab === "3d" && (
                            <Canvas>
                                <Scene
                                    meshes={objDict.meshes}
                                    pointClouds={objDict.point_clouds}
                                    dofBoxes={objDict.boxes}
                                    cameraPoses={objDict.camera_trajectories}
                                    lines={objDict.lines}
                                    voxels={objDict.voxels}
                                    spheres={objDict.spheres}
                                    planes={objDict.planes}
                                    store={store1}
                                />
                            </Canvas>
                        )}
                        {tab === "2d" && objDict.correspondences?.[0] && (
                            <Correspondence {...objDict.correspondences[0]} store={store2}/>
                        )}
                    </Stack>
                    {tab === "3d" &&
                        objDict.images?.map((obj) => (
                            <RndWindow
                                key={obj.name}
                                title={obj.name}
                                docker={imgDockerRef.current}
                                default={defaultRndProps as any}
                                onMouseDown={onMouseDown}
                            >
                                <img src={obj.url} className={classes.image}/>
                            </RndWindow>
                        ))}
                </Stack>
            </Stack>
            {tab === "3d" && (
                <>
                    <div className={classes.controlsWrapper} ref={levaPanelRef} onMouseDown={clickLevaPanel}
                         onMouseUp={leaveLevaPanel}>
                        <LevaPanel store={store1} flat hideCopyButton theme={levaTheme} hidden={tab !== "3d"}/>
                    </div>
                    <div ref={imgDockerRef} className={classes.imgDocker}></div>
                    <div id="property-docker" ref={propertyDockerRef} className={classes.propertyDocker}/>
                </>
            )}
        </Stack>
    );
});

const sidebarWidth = 300;

const defaultRndProps = {
    width: "25%"
};

const wrapperStyles: IStackStyles = {
    root: {
        width: "100vw",
        height: "100vh",
        overflow: "hidden"
    }
};

const headerStyles: IStackStyles = {
    root: {
        padding: theme.spacing.m,
        paddingBottom: 0,
        borderBottom: `1px solid ${theme.palette.neutralLighter}`,
        justifyContent: "space-between"
    }
};

const brandStyles: IStackStyles = {
    root: {
        width: sidebarWidth - 16
    }
};

const sidebarStyles: IStackStyles = {
    root: {
        width: sidebarWidth,
        borderRight: `1px solid ${theme.palette.neutralLighter}`
    }
};

const mainWrapperStyles: IStackStyles = {
    root: {
        overflow: "hidden"
    }
};

const sliderWrapperStyles: IStackStyles = {
    root: {
        paddingLeft: theme.spacing.s1,
        borderTop: `1px solid ${theme.palette.neutralLighter}`
    }
};

const mainStyles: IStackStyles = {
    root: {
        overflow: "hidden",
        position: "relative"
    }
};

const canvasWrapperStyles: IStackStyles = {
    root: {
        position: "relative"
    }
};

const classes = mergeStyleSets({
    pivot: {
        flex: 1
    },
    imgDocker: {
        position: "fixed",
        zIndex: 100,
        left: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "row",
        width: "fit-content"
    },
    image: {
        width: "100%",
        height: "auto"
    },
    propertyDocker: {
        position: "fixed",
        pointerEvents: "none",
        left: sidebarWidth,
        bottom: 0,
        "&:not(:empty)": {
            minHeight: 220
        }
    },
    controlsWrapper: {
        "&>div": {
            top: 60,
            right: 0,
            maxHeight: `calc(100vh - 110px)`,
            overflowY: "auto",
            border: `1px solid ${theme.palette.neutralLighter}`,
            display: "flex !important",
            flexDirection: "column"
        }
    }
});

export default Home;
