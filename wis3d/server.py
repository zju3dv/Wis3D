# coding=utf-8
import os
import cherrypy
import glob
import socket


class Visualizer:
    def __init__(self, vis_dir: str, static_dir: str):
        self.vis_dir = os.path.abspath(vis_dir)
        self.static_dir = static_dir

    @cherrypy.expose
    def index(self, *url_parts, **params):
        return open(os.path.join(self.static_dir, "index.html"), encoding="utf-8")

    @cherrypy.expose
    def file(self, path):
        res = path.split(os.sep)
        vis_dir = os.sep.join(res[0:-4])
        if vis_dir == self.vis_dir:
            return cherrypy.lib.static.serve_file(path)

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def all_sequences(self):
        sequences = glob.glob(os.path.join(self.vis_dir, "*"))
        sequences = [os.path.basename(seq) for seq in sequences]
        sequences = sorted(sequences)

        return sequences

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def all_scenes_in_sequence(self, sequence: str):
        scenes = glob.glob(os.path.abspath(os.path.join(self.vis_dir, sequence, "*")))
        scenes = sorted(scenes)

        return scenes

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def files_in_scene(self, scene_path):
        all_files = dict()
        folders = glob.glob(os.path.join(scene_path, "*"))
        for folder in folders:
            obj_type = os.path.basename(folder)
            all_files[obj_type] = sorted(glob.glob(os.path.join(folder, "*")))

        return all_files


def find_free_port(start: int, host: str = "0.0.0.0") -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        port = start
        while port < 65535:
            try:
                s.bind((host, port))
                break
            except:
                port += 1
                print("Port {} is in use, trying {}".format(port - 1, port))
    return port


def run_server(
        vis_dir: str, host: str = "0.0.0.0", port: int = None, verbose: bool = False
):
    static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app", "out")

    start_port = 19090 if port is None else port
    port = find_free_port(start_port, host)

    conf = {
        "/": {
            "tools.staticdir.on": True,
            "tools.staticdir.dir": static_dir,
            "tools.response_headers.on": True,
            "tools.response_headers.headers": [("Access-Control-Allow-Origin", "*")],
        },
        "/visual": {
            "tools.staticdir.on": True,
            "tools.staticdir.dir": vis_dir,
            "tools.response_headers.headers": [("Access-Control-Allow-Origin", "*")],
        },
    }

    visualizer = Visualizer(vis_dir, static_dir)
    cherrypy.config.update(
        {
            "server.socket_host": host,
            "server.socket_port": port,
            "log.screen": verbose,
        }
    )

    cherrypy.tree.mount(visualizer, "", conf)
    cherrypy.engine.signals.subscribe()
    # try:
    cherrypy.engine.start()
    print(f"Serving on http://{host}:{port}")
    cherrypy.engine.block()
    # except KeyboardInterrupt:
    cherrypy.engine.stop()
    cherrypy.engine.exit()
